"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const subscriptionController_1 = require("../controllers/subscriptionController");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Subscription routes
router.get('/status', subscriptionController_1.getSubscriptionStatus);
router.get('/plans', subscriptionController_1.getSubscriptionPlans);
router.post('/subscribe', subscriptionController_1.subscribeToPlan);
router.post('/cancel', subscriptionController_1.cancelSubscription);
// Credits routes (mainly for tenants)
router.get('/credits', subscriptionController_1.getCreditsBalance);
router.post('/credits/purchase', subscriptionController_1.purchaseCredits);
exports.default = router;
//# sourceMappingURL=subscriptionRoutes.js.map