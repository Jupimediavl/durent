import Stripe from 'stripe';

// Lazy initialization to avoid crashes if STRIPE_SECRET_KEY is not set
let stripe: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripe) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }
  return stripe;
};

export interface PaymentIntentData {
  amount: number; // in fils (AED * 100)
  currency: string;
  metadata: {
    userId: string;
    actionType: 'INVITE_CODE_GENERATION' | 'INVITE_CODE_USAGE';
    propertyId?: string;
    inviteCode?: string;
  };
}

export const stripeService = {
  // Create a payment intent for client
  createPaymentIntent: async (data: PaymentIntentData) => {
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
    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      throw new Error('Failed to create payment intent');
    }
  },

  // Confirm payment completion
  confirmPayment: async (paymentIntentId: string) => {
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
    } catch (error) {
      console.error('Stripe payment confirmation error:', error);
      throw new Error('Failed to confirm payment');
    }
  },

  // Get Stripe publishable key for client
  getPublishableKey: () => {
    return process.env.STRIPE_PUBLISHABLE_KEY || '';
  },

  // Webhook handler for Stripe events
  handleWebhook: async (payload: Buffer, signature: string) => {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      const event = getStripe().webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment succeeded:', paymentIntent.id);
          // Handle successful payment
          return { received: true, paymentIntent };
          
        case 'payment_intent.payment_failed':
          const failedIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment failed:', failedIntent.id);
          // Handle failed payment
          return { received: true, error: 'Payment failed' };
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
          return { received: true };
      }
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  },
};