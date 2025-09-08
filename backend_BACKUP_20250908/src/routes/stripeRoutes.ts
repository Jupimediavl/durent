import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createInvitePaymentIntent,
  createJoinPaymentIntent,
  confirmPaymentAndExecute,
  confirmJoinPaymentAndExecute,
  handleStripeWebhook,
  getPaymentConfig,
} from '../controllers/paymentController';

const router = Router();

// Get Stripe configuration for client
router.get('/config', getPaymentConfig);

// Protected routes
router.post('/create-invite-payment', authenticate, createInvitePaymentIntent);
router.post('/create-join-payment', authenticate, createJoinPaymentIntent);
router.post('/confirm-payment', authenticate, confirmPaymentAndExecute);
router.post('/confirm-join-payment', authenticate, confirmJoinPaymentAndExecute);

// Webhook route (no auth, uses Stripe signature)
router.post('/webhook', handleStripeWebhook);

export default router;