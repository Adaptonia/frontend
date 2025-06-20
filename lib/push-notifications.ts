/**
 * Push Notifications System for TRUE Background Notifications
 * This enables notifications to fire at exact times even when app is closed
 */

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getApp } from 'firebase/app';

const app = getApp();

export interface NotificationConfig {
  goalId: string;
  title: string;
  message: string;
  scheduledTime: string;
  userId?: string;
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if browser supports Firebase messaging
    const isFirebaseSupported = await isSupported();
    if (!isFirebaseSupported) {
      console.error('Firebase messaging is not supported');
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('Notification permission denied');
      return null;
    }

    // Get FCM token
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    if (token) {
      console.log('FCM Token obtained:', token);
      return token;
    } else {
      console.error('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Schedule a notification to be sent by the server at a specific time
 */
export async function scheduleServerPushNotification(notification: NotificationConfig): Promise<boolean> {
  try {
    // Get FCM token
    const fcmToken = await requestNotificationPermission();
    if (!fcmToken) {
      throw new Error('Failed to get FCM token');
    }

    // Schedule notification on server
    const response = await fetch('/api/notifications/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...notification,
        fcmToken
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    console.log('✅ FCM notification scheduled successfully');
    return true;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return false;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelServerPushNotification(goalId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId })
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel notification: ${response.status}`);
    }

    console.log('✅ FCM notification cancelled successfully');
    return true;
  } catch (error) {
    console.error('Failed to cancel notification:', error);
    return false;
  }
}

/**
 * Check if notifications are supported
 */
export async function isNotificationSupported(): Promise<boolean> {
  try {
    return await isSupported();
  } catch (error) {
    console.error('Error checking notification support:', error);
    return false;
  }
}

/**
 * Get current notification status
 */
export async function getNotificationStatus(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
}> {
  const supported = await isNotificationSupported();
  const permission = Notification.permission;

  return { supported, permission };
} 
