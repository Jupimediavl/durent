export declare class PaymentReminderService {
    /**
     * Check and send payment reminders for upcoming payments
     * Runs daily at 10:00 Dubai time
     */
    sendPaymentReminders(): Promise<void>;
    private getUpcomingPaymentsNeedingReminders;
    private sendReminderForPayment;
    /**
     * Check and send overdue payment notifications
     * Also runs daily at 10:00 Dubai time
     */
    sendOverdueNotifications(): Promise<void>;
}
export declare const paymentReminderService: PaymentReminderService;
//# sourceMappingURL=paymentReminderService.d.ts.map