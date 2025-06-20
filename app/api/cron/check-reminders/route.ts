import { NextRequest, NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite/config';
import { Query } from 'appwrite';
import { DATABASE_ID, REMINDERS_COLLECTION_ID } from '@/src/services/appwrite';

export async function GET(request: NextRequest) {
  try {
    // Skip cron if critical environment variables are missing
    if (!process.env.CRON_SECRET || !process.env.NEXTAUTH_URL || !DATABASE_ID || !REMINDERS_COLLECTION_ID) {
      console.log('⚠️ Vercel Cron: Skipping - missing required environment variables');
      return NextResponse.json({ 
        success: true, 
        message: 'Cron job skipped - missing required environment variables',
        processedCount: 0
      });
    }

    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Vercel Cron: Starting due reminders check...');
    
    // Get current time
    const now = new Date().toISOString();
    
    // Query for due reminders that haven't been processed
    const dueReminders = await databases.listDocuments(
      DATABASE_ID,
      REMINDERS_COLLECTION_ID,
      [
        Query.equal('status', 'pending'),
        Query.lessThanEqual('sendDate', now),
        Query.limit(25) // Smaller batch for API route
      ]
    );

    console.log(`📋 Vercel Cron: Found ${dueReminders.documents.length} due reminders`);

    if (dueReminders.documents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No due reminders found',
        processedCount: 0
      });
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as { reminderId: string; error: string }[]
    };

    // Process each due reminder
    for (const reminder of dueReminders.documents) {
      try {
        console.log(`📤 Vercel Cron: Processing reminder: ${reminder.title} for user: ${reminder.userId}`);
        
        // Send FCM notification via existing API
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: reminder.userId,
            title: reminder.title,
            body: reminder.description || 'Time for your goal!',
            data: {
              goalId: reminder.goalId,
              type: 'reminder',
              reminderId: reminder.$id
            }
          })
        });

        if (response.ok) {
          console.log(`📤 Vercel Cron: FCM notification sent for reminder: ${reminder.$id}`);

          // Update reminder status to 'sent'
          await databases.updateDocument(
            DATABASE_ID,
            REMINDERS_COLLECTION_ID,
            reminder.$id,
            {
              status: 'sent',
              updatedAt: new Date().toISOString()
            }
          );

          results.processed++;
          results.successful++;
          console.log(`✅ Vercel Cron: Successfully processed reminder: ${reminder.$id}`);
        } else {
          throw new Error(`FCM API returned ${response.status}`);
        }

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Vercel Cron: Failed to process reminder ${reminder.$id}:`, errorMessage);
        
        // Update retry count
        const newRetryCount = (reminder.retryCount || 0) + 1;
        const maxRetries = 3;
        
        if (newRetryCount >= maxRetries) {
          // Mark as failed after max retries
          await databases.updateDocument(
            DATABASE_ID,
            REMINDERS_COLLECTION_ID,
            reminder.$id,
            {
              status: 'failed',
              retryCount: newRetryCount,
              updatedAt: new Date().toISOString()
            }
          );
          console.log(`💀 Vercel Cron: Marked reminder ${reminder.$id} as failed after ${maxRetries} retries`);
        } else {
          // Schedule retry (next retry in 30 minutes)
          const nextRetry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          await databases.updateDocument(
            DATABASE_ID,
            REMINDERS_COLLECTION_ID,
            reminder.$id,
            {
              retryCount: newRetryCount,
              nextRetry: nextRetry,
              updatedAt: new Date().toISOString()
            }
          );
          console.log(`🔄 Vercel Cron: Scheduled retry ${newRetryCount}/${maxRetries} for reminder ${reminder.$id}`);
        }
        
        results.processed++;
        results.failed++;
        results.errors.push({
          reminderId: reminder.$id,
          error: errorMessage
        });
      }
    }

    console.log(`📊 Vercel Cron: Processing complete - Successful: ${results.successful}, Failed: ${results.failed}`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} due reminders`,
      results: results
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Vercel Cron: Due reminders check failed:', errorMessage);
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 