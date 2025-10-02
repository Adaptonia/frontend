import { Client, Databases, ID, Query } from 'appwrite';
import {
  PartnershipPreferences,
  Partnership,
  SharedGoal,
  PartnerTask,
  VerificationRequest,
  PartnerNotification,
  PartnershipMetrics
} from '../../database/partner-accountability-schema';

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTIONS = {
  PARTNERSHIP_PREFERENCES: process.env.NEXT_PUBLIC_APPWRITE_PARTNERSHIP_PREFERENCES_COLLECTION_ID!,
  PARTNERSHIPS: process.env.NEXT_PUBLIC_APPWRITE_PARTNERSHIPS_COLLECTION_ID!,
  SHARED_GOALS: process.env.NEXT_PUBLIC_APPWRITE_SHARED_GOALS_COLLECTION_ID!,
  PARTNER_TASKS: process.env.NEXT_PUBLIC_APPWRITE_PARTNER_TASKS_COLLECTION_ID!,
  VERIFICATION_REQUESTS: process.env.NEXT_PUBLIC_APPWRITE_VERIFICATION_REQUESTS_COLLECTION_ID!,
  PARTNER_NOTIFICATIONS: process.env.NEXT_PUBLIC_APPWRITE_PARTNER_NOTIFICATIONS_COLLECTION_ID!,
  PARTNERSHIP_METRICS: process.env.NEXT_PUBLIC_APPWRITE_PARTNERSHIP_METRICS_COLLECTION_ID!,
};

export interface CreatePartnerPreferencesData {
  userId: string;
  preferredPartnerType: 'p2p' | 'premium_expert' | 'either';
  supportStyle: string[];
  availableCategories: string[];
  timeCommitment: 'daily' | 'weekly' | 'flexible';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  timezone?: string;
  preferredMeetingTimes?: string[];
  bio?: string;
}

export interface PartnerMatchingCriteria {
  preferredPartnerType: 'p2p' | 'premium_expert' | 'either';
  supportStyle: string[];
  categories: string[];
  timeCommitment: 'daily' | 'weekly' | 'flexible';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  timezone?: string;
}

class PartnershipService {

  // ========== PARTNERSHIP PREFERENCES ==========

  async createPartnerPreferences(data: CreatePartnerPreferencesData): Promise<PartnershipPreferences> {
    console.log('📝 Creating partner preferences for userId:', data.userId);
    console.log('📦 Preferences data:', data);

    // Check if preferences already exist for this user
    const existing = await this.getPartnerPreferences(data.userId);

    if (existing) {
      // If preferences exist, update them instead
      console.log('⚠️ Preferences already exist for user, updating instead of creating');
      const updated = await this.updatePartnerPreferences(data.userId, data);
      if (updated) {
        console.log('✅ Successfully updated existing preferences');
        return updated;
      }
    }

    // Create new preferences
    const now = new Date().toISOString();

    const preferences: Omit<PartnershipPreferences, 'id'> = {
      userId: data.userId,
      preferredPartnerType: data.preferredPartnerType,
      supportStyle: data.supportStyle,
      availableCategories: data.availableCategories,
      timeCommitment: data.timeCommitment,
      experienceLevel: data.experienceLevel,
      isAvailableForMatching: true,
      timezone: data.timezone,
      preferredMeetingTimes: data.preferredMeetingTimes,
      bio: data.bio,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    };

    console.log('💾 Saving to database:', preferences);

    const result = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PARTNERSHIP_PREFERENCES,
      ID.unique(),
      preferences
    );

    console.log('✅ Successfully created preferences with ID:', result.$id);
    console.log('📄 Created document:', result);

