import cron from 'node-cron';
import { RentalExpiryService } from '../services/rentalExpiryService';

// Schedule rental expiry check at 9:00 Dubai time (UTC+4)
// This runs at 05:00 UTC which is 09:00 Dubai time
const RENTAL_EXPIRY_SCHEDULE = '0 5 * * *'; // Every day at 05:00 UTC (09:00 Dubai)

export function startRentalExpiryCron() {
  console.log('🏠 Starting rental expiry cron job scheduler...');
  console.log('📅 Scheduled to run daily at 09:00 Dubai time (05:00 UTC)');
  
  cron.schedule(RENTAL_EXPIRY_SCHEDULE, async () => {
    console.log(`🚀 Rental expiry cron job triggered at ${new Date().toISOString()}`);
    
    try {
      // Check for rentals expiring soon (90, 60, 30, 14, 7, 1 days)
      await RentalExpiryService.sendExpiryReminders();
      
      // Check for rentals that expired today
      await RentalExpiryService.sendExpiredNotifications();
      
      // Process auto-renewals for eligible rentals
      await RentalExpiryService.processAutoRenewals();
      
      console.log('✅ Rental expiry cron job completed successfully');
    } catch (error) {
      console.error('❌ Rental expiry cron job failed:', error);
    }
  });

  console.log('✅ Rental expiry cron job initialized');
}