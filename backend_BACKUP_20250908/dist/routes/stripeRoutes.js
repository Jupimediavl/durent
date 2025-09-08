"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
// Get Stripe configuration for client
router.get('/config', paymentController_1.getPaymentConfig);
// Protected routes
router.post('/create-invite-payment', auth_1.authenticate, paymentController_1.createInvitePaymentIntent);
router.post('/create-join-payment', auth_1.authenticate, paymentController_1.createJoinPaymentIntent);
router.post('/confirm-payment', auth_1.authenticate, paymentController_1.confirmPaymentAndExecute);
router.post('/confirm-join-payment', auth_1.authenticate, paymentController_1.confirmJoinPaymentAndExecute);
// Webhook route (no auth, uses Stripe signature)
router.post('/webhook', paymentController_1.handleStripeWebhook);
exports.default = router;
//# sourceMappingURL=stripeRoutes.js.map