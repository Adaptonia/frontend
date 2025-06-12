import { Account, Avatars, Client, Databases, Storage, Functions } from 'appwrite';

// Initialize the Appwrite client
export const client = new Client();

client
  .setEndpoint('https://cloud.appwrite.io/v1')  // Your Appwrite endpoint
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');  // Your project ID from environment variables

// Initialize Appwrite services
export const account = new Account(client);
export const avatars = new Avatars(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Database and collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
export const GOALS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GOALS_COLLECTION_ID || '';
export const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || '';
export const REMINDERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REMINDERS_COLLECTION_ID || 'reminders';
export const GOAL_PACKS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GOAL_PACKS_COLLECTION_ID || 'goal_packs';
export const LIBRARY_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_LIBRARY_COLLECTION_ID || 'library';
export const GOAL_PACK_REVIEWS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GOAL_PACK_REVIEWS_COLLECTION_ID || 'goal_pack_reviews';
export const GOAL_PACK_PURCHASES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GOAL_PACK_PURCHASES_COLLECTION_ID || 'goal_pack_purchases';

