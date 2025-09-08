import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Get user's notifications
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { limit = 50, offset = 0, test_push } = req.query;
    
    console.log('🔍 Query params:', req.query);
    console.log('🔍 test_push value:', test_push);
    
    // Handle test push notification request
    if (test_push === 'true') {
      console.log('🧪 Test push notification requested for user:', userId);
      try {
        const success = await NotificationService.createAndSendNotification(
          userId,
          'NEW_MESSAGE',
          '🔔 Test Push Notification',
          'This is a real push notification test from duRent!',
          { test: true, timestamp: new Date().toISOString() }
        );
        
        return res.json({
          success: true,
          message: success ? 'Push notification sent successfully!' : 'Failed to send push notification',
          test_push_result: success
        });
      } catch (error) {
        console.error('Failed to send test push notification:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to send push notification'
        });
      }
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false }
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Failed to get notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId!;

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
};

// Get notification settings
export const getNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    let settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { userId }
      });
    }

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification settings'
    });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      paymentReminders,
      paymentUpdates,
      messages,
      endRentalNotifications,
      tenantUpdates,
      paymentDateChangeRequests,
      reminderDaysBefore
    } = req.body;

    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: {
        paymentReminders,
        paymentUpdates,
        messages,
        endRentalNotifications,
        tenantUpdates,
        paymentDateChangeRequests,
        reminderDaysBefore
      },
      create: {
        userId,
        paymentReminders,
        paymentUpdates,
        messages,
        endRentalNotifications,
        tenantUpdates,
        paymentDateChangeRequests,
        reminderDaysBefore
      }
    });

    res.json({
      success: true,
      settings,
      message: 'Notification settings updated'
    });
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification settings'
    });
  }
};

// Delete notification
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId!;

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
};

// Get unread count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const count = await prisma.notification.count({
      where: { userId, read: false }
    });

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Failed to get unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
};