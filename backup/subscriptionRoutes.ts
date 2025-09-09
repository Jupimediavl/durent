import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSubscriptionStatus,
  getSubscriptionPlans,
  subscribeToPlan,
  cancelSubscription,
  getCreditsBalance,
  purchaseCredits,
} from '../controllers/subscriptionController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Subscription routes
router.get('/status', getSubscriptionStatus);
router.get('/plans', getSubscriptionPlans);
router.post('/subscribe', subscribeToPlan);
router.post('/cancel', cancelSubscription);

// Credits routes (mainly for tenants)
router.get('/credits', getCreditsBalance);
router.post('/credits/purchase', purchaseCredits);

export default router;