'use client';

import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, REMINDERS_COLLECTION_ID } from './client';

// Simple reminder data structure following Salein's pattern
type ReminderData = {
  goalId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  title: string;
  description?: string;
  sendDate: string;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
};

// Input type for creating reminders (excludes status and retryCount)
type ReminderInput = Omit<ReminderData, 'status' | 'retryCount'>;

const CONFIG = {
  databaseId: DATABASE_ID,
  collectionId: REMINDERS_COLLECTION_ID,
  maxRetries: 3,
  retryDelay: 30 * 60 * 1000 // 30 minutes
} as const;

const validateConfig = () => {
  if (!CONFIG.databaseId || !CONFIG.collectionId) {
    throw new Error(`Database or Collection ID not configured. 
      Database ID: ${CONFIG.databaseId}, 
      Collection ID: ${CONFIG.collectionId}`
    );
  }
};

// Simple function to create reminder (like Salein)
export const createReminder = async (reminder: ReminderInput) => {
  validateConfig();
  return databases.createDocument(
    CONFIG.databaseId,
    CONFIG.collectionId,
    ID.unique(),
    {
      ...reminder,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );
};

// Simple function to get due reminders (like Salein)
export const getDueReminders = async () => {
  validateConfig();
  const now = new Date().toISOString();
  
  const reminders = await databases.listDocuments(
    CONFIG.databaseId,
    CONFIG.collectionId,
    [
      Query.equal('status', 'pending'),
      Query.lessThanEqual('sendDate', now),
      Query.lessThan('retryCount', CONFIG.maxRetries)
    ]
  );

  return reminders;
};

// Debug function to get ALL pending reminders
export const getAllPendingReminders = async () => {
  validateConfig();
  
  const reminders = await databases.listDocuments(
    CONFIG.databaseId,
    CONFIG.collectionId,
    [
      Query.equal('status', 'pending'),
      Query.lessThan('retryCount', CONFIG.maxRetries)
    ]
  );

  return reminders;
};

// Simple function to update reminder status (like Salein)
export const updateReminderStatus = async (
  reminderId: string, 
  status: ReminderData['status']
) => {
  validateConfig();
  return databases.updateDocument(
    CONFIG.databaseId,
    CONFIG.collectionId,
    reminderId,
    { 
      status,
      updatedAt: new Date().toISOString()
    }
  );
};

// Simple function to update retry count (like Salein)
export const updateRetryCount = async (
  reminderId: string, 
  retryCount: number
) => {
  validateConfig();
  return databases.updateDocument(
    CONFIG.databaseId,
    CONFIG.collectionId,
    reminderId,
    {
      retryCount,
      nextRetry: new Date(Date.now() + CONFIG.retryDelay).toISOString(),
      updatedAt: new Date().toISOString()
    }
  );
};

// Export reminder service object (like Salein)
export const reminderService = {
  createReminder,
  getDueReminders,
  getAllPendingReminders,
  updateReminderStatus,
  updateRetryCount
} as const; 
