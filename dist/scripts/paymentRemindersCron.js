"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPaymentRemindersCron = startPaymentRemindersCron;
exports.triggerPaymentRemindersManually = triggerPaymentRemindersManually;
const node_cron_1 = __importDefault(require("node-cron"));
const paymentReminderService_1 = require("../services/paymentReminderService");
// Schedule payment reminders at 10:00 Dubai time (UTC+4)
// This runs at 06:00 UTC which is 10:00 Dubai time
const PAYMENT_REMINDERS_SCHEDULE = '0 6 * * *'; // Every day at 06:00 UTC (10:00 Dubai)
function startPaymentRemindersCron() {
    console.log('💰 Starting payment reminders cron job scheduler...');
    console.log('📅 Scheduled to run daily at 10:00 Dubai time (06:00 UTC)');
    node_cron_1.default.schedule(PAYMENT_REMINDERS_SCHEDULE, async () => {
        console.log(`🚀 Payment reminders cron job triggered at ${new Date().toISOString()}`);
        try {
            // Send payment reminders
            await paymentReminderService_1.paymentReminderService.sendPaymentReminders();
            // Also check for overdue payments
            await paymentReminderService_1.paymentReminderService.sendOverdueNotifications();
            console.log('✅ Payment reminders cron job completed successfully');
        }
        catch (error) {
            console.error('❌ Payment reminders cron job failed:', error);
        }
    });
    console.log('✅ Payment reminders cron job initialized');
}
// Manual trigger function for testing
async function triggerPaymentRemindersManually() {
    console.log('🧪 Manually triggering payment reminders...');
    try {
        await paymentReminderService_1.paymentReminderService.sendPaymentReminders();
        await paymentReminderService_1.paymentReminderService.sendOverdueNotifications();
        console.log('✅ Manual payment reminders completed');
    }
    catch (error) {
        console.error('❌ Manual payment reminders failed:', error);
        throw error;
    }
}
//# sourceMappingURL=paymentRemindersCron.js.map