"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startZoneDigestCron = startZoneDigestCron;
exports.triggerZoneDigestManually = triggerZoneDigestManually;
const node_cron_1 = __importDefault(require("node-cron"));
const zoneDigestService_1 = require("../services/zoneDigestService");
// Schedule daily digest at 20:00 Dubai time (UTC+4)
// This runs at 16:00 UTC which is 20:00 Dubai time (UTC+4)
const DAILY_DIGEST_SCHEDULE = '0 16 * * *'; // Every day at 16:00 UTC (20:00 Dubai time)
function startZoneDigestCron() {
    console.log('🕐 Starting zone digest cron job scheduler...');
    console.log('📅 Scheduled to run daily at 20:00 Dubai time (16:00 UTC)');
    node_cron_1.default.schedule(DAILY_DIGEST_SCHEDULE, async () => {
        console.log(`🚀 Zone digest cron job triggered at ${new Date().toISOString()}`);
        try {
            await zoneDigestService_1.zoneDigestService.sendDailyDigest();
            console.log('✅ Zone digest cron job completed successfully');
        }
        catch (error) {
            console.error('❌ Zone digest cron job failed:', error);
        }
    });
    console.log('✅ Zone digest cron job initialized');
}
// Manual trigger function for testing
async function triggerZoneDigestManually() {
    console.log('🧪 Manually triggering zone digest...');
    try {
        await zoneDigestService_1.zoneDigestService.sendDailyDigest();
        console.log('✅ Manual zone digest completed');
    }
    catch (error) {
        console.error('❌ Manual zone digest failed:', error);
        throw error;
    }
}
//# sourceMappingURL=zoneDigestCron.js.map