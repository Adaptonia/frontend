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
    if (authHeader !== `Bearer NUSheg_tWY2xy2j9bA9dWCJBDd1XKcWufCqFWUIDPHo`) {
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
        Query.limit(25) // Process max 25 reminders per run
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
        console.log(`📧 Processing reminder: ${reminder.$id}`);
        
        // Use user details directly from the reminder document
        if (!reminder.userEmail) {
          throw new Error(`Reminder ${reminder.$id} is missing an email address.`);
        }

        // Send email via Resend
        const { error: emailError } = await resend.emails.send({
          from: "Adaptonia <reminders@olonts.site>",
          to: [reminder.userEmail],
          subject: `🎯 Reminder: ${reminder.title || 'You have a reminder'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Hi ${reminder.userName || 'there'},</h2>
              <p>This is your scheduled reminder:</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0056b3;">${reminder.title}</h3>
                ${reminder.description ? `<p>${reminder.description}</p>` : ''}
              </div>
              <p>Keep up the great work!</p>
            </div>
          `,
        });

        if (emailError) {
          throw new Error(`Resend API Error: ${emailError.message}`);
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
        console.log(`✅ Email sent successfully to ${reminder.userEmail}`);

      } catch (error) {
        results.processed++;
        results.failed++;
        
        // Update retry count
        const newRetryCount = (reminder.retryCount || 0) + 1;
        const newStatus = newRetryCount >= 3 ? 'failed' : 'pending';
        
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_REMINDERS_COLLECTION_ID!,
          reminder.$id,
          {
            retryCount: newRetryCount,
            status: newStatus
          }
        );

        console.log(`❌ Failed to send reminder ${reminder.$id}:`, error);
      }
    }

    console.log('📊 Email reminders processing complete:', results);

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