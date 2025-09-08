"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Add debug logging for all notification requests
router.use('*', (req, res, next) => {
    console.log(`🔔 Notification route hit: ${req.method} ${req.originalUrl} - From IP: ${req.ip}`);
    console.log(`🔔 Headers: ${JSON.stringify(req.headers, null, 2)}`);
    next();
});
// Simple test endpoint without auth to verify routing
router.post('/test-simple', (req, res) => {
    console.log('🧪 Simple test endpoint hit!');
    res.json({ success: true, message: 'Simple test endpoint working!' });
});
// All routes require authentication
router.use(auth_1.authenticate);
// Get user's notifications
router.get('/', notificationController_1.getUserNotifications);
// Test endpoint using GET method (since we know GET works)
router.get('/test-push-get', async (req, res) => {
    try {
        console.log('🧪 GET test endpoint hit for user:', req.userId);
        const { NotificationService } = require('../services/notificationService');
        // Send real push notification
        const success = await NotificationService.createAndSendNotification(req.userId, 'NEW_MESSAGE', '🔔 Test Push Notification (GET)', 'This is a real push notification test from duRent using GET method!', { test: true, timestamp: new Date().toISOString() });
        res.json({
            success,
            message: success ? 'Push notification sent successfully!' : 'Failed to send push notification'
        });
    }
    catch (error) {
        console.error('Failed to send test push notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send push notification'
        });
    }
});
// Get unread count
router.get('/unread-count', notificationController_1.getUnreadCount);
// Mark specific notification as read
router.patch('/:notificationId/read', notificationController_1.markNotificationAsRead);
// Mark all notifications as read
router.patch('/mark-all-read', notificationController_1.markAllNotificationsAsRead);
// Delete specific notification
router.delete('/:notificationId', notificationController_1.deleteNotification);
// Get notification settings
router.get('/settings', notificationController_1.getNotificationSettings);
// Update notification settings
router.put('/settings', notificationController_1.updateNotificationSettings);
// TEST ENDPOINT - Create and send real push notification
// Temporarily enabled for production testing
router.post('/test-push', async (req, res) => {
    try {
        const { NotificationService } = require('../services/notificationService');
        // Send real push notification
        const success = await NotificationService.createAndSendNotification(req.userId, 'NEW_MESSAGE', '🔔 Test Push Notification', 'This is a real push notification test from duRent!', { test: true, timestamp: new Date().toISOString() });
        res.json({
            success,
            message: success ? 'Push notification sent successfully!' : 'Failed to send push notification'
        });
    }
    catch (error) {
        console.error('Failed to send test push notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send push notification'
        });
    }
});
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map