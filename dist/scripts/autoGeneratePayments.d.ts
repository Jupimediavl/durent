interface PaymentGenerationResult {
    success: number;
    skipped: number;
    errors: string[];
}
/**
 * Auto-generates monthly payments for active rental relationships
 * Based on property's paymentDueDay and paymentFrequency settings
 */
export declare function autoGeneratePayments(): Promise<PaymentGenerationResult>;
export {};
//# sourceMappingURL=autoGeneratePayments.d.ts.map