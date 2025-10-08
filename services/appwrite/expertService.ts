import { databases, DATABASE_ID, EXPERT_PROFILES_COLLECTION_ID } from '@/lib/appwrite/config';
import { ID, Query } from 'appwrite';
import { ExpertProfile } from '@/database/partner-accountability-schema';

// Fallback collection ID in case environment variable is not loaded
const EXPERT_COLLECTION_ID = EXPERT_PROFILES_COLLECTION_ID || process.env.NEXT_PUBLIC_APPWRITE_EXPERT_PROFILES_COLLECTION_ID || 'expert_profiles';

// Temporary hardcode for testing (remove this after fixing env vars)
// const EXPERT_COLLECTION_ID = 'expert_profiles';

export interface CreateExpertProfileData {
  userId: string;
  expertiseAreas: string[];
  yearsOfExperience: number;
  certifications: string[];
  specializations: string[];
  hourlyRate?: number;
  availability: {
    timeSlots: string[];
    timezone: string;
    maxClients: number;
  };
  bio: string;
  achievements: string[];
  isAvailableForMatching: boolean;
  successStories: string[];
}

export interface UpdateExpertProfileData extends Partial<CreateExpertProfileData> {
  rating?: number;
  totalClientsHelped?: number;
}

class ExpertService {
  async createExpertProfile(data: CreateExpertProfileData): Promise<ExpertProfile> {
    try {
      const expertProfileData = {
        userId: data.userId,
        isExpert: true,
        expertiseAreas: data.expertiseAreas,
        yearsOfExperience: data.yearsOfExperience,
        certifications: data.certifications,
        specializations: data.specializations,
        hourlyRate: data.hourlyRate,
        availability: JSON.stringify(data.availability),
        bio: data.bio,
        achievements: data.achievements,
        isAvailableForMatching: data.isAvailableForMatching,
        rating: 0,
        totalClientsHelped: 0,
        successStories: data.successStories,
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        EXPERT_COLLECTION_ID,
        ID.unique(),
        expertProfileData
      );

      return {
        id: result.$id,
        userId: data.userId,
        isExpert: true,
        expertiseAreas: data.expertiseAreas,
        yearsOfExperience: data.yearsOfExperience,
        certifications: data.certifications,
        specializations: data.specializations,
        hourlyRate: data.hourlyRate,
        availability: data.availability,
        bio: data.bio,
        achievements: data.achievements,
        isAvailableForMatching: data.isAvailableForMatching,
        rating: 0,
        totalClientsHelped: 0,
        successStories: data.successStories,
        createdAt: result.$createdAt,
        updatedAt: result.$updatedAt,
      };
    } catch (error) {
      console.error('Error creating expert profile:', error);
      throw new Error('Failed to create expert profile');
    }
  }

  async getExpertProfile(userId: string): Promise<ExpertProfile | null> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        EXPERT_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (result.documents.length === 0) {
        return null;
      }

      const doc = result.documents[0];
      
      // Parse availability with error handling
      let availability;
      try {
        availability = JSON.parse(doc.availability);
      } catch (error) {
        console.error('Error parsing availability:', error);
        availability = {
          timeSlots: [],
          timezone: '',
          maxClients: 5
        };
      }
      
