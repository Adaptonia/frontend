import { NextRequest, NextResponse } from 'next/server';
import partnerNotificationService, { CreateNotificationData } from '@/services/partnerNotificationService';

export async function POST(request: NextRequest) {
  try {
    const notificationData: CreateNotificationData = await request.json();

    // Validate required fields
    if (!notificationData.partnershipId || !notificationData.fromUserId || !notificationData.toUserId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: partnershipId, fromUserId, toUserId' },
        { status: 400 }
      );
    }

    if (!notificationData.type || !notificationData.title || !notificationData.message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, message' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = [
      'partner_assigned',
      'partnership_request',
      'task_completed',
      'verification_request',
      'verification_approved',
      'verification_rejected',
      'redo_requested',
      'goal_shared',
      'partnership_ended',
      'weekly_summary'
    ];

    if (!validTypes.includes(notificationData.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Create the notification (this will also attempt to send email)
    const notification = await partnerNotificationService.createNotification(notificationData);

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Failed to create notification' },
        { status: 500 }
      );
    }

   

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        emailSent: notification.emailSent,
        createdAt: notification.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating partner notification:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnershipId = searchParams.get('partnershipId');

    if (!partnershipId) {
      return NextResponse.json(
        { success: false, error: 'Missing partnershipId parameter' },
        { status: 400 }
      );
    }

    const notifications = await partnerNotificationService.getPartnershipNotifications(partnershipId);

    return NextResponse.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Error fetching partner notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}