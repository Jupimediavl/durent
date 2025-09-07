import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationSettings,
  updateNotificationSettings,
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's notifications
router.get('/', getUserNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark specific notification as read
router.patch('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllNotificationsAsRead);

// Delete specific notification
router.delete('/:notificationId', deleteNotification);

// Get notification settings
router.get('/settings', getNotificationSettings);

// Update notification settings
router.put('/settings', updateNotificationSettings);

// TEST ENDPOINT - Create and send real push notification (development only)
if (process.env.NODE_ENV !== 'production') {
  router.post('/test-push', async (req: any, res: any) => {
    try {
      const { NotificationService } = require('../services/notificationService');
      
      // Send real push notification
      const success = await NotificationService.createAndSendNotification(
        req.userId,
        'NEW_MESSAGE',
        '🔔 Test Push Notification',
        'This is a real push notification test from duRent!',
        { test: true, timestamp: new Date().toISOString() }
      );
      
      res.json({
        success,
        message: success ? 'Push notification sent successfully!' : 'Failed to send push notification'
      });
    } catch (error) {
      console.error('Failed to send test push notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send push notification'
      });
    }
  });
}

export default router;