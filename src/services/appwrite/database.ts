import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, GOALS_COLLECTION_ID } from './client';
import { CreateGoalRequest, Goal, UpdateGoalRequest } from '@/lib/types';

/**
 * Create a new goal
 */
export const createGoal = async (goalData: CreateGoalRequest, userId: string): Promise<Goal> => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      ID.unique(),
      {
        ...goalData,
        userId,
        isCompleted: goalData.isCompleted || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      category: response.category,
      deadline: response.deadline,
      location: response.location,
      tags: response.tags,
      reminderDate: response.reminderDate,
      isCompleted: response.isCompleted,
      userId: response.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create goal';
    console.error('Goal creation error:', errorMessage);
    throw error;
  }
};

/**
 * Get all goals for a user
 */
export const getGoals = async (userId: string): Promise<Goal[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      deadline: doc.deadline,
      location: doc.location,
      tags: doc.tags,
      reminderDate: doc.reminderDate,
      isCompleted: doc.isCompleted,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch goals';
    console.error('Goals fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Get a single goal by ID
 */
export const getGoalById = async (goalId: string, userId: string): Promise<Goal> => {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      goalId
    );

    // Verify that the goal belongs to the user
    if (response.userId !== userId) {
      throw new Error('You do not have permission to access this goal');
    }

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      category: response.category,
      deadline: response.deadline,
      location: response.location,
      tags: response.tags,
      reminderDate: response.reminderDate,
      isCompleted: response.isCompleted,
      userId: response.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch goal';
    console.error('Goal fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Update a goal
 */
export const updateGoal = async (
  goalId: string, 
  goalData: UpdateGoalRequest, 
  userId: string
): Promise<Goal> => {
  try {
    // First verify the user owns this goal
    // const existingGoal = await getGoalById(goalId, userId);
    
    const response = await databases.updateDocument(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      goalId,
      {
        ...goalData,
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      category: response.category,
      deadline: response.deadline,
      location: response.location,
      tags: response.tags,
      reminderDate: response.reminderDate,
      isCompleted: response.isCompleted,
      userId: response.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update goal';
    console.error('Goal update error:', errorMessage);
    throw error;
  }
};

/**
 * Delete a goal
 */
export const deleteGoal = async (goalId: string, userId: string): Promise<void> => {
  try {
    // First verify the user owns this goal
    await getGoalById(goalId, userId);
    
    await databases.deleteDocument(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      goalId
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete goal';
    console.error('Goal deletion error:', errorMessage);
    throw error;
  }
};

/**
 * Toggle goal completion status
 */
export const toggleGoalCompletion = async (goalId: string, userId: string): Promise<Goal> => {
  try {
    // Get the goal first to check ownership and current completion status
    const goal = await getGoalById(goalId, userId);
    
    // Toggle the completion status
    const response = await databases.updateDocument(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      goalId,
      {
        isCompleted: !goal.isCompleted,
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      category: response.category,
      deadline: response.deadline,
      location: response.location,
      tags: response.tags,
      reminderDate: response.reminderDate,
      isCompleted: response.isCompleted,
      userId: response.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to toggle goal completion';
    console.error('Goal toggle error:', errorMessage);
    throw error;
  }
}; 