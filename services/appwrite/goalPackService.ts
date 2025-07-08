import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, GOAL_PACKS_COLLECTION_ID, GOAL_PACK_REVIEWS_COLLECTION_ID, GOAL_PACK_PURCHASES_COLLECTION_ID } from './client';
import { CreateGoalPackRequest, GoalPack, UpdateGoalPackRequest, GoalPackReview, CreateGoalPackReviewRequest, UpdateGoalPackReviewRequest, GoalPackPurchase, CreateGoalPackPurchaseRequest, GoalPackWithStats } from '@/lib/types';

// Collection IDs for reviews and purchases

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
              link: response.link,
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

/**
 * Get goal packs with stats for explore page
 */
export const getGoalPacksWithStats = async (userId?: string): Promise<GoalPackWithStats[]> => {
  try {
    const goalPacks = await getAllGoalPacks();
    
    const goalPacksWithStats = await Promise.all(
      goalPacks.map(async (pack) => {
        // Get reviews for this pack
        const reviewsResponse = await databases.listDocuments(
          DATABASE_ID,
          GOAL_PACK_REVIEWS_COLLECTION_ID,
          [Query.equal('goalPackId', pack.id)]
        );

        // Get purchases for this pack
        const purchasesResponse = await databases.listDocuments(
          DATABASE_ID,
          GOAL_PACK_PURCHASES_COLLECTION_ID,
          [Query.equal('goalPackId', pack.id)]
        );

        // Calculate average rating
        const reviews = reviewsResponse.documents;
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0;

        // Check if user has purchased this pack
        let isPurchased = false;
        let userReview = undefined;
        
        if (userId) {
          isPurchased = purchasesResponse.documents.some(purchase => purchase.userId === userId);
          
          const userReviewDoc = reviews.find(review => review.userId === userId);
          if (userReviewDoc) {
            userReview = {
              id: userReviewDoc.$id,
              goalPackId: userReviewDoc.goalPackId,
              userId: userReviewDoc.userId,
              userName: userReviewDoc.userName,
              userProfilePicture: userReviewDoc.userProfilePicture,
              rating: userReviewDoc.rating,
              reviewText: userReviewDoc.reviewText,
              isHelpful: userReviewDoc.isHelpful,
              createdAt: userReviewDoc.createdAt,
              updatedAt: userReviewDoc.updatedAt
            };
          }
        }

        return {
          ...pack,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalReviews: reviews.length,
          totalPurchases: purchasesResponse.documents.length,
          isPurchased,
          userReview
        };
      })
    );

    return goalPacksWithStats;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch goal packs with stats';
    console.error('Goal packs with stats fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Create a review for a goal pack
 */
export const createGoalPackReview = async (
  reviewData: CreateGoalPackReviewRequest, 
  userId: string,
  userName: string,
  userProfilePicture?: string
): Promise<GoalPackReview> => {
  try {
    // Check if user has already reviewed this pack
    const existingReviews = await databases.listDocuments(
      DATABASE_ID,
      GOAL_PACK_REVIEWS_COLLECTION_ID,
      [
        Query.equal('goalPackId', reviewData.goalPackId),
        Query.equal('userId', userId)
      ]
    );

    if (existingReviews.documents.length > 0) {
      throw new Error('You have already reviewed this goal pack');
    }

    const response = await databases.createDocument(
      DATABASE_ID,
      GOAL_PACK_REVIEWS_COLLECTION_ID,
      ID.unique(),
      {
        ...reviewData,
        userId,
        userName,
        userProfilePicture: userProfilePicture || '',
        isHelpful: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      goalPackId: response.goalPackId,
      userId: response.userId,
      userName: response.userName,
      userProfilePicture: response.userProfilePicture,
      rating: response.rating,
      reviewText: response.reviewText,
      isHelpful: response.isHelpful,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create review';
    console.error('Review creation error:', errorMessage);
    throw error;
  }
};

/**
 * Update a goal pack review
 */
export const updateGoalPackReview = async (
  reviewId: string,
  reviewData: UpdateGoalPackReviewRequest,
  userId: string
): Promise<GoalPackReview> => {
  try {
    // Verify ownership
    const existingReview = await databases.getDocument(
      DATABASE_ID,
      GOAL_PACK_REVIEWS_COLLECTION_ID,
      reviewId
    );

    if (existingReview.userId !== userId) {
      throw new Error('You can only update your own reviews');
    }

    const response = await databases.updateDocument(
      DATABASE_ID,
      GOAL_PACK_REVIEWS_COLLECTION_ID,
      reviewId,
      {
        ...reviewData,
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      goalPackId: response.goalPackId,
      userId: response.userId,
      userName: response.userName,
      userProfilePicture: response.userProfilePicture,
      rating: response.rating,
      reviewText: response.reviewText,
      isHelpful: response.isHelpful,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update review';
    console.error('Review update error:', errorMessage);
    throw error;
  }
};

/**
 * Delete a goal pack review
 */
export const deleteGoalPackReview = async (reviewId: string, userId: string): Promise<void> => {
  try {
    // Verify ownership
    const existingReview = await databases.getDocument(
      DATABASE_ID,
      GOAL_PACK_REVIEWS_COLLECTION_ID,
      reviewId
    );

    if (existingReview.userId !== userId) {
      throw new Error('You can only delete your own reviews');
    }

    await databases.deleteDocument(
      DATABASE_ID,
      GOAL_PACK_REVIEWS_COLLECTION_ID,
      reviewId
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete review';
    console.error('Review deletion error:', errorMessage);
    throw error;
  }
};

/**
 * Get reviews for a specific goal pack
 */
export const getGoalPackReviews = async (goalPackId: string): Promise<GoalPackReview[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      GOAL_PACK_REVIEWS_COLLECTION_ID,
      [
        Query.equal('goalPackId', goalPackId),
        Query.orderDesc('createdAt')
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      goalPackId: doc.goalPackId,
      userId: doc.userId,
      userName: doc.userName,
      userProfilePicture: doc.userProfilePicture,
      rating: doc.rating,
      reviewText: doc.reviewText,
      isHelpful: doc.isHelpful,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reviews';
    console.error('Reviews fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Purchase a goal pack
 */
export const purchaseGoalPack = async (
  purchaseData: CreateGoalPackPurchaseRequest,
  userId: string
): Promise<GoalPackPurchase> => {
  try {
    // Check if user has already purchased this pack
    const existingPurchases = await databases.listDocuments(
      DATABASE_ID,
      GOAL_PACK_PURCHASES_COLLECTION_ID,
      [
        Query.equal('goalPackId', purchaseData.goalPackId),
        Query.equal('userId', userId)
      ]
    );

    if (existingPurchases.documents.length > 0) {
      throw new Error('You have already purchased this goal pack');
    }

    const response = await databases.createDocument(
      DATABASE_ID,
      GOAL_PACK_PURCHASES_COLLECTION_ID,
      ID.unique(),
      {
        ...purchaseData,
        userId,
        purchaseDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      goalPackId: response.goalPackId,
      userId: response.userId,
      purchasePrice: response.purchasePrice,
      purchaseDate: response.purchaseDate,
      createdAt: response.createdAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to purchase goal pack';
    console.error('Purchase error:', errorMessage);
    throw error;
  }
};

/**
 * Get user's purchased goal packs
 */
export const getUserPurchases = async (userId: string): Promise<GoalPackPurchase[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      GOAL_PACK_PURCHASES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('createdAt')
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      goalPackId: doc.goalPackId,
      userId: doc.userId,
      purchasePrice: doc.purchasePrice,
      purchaseDate: doc.purchaseDate,
      createdAt: doc.createdAt
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user purchases';
    console.error('User purchases fetching error:', errorMessage);
    throw error;
  }
}; 
