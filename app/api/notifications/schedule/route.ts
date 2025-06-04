import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure web-push with your VAPID keys
// You'll need to generate these keys and set them as environment variables
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
  subject: process.env.VAPID_SUBJECT || 'mailto:your-email@example.com'
};

webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// In-memory storage for scheduled notifications (use a database in production)
const scheduledNotifications = new Map<string, NodeJS.Timeout>();

interface ScheduleNotificationRequest {
  goalId: string;
  title: string;
  message: string;
  scheduledTime: string; // ISO string
  userId?: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleNotificationRequest = await request.json();
    
    const { goalId, title, message, scheduledTime, subscription } = body;
    
    // Validate required fields
    if (!goalId || !title || !scheduledTime || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse scheduled time
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Calculate delay until notification should be sent
    const delay = scheduledDate.getTime() - now.getTime();
    
    // Cancel any existing notification for this goal
    const existingTimeout = scheduledNotifications.get(goalId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule the notification
    const timeout = setTimeout(async () => {
      try {
        console.log(`🚀 Sending push notification for goal: ${goalId}`);
        
        // Prepare the push notification payload
        const payload = JSON.stringify({
          title,
          body: message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          data: {
            goalId,
            url: `/dashboard?goal=${goalId}`,
            timestamp: Date.now()
          },
          actions: [
            {
              action: 'view',
              title: 'View Goal'
            },
            {
              action: 'complete',
              title: 'Mark Complete'
            }
          ],
          requireInteraction: true,
          tag: `goal-${goalId}`
        });

        // Send the push notification
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
            }
          },
          payload
        );

        console.log(`✅ Push notification sent successfully for goal: ${goalId}`);
        
        // Remove from scheduled notifications
        scheduledNotifications.delete(goalId);
        
      } catch (error) {
        console.error(`❌ Failed to send push notification for goal ${goalId}:`, error);
        // Remove from scheduled notifications even if failed
        scheduledNotifications.delete(goalId);
      }
    }, delay);

    // Store the timeout so we can cancel it later if needed
    scheduledNotifications.set(goalId, timeout);

    console.log(`📅 Notification scheduled for goal ${goalId} at ${scheduledDate.toLocaleString()}`);
    console.log(`⏰ Will fire in ${Math.round(delay / 1000)} seconds`);

    return NextResponse.json({
      success: true,
      goalId,
      scheduledTime: scheduledDate.toISOString(),
      delayMs: delay,
      message: `Notification scheduled for ${scheduledDate.toLocaleString()}`
    });

  } catch (error) {
    console.error('Error scheduling notification:', error);
    return NextResponse.json(
      { error: 'Failed to schedule notification' },
      { status: 500 }
    );
  }
}

// GET endpoint to check scheduled notifications (for debugging)
export async function GET() {
  const scheduled = Array.from(scheduledNotifications.keys());
  return NextResponse.json({
    scheduledNotifications: scheduled,
    count: scheduled.length
  });
} 