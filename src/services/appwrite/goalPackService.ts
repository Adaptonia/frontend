import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, GOAL_PACKS_COLLECTION_ID } from './client';
import { CreateGoalPackRequest, GoalPack, UpdateGoalPackRequest } from '@/lib/types';

/**
 * Create a new goal pack (Admin only)
 */
export const createGoalPack = async (goalPackData: CreateGoalPackRequest, adminId: string): Promise<GoalPack> => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      GOAL_PACKS_COLLECTION_ID,
      ID.unique(),
      {
        ...goalPackData,
        createdBy: adminId,
        isActive: goalPackData.isActive !== undefined ? goalPackData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      category: response.category,
      targetUserType: response.targetUserType,
      milestones: response.milestones,
      tags: response.tags,
      isActive: response.isActive,
      createdBy: response.createdBy,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create goal pack';
    console.error('Goal pack creation error:', errorMessage);
    throw error;
  }
};

/**
 * Get all goal packs (Admin only)
 */
export const getAllGoalPacks = async (): Promise<GoalPack[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      GOAL_PACKS_COLLECTION_ID,
      [Query.orderDesc('createdAt')]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      targetUserType: doc.targetUserType,
      milestones: doc.milestones,
      tags: doc.tags,
      isActive: doc.isActive,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch goal packs';
    console.error('Goal packs fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Get active goal packs for specific user type
 */
export const getGoalPacksForUserType = async (userType: 'student' | 'non-student'): Promise<GoalPack[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      GOAL_PACKS_COLLECTION_ID,
      [
        Query.equal('isActive', true),
        Query.or([
          Query.equal('targetUserType', userType),
          Query.equal('targetUserType', 'all')
        ]),
        Query.orderDesc('createdAt')
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      targetUserType: doc.targetUserType,
      milestones: doc.milestones,
      tags: doc.tags,
      isActive: doc.isActive,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch goal packs for user type';
    console.error('Goal packs for user type fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Get a single goal pack by ID
 */
export const getGoalPackById = async (goalPackId: string): Promise<GoalPack> => {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      GOAL_PACKS_COLLECTION_ID,
      goalPackId
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      category: response.category,
      targetUserType: response.targetUserType,
      milestones: response.milestones,
      tags: response.tags,
      isActive: response.isActive,
      createdBy: response.createdBy,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch goal pack';
    console.error('Goal pack fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Update a goal pack (Admin only)
 */
export const updateGoalPack = async (
  goalPackId: string, 
  goalPackData: UpdateGoalPackRequest
): Promise<GoalPack> => {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      GOAL_PACKS_COLLECTION_ID,
      goalPackId,
      {
        ...goalPackData,
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      category: response.category,
      targetUserType: response.targetUserType,
      milestones: response.milestones,
      tags: response.tags,
      isActive: response.isActive,
      createdBy: response.createdBy,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update goal pack';
    console.error('Goal pack update error:', errorMessage);
    throw error;
  }
};

/**
 * Delete a goal pack (Admin only)
 */
export const deleteGoalPack = async (goalPackId: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      GOAL_PACKS_COLLECTION_ID,
      goalPackId
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete goal pack';
    console.error('Goal pack deletion error:', errorMessage);
    throw error;
  }
};

/**
 * Toggle goal pack active status (Admin only)
 */
export const toggleGoalPackStatus = async (goalPackId: string): Promise<GoalPack> => {
  try {
    // Get the goal pack first to check current status
    const goalPack = await getGoalPackById(goalPackId);
    
    // Toggle the active status
    const response = await databases.updateDocument(
      DATABASE_ID,
      GOAL_PACKS_COLLECTION_ID,
      goalPackId,
      {
        isActive: !goalPack.isActive,
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      category: response.category,
      targetUserType: response.targetUserType,
      milestones: response.milestones,
      tags: response.tags,
      isActive: response.isActive,
      createdBy: response.createdBy,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to toggle goal pack status';
    console.error('Goal pack status toggle error:', errorMessage);
    throw error;
  }
}; 