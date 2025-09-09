"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const propertyController_1 = require("../controllers/propertyController");
const chatController_1 = require("../controllers/chatController");
const userController_1 = require("../controllers/userController");
// import { getPricingPlans, getActionPricing, startChatWithOwner, viewContactDetails, checkChatStatus, checkContactDetailsStatus } from '../controllers/pricingController';
const paymentController_1 = require("../controllers/paymentController");
const paymentDateChangeController_1 = require("../controllers/paymentDateChangeController");
const uploadController_1 = require("../controllers/uploadController");
const issueController_1 = require("../controllers/issueController");
const zoneNotificationController_1 = require("../controllers/zoneNotificationController");
const zoneDigestCron_1 = require("../scripts/zoneDigestCron");
const paymentRemindersCron_1 = require("../scripts/paymentRemindersCron");
const auth_1 = require("../middleware/auth");
const endRentalRoutes_1 = __importDefault(require("./endRentalRoutes"));
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
const stripeRoutes_1 = __importDefault(require("./stripeRoutes"));
// import subscriptionRoutes from './subscriptionRoutes'; // Temporarily disabled
const router = (0, express_1.Router)();
router.post('/auth/register', authController_1.register);
router.post('/auth/login', authController_1.login);
router.post('/properties', auth_1.authenticate, propertyController_1.createProperty);
router.get('/properties', auth_1.authenticate, propertyController_1.getProperties);
router.get('/properties/available', auth_1.authenticate, propertyController_1.searchAvailableProperties);
router.put('/properties/:propertyId', auth_1.authenticate, propertyController_1.updateProperty);
router.patch('/properties/:propertyId/availability', auth_1.authenticate, propertyController_1.updatePropertyAvailability);
router.patch('/properties/:id/payment-settings', auth_1.authenticate, propertyController_1.updatePaymentSettings);
router.delete('/properties/:propertyId', auth_1.authenticate, propertyController_1.deleteProperty);
router.post('/properties/upload-photos', auth_1.authenticate, uploadController_1.upload.array('photos', 10), uploadController_1.uploadPropertyPhotos);
router.post('/invites/generate', auth_1.authenticate, propertyController_1.generateInvite);
router.post('/invites/validate', auth_1.authenticate, propertyController_1.validateInvite);
router.post('/invites/accept', auth_1.authenticate, propertyController_1.acceptInvite);
router.post('/messages', auth_1.authenticate, chatController_1.sendMessage);
router.get('/messages/:propertyId', auth_1.authenticate, chatController_1.getMessages);
router.get('/conversations', auth_1.authenticate, chatController_1.getConversations);
router.patch('/messages/:propertyId/read', auth_1.authenticate, chatController_1.markAsRead);
router.patch('/user/push-token', auth_1.authenticate, userController_1.updatePushToken);
router.get('/user/profile', auth_1.authenticate, userController_1.getProfile);
router.put('/user/profile', auth_1.authenticate, userController_1.updateProfile);
router.put('/user/password', auth_1.authenticate, userController_1.updatePassword);
router.get('/user/check-property-view/:propertyId', auth_1.authenticate, userController_1.checkPropertyViewStatus);
router.post('/user/view-premium-property/:propertyId', auth_1.authenticate, userController_1.viewPremiumPropertyDetails);
// Pricing routes - temporarily disabled
// router.get('/pricing/plans', getPricingPlans);
// router.get('/pricing/action/:actionType', getActionPricing);
// router.get('/pricing/check-chat-status/:propertyId', authenticate, checkChatStatus);
// router.get('/pricing/check-contact-status/:propertyId', authenticate, checkContactDetailsStatus);
// router.post('/pricing/chat-with-owner/:propertyId', authenticate, startChatWithOwner);
// router.post('/pricing/view-contact-details/:propertyId', authenticate, viewContactDetails);
router.post('/payments', auth_1.authenticate, paymentController_1.createPayment);
router.get('/payments', auth_1.authenticate, paymentController_1.getPayments);
router.get('/payments/upcoming', auth_1.authenticate, paymentController_1.getUpcomingPayments);
router.get('/payments/history', auth_1.authenticate, paymentController_1.getPaymentHistory);
router.get('/payments/verification', auth_1.authenticate, paymentController_1.getPaymentsForVerification);
router.patch('/payments/:id/paid', auth_1.authenticate, paymentController_1.markPaymentAsPaid);
router.patch('/payments/:id/verify', auth_1.authenticate, paymentController_1.verifyPayment);
router.patch('/payments/:id/not-received', auth_1.authenticate, paymentController_1.markPaymentNotReceived);
router.delete('/payments/:id', auth_1.authenticate, paymentController_1.deletePayment);
router.post('/properties/:propertyId/generate-payment', auth_1.authenticate, paymentController_1.generatePaymentForProperty);
// Invite code routes
router.get('/invites/check/:propertyId', auth_1.authenticate, paymentController_1.checkExistingInviteCode);
// Payment Date Change Request routes
router.post('/payment-date-changes/propose', auth_1.authenticate, paymentDateChangeController_1.proposePaymentDateChange);
router.get('/payment-date-changes/pending', auth_1.authenticate, paymentDateChangeController_1.getPendingChangeRequests);
router.post('/payment-date-changes/:requestId/respond', auth_1.authenticate, paymentDateChangeController_1.respondToChangeRequest);
router.get('/payment-date-changes/property/:propertyId/history', auth_1.authenticate, paymentDateChangeController_1.getChangeRequestHistory);
router.post('/payment-date-changes/expire', paymentDateChangeController_1.expireOldRequests); // Could be called by cron job
// End Rental routes
router.use('/', endRentalRoutes_1.default);
// Notification routes
router.use('/notifications', notificationRoutes_1.default);
// Stripe payment routes
router.use('/stripe', stripeRoutes_1.default);
// Issue Report routes
router.post('/issues', auth_1.authenticate, issueController_1.createIssueReport);
router.get('/issues/tenant', auth_1.authenticate, issueController_1.getTenantIssues);
router.get('/issues/tenant/count', auth_1.authenticate, issueController_1.getTenantIssuesCount);
router.get('/issues/landlord', auth_1.authenticate, issueController_1.getLandlordIssues);
router.get('/issues/landlord/count', auth_1.authenticate, issueController_1.getLandlordIssuesCount);
router.get('/issues/:issueId', auth_1.authenticate, issueController_1.getIssueDetails);
router.patch('/issues/:issueId/status', auth_1.authenticate, issueController_1.updateIssueStatus);
// Subscription routes
// router.use('/subscription', subscriptionRoutes); // Temporarily disabled
// Test endpoint directly in main routes for debugging
router.post('/notifications/test-push-direct', (req, res) => {
    console.log('🧪 Direct test endpoint hit!');
    res.json({ success: true, message: 'Direct test endpoint working!', version: 'zone-notifications-v1', timestamp: new Date().toISOString() });
});
// Zone notification routes - real implementation with authentication
router.get('/zone-notifications/zones', auth_1.authenticate, zoneNotificationController_1.getUserNotificationZones);
router.post('/zone-notifications/preferences', auth_1.authenticate, zoneNotificationController_1.toggleZoneNotification);
router.get('/zone-notifications/preferences/:zoneName', auth_1.authenticate, zoneNotificationController_1.checkZoneNotificationStatus);
router.get('/zone-notifications/settings', auth_1.authenticate, zoneNotificationController_1.getUserNotificationSettings);
router.put('/zone-notifications/settings', auth_1.authenticate, zoneNotificationController_1.updateUserNotificationSettings);
// Manual trigger for zone digest (testing purposes)
router.post('/zone-notifications/trigger-digest', async (req, res) => {
    try {
        console.log('🧪 Manual zone digest trigger requested');
        console.log('🔧 About to call triggerZoneDigestManually function');
        await (0, zoneDigestCron_1.triggerZoneDigestManually)();
        console.log('✅ triggerZoneDigestManually completed successfully');
        res.json({ success: true, message: 'Zone digest triggered successfully' });
    }
    catch (error) {
        console.error('❌ Manual zone digest trigger failed:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to trigger zone digest', details: error.message });
    }
});
// DEPLOYMENT TEST - Remove after verification
router.get('/deployment-test', (req, res) => {
    res.json({ deployed: true, timestamp: new Date().toISOString(), version: 'zone-notifications-deployment-test' });
});
// Emergency manual trigger - inline implementation
router.post('/zone-notifications/emergency-trigger', async (req, res) => {
    try {
        console.log('🚨 Emergency zone digest trigger requested');
        // Import directly here to avoid module issues
        const { zoneDigestService } = await Promise.resolve().then(() => __importStar(require('../services/zoneDigestService')));
        await zoneDigestService.sendDailyDigest();
        console.log('✅ Emergency trigger completed');
        res.json({ success: true, message: 'Emergency zone digest completed' });
    }
    catch (error) {
        console.error('❌ Emergency trigger failed:', error);
        res.status(500).json({ error: 'Emergency trigger failed', details: error.message });
    }
});
// Manual trigger for payment reminders (testing purposes)
router.post('/payment-reminders/trigger-manual', async (req, res) => {
    try {
        console.log('💰 Manual payment reminders trigger requested');
        await (0, paymentRemindersCron_1.triggerPaymentRemindersManually)();
        console.log('✅ Payment reminders completed successfully');
        res.json({ success: true, message: 'Payment reminders triggered successfully' });
    }
    catch (error) {
        console.error('❌ Manual payment reminders trigger failed:', error);
        res.status(500).json({ error: 'Failed to trigger payment reminders', details: error.message });
    }
});
// Debug endpoint
router.get('/debug/user', auth_1.authenticate, async (req, res) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
            tenantRelationships: {
                include: {
                    property: true
                }
            },
            ownedProperties: true
        }
    });
    res.json({ user, userId: req.userId });
});
exports.default = router;
//# sourceMappingURL=index.js.map