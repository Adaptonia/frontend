import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, REMINDERS_COLLECTION_ID } from '@/src/services/appwrite/client';
import { Query } from 'appwrite';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 API: Checking for due notifications for user:', userId);

    // Get current time for comparison
    const now = new Date();
    const utcNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
    
    // Query for due reminders that are still pending
    const dueReminders = await databases.listDocuments(
      DATABASE_ID,
      REMINDERS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('status', 'pending'),
        Query.lessThanEqual('sendDate', utcNow), // Due now or in the past
        Query.limit(10) // Reasonable limit
      ]
    );

    console.log(`📋 API: Found ${dueReminders.documents.length} due notifications`);

    // Transform to notification format
    const notifications = dueReminders.documents.map(reminder => ({
      id: reminder.$id,
      goalId: reminder.goalId,
      title: reminder.title,
      description: reminder.description,
      sendDate: reminder.sendDate,
      userId: reminder.userId
    }));

    // Mark these reminders as 'sent' to prevent showing them again
    for (const reminder of dueReminders.documents) {
      try {
        await databases.updateDocument(
          DATABASE_ID,
          REMINDERS_COLLECTION_ID,
          reminder.$id,
          { status: 'sent' }
        );
        console.log(`✅ API: Marked reminder ${reminder.$id} as sent`);
      } catch (error) {
        console.error(`❌ API: Failed to mark reminder ${reminder.$id} as sent:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      notifications: notifications,
      count: notifications.length,
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ API: Error fetching due notifications:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch due notifications',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 