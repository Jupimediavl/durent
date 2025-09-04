import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { createProperty, generateInvite, acceptInvite, validateInvite, getProperties, updatePaymentSettings, updateProperty, searchAvailableProperties, updatePropertyAvailability } from '../controllers/propertyController';
import { sendMessage, getMessages, getConversations, markAsRead } from '../controllers/chatController';
import { updatePushToken, getProfile } from '../controllers/userController';
import { createPayment, getPayments, markPaymentAsPaid, getUpcomingPayments, generatePaymentForProperty, verifyPayment, getPaymentsForVerification, deletePayment } from '../controllers/paymentController';
import { proposePaymentDateChange, getPendingChangeRequests, respondToChangeRequest, getChangeRequestHistory, expireOldRequests } from '../controllers/paymentDateChangeController';
import { upload, uploadPropertyPhotos } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import endRentalRoutes from './endRentalRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

router.post('/properties', authenticate, createProperty);
router.get('/properties', authenticate, getProperties);
router.get('/properties/available', authenticate, searchAvailableProperties);
router.put('/properties/:propertyId', authenticate, updateProperty);
router.patch('/properties/:propertyId/availability', authenticate, updatePropertyAvailability);
router.patch('/properties/:id/payment-settings', authenticate, updatePaymentSettings);
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

router.post('/payments', authenticate, createPayment);
router.get('/payments', authenticate, getPayments);
router.get('/payments/upcoming', authenticate, getUpcomingPayments);
router.get('/payments/verification', authenticate, getPaymentsForVerification);
router.patch('/payments/:id/paid', authenticate, markPaymentAsPaid);
router.patch('/payments/:id/verify', authenticate, verifyPayment);
router.delete('/payments/:id', authenticate, deletePayment);
router.post('/properties/:propertyId/generate-payment', authenticate, generatePaymentForProperty);

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

export default router;