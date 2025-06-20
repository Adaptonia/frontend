import { NextRequest, NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite/config';
import { Query } from 'appwrite';
import admin from '@/lib/firebase-admin';
import { DATABASE_ID, PUSH_TOKENS_COLLECTION_ID } from '@/src/services/appwrite';
import { Message, MulticastMessage } from 'firebase-admin/messaging';

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: userId, title, or body' },
        { status: 400 }
      );
    }

    // Get user's FCM tokens from Appwrite database
    const tokens = await databases.listDocuments(
      DATABASE_ID,
      PUSH_TOKENS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (!tokens.documents.length) {
      return NextResponse.json(
        { success: false, message: 'No FCM tokens found for user' },
        { status: 404 }
      );
    }

    // Extract all tokens for multicast (user might have multiple devices)
    const fcmTokens = tokens.documents.map(doc => doc.token);
    console.log(`📤 Sending FCM notification to ${fcmTokens.length} device(s) for user: ${userId}`);

    let response;

    if (fcmTokens.length === 1) {
      // Single device - use send()
      // Use both notification AND data fields for maximum compatibility
      const message: Message = {
        token: fcmTokens[0],
        notification: {
          title,
          body,
        },
        data: {
          title, // Also include in data for service worker
          body,  // Also include in data for service worker
          ...(data || {}),
          timestamp: Date.now().toString(),
          clickAction: '/dashboard'
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            tag: `adaptonia-${Date.now()}`,
            renotify: true
          },
          fcmOptions: {
            link: '/dashboard'
          }
        }
      };

      console.log('📤 Sending single FCM message:', JSON.stringify(message, null, 2));
      response = await admin.messaging().send(message);
      console.log('✅ Push notification sent to single device:', response);

    } else {
      // Multiple devices - use sendEachForMulticast()
      const message: MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: {
          title, // Also include in data for service worker
          body,  // Also include in data for service worker
          ...(data || {}),
          timestamp: Date.now().toString(),
          clickAction: '/dashboard'
        },
        tokens: fcmTokens,
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            tag: `adaptonia-${Date.now()}`,
            renotify: true
          },
          fcmOptions: {
            link: '/dashboard'
          }
        }
      };

      console.log('📤 Sending multicast FCM message:', JSON.stringify(message, null, 2));
      response = await admin.messaging().sendEachForMulticast(message);
      console.log(`✅ Push notification sent to ${response.successCount}/${fcmTokens.length} devices`);
      
      // Handle partial failures
      if (response.failureCount > 0) {
        console.warn(`⚠️ ${response.failureCount} notifications failed:`, response.responses);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      response
    });

  } catch (error: any) {
    console.error('❌ Error sending notification:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 
