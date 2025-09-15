import { Router } from 'express';
import { register, login, verifyEmail, resendVerificationEmail } from '../controllers/authController';
import { createProperty, generateInvite, acceptInvite, validateInvite, getProperties, updatePaymentSettings, updateProperty, searchAvailableProperties, updatePropertyAvailability, deleteProperty } from '../controllers/propertyController';
import { sendMessage, getMessages, getConversations, markAsRead } from '../controllers/chatController';
import { updatePushToken, getProfile, viewPremiumPropertyDetails, checkPropertyViewStatus, updateProfile, updatePassword } from '../controllers/userController';
// import { getPricingPlans, getActionPricing, startChatWithOwner, viewContactDetails, checkChatStatus, checkContactDetailsStatus } from '../controllers/pricingController';
import { createPayment, getPayments, markPaymentAsPaid, getUpcomingPayments, getPaymentHistory, generatePaymentForProperty, verifyPayment, getPaymentsForVerification, deletePayment, markPaymentNotReceived, checkExistingInviteCode } from '../controllers/paymentController';
import { proposePaymentDateChange, getPendingChangeRequests, respondToChangeRequest, getChangeRequestHistory, expireOldRequests } from '../controllers/paymentDateChangeController';
import { upload, uploadPropertyPhotos } from '../controllers/uploadController';
import { createIssueReport, getTenantIssues, getLandlordIssues, updateIssueStatus, getIssueDetails, getLandlordIssuesCount, getTenantIssuesCount } from '../controllers/issueController';
import { getUserNotificationZones, toggleZoneNotification, checkZoneNotificationStatus, getUserNotificationSettings, updateUserNotificationSettings } from '../controllers/zoneNotificationController';
import { setupContract, getContract, checkExpiringContracts, extendContract } from '../controllers/contractController';
import { triggerZoneDigestManually } from '../scripts/zoneDigestCron';
import { triggerPaymentRemindersManually } from '../scripts/paymentRemindersCron';
import { authenticate } from '../middleware/auth';
import endRentalRoutes from './endRentalRoutes';
import notificationRoutes from './notificationRoutes';
import stripeRoutes from './stripeRoutes';
// import subscriptionRoutes from './subscriptionRoutes'; // Temporarily disabled

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
// Email verification routes
router.post('/auth/verify-email', verifyEmail);
router.post('/auth/resend-verification', resendVerificationEmail);

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
router.get('/user/check-property-view/:propertyId', authenticate, checkPropertyViewStatus);
router.post('/user/view-premium-property/:propertyId', authenticate, viewPremiumPropertyDetails);

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
router.use('/', endRentalRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Stripe payment routes
router.use('/stripe', stripeRoutes);

// Issue Report routes
router.post('/issues', authenticate, createIssueReport);
router.get('/issues/tenant', authenticate, getTenantIssues);
router.get('/issues/tenant/count', authenticate, getTenantIssuesCount);
router.get('/issues/landlord', authenticate, getLandlordIssues);
router.get('/issues/landlord/count', authenticate, getLandlordIssuesCount);
router.get('/issues/:issueId', authenticate, getIssueDetails);
router.patch('/issues/:issueId/status', authenticate, updateIssueStatus);

// Subscription routes
// router.use('/subscription', subscriptionRoutes); // Temporarily disabled

// Test endpoint directly in main routes for debugging
router.post('/notifications/test-push-direct', (req: any, res: any) => {
  console.log('🧪 Direct test endpoint hit!');
  res.json({ success: true, message: 'Direct test endpoint working!', version: 'zone-notifications-v1', timestamp: new Date().toISOString() });
});

// Zone notification routes - real implementation with authentication
router.get('/zone-notifications/zones', authenticate, getUserNotificationZones);
router.post('/zone-notifications/preferences', authenticate, toggleZoneNotification);
router.get('/zone-notifications/preferences/:zoneName', authenticate, checkZoneNotificationStatus);
router.get('/zone-notifications/settings', authenticate, getUserNotificationSettings);
router.put('/zone-notifications/settings', authenticate, updateUserNotificationSettings);

// Manual trigger for zone digest (testing purposes)
router.post('/zone-notifications/trigger-digest', async (req: any, res: any) => {
  try {
    console.log('🧪 Manual zone digest trigger requested');
    console.log('🔧 About to call triggerZoneDigestManually function');
    await triggerZoneDigestManually();
    console.log('✅ triggerZoneDigestManually completed successfully');
    res.json({ success: true, message: 'Zone digest triggered successfully' });
  } catch (error: any) {
    console.error('❌ Manual zone digest trigger failed:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to trigger zone digest', details: error.message });
  }
});

// DEPLOYMENT TEST - Remove after verification
router.get('/deployment-test', (req: any, res: any) => {
  res.json({ deployed: true, timestamp: new Date().toISOString(), version: 'zone-notifications-deployment-test' });
});

// Emergency manual trigger - inline implementation
router.post('/zone-notifications/emergency-trigger', async (req: any, res: any) => {
  try {
    console.log('🚨 Emergency zone digest trigger requested');
    
    // Import directly here to avoid module issues
    const { zoneDigestService } = await import('../services/zoneDigestService');
    await zoneDigestService.sendDailyDigest();
    
    console.log('✅ Emergency trigger completed');
    res.json({ success: true, message: 'Emergency zone digest completed' });
  } catch (error: any) {
    console.error('❌ Emergency trigger failed:', error);
    res.status(500).json({ error: 'Emergency trigger failed', details: error.message });
  }
});

// Manual trigger for payment reminders (testing purposes)
router.post('/payment-reminders/trigger-manual', async (req: any, res: any) => {
  try {
    console.log('💰 Manual payment reminders trigger requested');
    await triggerPaymentRemindersManually();
    console.log('✅ Payment reminders completed successfully');
    res.json({ success: true, message: 'Payment reminders triggered successfully' });
  } catch (error: any) {
    console.error('❌ Manual payment reminders trigger failed:', error);
    res.status(500).json({ error: 'Failed to trigger payment reminders', details: error.message });
  }
});

// Debug endpoint
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

// Contract routes
router.post('/contracts/setup', authenticate, setupContract);
router.get('/contracts/:rentalId', authenticate, getContract);
router.post('/contracts/:rentalId/extend', authenticate, extendContract);
router.get('/contracts/check/expiring', checkExpiringContracts);

export default router;