    return { id: result.$id, ...preferences };
  }

  async getPartnerPreferences(userId: string): Promise<PartnershipPreferences | null> {
    try {
      console.log('🔍 Fetching partner preferences for userId:', userId);
      console.log('📦 Using collection:', COLLECTIONS.PARTNERSHIP_PREFERENCES);

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PARTNERSHIP_PREFERENCES,
        [Query.equal('userId', userId)]
      );

      console.log('📊 Query result:', {
        total: result.total,
        documentsFound: result.documents.length,
        documents: result.documents
      });

      if (result.documents.length === 0) {
        console.log('❌ No preferences found for user:', userId);
        return null;
      }

      const doc = result.documents[0];
      console.log('✅ Found preferences:', doc);

      return {
        id: doc.$id,
        userId: doc.userId,
        preferredPartnerType: doc.preferredPartnerType,
        supportStyle: doc.supportStyle,
        availableCategories: doc.availableCategories,
        timeCommitment: doc.timeCommitment,
        experienceLevel: doc.experienceLevel,
        isAvailableForMatching: doc.isAvailableForMatching,
        timezone: doc.timezone,
        preferredMeetingTimes: doc.preferredMeetingTimes,
        bio: doc.bio,
        lastActiveAt: doc.lastActiveAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Error fetching partner preferences:', {
        userId,
        errorCode: error.code,
        errorMessage: error.message,
        errorType: error.type,
        fullError: error
      });

      // Only log errors that aren't "document not found"
      if (error.code !== 404 && !error.message?.includes('Document with the requested ID could not be found')) {
        console.error('Error getting partner preferences:', error);
      }
      return null;
    }
  }

  async updatePartnerPreferences(
    userId: string,
    updates: Partial<CreatePartnerPreferencesData>
  ): Promise<PartnershipPreferences | null> {
    try {
      const existing = await this.getPartnerPreferences(userId);
      if (!existing) return null;

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNERSHIP_PREFERENCES,
        existing.id,
        updatedData
      );

      return {
        id: result.$id,
        userId: result.userId,
        preferredPartnerType: result.preferredPartnerType,
        supportStyle: result.supportStyle,
        availableCategories: result.availableCategories,
        timeCommitment: result.timeCommitment,
        experienceLevel: result.experienceLevel,
        isAvailableForMatching: result.isAvailableForMatching,
        timezone: result.timezone,
        preferredMeetingTimes: result.preferredMeetingTimes,
        bio: result.bio,
        lastActiveAt: result.lastActiveAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch (error) {
      console.error('Error updating partner preferences:', error);
      return null;
    }
  }

  async setAvailableForMatching(userId: string, available: boolean): Promise<boolean> {
    try {
      const existing = await this.getPartnerPreferences(userId);
      if (!existing) return false;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNERSHIP_PREFERENCES,
        existing.id,
        {
          isAvailableForMatching: available,
          updatedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        }
      );

      return true;
    } catch (error) {
      console.error('Error setting availability:', error);
      return false;
    }
  }

  // ========== PARTNER MATCHING ==========

  async findPotentialPartners(criteria?: PartnerMatchingCriteria, requireAvailable: boolean = false): Promise<PartnershipPreferences[]> {
    try {
      const queries = [];

      // Only filter by availability if explicitly required (for auto-match)
      if (requireAvailable) {
        queries.push(Query.equal('isAvailableForMatching', true));
      }

      // Only apply filters if criteria is provided
      if (criteria) {
        // Add partner type filter
        if (criteria.preferredPartnerType !== 'either') {
          queries.push(Query.equal('preferredPartnerType', [criteria.preferredPartnerType, 'either']));
        }

        // Add time commitment filter
        if (criteria.timeCommitment) {
          queries.push(Query.equal('timeCommitment', [criteria.timeCommitment, 'flexible']));
        }
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PARTNERSHIP_PREFERENCES,
        queries
      );

      const potentialPartners: PartnershipPreferences[] = result.documents
        .filter(doc => doc.userId && doc.preferredPartnerType) // Only valid documents
        .map(doc => ({
          id: doc.$id,
          userId: doc.userId,
          preferredPartnerType: doc.preferredPartnerType,
          supportStyle: doc.supportStyle || [],
          availableCategories: doc.availableCategories || [],
          timeCommitment: doc.timeCommitment,
          experienceLevel: doc.experienceLevel,
          isAvailableForMatching: doc.isAvailableForMatching,
          timezone: doc.timezone,
          preferredMeetingTimes: doc.preferredMeetingTimes || [],
          bio: doc.bio,
          lastActiveAt: doc.lastActiveAt,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }));

      // Apply client-side filtering only if criteria is provided
      if (!criteria) {
        return potentialPartners; // Return all if no criteria
      }

      return potentialPartners.filter(partner => {
        // Check for overlapping categories
        const hasCommonCategory = partner.availableCategories.some(category =>
          criteria.categories?.includes(category)
        );

        // Check for overlapping support styles
        const hasCommonSupportStyle = partner.supportStyle.some(style =>
          criteria.supportStyle?.includes(style)
        );

        return hasCommonCategory && hasCommonSupportStyle;
      });
    } catch (error) {
      console.error('Error finding potential partners:', error);
      return [];
    }
  }

  async calculateCompatibilityScore(
    user1Preferences: PartnershipPreferences,
    user2Preferences: PartnershipPreferences
  ): Promise<number> {
    let score = 0;
    let maxScore = 0;

    // Partner type compatibility (weight: 25%)
    maxScore += 25;
    if (
      user1Preferences.preferredPartnerType === user2Preferences.preferredPartnerType ||
      user1Preferences.preferredPartnerType === 'either' ||
      user2Preferences.preferredPartnerType === 'either'
    ) {
      score += 25;
    }

    // Time commitment compatibility (weight: 20%)
    maxScore += 20;
    if (
      user1Preferences.timeCommitment === user2Preferences.timeCommitment ||
      user1Preferences.timeCommitment === 'flexible' ||
      user2Preferences.timeCommitment === 'flexible'
    ) {
      score += 20;
    }

    // Category overlap (weight: 25%)
    maxScore += 25;
    const commonCategories = user1Preferences.availableCategories.filter(cat =>
      user2Preferences.availableCategories.includes(cat)
    );
    const categoryOverlap = commonCategories.length / Math.max(
      user1Preferences.availableCategories.length,
      user2Preferences.availableCategories.length
    );
    score += categoryOverlap * 25;

    // Support style overlap (weight: 20%)
    maxScore += 20;
    const commonSupportStyles = user1Preferences.supportStyle.filter(style =>
      user2Preferences.supportStyle.includes(style)
    );
    const supportStyleOverlap = commonSupportStyles.length / Math.max(
      user1Preferences.supportStyle.length,
      user2Preferences.supportStyle.length
    );
    score += supportStyleOverlap * 20;

    // Experience level compatibility (weight: 10%)
    maxScore += 10;
    const experienceLevels = ['beginner', 'intermediate', 'advanced'];
    const user1Level = experienceLevels.indexOf(user1Preferences.experienceLevel);
    const user2Level = experienceLevels.indexOf(user2Preferences.experienceLevel);
    const levelDifference = Math.abs(user1Level - user2Level);

    if (levelDifference === 0) score += 10; // Same level
    else if (levelDifference === 1) score += 7; // Adjacent levels
    else score += 3; // Different levels but still workable

    return Math.round((score / maxScore) * 100);
  }

  // ========== PARTNERSHIPS ==========

  async createPartnership(
    user1Id: string,
    user2Id: string,
    partnershipType: 'p2p' | 'premium_expert',
    matchingPreferences: any,
    autoApproved: boolean = true // ✅ Auto-match = active immediately
  ): Promise<Partnership> {
    const now = new Date().toISOString();

    const partnershipData = {
      user1Id,
      user2Id,
      partnershipType,
      status: autoApproved ? 'active' : 'pending', // ✅ FIX: Active if auto-matched
      matchedAt: now,
      matchingPreferences: JSON.stringify(matchingPreferences || {}),
      partnershipRules: JSON.stringify({
        verificationRequired: true,
        reminderFrequency: 'weekly',
        allowTaskCreation: true,
      }),
      metrics: JSON.stringify({
        totalSharedGoals: 0,
        totalTasksVerified: 0,
        averageVerificationTime: 0,
        lastInteraction: now,
      }),
      createdAt: now,
      updatedAt: now,
    };

    const result = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PARTNERSHIPS,
      ID.unique(),
      partnershipData
    );

    // Mark both users as unavailable for matching
    await this.setAvailableForMatching(user1Id, false);
    await this.setAvailableForMatching(user2Id, false);

    return {
      id: result.$id,
      user1Id,
      user2Id,
      partnershipType,
      status: autoApproved ? 'active' : 'pending', // ✅ Match the created status
      matchedAt: now,
      matchingPreferences: matchingPreferences || {},
      partnershipRules: {
        verificationRequired: true,
        reminderFrequency: 'weekly',
        allowTaskCreation: true,
      },
      metrics: {
        totalSharedGoals: 0,
        totalTasksVerified: 0,
        averageVerificationTime: 0,
        lastInteraction: now,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  async getPartnership(partnershipId: string): Promise<Partnership | null> {
    try {
      const result = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNERSHIPS,
        partnershipId
      );

      return {
        id: result.$id,
        user1Id: result.user1Id,
        user2Id: result.user2Id,
        partnershipType: result.partnershipType,
        status: result.status,
        matchedAt: result.matchedAt,
        startedAt: result.startedAt,
        endedAt: result.endedAt,
        matchingPreferences: JSON.parse(result.matchingPreferences || '{}'),
        partnershipRules: JSON.parse(result.partnershipRules || '{}'),
        metrics: JSON.parse(result.metrics || '{}'),
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch (error) {
      console.error('Error getting partnership:', error);
      return null;
    }
  }

  async getUserPartnership(userId: string): Promise<Partnership | null> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PARTNERSHIPS,
        [
          Query.or([
            Query.equal('user1Id', userId),
            Query.equal('user2Id', userId)
          ]),
          Query.equal('status', ['active', 'pending'])
        ]
      );

      if (result.documents.length === 0) return null;

      const doc = result.documents[0];
      return {
        id: doc.$id,
        user1Id: doc.user1Id,
        user2Id: doc.user2Id,
        partnershipType: doc.partnershipType,
        status: doc.status,
        matchedAt: doc.matchedAt,
        startedAt: doc.startedAt,
        endedAt: doc.endedAt,
        matchingPreferences: JSON.parse(doc.matchingPreferences || '{}'),
        partnershipRules: JSON.parse(doc.partnershipRules || '{}'),
        metrics: JSON.parse(doc.metrics || '{}'),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    } catch (error) {
      console.error('Error getting user partnership:', error);
      return null;
    }
  }

  async getAllActivePartnerships(): Promise<Partnership[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PARTNERSHIPS,
        [Query.equal('status', ['active', 'pending'])]
      );

      return result.documents.map(doc => ({
        id: doc.$id,
        user1Id: doc.user1Id,
        user2Id: doc.user2Id,
        partnershipType: doc.partnershipType,
        status: doc.status,
        matchedAt: doc.matchedAt,
        startedAt: doc.startedAt,
        endedAt: doc.endedAt,
        matchingPreferences: JSON.parse(doc.matchingPreferences || '{}'),
        partnershipRules: JSON.parse(doc.partnershipRules || '{}'),
        metrics: JSON.parse(doc.metrics || '{}'),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
    } catch (error) {
      console.error('Error getting all active partnerships:', error);
      return [];
    }
  }

  async updatePartnershipStatus(
    partnershipId: string,
    status: 'pending' | 'active' | 'paused' | 'ended'
  ): Promise<boolean> {
    try {
      const updates: any = {
        status,
        updatedAt: new Date().toISOString(),
      };

      if (status === 'active' && !updates.startedAt) {
        updates.startedAt = new Date().toISOString();
      }

      if (status === 'ended') {
        updates.endedAt = new Date().toISOString();

        // Make both users available for matching again
        const partnership = await this.getPartnership(partnershipId);
        if (partnership) {
          await this.setAvailableForMatching(partnership.user1Id, true);
          await this.setAvailableForMatching(partnership.user2Id, true);
        }
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNERSHIPS,
        partnershipId,
        updates
      );

      return true;
    } catch (error) {
      console.error('Error updating partnership status:', error);
      return false;
    }
  }

  // ========== PARTNER MATCHING ALGORITHM ==========

  async findBestMatch(userId: string): Promise<PartnershipPreferences | null> {
    try {
      const userPreferences = await this.getPartnerPreferences(userId);
      if (!userPreferences || !userPreferences.isAvailableForMatching) {
        return null;
      }

      const criteria: PartnerMatchingCriteria = {
        preferredPartnerType: userPreferences.preferredPartnerType,
        supportStyle: userPreferences.supportStyle,
        categories: userPreferences.availableCategories,
        timeCommitment: userPreferences.timeCommitment,
        experienceLevel: userPreferences.experienceLevel,
        timezone: userPreferences.timezone,
      };

      const potentialPartners = await this.findPotentialPartners(criteria, true); // Auto-match requires availability

      if (potentialPartners.length === 0) return null;

      // Calculate compatibility scores
      const partnersWithScores = await Promise.all(
        potentialPartners.map(async (partner) => ({
          partner,
          score: await this.calculateCompatibilityScore(userPreferences, partner)
        }))
      );

      // Sort by compatibility score (highest first)
      partnersWithScores.sort((a, b) => b.score - a.score);

      // Return the best match (must have at least 60% compatibility)
      const bestMatch = partnersWithScores[0];
      return bestMatch && bestMatch.score >= 60 ? bestMatch.partner : null;

    } catch (error) {
      console.error('Error finding best match:', error);
      return null;
    }
  }

  async requestPartnership(
    requesterId: string,
    partnerId: string,
    partnershipType: 'p2p' | 'premium_expert' = 'p2p',
    autoApproved: boolean = true // ✅ true for auto-match, false for manual
  ): Promise<Partnership | null> {
    try {
      // Check if both users are available
      const requesterPrefs = await this.getPartnerPreferences(requesterId);
      const partnerPrefs = await this.getPartnerPreferences(partnerId);

      if (!requesterPrefs?.isAvailableForMatching || !partnerPrefs?.isAvailableForMatching) {
        throw new Error('One or both users are not available for matching');
      }

      // Create partnership
      const partnership = await this.createPartnership(
        requesterId,
        partnerId,
        partnershipType,
        {
          supportStyle: requesterPrefs.supportStyle,
          categories: requesterPrefs.availableCategories,
          timeCommitment: requesterPrefs.timeCommitment,
        },
        autoApproved // ✅ Pass through auto-approved status
      );

      return partnership;
    } catch (error) {
      console.error('Error requesting partnership:', error);
      return null;
    }
  }
}

export const partnershipService = new PartnershipService();
export default partnershipService;