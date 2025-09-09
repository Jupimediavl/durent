"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
// Lazy initialization to avoid crashes if STRIPE_SECRET_KEY is not set
let stripe = null;
const getStripe = () => {
    if (!stripe) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: '2025-08-27.basil',
        });
    }
    return stripe;
};
exports.stripeService = {
    // Create a payment intent for client
    createPaymentIntent: async (data) => {
        try {
            const paymentIntent = await getStripe().paymentIntents.create({
                amount: data.amount,
                currency: data.currency,
                metadata: data.metadata,
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
            };
        }
        catch (error) {
            console.error('Stripe payment intent creation error:', error);
            throw new Error('Failed to create payment intent');
        }
    },
    // Confirm payment completion
    confirmPayment: async (paymentIntentId) => {
        try {
            const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status === 'succeeded') {
                return {
                    success: true,
                    metadata: paymentIntent.metadata,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                };
            }
            return {
                success: false,
                status: paymentIntent.status,
            };
        }
        catch (error) {
            console.error('Stripe payment confirmation error:', error);
            throw new Error('Failed to confirm payment');
        }
    },
    // Get Stripe publishable key for client
    getPublishableKey: () => {
        return process.env.STRIPE_PUBLISHABLE_KEY || '';
    },
    // Webhook handler for Stripe events
    handleWebhook: async (payload, signature) => {
        try {
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
            const event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
            // Handle different event types
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    console.log('Payment succeeded:', paymentIntent.id);
                    // Handle successful payment
                    return { received: true, paymentIntent };
                case 'payment_intent.payment_failed':
                    const failedIntent = event.data.object;
                    console.log('Payment failed:', failedIntent.id);
                    // Handle failed payment
                    return { received: true, error: 'Payment failed' };
                default:
                    console.log(`Unhandled event type: ${event.type}`);
                    return { received: true };
            }
        }
        catch (error) {
            console.error('Webhook error:', error);
            throw error;
        }
    },
};
//# sourceMappingURL=stripeService.js.map