import { NextRequest, NextResponse } from 'next/server';
// Use the 'node-appwrite' SDK for server-side operations
import { Client, Databases, Query } from 'node-appwrite';

// Use server-side environment variables for security
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const REMINDERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REMINDERS_COLLECTION_ID;
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;


export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables for robust error handling
    if (!DATABASE_ID || !REMINDERS_COLLECTION_ID || !APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
        console.error('❌ API Error: Missing required Appwrite environment variables on the server.');
        throw new Error('Server is not configured correctly.');
    }

    // Initialize a new, secure, server-side Appwrite client using the Node SDK
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY); // The API key grants server-level access

    const databases = new Databases(client);

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('✅ API: Successfully authenticated. Fetching pending reminders for user:', userId);

    // Get current time in UTC. .toISOString() is always in UTC (Z-normalized), so no manual offset is needed.
    const now = new Date();
    const utcNow = now.toISOString();
    
    // Query for pending reminders due in the next 24 hours
    const futureTime = new Date(now.getTime() + (24 * 60 * 60 * 1000)).toISOString();
    
    const reminders = await databases.listDocuments(
      DATABASE_ID,
      REMINDERS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('status', 'pending'),
        Query.greaterThanEqual('sendDate', utcNow),
        Query.lessThanEqual('sendDate', futureTime),
        Query.limit(100)
      ]
    );

    console.log(`📋 API: Found ${reminders.documents.length} pending reminders for user`);

    const transformedReminders = reminders.documents.map(doc => ({
      id: doc.$id,
      goalId: doc.goalId,
      title: doc.title,
      description: doc.description,
      sendDate: doc.sendDate,
      userId: doc.userId,
      source: 'server'
    }));

    return NextResponse.json({
      success: true,
      reminders: transformedReminders,
      count: transformedReminders.length,
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ API: Error fetching pending reminders:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch reminders',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 