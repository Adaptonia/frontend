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
    const { userId, title, body, data } = req.payload ?? {};

    if (!userId || !title || !body) {
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
    const tokens = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PUSH_TOKENS_COLLECTION_ID,
      [
        // Query for user's tokens
        Query.equal('userId', userId)
      ]
    );

    if (!tokens.documents.length) {
      return {
        json: {
          success: false,
          message: 'No FCM tokens found for user.'
        },
        status: 404
      };
    }

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

    return {
      json: {
        success: true,
        message: 'Notification sent successfully',
        response
      }
    };
  } catch (error) {
    context.error('Error sending notification: ' + error.message);
    return {
      json: {
        success: false,
        message: error.message
      },
      status: 500
    };
  }
}; 