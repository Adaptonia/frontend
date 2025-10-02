import { Client, Databases, ID } from 'appwrite';
import { PartnerNotification } from '../database/partner-accountability-schema';

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTIONS = {
  PARTNER_NOTIFICATIONS: process.env.NEXT_PUBLIC_APPWRITE_PARTNER_NOTIFICATIONS_COLLECTION_ID!,
  USERS: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
};

export interface CreateNotificationData {
  partnershipId: string;
  fromUserId: string;
  toUserId: string;
  type: 'partner_assigned' | 'task_completed' | 'verification_request' |
        'verification_approved' | 'verification_rejected' | 'redo_requested' |
        'goal_shared' | 'partnership_ended' | 'weekly_summary';
  title: string;
  message: string;
  relatedTaskId?: string;
  relatedGoalId?: string;
  relatedVerificationId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

class PartnerNotificationService {

  // ========== NOTIFICATION MANAGEMENT ==========

  async createNotification(data: CreateNotificationData): Promise<PartnerNotification | null> {
    try {
      const now = new Date().toISOString();

      const notificationData: Omit<PartnerNotification, 'id'> = {
        partnershipId: data.partnershipId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedTaskId: data.relatedTaskId,
        relatedGoalId: data.relatedGoalId,
        relatedVerificationId: data.relatedVerificationId,
        emailSent: false,
        pushSent: false,
        isRead: false,
        priority: data.priority || 'normal',
        createdAt: now,
        updatedAt: now,
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNER_NOTIFICATIONS,
        ID.unique(),
        notificationData
      );

      const notification: PartnerNotification = {
        id: result.$id,
        ...notificationData,
      };

      // Attempt to send email notification
      await this.sendEmailNotification(notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  async sendEmailNotification(notification: PartnerNotification): Promise<boolean> {
    try {
      // Get user details
      const [fromUser, toUser] = await Promise.all([
        this.getUserById(notification.fromUserId),
        this.getUserById(notification.toUserId)
      ]);

      if (!toUser || !toUser.email) {
        console.error('Cannot send email: recipient user not found or no email');
        return false;
      }

      // Generate email content based on notification type
      const emailData = await this.generateEmailContent(notification, fromUser, toUser);

      if (!emailData) {
        console.error('Failed to generate email content');
        return false;
      }

      // Send email via API route
      const response = await fetch('/api/partner-notifications/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: notification.id,
          emailData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update notification as sent
        await this.markEmailAsSent(notification.id);
        return true;
      } else {
        console.error('Failed to send email:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  private async getUserById(userId: string): Promise<any> {
    try {
      // Query by userId field, not document ID
      const { Query } = await import('appwrite');
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.equal('userId', userId)]
      );

      if (result.documents.length === 0) {
        console.error('User not found for userId:', userId);
        return null;
      }

      return result.documents[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  private async markEmailAsSent(notificationId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNER_NOTIFICATIONS,
        notificationId,
        {
          emailSent: true,
          emailSentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error('Error marking email as sent:', error);
    }
  }

  private async generateEmailContent(
    notification: PartnerNotification,
    fromUser: any,
    toUser: any
  ): Promise<EmailData | null> {
    const fromUserName = fromUser?.name || 'Your Partner';
    const toUserName = toUser?.name || 'there';

    switch (notification.type) {
      case 'partner_assigned':
        return {
          to: toUser.email,
          subject: '🤝 You\'ve been matched with an accountability partner!',
          htmlContent: this.generatePartnerAssignedHTML(fromUserName, toUserName, notification.partnershipId),
          textContent: this.generatePartnerAssignedText(fromUserName, toUserName, notification.partnershipId)
        };

      case 'task_completed':
        return {
          to: toUser.email,
          subject: '✅ Your partner completed a task',
          htmlContent: this.generateTaskCompletedHTML(fromUserName, toUserName, notification.title, notification.message),
          textContent: this.generateTaskCompletedText(fromUserName, toUserName, notification.title, notification.message)
        };

      case 'verification_request':
        return {
          to: toUser.email,
          subject: '🔍 Task verification needed',
          htmlContent: this.generateVerificationRequestHTML(fromUserName, toUserName, notification.title, notification.message),
          textContent: this.generateVerificationRequestText(fromUserName, toUserName, notification.title, notification.message)
        };

      case 'verification_approved':
        return {
          to: toUser.email,
          subject: '🎉 Your task was approved!',
          htmlContent: this.generateVerificationApprovedHTML(fromUserName, toUserName, notification.title, notification.message),
          textContent: this.generateVerificationApprovedText(fromUserName, toUserName, notification.title, notification.message)
        };

      case 'verification_rejected':
        return {
          to: toUser.email,
          subject: '🔄 Task needs revision',
          htmlContent: this.generateVerificationRejectedHTML(fromUserName, toUserName, notification.title, notification.message),
          textContent: this.generateVerificationRejectedText(fromUserName, toUserName, notification.title, notification.message)
        };

      case 'goal_shared':
        return {
          to: toUser.email,
          subject: '🎯 New shared goal created',
          htmlContent: this.generateGoalSharedHTML(fromUserName, toUserName, notification.title, notification.message),
          textContent: this.generateGoalSharedText(fromUserName, toUserName, notification.title, notification.message)
        };

      default:
        console.warn('Unknown notification type:', notification.type);
        return null;
    }
  }

  // ========== EMAIL TEMPLATES ==========

  private generatePartnerAssignedHTML(fromUserName: string, toUserName: string, partnershipId: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #3b82f6; font-size: 24px; margin: 0;">🤝 Partner Match Found!</h1>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Hi ${toUserName},
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Great news! We've found you the perfect accountability partner. You've been matched with <strong>${fromUserName}</strong> based on your shared goals and preferences.
          </p>

          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #1e40af; margin: 0 0 16px 0;">What happens next?</h3>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Start creating shared goals together</li>
              <li style="margin-bottom: 8px;">Break down your goals into verifiable tasks</li>
              <li style="margin-bottom: 8px;">Support each other through regular check-ins</li>
              <li>Celebrate your achievements together!</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXTAUTH_URL}/partnership/${partnershipId}"
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Partnership Dashboard
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 32px;">
            Ready to achieve your goals together? Let's get started!
          </p>
        </div>
      </div>
    `;
  }

  private generatePartnerAssignedText(fromUserName: string, toUserName: string, partnershipId: string): string {
    return `
      Hi ${toUserName},

      Great news! We've found you the perfect accountability partner. You've been matched with ${fromUserName} based on your shared goals and preferences.

      What happens next?
      • Start creating shared goals together
      • Break down your goals into verifiable tasks
      • Support each other through regular check-ins
      • Celebrate your achievements together!

      View your partnership dashboard: ${process.env.NEXTAUTH_URL}/partnership/${partnershipId}

      Ready to achieve your goals together? Let's get started!

      Best regards,
      The Adaptonia Team
    `;
  }

  private generateTaskCompletedHTML(fromUserName: string, toUserName: string, title: string, message: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #059669; font-size: 24px; margin: 0;">✅ Task Completed!</h1>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Hi ${toUserName},
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Your accountability partner <strong>${fromUserName}</strong> has completed a task and marked it as done:
          </p>

          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0;">
            <h3 style="color: #065f46; margin: 0 0 8px 0;">${title}</h3>
            <p style="color: #374151; margin: 0;">${message}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            If this task requires verification, you'll receive a separate notification to review and approve it.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXTAUTH_URL}/partnership"
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Partnership Dashboard
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateTaskCompletedText(fromUserName: string, toUserName: string, title: string, message: string): string {
    return `
      Hi ${toUserName},

      Your accountability partner ${fromUserName} has completed a task and marked it as done:

      Task: ${title}
      ${message}

      If this task requires verification, you'll receive a separate notification to review and approve it.

      View your partnership dashboard: ${process.env.NEXTAUTH_URL}/partnership

      Keep up the great work together!

      Best regards,
      The Adaptonia Team
    `;
  }

  private generateVerificationRequestHTML(fromUserName: string, toUserName: string, title: string, message: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #d97706; font-size: 24px; margin: 0;">🔍 Task Verification Needed</h1>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Hi ${toUserName},
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            <strong>${fromUserName}</strong> has completed a task and is requesting your verification:
          </p>

          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
            <h3 style="color: #92400e; margin: 0 0 8px 0;">${title}</h3>
            <p style="color: #374151; margin: 0;">${message}</p>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #374151; margin: 0 0 16px 0;">Your verification options:</h3>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>Approve:</strong> Confirm the task is completed satisfactorily</li>
              <li style="margin-bottom: 8px;"><strong>Reject:</strong> Mark as incomplete or unsatisfactory</li>
              <li><strong>Request Redo:</strong> Ask for improvements or corrections</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXTAUTH_URL}/partnership/verify"
               style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Verify Task Now
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 32px;">
            Your partner is counting on your feedback. Please review when you have a moment.
          </p>
        </div>
      </div>
    `;
  }

  private generateVerificationRequestText(fromUserName: string, toUserName: string, title: string, message: string): string {
    return `
      Hi ${toUserName},

      ${fromUserName} has completed a task and is requesting your verification:

      Task: ${title}
      ${message}

      Your verification options:
      • Approve: Confirm the task is completed satisfactorily
      • Reject: Mark as incomplete or unsatisfactory
      • Request Redo: Ask for improvements or corrections

      Verify the task: ${process.env.NEXTAUTH_URL}/partnership/verify

      Your partner is counting on your feedback. Please review when you have a moment.

      Best regards,
      The Adaptonia Team
    `;
  }

  private generateVerificationApprovedHTML(fromUserName: string, toUserName: string, title: string, message: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #059669; font-size: 24px; margin: 0;">🎉 Task Approved!</h1>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Hi ${toUserName},
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Great news! <strong>${fromUserName}</strong> has approved your completed task:
          </p>

          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0;">
            <h3 style="color: #065f46; margin: 0 0 8px 0;">${title}</h3>
            <p style="color: #374151; margin: 0;">${message}</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <p style="font-size: 18px; color: #059669; font-weight: 600; margin: 0;">
              🏆 Well done! Keep up the excellent work!
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXTAUTH_URL}/partnership"
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Your Progress
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateVerificationApprovedText(fromUserName: string, toUserName: string, title: string, message: string): string {
    return `
      Hi ${toUserName},

      Great news! ${fromUserName} has approved your completed task:

      Task: ${title}
      ${message}

      🏆 Well done! Keep up the excellent work!

      View your progress: ${process.env.NEXTAUTH_URL}/partnership

      Best regards,
      The Adaptonia Team
    `;
  }

  private generateVerificationRejectedHTML(fromUserName: string, toUserName: string, title: string, message: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #dc2626; font-size: 24px; margin: 0;">🔄 Task Needs Revision</h1>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Hi ${toUserName},
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            <strong>${fromUserName}</strong> has reviewed your task and provided feedback:
          </p>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
            <h3 style="color: #b91c1c; margin: 0 0 8px 0;">${title}</h3>
            <p style="color: #374151; margin: 0;"><strong>Feedback:</strong> ${message}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Don't worry! This is part of the accountability process. Use this feedback to improve and try again.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXTAUTH_URL}/partnership"
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Task & Feedback
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 32px;">
            Remember: Every setback is a setup for a comeback! 💪
          </p>
        </div>
      </div>
    `;
  }

  private generateVerificationRejectedText(fromUserName: string, toUserName: string, title: string, message: string): string {
    return `
      Hi ${toUserName},

      ${fromUserName} has reviewed your task and provided feedback:

      Task: ${title}
      Feedback: ${message}

      Don't worry! This is part of the accountability process. Use this feedback to improve and try again.

      View task & feedback: ${process.env.NEXTAUTH_URL}/partnership

      Remember: Every setback is a setup for a comeback! 💪

      Best regards,
      The Adaptonia Team
    `;
  }

  private generateGoalSharedHTML(fromUserName: string, toUserName: string, title: string, message: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">🎯 New Shared Goal Created</h1>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Hi ${toUserName},
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            <strong>${fromUserName}</strong> has created a new shared goal for both of you to work on:
          </p>

          <div style="background-color: #faf5ff; border-left: 4px solid #8b5cf6; padding: 16px; margin: 24px 0;">
            <h3 style="color: #6b21a8; margin: 0 0 8px 0;">${title}</h3>
            <p style="color: #374151; margin: 0;">${message}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Start breaking this goal down into tasks and support each other along the way!
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXTAUTH_URL}/partnership"
               style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Shared Goal
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateGoalSharedText(fromUserName: string, toUserName: string, title: string, message: string): string {
    return `
      Hi ${toUserName},

      ${fromUserName} has created a new shared goal for both of you to work on:

      Goal: ${title}
      ${message}

      Start breaking this goal down into tasks and support each other along the way!

      View shared goal: ${process.env.NEXTAUTH_URL}/partnership

      Best regards,
      The Adaptonia Team
    `;
  }

  // ========== NOTIFICATION QUERIES ==========

  async getPartnershipNotifications(partnershipId: string): Promise<PartnerNotification[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PARTNER_NOTIFICATIONS,
        [
          // Query.equal('partnershipId', partnershipId),
          // Query.orderDesc('createdAt'),
          // Query.limit(50)
        ]
      );

      return result.documents.map(doc => ({
        id: doc.$id,
        partnershipId: doc.partnershipId,
        fromUserId: doc.fromUserId,
        toUserId: doc.toUserId,
        type: doc.type,
        title: doc.title,
        message: doc.message,
        relatedTaskId: doc.relatedTaskId,
        relatedGoalId: doc.relatedGoalId,
        relatedVerificationId: doc.relatedVerificationId,
        emailSent: doc.emailSent,
        emailSentAt: doc.emailSentAt,
        pushSent: doc.pushSent,
        pushSentAt: doc.pushSentAt,
        isRead: doc.isRead,
        readAt: doc.readAt,
        actionTaken: doc.actionTaken,
        priority: doc.priority,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
    } catch (error) {
      console.error('Error getting partnership notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PARTNER_NOTIFICATIONS,
        notificationId,
        {
          isRead: true,
          readAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // ========== QUICK NOTIFICATION HELPERS ==========

  async notifyPartnershipRequest(partnershipId: string, requesterId: string, partnerId: string): Promise<void> {
    // Notify partner about the partnership request (pending)
    await this.createNotification({
      partnershipId,
      fromUserId: requesterId,
      toUserId: partnerId,
      type: 'partner_assigned',
      title: 'Partnership Request',
      message: 'Someone wants to be your accountability partner! Review and accept or decline the request.',
      priority: 'high'
    });
  }

  async notifyPartnerAssignment(partnershipId: string, user1Id: string, user2Id: string): Promise<void> {
    // Notify user 2 about the new partnership
    await this.createNotification({
      partnershipId,
      fromUserId: user1Id,
      toUserId: user2Id,
      type: 'partner_assigned',
      title: 'New Accountability Partner',
      message: 'You\'ve been matched with a new accountability partner! Start your journey together.',
      priority: 'high'
    });

    // Notify user 1 as well
    await this.createNotification({
      partnershipId,
      fromUserId: user2Id,
      toUserId: user1Id,
      type: 'partner_assigned',
      title: 'New Accountability Partner',
      message: 'You\'ve been matched with a new accountability partner! Start your journey together.',
      priority: 'high'
    });
  }

  async notifyTaskCompleted(
    partnershipId: string,
    ownerId: string,
    partnerId: string,
    taskTitle: string,
    taskId: string
  ): Promise<void> {
    await this.createNotification({
      partnershipId,
      fromUserId: ownerId,
      toUserId: partnerId,
      type: 'task_completed',
      title: 'Partner Completed Task',
      message: `Your partner has completed: "${taskTitle}"`,
      relatedTaskId: taskId,
      priority: 'normal'
    });
  }

  async notifyVerificationRequest(
    partnershipId: string,
    requesterId: string,
    verifierId: string,
    taskTitle: string,
    taskId: string
  ): Promise<void> {
    await this.createNotification({
      partnershipId,
      fromUserId: requesterId,
      toUserId: verifierId,
      type: 'verification_request',
      title: 'Task Verification Needed',
      message: `Please verify the completed task: "${taskTitle}"`,
      relatedTaskId: taskId,
      priority: 'high'
    });
  }

  async notifyVerificationResult(
    partnershipId: string,
    verifierId: string,
    ownerId: string,
    taskTitle: string,
    action: 'approved' | 'rejected',
    comment?: string
  ): Promise<void> {
    const type = action === 'approved' ? 'verification_approved' : 'verification_rejected';
    const title = action === 'approved' ? 'Task Approved!' : 'Task Needs Revision';
    const message = comment ||
      (action === 'approved'
        ? `Your task "${taskTitle}" has been approved by your partner!`
        : `Your task "${taskTitle}" needs some revisions. Check the feedback provided.`);

    await this.createNotification({
      partnershipId,
      fromUserId: verifierId,
      toUserId: ownerId,
      type,
      title,
      message,
      priority: action === 'approved' ? 'normal' : 'high'
    });
  }

  async notifyGoalShared(
    partnershipId: string,
    ownerId: string,
    partnerId: string,
    goalTitle: string,
    goalId: string
  ): Promise<void> {
    await this.createNotification({
      partnershipId,
      fromUserId: ownerId,
      toUserId: partnerId,
      type: 'goal_shared',
      title: 'New Shared Goal',
      message: `Your partner created a shared goal: "${goalTitle}"`,
      relatedGoalId: goalId,
      priority: 'normal'
    });
  }
}

export const partnerNotificationService = new PartnerNotificationService();
export default partnerNotificationService;