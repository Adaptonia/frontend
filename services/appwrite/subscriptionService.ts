import { databases, DATABASE_ID } from '@/lib/appwrite/config';
import { ID, Query } from 'appwrite';
import { Subscription } from '@/database/partner-accountability-schema';

const SUBSCRIPTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || 'subscriptions';

export interface CreateSubscriptionData {
  userId: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  paymentReference: string;
  paymentChannel: string;
  startDate: Date;
  endDate: Date;
  autoRenew?: boolean;
}

class SubscriptionService {
  // Create new subscription
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    try {
      const now = new Date().toISOString();

      const subscriptionData = {
        userId: data.userId,
        plan: data.plan,
        status: 'active',
        amount: data.amount,
        currency: data.currency,
        paymentReference: data.paymentReference,
        paymentChannel: data.paymentChannel,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        autoRenew: data.autoRenew || false,
        createdAt: now,
        updatedAt: now,
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        ID.unique(),
        subscriptionData
      );

      return this.mapDocumentToSubscription(result);
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Get user's active subscription
  async getUserActiveSubscription(userId: string): Promise<Subscription | null> {
    try {
      const now = new Date().toISOString();

      const result = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'active'),
          Query.greaterThan('endDate', now),
          Query.orderDesc('createdAt'),
          Query.limit(1)
        ]
      );

      if (result.documents.length === 0) {
        return null;
      }

      return this.mapDocumentToSubscription(result.documents[0]);
    } catch (error) {
      console.error('Error getting active subscription:', error);
      return null;
    }
  }

  // Check if user has active premium subscription
  async hasActivePremium(userId: string): Promise<boolean> {
    const subscription = await this.getUserActiveSubscription(userId);
    return subscription !== null;
  }

  // Get all user subscriptions (history)
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt')
        ]
      );

      return result.documents.map(doc => this.mapDocumentToSubscription(doc));
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return [];
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        subscriptionId,
        {
          status: 'cancelled',
          autoRenew: false,
          updatedAt: new Date().toISOString()
        }
      );

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  // Update expired subscriptions (can be called by cron job)
  async updateExpiredSubscriptions(): Promise<void> {
    try {
      const now = new Date().toISOString();

      const result = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal('status', 'active'),
          Query.lessThan('endDate', now)
        ]
      );

      for (const doc of result.documents) {
        await databases.updateDocument(
          DATABASE_ID,
          SUBSCRIPTIONS_COLLECTION_ID,
          doc.$id,
          {
            status: 'expired',
            updatedAt: now
          }
        );
      }
    } catch (error) {
      console.error('Error updating expired subscriptions:', error);
    }
  }

  // Map Appwrite document to Subscription interface
  private mapDocumentToSubscription(doc: any): Subscription {
    return {
      id: doc.$id,
      userId: doc.userId,
      plan: doc.plan,
      status: doc.status,
      amount: doc.amount,
      currency: doc.currency,
      paymentReference: doc.paymentReference,
      paymentChannel: doc.paymentChannel,
      startDate: doc.startDate,
      endDate: doc.endDate,
      autoRenew: doc.autoRenew,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export const subscriptionService = new SubscriptionService();