      return {
        id: doc.$id,
        userId: doc.userId,
        isExpert: doc.isExpert,
        expertiseAreas: doc.expertiseAreas || [],
        yearsOfExperience: doc.yearsOfExperience || 0,
        certifications: doc.certifications || [],
        specializations: doc.specializations || [],
        hourlyRate: doc.hourlyRate,
        availability: availability,
        bio: doc.bio || '',
        achievements: doc.achievements || [],
        isAvailableForMatching: doc.isAvailableForMatching !== undefined ? doc.isAvailableForMatching : true,
        rating: doc.rating || 0,
        totalClientsHelped: doc.totalClientsHelped || 0,
        successStories: doc.successStories || [],
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
      };
    } catch (error) {
      console.error('Error getting expert profile:', error);
      return null;
    }
  }

  async updateExpertProfile(userId: string, data: UpdateExpertProfileData): Promise<ExpertProfile | null> {
    try {
      const existingProfile = await this.getExpertProfile(userId);
      if (!existingProfile) {
        throw new Error('Expert profile not found');
      }

      const updateData: any = {
        ...data,
      };

      if (data.availability) {
        updateData.availability = JSON.stringify(data.availability);
      }

      const result = await databases.updateDocument(
        DATABASE_ID,
        EXPERT_COLLECTION_ID,
        existingProfile.id,
        updateData
      );

      return {
        ...existingProfile,
        ...data,
        updatedAt: result.$updatedAt,
      };
    } catch (error) {
      console.error('Error updating expert profile:', error);
      throw new Error('Failed to update expert profile');
    }
  }

  async getAllExperts(): Promise<ExpertProfile[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        EXPERT_COLLECTION_ID,
        [
          Query.equal('isExpert', true),
          Query.equal('isAvailableForMatching', true),
          Query.orderDesc('rating')
        ]
      );

      return result.documents.map(doc => ({
        id: doc.$id,
        userId: doc.userId,
        isExpert: doc.isExpert,
        expertiseAreas: doc.expertiseAreas || [],
        yearsOfExperience: doc.yearsOfExperience,
        certifications: doc.certifications || [],
        specializations: doc.specializations || [],
        hourlyRate: doc.hourlyRate,
        availability: (() => {
          try {
            return JSON.parse(doc.availability);
          } catch (error) {
            console.error('Error parsing availability:', error);
            return {
              timeSlots: [],
              timezone: '',
              maxClients: 5
            };
          }
        })(),
        bio: doc.bio,
        achievements: doc.achievements || [],
        isAvailableForMatching: doc.isAvailableForMatching,
        rating: doc.rating,
        totalClientsHelped: doc.totalClientsHelped,
        successStories: doc.successStories || [],
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
      }));
    } catch (error) {
      console.error('Error getting all experts:', error);
      return [];
    }
  }

  async getExpertsByCategory(category: string): Promise<ExpertProfile[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        EXPERT_COLLECTION_ID,
        [
          Query.equal('isExpert', true),
          Query.equal('isAvailableForMatching', true),
          Query.contains('expertiseAreas', category),
          Query.orderDesc('rating')
        ]
      );

      return result.documents.map(doc => ({
        id: doc.$id,
        userId: doc.userId,
        isExpert: doc.isExpert,
        expertiseAreas: doc.expertiseAreas || [],
        yearsOfExperience: doc.yearsOfExperience,
        certifications: doc.certifications || [],
        specializations: doc.specializations || [],
        hourlyRate: doc.hourlyRate,
        availability: (() => {
          try {
            return JSON.parse(doc.availability);
          } catch (error) {
            console.error('Error parsing availability:', error);
            return {
              timeSlots: [],
              timezone: '',
              maxClients: 5
            };
          }
        })(),
        bio: doc.bio,
        achievements: doc.achievements || [],
        isAvailableForMatching: doc.isAvailableForMatching,
        rating: doc.rating,
        totalClientsHelped: doc.totalClientsHelped,
        successStories: doc.successStories || [],
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
      }));
    } catch (error) {
      console.error('Error getting experts by category:', error);
      return [];
    }
  }

  async deleteExpertProfile(userId: string): Promise<boolean> {
    try {
      const existingProfile = await this.getExpertProfile(userId);
      if (!existingProfile) {
        return false;
      }

      await databases.deleteDocument(
        DATABASE_ID,
        EXPERT_COLLECTION_ID,
        existingProfile.id
      );

      return true;
    } catch (error) {
      console.error('Error deleting expert profile:', error);
      return false;
    }
  }
}

export const expertService = new ExpertService();
export default expertService;
