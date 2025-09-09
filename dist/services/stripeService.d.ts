import Stripe from 'stripe';
export interface PaymentIntentData {
    amount: number;
    currency: string;
    metadata: {
        userId: string;
        actionType: 'INVITE_CODE_GENERATION' | 'INVITE_CODE_USAGE';
        propertyId?: string;
        inviteCode?: string;
    };
}
export declare const stripeService: {
    createPaymentIntent: (data: PaymentIntentData) => Promise<{
        clientSecret: string | null;
        paymentIntentId: string;
        amount: number;
        currency: string;
    }>;
    confirmPayment: (paymentIntentId: string) => Promise<{
        success: boolean;
        metadata: Stripe.Metadata;
        amount: number;
        currency: string;
        status?: undefined;
    } | {
        success: boolean;
        status: "canceled" | "processing" | "requires_action" | "requires_capture" | "requires_confirmation" | "requires_payment_method";
        metadata?: undefined;
        amount?: undefined;
        currency?: undefined;
    }>;
    getPublishableKey: () => string;
    handleWebhook: (payload: Buffer, signature: string) => Promise<{
        received: boolean;
        paymentIntent: Stripe.PaymentIntent;
        error?: undefined;
    } | {
        received: boolean;
        error: string;
        paymentIntent?: undefined;
    } | {
        received: boolean;
        paymentIntent?: undefined;
        error?: undefined;
    }>;
};
//# sourceMappingURL=stripeService.d.ts.map