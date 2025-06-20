const { Client, Databases, Query, Functions } = require('node-appwrite');

module.exports = async function (req, context) {
  try {
    console.log('🔍 Starting due reminders check...');
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const functions = new Functions(client);

    // Get current time
    const now = new Date().toISOString();
    
    // Query for due reminders
    const dueReminders = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_REMINDERS_COLLECTION_ID,
      [
        Query.equal('status', 'pending'),
        Query.lessThanEqual('sendDate', now),
        Query.limit(50) // Process max 50 reminders per run
      ]
    );

    console.log(`📋 Found ${dueReminders.documents.length} due reminders`);

    if (dueReminders.documents.length === 0) {
      return {
        json: {
          success: true,
          message: 'No due reminders found',
          processedCount: 0
        }
      };
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each due reminder
    for (const reminder of dueReminders.documents) {
      try {
        console.log(`📤 Processing reminder: ${reminder.title} for user: ${reminder.userId}`);
        
        // Send FCM notification via existing function
        const notificationResponse = await functions.createExecution(
          process.env.APPWRITE_SEND_PUSH_NOTIFICATION_FUNCTION_ID,
          JSON.stringify({
            userId: reminder.userId,
            title: reminder.title,
            body: reminder.description || 'Time for your goal!',
            data: {
              goalId: reminder.goalId,
              type: 'reminder',
              reminderId: reminder.$id
            }
          })
        );

        console.log(`📤 FCM notification sent for reminder: ${reminder.$id}`);

        // Update reminder status to 'sent'
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_REMINDERS_COLLECTION_ID,
          reminder.$id,
          {
            status: 'sent',
            updatedAt: new Date().toISOString()
          }
        );

        results.processed++;
        results.successful++;
        console.log(`✅ Successfully processed reminder: ${reminder.$id}`);

      } catch (error) {
        console.error(`❌ Failed to process reminder ${reminder.$id}:`, error.message);
        
        // Update retry count
        const newRetryCount = (reminder.retryCount || 0) + 1;
        const maxRetries = 3;
        
        if (newRetryCount >= maxRetries) {
          // Mark as failed after max retries
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_REMINDERS_COLLECTION_ID,
            reminder.$id,
            {
              status: 'failed',
              retryCount: newRetryCount,
              updatedAt: new Date().toISOString()
            }
          );
          console.log(`💀 Marked reminder ${reminder.$id} as failed after ${maxRetries} retries`);
        } else {
          // Schedule retry (next retry in 30 minutes)
          const nextRetry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_REMINDERS_COLLECTION_ID,
            reminder.$id,
            {
              retryCount: newRetryCount,
              nextRetry: nextRetry,
              updatedAt: new Date().toISOString()
            }
          );
          console.log(`🔄 Scheduled retry ${newRetryCount}/${maxRetries} for reminder ${reminder.$id} at ${nextRetry}`);
        }
        
        results.processed++;
        results.failed++;
        results.errors.push({
          reminderId: reminder.$id,
          error: error.message
        });
      }
    }

    console.log(`📊 Processing complete - Successful: ${results.successful}, Failed: ${results.failed}`);

    return {
      json: {
        success: true,
        message: `Processed ${results.processed} due reminders`,
        results: results
      }
    };

  } catch (error) {
    context.error('Error checking due reminders: ' + error.message);
    console.error('❌ Due reminders check failed:', error);
    
    return {
      json: {
        success: false,
        message: error.message
      },
      status: 500
    };
  }
}; 