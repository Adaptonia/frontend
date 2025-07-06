import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  // --- Environment Variable Validation ---
  const requiredEnv = [
    'RESEND_API_KEY',
    'CRON_SECRET',
    'APPWRITE_ENDPOINT',
    'APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_REMINDERS_COLLECTION_ID',
    'APPWRITE_USERS_COLLECTION_ID'
  ];

  for (const key of requiredEnv) {
    if (!process.env[key]) {
      console.error(`❌ Missing required environment variable: ${key}`);
      return NextResponse.json(
        { success: false, error: `Server configuration error: Missing environment variable ${key}` },
        { status: 500 }
      );
    }
  }
  // --- End Validation ---

  try {
    // Security: Verify cron secret (following Vercel docs)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Cron job: Starting email reminders check...');

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    
    // Get current time
    const now = new Date().toISOString();
    
    // Query for due reminders that haven't been sent
    const dueReminders = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_REMINDERS_COLLECTION_ID!,
      [
        Query.equal('status', 'pending'),
        Query.lessThanEqual('sendAt', now),
        Query.limit(3) // Reduced from 25 to 3 for 10-second timeout
      ]
    );

    console.log(`📋 Found ${dueReminders.documents.length} due email reminders`);

    if (dueReminders.documents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No due email reminders found',
        processedCount: 0
      });
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0
    };

    // Process each reminder
    for (const reminder of dueReminders.documents) {
      try {
        // Use user details directly from the reminder document
        if (!reminder.userEmail) {
          throw new Error(`Missing email for reminder ${reminder.$id}`);
        }

        // Send simple email via Resend
        const { error: emailError } = await resend.emails.send({
          from: "Adaptonia <reminders@olonts.site>",
          to: [reminder.userEmail],
          subject: `🎯 Goal Reminder`,
          text: `Hi ${reminder.userName || 'there'},\n\nThis is your scheduled reminder: ${reminder.title || 'Time to work on your goal!'}\n\n${reminder.description || ''}\n\nKeep up the great work!\n\n- Adaptonia Team`
        });

        if (emailError) {
          throw new Error(`Email failed: ${emailError.message}`);
        }

        // Update reminder status to 'sent'
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_REMINDERS_COLLECTION_ID!,
          reminder.$id,
          { status: 'sent' }
        );

        results.processed++;
        results.successful++;

      } catch (error) {
        results.processed++;
        results.failed++;
        
        // Simple retry logic - just mark as failed after first failure
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_REMINDERS_COLLECTION_ID!,
          reminder.$id,
          { status: 'failed' }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} email reminders`,
      results: results
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 