import { Router } from 'express';
import {
  requestEndRental,
  acceptEndRental,
  cancelEndRental,
  getEndRequestStatus,
  getPastRentals,
  getPastTenants,
  autoAcceptExpiredRequests
} from '../controllers/endRentalController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Request to end a rental
router.post('/rentals/:rentalId/end-request', authenticate, requestEndRental);

// Accept end request
router.post('/rentals/:rentalId/accept-end', authenticate, acceptEndRental);

// Cancel end request
router.post('/rentals/:rentalId/cancel-end', authenticate, cancelEndRental);

// Get end request status
router.get('/rentals/:rentalId/end-status', authenticate, getEndRequestStatus);

// Get user's past rentals
router.get('/my/past-rentals', authenticate, getPastRentals);

// Get past tenants for a property
router.get('/properties/:propertyId/past-tenants', authenticate, getPastTenants);

// Auto-accept expired requests (can be called by cron or manually)
router.post('/end-requests/auto-accept', autoAcceptExpiredRequests);

export default router;