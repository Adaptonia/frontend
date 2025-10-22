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
          throw new Error(`Reminder ${reminder.$id} is missing an email address.`);
        }

        // Prepare email content based on recurring status
        const isRecurring = reminder.isRecurring;
        const currentDay = reminder.currentDay || 1;
        const totalDays = reminder.recurringDuration || 1;
        
        const emailSubject = isRecurring 
          ? `🎯 Day ${currentDay}/${totalDays}: ${reminder.title || 'Daily Goal Reminder'}`
          : `🎯 Reminder: ${reminder.title || 'You have a reminder'}`;

        const emailContent = isRecurring
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Hi ${reminder.userName || 'there'},</h2>
              <p>This is your daily reminder for <strong>Day ${currentDay} of ${totalDays}</strong>:</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0056b3;">${reminder.title}</h3>
                ${reminder.description ? `<p>${reminder.description}</p>` : ''}
              </div>
              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #1976d2;">
                  📅 <strong>Progress:</strong> Day ${currentDay} of ${totalDays} 
                  ${totalDays > 1 ? `(${Math.round((currentDay / totalDays) * 100)}% complete)` : ''}
                </p>
              </div>
              <p>Keep up the great work! You're building lasting habits. 💪</p>
              <p>Best regards,<br/>The Adaptonia Team</p>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Hi ${reminder.userName || 'there'},</h2>
              <p>This is your scheduled reminder:</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0056b3;">${reminder.title}</h3>
                ${reminder.description ? `<p>${reminder.description}</p>` : ''}
              </div>
              <p>Keep up the great work!</p>
              <p>Best regards,<br/>The Adaptonia Team</p>
            </div>
          `;

        // Send email via Resend
        const { error: emailError } = await resend.emails.send({
          from: "Adaptonia <reminders@olonts.site>",
          to: [reminder.userEmail],
          subject: emailSubject,
          html: emailContent,
        });

        if (emailError) {
          throw new Error(`Resend API Error: ${emailError.message}`);
        }

        // Handle recurring vs non-recurring reminders
        if (isRecurring && currentDay < totalDays) {
          // This is a recurring reminder that should continue
          // Calculate next send time (tomorrow at same time)
          const nextSendAt = new Date(reminder.sendAt);
          nextSendAt.setDate(nextSendAt.getDate() + 1);
          
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_REMINDERS_COLLECTION_ID!,
            reminder.$id,
            {
              currentDay: currentDay + 1,
              sendAt: nextSendAt.toISOString(),
              lastSentDate: new Date().toISOString(),
              status: 'pending', // Keep as pending for next day
              retryCount: 0,     // Reset retry count
              updatedAt: new Date().toISOString()
            }
          );
          
        } else {
          // Non-recurring or final day of recurring reminder
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_REMINDERS_COLLECTION_ID!,
          reminder.$id,
            { 
              status: 'sent',
              lastSentDate: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          );
          
          
        }

        results.processed++;
        results.successful++;

      } catch (error: any) {
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