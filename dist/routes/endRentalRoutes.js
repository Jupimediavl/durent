"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const endRentalController_1 = require("../controllers/endRentalController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Request to end a rental
router.post('/rentals/:rentalId/end-request', auth_1.authenticate, endRentalController_1.requestEndRental);
// Accept end request
router.post('/rentals/:rentalId/accept-end', auth_1.authenticate, endRentalController_1.acceptEndRental);
// Cancel end request
router.post('/rentals/:rentalId/cancel-end', auth_1.authenticate, endRentalController_1.cancelEndRental);
// Get end request status
router.get('/rentals/:rentalId/end-status', auth_1.authenticate, endRentalController_1.getEndRequestStatus);
// Get user's past rentals
router.get('/my/past-rentals', auth_1.authenticate, endRentalController_1.getPastRentals);
// Get past tenants for a property
router.get('/properties/:propertyId/past-tenants', auth_1.authenticate, endRentalController_1.getPastTenants);
// Auto-accept expired requests (can be called by cron or manually)
router.post('/end-requests/auto-accept', endRentalController_1.autoAcceptExpiredRequests);
exports.default = router;
//# sourceMappingURL=endRentalRoutes.js.map