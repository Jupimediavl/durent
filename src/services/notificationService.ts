import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaClient, NotificationType } from '@prisma/client';

const expo = new Expo();
const prisma = new PrismaClient();

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  // Save notification to database and send push notification
  static async createAndSendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      // Get user with push token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { notificationSettings: true }
      });

      if (!user || !user.pushToken) {
        console.log('User not found or no push token');
        return false;
      }

      // Check if user wants this type of notification
      if (!this.shouldSendNotification(user, type)) {
        console.log(`User ${userId} has disabled ${type} notifications`);
        return false;
      }

      // Save notification to database  
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data: data || {},
          sentAt: new Date()
        }
      });

      // Send push notification
      const success = await this.sendPushNotification(user.pushToken, {
        title,
        body,
        data: { ...data, notificationId: notification.id }
      });

      if (!success) {
        // Mark as failed to send
        await prisma.notification.update({
          where: { id: notification.id },
          data: { sentAt: null }
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to create and send notification:', error);
      return false;
    }
  }

  static shouldSendNotification(user: any, type: NotificationType): boolean {
    const settings = user.notificationSettings;
    if (!settings) return true; // Default: send all notifications

    switch (type) {
      case 'PAYMENT_REMINDER':
      case 'PAYMENT_OVERDUE':
        return settings.paymentReminders;
      case 'PAYMENT_APPROVED':
      case 'PAYMENT_REJECTED':
      case 'PAYMENT_VERIFICATION_NEEDED':
        return settings.paymentUpdates;
      case 'NEW_MESSAGE':
        return settings.messages;
      case 'END_RENTAL_REQUEST':
      case 'END_RENTAL_AUTO_ACCEPT_WARNING':
        return settings.endRentalNotifications;
      case 'NEW_TENANT_JOINED':
        return settings.tenantUpdates;
      case 'PAYMENT_DATE_CHANGE_REQUEST':
      case 'PAYMENT_DATE_CHANGE_APPROVED':
      case 'PAYMENT_DATE_CHANGE_REJECTED':
        return settings.paymentDateChangeRequests;
      default:
        return true;
    }
  }

  private static async sendPushNotification(
    pushToken: string, 
    notification: NotificationData
  ): Promise<boolean> {
    try {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error('Invalid push token:', pushToken);
        return false;
      }

      const message: ExpoPushMessage = {
        to: pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      };

      const tickets = await expo.sendPushNotificationsAsync([message]);
      const ticket = tickets[0];

      if (ticket.status === 'error') {
        console.error('Push notification error:', ticket.message);
        return false;
      }

      console.log('Push notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  // PAYMENT NOTIFICATIONS
  static async sendPaymentReminderNotification(
    tenantId: string,
    propertyTitle: string,
    amount: number,
    dueDate: string,
    propertyId: string
  ): Promise<boolean> {
    return this.createAndSendNotification(
      tenantId,
      'PAYMENT_REMINDER',
      'Rent Payment Reminder',
      `AED ${amount} due for "${propertyTitle}" on ${dueDate}`,
      { type: 'payment_reminder', propertyId, amount, dueDate }
    );
  }

  static async sendPaymentOverdueNotification(
    tenantId: string,
    landlordId: string,
    propertyTitle: string,
    amount: number,
    daysPastDue: number,
    propertyId: string
  ): Promise<boolean> {
    // Notify tenant
    await this.createAndSendNotification(
      tenantId,
      'PAYMENT_OVERDUE',
      'Payment Overdue!',
      `Your rent of AED ${amount} for "${propertyTitle}" is ${daysPastDue} days overdue`,
      { type: 'payment_overdue', propertyId, amount, daysPastDue }
    );

    // Notify landlord
    return this.createAndSendNotification(
      landlordId,
      'PAYMENT_OVERDUE',
      'Tenant Payment Overdue',
      `Tenant's rent of AED ${amount} for "${propertyTitle}" is ${daysPastDue} days overdue`,
      { type: 'payment_overdue', propertyId, amount, daysPastDue }
    );
  }

  static async sendPaymentApprovedNotification(
    tenantId: string,
    propertyTitle: string,
    amount: number,
    propertyId: string
  ): Promise<boolean> {
    return this.createAndSendNotification(
      tenantId,
      'PAYMENT_APPROVED',
      'Payment Approved!',
      `Your payment of AED ${amount} for "${propertyTitle}" has been approved`,
      { type: 'payment_approved', propertyId, amount }
    );
  }

  static async sendPaymentRejectedNotification(
    tenantId: string,
    propertyTitle: string,
    amount: number,
    propertyId: string,
    reason?: string
  ): Promise<boolean> {
    return this.createAndSendNotification(
      tenantId,
      'PAYMENT_REJECTED',
      'Payment Rejected',
      `Your payment of AED ${amount} for "${propertyTitle}" was rejected${reason ? `: ${reason}` : ''}`,
      { type: 'payment_rejected', propertyId, amount, reason }
    );
  }

  static async sendPaymentVerificationNotification(
    landlordId: string,
    tenantName: string,
    propertyTitle: string,
    amount: number,
    propertyId: string,
    paymentId: string
  ): Promise<boolean> {
    return this.createAndSendNotification(
      landlordId,
      'PAYMENT_VERIFICATION_NEEDED',
      'Payment Verification Needed',
      `${tenantName} submitted payment of AED ${amount} for "${propertyTitle}"`,
      { type: 'payment_verification', propertyId, paymentId, amount }
    );
  }

  // END RENTAL NOTIFICATIONS
  static async sendEndRentalRequestNotification(
    receiverId: string,
    requesterName: string,
    propertyTitle: string,
    propertyId: string,
    reason?: string
  ): Promise<boolean> {
    return this.createAndSendNotification(
      receiverId,
      'END_RENTAL_REQUEST',
      'End Rental Request',
      `${requesterName} wants to end the rental for "${propertyTitle}"${reason ? `: ${reason}` : ''}`,
      { type: 'end_rental_request', propertyId, requesterName, reason }
    );
  }

  static async sendEndRentalAutoAcceptWarning(
    userId: string,
    propertyTitle: string,
    hoursLeft: number,
    propertyId: string
  ): Promise<boolean> {
    return this.createAndSendNotification(
      userId,
      'END_RENTAL_AUTO_ACCEPT_WARNING',
      'End Rental Auto-Accept Soon',
      `Rental for "${propertyTitle}" will auto-accept in ${hoursLeft} hours`,
      { type: 'end_rental_warning', propertyId, hoursLeft }
    );
  }

  // PAYMENT DATE CHANGE NOTIFICATIONS
  static async sendPaymentDateChangeRequestNotification(
    landlordId: string,
    tenantName: string,
    propertyTitle: string,
    currentDate: number,
    proposedDate: number,
    propertyId: string,
    requestId: string
  ): Promise<boolean> {
    return this.createAndSendNotification(
      landlordId,
      'PAYMENT_DATE_CHANGE_REQUEST',
      'Payment Date Change Request',
      `${tenantName} wants to change payment date from ${currentDate} to ${proposedDate} for "${propertyTitle}"`,
      { type: 'payment_date_change_request', propertyId, requestId, currentDate, proposedDate }
    );
  }

  static async sendPaymentDateChangeResponseNotification(
    tenantId: string,
    approved: boolean,
    propertyTitle: string,
    newDate: number,
    propertyId: string
  ): Promise<boolean> {
    const type = approved ? 'PAYMENT_DATE_CHANGE_APPROVED' : 'PAYMENT_DATE_CHANGE_REJECTED';
    const title = approved ? 'Payment Date Change Approved' : 'Payment Date Change Rejected';
    const body = approved 
      ? `Payment date changed to ${newDate} for "${propertyTitle}"`
      : `Payment date change request rejected for "${propertyTitle}"`;

    return this.createAndSendNotification(
      tenantId,
      type,
      title,
      body,
      { type: 'payment_date_change_response', propertyId, approved, newDate }
    );
  }

  // TENANT NOTIFICATIONS
  static async sendNewTenantJoinedNotification(
    landlordId: string,
    tenantName: string,
    propertyTitle: string,
    propertyId: string
  ): Promise<boolean> {
    return this.createAndSendNotification(
      landlordId,
      'NEW_TENANT_JOINED',
      'New Tenant Joined',
      `${tenantName} joined your property "${propertyTitle}"`,
      { type: 'new_tenant', propertyId, tenantName }
    );
  }

  // MESSAGE NOTIFICATIONS
  static async sendNewMessageNotification(
    receiverId: string,
    senderName: string,
    messageContent: string,
    propertyTitle: string,
    propertyId: string
  ): Promise<boolean> {
    return this.createAndSendNotification(
      receiverId,
      'NEW_MESSAGE',
      `New message from ${senderName}`,
      messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent,
      { type: 'message', propertyId, senderName }
    );
  }

  // UTILITY FUNCTIONS
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
      });
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  static async getUserNotifications(userId: string, limit: number = 50) {
    try {
      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return [];
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: { userId, read: false }
      });
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

}