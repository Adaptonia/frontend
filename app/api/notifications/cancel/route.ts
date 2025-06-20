import { NextRequest, NextResponse } from 'next/server';

// This should match the storage used in the schedule endpoint
// In production, you'd use a database instead of in-memory storage
declare global {
  var scheduledNotifications: Map<string, NodeJS.Timeout> | undefined;
}

// Use global variable to persist across hot reloads in development
const scheduledNotifications = globalThis.scheduledNotifications ?? new Map<string, NodeJS.Timeout>();
globalThis.scheduledNotifications = scheduledNotifications;

interface CancelNotificationRequest {
  goalId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CancelNotificationRequest = await request.json();
    const { goalId } = body;
    
    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      );
    }

    // Check if notification exists
    const existingTimeout = scheduledNotifications.get(goalId);
    
    if (existingTimeout) {
      // Cancel the scheduled notification
      clearTimeout(existingTimeout);
      scheduledNotifications.delete(goalId);
      
      console.log(`✅ Cancelled scheduled notification for goal: ${goalId}`);
      
      return NextResponse.json({
        success: true,
        goalId,
        message: `Notification cancelled for goal ${goalId}`
      });
    } else {
      return NextResponse.json({
        success: false,
        goalId,
        message: `No scheduled notification found for goal ${goalId}`
      });
    }

  } catch (error) {
    console.error('Error cancelling notification:', error);
    return NextResponse.json(
      { error: 'Failed to cancel notification' },
      { status: 500 }
    );
  }
} 
