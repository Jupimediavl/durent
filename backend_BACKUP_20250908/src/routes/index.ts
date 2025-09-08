import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { createProperty, generateInvite, acceptInvite, validateInvite, getProperties, updatePaymentSettings, updateProperty, searchAvailableProperties, updatePropertyAvailability, deleteProperty } from '../controllers/propertyController';
import { sendMessage, getMessages, getConversations, markAsRead } from '../controllers/chatController';
import { updatePushToken, getProfile, viewPremiumPropertyDetails, checkPropertyViewStatus, updateProfile, updatePassword } from '../controllers/userController';
// import { getPricingPlans, getActionPricing, startChatWithOwner, viewContactDetails, checkChatStatus, checkContactDetailsStatus } from '../controllers/pricingController';
import { createPayment, getPayments, markPaymentAsPaid, getUpcomingPayments, getPaymentHistory, generatePaymentForProperty, verifyPayment, getPaymentsForVerification, deletePayment, markPaymentNotReceived, checkExistingInviteCode } from '../controllers/paymentController';
import { proposePaymentDateChange, getPendingChangeRequests, respondToChangeRequest, getChangeRequestHistory, expireOldRequests } from '../controllers/paymentDateChangeController';
import { upload, uploadPropertyPhotos } from '../controllers/uploadController';
import { createIssueReport, getTenantIssues, getLandlordIssues, updateIssueStatus, getIssueDetails, getLandlordIssuesCount, getTenantIssuesCount } from '../controllers/issueController';
import { setupContract, getContract, checkExpiringContracts, extendContract } from '../controllers/contractController';
// import { setZoneNotificationPreference, getZoneNotificationPreferences, getZoneNotificationPreference, deleteZoneNotificationPreference } from '../controllers/zoneNotificationController';
import { authenticate } from '../middleware/auth';
// import endRentalRoutes from './endRentalRoutes';
// import notificationRoutes from './notificationRoutes';
// import stripeRoutes from './stripeRoutes';
// import subscriptionRoutes from './subscriptionRoutes'; // Temporarily disabled

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

router.post('/properties', authenticate, createProperty);
router.get('/properties', authenticate, getProperties);
router.get('/properties/available', authenticate, searchAvailableProperties);
router.put('/properties/:propertyId', authenticate, updateProperty);
router.patch('/properties/:propertyId/availability', authenticate, updatePropertyAvailability);
router.patch('/properties/:id/payment-settings', authenticate, updatePaymentSettings);
router.delete('/properties/:propertyId', authenticate, deleteProperty);
router.post('/properties/upload-photos', authenticate, upload.array('photos', 10), uploadPropertyPhotos);
router.post('/invites/generate', authenticate, generateInvite);
router.post('/invites/validate', authenticate, validateInvite);
router.post('/invites/accept', authenticate, acceptInvite);

router.post('/messages', authenticate, sendMessage);
router.get('/messages/:propertyId', authenticate, getMessages);
router.get('/conversations', authenticate, getConversations);
router.patch('/messages/:propertyId/read', authenticate, markAsRead);

router.patch('/user/push-token', authenticate, updatePushToken);
router.get('/user/profile', authenticate, getProfile);
router.put('/user/profile', authenticate, updateProfile);
router.put('/user/password', authenticate, updatePassword);
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

router.post('/payments', authenticate, createPayment);
router.get('/payments', authenticate, getPayments);
router.get('/payments/upcoming', authenticate, getUpcomingPayments);
router.get('/payments/history', authenticate, getPaymentHistory);
router.get('/payments/verification', authenticate, getPaymentsForVerification);
router.patch('/payments/:id/paid', authenticate, markPaymentAsPaid);
router.patch('/payments/:id/verify', authenticate, verifyPayment);
router.patch('/payments/:id/not-received', authenticate, markPaymentNotReceived);
router.delete('/payments/:id', authenticate, deletePayment);
router.post('/properties/:propertyId/generate-payment', authenticate, generatePaymentForProperty);

// Invite code routes
router.get('/invites/check/:propertyId', authenticate, checkExistingInviteCode);

// Payment Date Change Request routes
router.post('/payment-date-changes/propose', authenticate, proposePaymentDateChange);
router.get('/payment-date-changes/pending', authenticate, getPendingChangeRequests);
router.post('/payment-date-changes/:requestId/respond', authenticate, respondToChangeRequest);
router.get('/payment-date-changes/property/:propertyId/history', authenticate, getChangeRequestHistory);
router.post('/payment-date-changes/expire', expireOldRequests); // Could be called by cron job

// End Rental routes
// router.use('/', endRentalRoutes);

// Test endpoint directly in main routes for debugging
router.post('/notifications/test-push-direct', (req: any, res: any) => {
  console.log('🧪 Direct test endpoint hit!');
  res.json({ success: true, message: 'Direct test endpoint working!', version: 'zone-notifications-v1', timestamp: new Date().toISOString() });
});

// Notification routes
// router.use('/notifications', notificationRoutes);

// Zone notification routes - temporary implementation without auth for testing
router.get('/zone-notifications/preferences/:zoneName', (req: any, res) => {
  console.log('🧪 Zone notification check for zone:', req.params.zoneName);
  console.log('🌐 Request from IP:', req.ip || req.connection.remoteAddress);
  console.log('🔍 User-Agent:', req.headers['user-agent']);
  res.json({ isEnabled: false, exists: false, message: 'Temporarily disabled during database migration - NO AUTH' });
});

router.post('/zone-notifications/preferences', (req: any, res) => {
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
router.get('/zone-notifications/test/:zoneName', (req: any, res) => {
  console.log('🧪 TEST Zone notification check for zone:', req.params.zoneName);
  res.json({ isEnabled: false, exists: false, message: 'Test endpoint working - temporarily disabled during database migration' });
});

router.post('/zone-notifications/test-preferences', (req: any, res) => {
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
router.post('/issues', authenticate, createIssueReport);
router.get('/issues/tenant', authenticate, getTenantIssues);
router.get('/issues/tenant/count', authenticate, getTenantIssuesCount);
router.get('/issues/landlord', authenticate, getLandlordIssues);
router.get('/issues/landlord/count', authenticate, getLandlordIssuesCount);
router.get('/issues/:issueId', authenticate, getIssueDetails);
router.patch('/issues/:issueId/status', authenticate, updateIssueStatus);

// Contract Management routes
router.post('/contracts/setup', authenticate, setupContract);
router.get('/contracts/:rentalId', authenticate, getContract);
router.post('/contracts/:rentalId/extend', authenticate, extendContract);
router.get('/contracts/check/expiring', checkExpiringContracts);

// Zone Notification routes - temporarily disabled
// router.post('/zone-notifications/preferences', authenticate, setZoneNotificationPreference);
// router.get('/zone-notifications/preferences', authenticate, getZoneNotificationPreferences);
// router.get('/zone-notifications/check/:zoneName', authenticate, getZoneNotificationPreference);
// router.delete('/zone-notifications/remove/:zoneName', authenticate, deleteZoneNotificationPreference);

// Subscription routes
// router.use('/subscription', subscriptionRoutes); // Temporarily disabled

// Debug endpoint
// DEPLOYMENT TEST - Remove after verification
router.get('/deployment-test', (req: any, res: any) => {
  res.json({ deployed: true, timestamp: new Date().toISOString(), version: 'zone-notifications-deployment-test' });
});

router.get('/debug/user', authenticate, async (req: any, res) => {
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

export default router;