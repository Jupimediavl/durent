"use strict";
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
const contractController_1 = require("../controllers/contractController");
// import { setZoneNotificationPreference, getZoneNotificationPreferences, getZoneNotificationPreference, deleteZoneNotificationPreference } from '../controllers/zoneNotificationController';
const auth_1 = require("../middleware/auth");
// import endRentalRoutes from './endRentalRoutes';
// import notificationRoutes from './notificationRoutes';
// import stripeRoutes from './stripeRoutes';
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
// Credit system routes - disabled as we no longer use credits for property viewing
// router.get('/user/check-property-view/:propertyId', authenticate, checkPropertyViewStatus);
// router.post('/user/view-premium-property/:propertyId', authenticate, viewPremiumPropertyDetails);
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
// router.use('/', endRentalRoutes);
// Test endpoint directly in main routes for debugging
router.post('/notifications/test-push-direct', (req, res) => {
    console.log('🧪 Direct test endpoint hit!');
    res.json({ success: true, message: 'Direct test endpoint working!', version: 'zone-notifications-v1', timestamp: new Date().toISOString() });
});
// Notification routes
// router.use('/notifications', notificationRoutes);
// Zone notification routes - temporary implementation without auth for testing
router.get('/zone-notifications/preferences/:zoneName', (req, res) => {
    console.log('🧪 Zone notification check for zone:', req.params.zoneName);
    console.log('🌐 Request from IP:', req.ip || req.connection.remoteAddress);
    console.log('🔍 User-Agent:', req.headers['user-agent']);
    res.json({ isEnabled: false, exists: false, message: 'Temporarily disabled during database migration - NO AUTH' });
});
router.post('/zone-notifications/preferences', (req, res) => {
    console.log('🧪 Zone notification preference update:', req.body);
    console.log('🌐 Request from IP:', req.ip || req.connection.remoteAddress);
    console.log('🔍 User-Agent:', req.headers['user-agent']);
    const { zoneName, isEnabled } = req.body;
    res.json({
        success: true,
        message: isEnabled
            ? `Notifications enabled for ${zoneName} (temp mode - NO AUTH)`
            : `Notifications disabled for ${zoneName} (temp mode - NO AUTH)`
    });
});
// Test endpoint without auth for debugging
router.get('/zone-notifications/test/:zoneName', (req, res) => {
    console.log('🧪 TEST Zone notification check for zone:', req.params.zoneName);
    res.json({ isEnabled: false, exists: false, message: 'Test endpoint working - temporarily disabled during database migration' });
});
router.post('/zone-notifications/test-preferences', (req, res) => {
    console.log('🧪 TEST Zone notification preference update:', req.body);
    const { zoneName, isEnabled } = req.body;
    res.json({
        success: true,
        message: isEnabled
            ? `Test: Notifications enabled for ${zoneName} (temp mode)`
            : `Test: Notifications disabled for ${zoneName} (temp mode)`
    });
});
// Stripe payment routes
// router.use('/stripe', stripeRoutes);
// Issue Report routes
router.post('/issues', auth_1.authenticate, issueController_1.createIssueReport);
router.get('/issues/tenant', auth_1.authenticate, issueController_1.getTenantIssues);
router.get('/issues/tenant/count', auth_1.authenticate, issueController_1.getTenantIssuesCount);
router.get('/issues/landlord', auth_1.authenticate, issueController_1.getLandlordIssues);
router.get('/issues/landlord/count', auth_1.authenticate, issueController_1.getLandlordIssuesCount);
router.get('/issues/:issueId', auth_1.authenticate, issueController_1.getIssueDetails);
router.patch('/issues/:issueId/status', auth_1.authenticate, issueController_1.updateIssueStatus);
// Contract Management routes
router.post('/contracts/setup', auth_1.authenticate, contractController_1.setupContract);
router.get('/contracts/:rentalId', auth_1.authenticate, contractController_1.getContract);
router.post('/contracts/:rentalId/extend', auth_1.authenticate, contractController_1.extendContract);
router.get('/contracts/check/expiring', contractController_1.checkExpiringContracts);
// Zone Notification routes - temporarily disabled
// router.post('/zone-notifications/preferences', authenticate, setZoneNotificationPreference);
// router.get('/zone-notifications/preferences', authenticate, getZoneNotificationPreferences);
// router.get('/zone-notifications/check/:zoneName', authenticate, getZoneNotificationPreference);
// router.delete('/zone-notifications/remove/:zoneName', authenticate, deleteZoneNotificationPreference);
// Subscription routes
// router.use('/subscription', subscriptionRoutes); // Temporarily disabled
// Debug endpoint
// DEPLOYMENT TEST - Remove after verification
router.get('/deployment-test', (req, res) => {
    res.json({ deployed: true, timestamp: new Date().toISOString(), version: 'zone-notifications-deployment-test' });
});
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