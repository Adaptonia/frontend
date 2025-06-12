import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, LIBRARY_COLLECTION_ID } from './client';
import { CreateLibraryItemRequest, LibraryItem, UpdateLibraryItemRequest, LibraryItemType } from '@/lib/types';

/**
 * Create a new library item
 */
export const createLibraryItem = async (itemData: CreateLibraryItemRequest, userId: string): Promise<LibraryItem> => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      ID.unique(),
      {
        ...itemData,
        userId,
        dateAdded: itemData.dateAdded || new Date().toISOString().split('T')[0],
        isFavorite: itemData.isFavorite || false,
        isCompleted: itemData.isCompleted || false,
        rating: itemData.rating || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      type: response.type,
      author: response.author,
      url: response.url,
      tags: response.tags,
      category: response.category,
      isFavorite: response.isFavorite,
      isCompleted: response.isCompleted,
      rating: response.rating,
      notes: response.notes,
      dateAdded: response.dateAdded,
      dateCompleted: response.dateCompleted,
      userId: response.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create library item';
    console.error('Library item creation error:', errorMessage);
    throw error;
  }
};

/**
 * Get all library items for a user
 */
export const getLibraryItems = async (userId: string): Promise<LibraryItem[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('createdAt')
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      type: doc.type,
      author: doc.author,
      url: doc.url,
      tags: doc.tags,
      category: doc.category,
      isFavorite: doc.isFavorite,
      isCompleted: doc.isCompleted,
      rating: doc.rating,
      notes: doc.notes,
      dateAdded: doc.dateAdded,
      dateCompleted: doc.dateCompleted,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch library items';
    console.error('Library items fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Get library items by category
 */
export const getLibraryItemsByCategory = async (userId: string, category: string): Promise<LibraryItem[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('category', category),
        Query.orderDesc('createdAt')
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      type: doc.type,
      author: doc.author,
      url: doc.url,
      tags: doc.tags,
      category: doc.category,
      isFavorite: doc.isFavorite,
      isCompleted: doc.isCompleted,
      rating: doc.rating,
      notes: doc.notes,
      dateAdded: doc.dateAdded,
      dateCompleted: doc.dateCompleted,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch library items by category';
    console.error('Library items by category fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Get library items by type
 */
export const getLibraryItemsByType = async (userId: string, type: LibraryItemType): Promise<LibraryItem[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('type', type),
        Query.orderDesc('createdAt')
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      type: doc.type,
      author: doc.author,
      url: doc.url,
      tags: doc.tags,
      category: doc.category,
      isFavorite: doc.isFavorite,
      isCompleted: doc.isCompleted,
      rating: doc.rating,
      notes: doc.notes,
      dateAdded: doc.dateAdded,
      dateCompleted: doc.dateCompleted,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch library items by type';
    console.error('Library items by type fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Get favorite library items
 */
export const getFavoriteLibraryItems = async (userId: string): Promise<LibraryItem[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('isFavorite', true),
        Query.orderDesc('createdAt')
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      type: doc.type,
      author: doc.author,
      url: doc.url,
      tags: doc.tags,
      category: doc.category,
      isFavorite: doc.isFavorite,
      isCompleted: doc.isCompleted,
      rating: doc.rating,
      notes: doc.notes,
      dateAdded: doc.dateAdded,
      dateCompleted: doc.dateCompleted,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch favorite library items';
    console.error('Favorite library items fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Update a library item
 */
export const updateLibraryItem = async (
  itemId: string, 
  itemData: UpdateLibraryItemRequest
): Promise<LibraryItem> => {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      itemId,
      {
        ...itemData,
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      type: response.type,
      author: response.author,
      url: response.url,
      tags: response.tags,
      category: response.category,
      isFavorite: response.isFavorite,
      isCompleted: response.isCompleted,
      rating: response.rating,
      notes: response.notes,
      dateAdded: response.dateAdded,
      dateCompleted: response.dateCompleted,
      userId: response.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update library item';
    console.error('Library item update error:', errorMessage);
    throw error;
  }
};

/**
 * Delete a library item
 */
export const deleteLibraryItem = async (itemId: string, userId: string): Promise<void> => {
  try {
    // First verify the user owns this item
    const item = await databases.getDocument(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      itemId
    );

    if (item.userId !== userId) {
      throw new Error('You do not have permission to delete this library item');
    }

    await databases.deleteDocument(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      itemId
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete library item';
    console.error('Library item deletion error:', errorMessage);
    throw error;
  }
};

/**
 * Toggle favorite status of a library item
 */
export const toggleLibraryItemFavorite = async (itemId: string, userId: string): Promise<LibraryItem> => {
  try {
    // Get the item first to check ownership and current favorite status
    const item = await databases.getDocument(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      itemId
    );

    if (item.userId !== userId) {
      throw new Error('You do not have permission to modify this library item');
    }

    // Toggle the favorite status
    const response = await databases.updateDocument(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      itemId,
      {
        isFavorite: !item.isFavorite,
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      type: response.type,
      author: response.author,
      url: response.url,
      tags: response.tags,
      category: response.category,
      isFavorite: response.isFavorite,
      isCompleted: response.isCompleted,
      rating: response.rating,
      notes: response.notes,
      dateAdded: response.dateAdded,
      dateCompleted: response.dateCompleted,
      userId: response.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to toggle library item favorite';
    console.error('Library item favorite toggle error:', errorMessage);
    throw error;
  }
};

/**
 * Toggle completion status of a library item
 */
export const toggleLibraryItemCompletion = async (itemId: string, userId: string): Promise<LibraryItem> => {
  try {
    // Get the item first to check ownership and current completion status
    const item = await databases.getDocument(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      itemId
    );

    if (item.userId !== userId) {
      throw new Error('You do not have permission to modify this library item');
    }

    // Toggle the completion status
    const updateData: any = {
      isCompleted: !item.isCompleted,
      updatedAt: new Date().toISOString()
    };

    // If marking as completed, set completion date
    if (!item.isCompleted) {
      updateData.dateCompleted = new Date().toISOString().split('T')[0];
    } else {
      // If marking as incomplete, remove completion date
      updateData.dateCompleted = null;
    }

    const response = await databases.updateDocument(
      DATABASE_ID,
      LIBRARY_COLLECTION_ID,
      itemId,
      updateData
    );

    return {
      id: response.$id,
      title: response.title,
      description: response.description,
      type: response.type,
      author: response.author,
      url: response.url,
      tags: response.tags,
      category: response.category,
      isFavorite: response.isFavorite,
      isCompleted: response.isCompleted,
      rating: response.rating,
      notes: response.notes,
      dateAdded: response.dateAdded,
      dateCompleted: response.dateCompleted,
      userId: response.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to toggle library item completion';
    console.error('Library item completion toggle error:', errorMessage);
    throw error;
  }
}; 