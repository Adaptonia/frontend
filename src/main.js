const { Client, Databases, Query } = require('node-appwrite');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = async function (req, context) {
  try {
    context.log('🚀 Function started - checking payload...');
    context.log('🔍 req.payload:', req.payload);
    
    const { userId, title, body, data } = req.payload ?? {};
    
    context.log(`📋 Extracted fields: userId=${userId}, title=${title}, body=${body}`);

    if (!userId || !title || !body) {
      context.log('❗ Missing required fields');
      return {
        json: {
          success: false,
          message: 'Missing required fields: userId, title, or body.'
        },
        status: 400
      };
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Get user's FCM tokens from database
    context.log('🔍 Querying for FCM tokens...');
    const tokens = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PUSH_TOKENS_COLLECTION_ID,
      [
        // Query for user's tokens
        Query.equal('userId', userId)
      ]
    );

    context.log(`📱 Found ${tokens.documents.length} FCM tokens`);
    
    if (!tokens.documents.length) {
      context.log(`⚠️ No FCM tokens found for user: ${userId}`);
      return {
        json: {
          success: false,
          message: 'No FCM tokens found for user.'
        },
        status: 404
      };
    }

    context.log('🔍 Preparing notification message...');

    // Prepare notification message
    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      tokens: tokens.documents.map(doc => doc.token)
    };

    // Send notification
    const response = await admin.messaging().sendMulticast(message);

    context.log('✅ Notification sent - Success: ' + response.successCount + ', Failed: ' + response.failureCount);

    return {
      json: {
        success: true,
        message: 'Notification sent successfully',
        response
      }
    };
  } catch (error) {
    context.error('Error sending notification: ' + error.message);
    context.error('Stack trace:', error.stack);
    return {
      json: {
        success: false,
        message: error.message
      },
      status: 500
    };
  }
}; 