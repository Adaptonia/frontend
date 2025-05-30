'use client'

import { Client, Databases, Query, ID, AppwriteException } from 'appwrite'
import { User, ApiResponse } from '../types/channel'

// Initialize Appwrite client
const client = new Client()
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

const databases = new Databases(client)

// Database and Collection IDs
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'main'
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'users'

export interface CreateUserData {
  userId: string
  name: string
  email: string
  role?: 'admin' | 'user'
  profilePicture?: string
}

class UserService {
  /**
   * Create or get user in the database
   */
  async createOrGetUser(userData: CreateUserData): Promise<ApiResponse<User>> {
    try {
      // First, try to get existing user
      const existingUser = await this.getUserById(userData.userId)
      if (existingUser.success && existingUser.data) {
        return existingUser
      }

      // Create new user if doesn't exist
      const userDoc = await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: userData.userId,
          name: userData.name,
          email: userData.email,
          role: userData.role || 'user',
          profilePicture: userData.profilePicture || '/api/placeholder/40/40'
        }
      )

      return {
        success: true,
        data: userDoc as unknown as User
      }
    } catch (error) {
      console.error('Error creating/getting user:', error)
      return this.handleError(error)
    }
  }

  /**
   * Get user by userId
   */
  async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const users = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.limit(1)
        ]
      )

      if (users.documents.length === 0) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      return {
        success: true,
        data: users.documents[0] as unknown as User
      }
    } catch (error) {
      console.error('Error getting user:', error)
      return this.handleError(error)
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updates: Partial<CreateUserData>): Promise<ApiResponse<User>> {
    try {
      const existingUser = await this.getUserById(userId)
      if (!existingUser.success || !existingUser.data) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      const updatedUser = await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        existingUser.data.$id,
        updates
      )

      return {
        success: true,
        data: updatedUser as unknown as User
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return this.handleError(error)
    }
  }

  /**
   * Get multiple users by their userIds
   */
  async getUsersByIds(userIds: string[]): Promise<ApiResponse<User[]>> {
    try {
      if (userIds.length === 0) {
        return { success: true, data: [] }
      }

      const users = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [
          Query.equal('userId', userIds),
          Query.limit(100)
        ]
      )

      return {
        success: true,
        data: users.documents as unknown as User[]
      }
    } catch (error) {
      console.error('Error getting users by IDs:', error)
      return this.handleError(error)
    }
  }

  /**
   * Handle errors and convert to consistent response format
   */
  private handleError(error: unknown): ApiResponse<any> {
    if (error instanceof AppwriteException) {
      return {
        success: false,
        error: error.message || 'An error occurred with the database'
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

// Export singleton instance
export const userService = new UserService()
export default userService 