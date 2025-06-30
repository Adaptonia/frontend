const sdk = require('node-appwrite');

module.exports = async function ({ res, log, error: logError }) {
  try {
    log('🔍 Starting due reminders check...');
    
    // Initialize Appwrite client
    const client = new sdk.Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new sdk.Databases(client);

    // Get current time in UTC
    const now = new Date();
    const utcNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
    
    log('⏰ Current time check:', {
      localTime: now.toLocaleString(),
      utcTime: now.toUTCString(),
      isoString: now.toISOString(),
      adjustedUTC: utcNow
    });
    
    // Query for due reminders
    const dueReminders = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_REMINDERS_COLLECTION_ID,
      [
        sdk.Query.equal('status', 'pending'),
        sdk.Query.lessThanEqual('sendDate', utcNow),
        sdk.Query.limit(50) // Process max 50 reminders per run
      ]
    );

    log(`📋 Found ${dueReminders.documents.length} due reminders`);

    // Log each due reminder's time for debugging
    dueReminders.documents.forEach(reminder => {
      const reminderDate = new Date(reminder.sendDate);
      log(`📅 Due reminder ${reminder.$id}:`, {
        title: reminder.title,
        scheduledLocal: reminderDate.toLocaleString(),
        scheduledUTC: reminderDate.toUTCString(),
        scheduledISO: reminder.sendDate,
        currentUTC: utcNow
      });
    });

    if (dueReminders.documents.length === 0) {
      return res.json({
        success: true,
        message: 'No due reminders found',
        processedCount: 0,
        currentTime: {
          local: now.toLocaleString(),
          utc: now.toUTCString(),
          iso: now.toISOString()
        }
      });
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
        log(`📤 Processing reminder: ${reminder.title} for user: ${reminder.userId}`, {
          scheduledFor: reminder.sendDate,
          currentTime: utcNow
        });
        
        // Get user's FCM tokens first
        log('📤 Getting FCM tokens for user:', reminder.userId);
        const userTokens = await databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_PUSH_TOKENS_COLLECTION_ID,
          [
            sdk.Query.equal('userId', reminder.userId)
          ]
        );

        if (userTokens.documents.length === 0) {
          log(`⚠️ No FCM tokens found for user: ${reminder.userId}`);
          // Skip this reminder - user has no push tokens
          results.processed++;
          results.failed++;
          results.errors.push({
            reminderId: reminder.$id,
            error: 'No FCM tokens found for user'
          });
          continue;
        }

        log(`📱 Found ${userTokens.documents.length} FCM tokens for user`);

        // Create push notification using Firebase send-push-notification function
        log('📤 Sending push notification via Firebase...');
        
        // Use the existing send-push-notification function
        const notificationPayload = {
          userId: reminder.userId,
          title: reminder.title,
          body: reminder.description || 'Time to work on your goal!',
          data: {
            goalId: reminder.goalId,
            type: 'reminder',
            reminderId: reminder.$id
          }
        };

        const functions = new sdk.Functions(client);
        const notificationResponse = await functions.createExecution(
          process.env.APPWRITE_SEND_PUSH_NOTIFICATION_FUNCTION_ID,
          JSON.stringify(notificationPayload),
          false
        );

        log(`📤 Push notification sent - Response:`, notificationResponse.responseBody);

        // Update reminder status to 'sent'
        const updateData = {
          status: 'sent'
        };
        
        // Add optional fields only if they might be supported
        try {
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_REMINDERS_COLLECTION_ID,
            reminder.$id,
            updateData
          );
        } catch (updateError) {
          log(`⚠️ Could not update reminder ${reminder.$id}, but notification was sent: ${updateError.message}`);
        }

        results.processed++;
        results.successful++;
        log(`✅ Successfully processed reminder: ${reminder.$id}`);

      } catch (error) {
        logError(`❌ Failed to process reminder ${reminder.$id}:`, error.message);
        
        // Update retry count
        const newRetryCount = (reminder.retryCount || 0) + 1;
        const maxRetries = 3;
        
        // Try to update reminder with error handling for missing attributes
        try {
          if (newRetryCount >= maxRetries) {
            // Mark as failed after max retries
            await databases.updateDocument(
              process.env.APPWRITE_DATABASE_ID,
              process.env.APPWRITE_REMINDERS_COLLECTION_ID,
              reminder.$id,
              { status: 'failed' }
            );
            log(`💀 Marked reminder ${reminder.$id} as failed after ${maxRetries} retries`);
          } else {
            // Keep status as pending for retry (will be retried on next cron run)
            log(`🔄 Will retry reminder ${reminder.$id} on next cron run (attempt ${newRetryCount}/${maxRetries})`);
          }
        } catch (updateError) {
          log(`⚠️ Could not update reminder ${reminder.$id} status: ${updateError.message}`);
        }
        
        results.processed++;
        results.failed++;
        results.errors.push({
          reminderId: reminder.$id,
          error: error.message
        });
      }
    }

    log(`📊 Processing complete - Successful: ${results.successful}, Failed: ${results.failed}`);

    return res.json({
      success: true,
      message: `Processed ${results.processed} due reminders`,
      results: results,
      currentTime: {
        local: now.toLocaleString(),
        utc: now.toUTCString(),
        iso: now.toISOString()
      }
    });

  } catch (error) {
    logError('Error checking due reminders: ' + error.message);
    logError('❌ Due reminders check failed:', error);
    
    return res.json({
      success: false,
      message: error.message,
      currentTime: {
        local: new Date().toLocaleString(),
        utc: new Date().toUTCString(),
        iso: new Date().toISOString()
      }
    }, 500);
  }
};
