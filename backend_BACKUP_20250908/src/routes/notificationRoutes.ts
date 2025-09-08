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

// Add debug logging for all notification requests
router.use('*', (req: any, res: any, next: any) => {
  console.log(`🔔 Notification route hit: ${req.method} ${req.originalUrl} - From IP: ${req.ip}`);
  console.log(`🔔 Headers: ${JSON.stringify(req.headers, null, 2)}`);
  next();
});

// Simple test endpoint without auth to verify routing
router.post('/test-simple', (req: any, res: any) => {
  console.log('🧪 Simple test endpoint hit!');
  res.json({ success: true, message: 'Simple test endpoint working!' });
});

// All routes require authentication
router.use(authenticate);

// Get user's notifications
router.get('/', getUserNotifications);

// Test endpoint using GET method (since we know GET works)
router.get('/test-push-get', async (req: any, res: any) => {
    try {
      console.log('🧪 GET test endpoint hit for user:', req.userId);
      const { NotificationService } = require('../services/notificationService');
      
      // Send real push notification
      const success = await NotificationService.createAndSendNotification(
        req.userId,
        'NEW_MESSAGE',
        '🔔 Test Push Notification (GET)',
        'This is a real push notification test from duRent using GET method!',
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

// TEST ENDPOINT - Create and send real push notification
// Temporarily enabled for production testing
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

export default router;