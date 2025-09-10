import { PrismaClient, RentalStatus } from '@prisma/client';
import { addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export class RentalExpiryService {
  
  /**
   * Check for rentals expiring soon and send notifications
   * Sends notifications at 90, 60, 30, 14, 7, and 1 day(s) before expiry
   */
  static async sendExpiryReminders(): Promise<void> {
    console.log('🏠 [RENTAL EXPIRY] Starting expiry reminder check...');
    
    try {
      const today = new Date();
      const reminderDays = [90, 60, 30, 14, 7, 1]; // Days before expiry to send notifications
      
      for (const days of reminderDays) {
        const targetDate = addDays(today, days);
        
        // Find active rentals expiring on target date
        const expiringRentals = await prisma.rentalRelationship.findMany({
          where: {
            status: RentalStatus.ACTIVE,
            OR: [
              {
                contractEndDate: {
                  gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
                  lt: addDays(new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()), 1)
                }
              },
              {
                endDate: {
                  gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
                  lt: addDays(new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()), 1)
                }
              }
            ]
          },
          include: {
            tenant: true,
            landlord: true,
            property: true
          }
        });

        console.log(`🏠 [RENTAL EXPIRY] Found ${expiringRentals.length} rentals expiring in ${days} days`);

        for (const rental of expiringRentals) {
          await this.sendExpiryNotification(rental, days);
        }
      }
      
      console.log('✅ [RENTAL EXPIRY] Expiry reminder check completed successfully');
    } catch (error) {
      console.error('❌ [RENTAL EXPIRY] Error in sendExpiryReminders:', error);
    }
  }

  /**
   * Check for rentals that expired today and send notifications
   */
  static async sendExpiredNotifications(): Promise<void> {
    console.log('🏠 [RENTAL EXPIRY] Checking for expired rentals...');
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = addDays(startOfDay, 1);
      
      // Find rentals that expired today
      const expiredRentals = await prisma.rentalRelationship.findMany({
        where: {
          status: RentalStatus.ACTIVE,
          OR: [
            {
              contractEndDate: {
                gte: startOfDay,
                lt: endOfDay
              }
            },
            {
              endDate: {
                gte: startOfDay,
                lt: endOfDay
              }
            }
          ]
        },
        include: {
          tenant: true,
          landlord: true,
          property: true
        }
      });

      console.log(`🏠 [RENTAL EXPIRY] Found ${expiredRentals.length} rentals that expired today`);

      for (const rental of expiredRentals) {
        await this.sendExpiredNotification(rental);
        
        // Update rental status to ENDED if not in auto-renewal
        if (!rental.autoRenewal) {
          await prisma.rentalRelationship.update({
            where: { id: rental.id },
            data: { status: RentalStatus.ENDED }
          });
          console.log(`🏠 [RENTAL EXPIRY] Updated rental ${rental.id} status to ENDED`);
        }
      }
      
      console.log('✅ [RENTAL EXPIRY] Expired rentals check completed successfully');
    } catch (error) {
      console.error('❌ [RENTAL EXPIRY] Error in sendExpiredNotifications:', error);
    }
  }

  /**
   * Process auto-renewals for eligible rentals
   */
  static async processAutoRenewals(): Promise<void> {
    console.log('🏠 [RENTAL EXPIRY] Processing auto-renewals...');
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = addDays(startOfDay, 1);
      
      // Find rentals with auto-renewal that expired today
      const autoRenewalRentals = await prisma.rentalRelationship.findMany({
        where: {
          status: RentalStatus.ACTIVE,
          autoRenewal: true,
          OR: [
            {
              contractEndDate: {
                gte: startOfDay,
                lt: endOfDay
              }
            },
            {
              endDate: {
                gte: startOfDay,
                lt: endOfDay
              }
            }
          ]
        },
        include: {
          tenant: true,
          landlord: true,
          property: true
        }
      });

      console.log(`🏠 [RENTAL EXPIRY] Found ${autoRenewalRentals.length} rentals for auto-renewal`);

      for (const rental of autoRenewalRentals) {
        // Extend contract by the original duration (default to 12 months if not specified)
        const contractDuration = rental.contractDuration || 12;
        const currentEndDate = rental.contractEndDate || rental.endDate;
        const newEndDate = addDays(currentEndDate!, contractDuration * 30); // Approximate months to days
        
        // Update the rental with new end date
        await prisma.rentalRelationship.update({
          where: { id: rental.id },
          data: {
            contractEndDate: newEndDate,
            endDate: newEndDate
          }
        });

        // Send renewal notification to both tenant and landlord
        await this.sendRenewalNotification(rental, newEndDate);
        
        console.log(`🏠 [RENTAL EXPIRY] Auto-renewed rental ${rental.id} until ${newEndDate.toDateString()}`);
      }
      
      console.log('✅ [RENTAL EXPIRY] Auto-renewal processing completed successfully');
    } catch (error) {
      console.error('❌ [RENTAL EXPIRY] Error in processAutoRenewals:', error);
    }
  }

  /**
   * Send expiry notification to both tenant and landlord
   */
  private static async sendExpiryNotification(rental: any, daysRemaining: number): Promise<void> {
    const propertyName = rental.property?.title || 'Your property';
    
    // Notification for tenant
    const tenantTitle = `Contract Expiring Soon`;
    const tenantBody = `Your rental contract for ${propertyName} expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Please contact your landlord if you wish to renew.`;
    
    await NotificationService.createAndSendNotification(
      rental.tenantId,
      'RENTAL_EXPIRING_SOON',
      tenantTitle,
      tenantBody,
      {
        rentalId: rental.id,
        propertyId: rental.propertyId,
        daysRemaining,
        type: 'rental_expiry'
      }
    );

    // Notification for landlord
    const landlordTitle = `Tenant Contract Expiring`;
    const landlordBody = `The rental contract for ${propertyName} with ${rental.tenant?.firstName} expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Consider discussing renewal options.`;
    
    await NotificationService.createAndSendNotification(
      rental.landlordId,
      'RENTAL_EXPIRING_SOON',
      landlordTitle,
      landlordBody,
      {
        rentalId: rental.id,
        propertyId: rental.propertyId,
        tenantId: rental.tenantId,
        daysRemaining,
        type: 'rental_expiry'
      }
    );

    console.log(`📱 [RENTAL EXPIRY] Sent expiry notifications for rental ${rental.id} (${daysRemaining} days remaining)`);
  }

  /**
   * Send expired notification to both tenant and landlord
   */
  private static async sendExpiredNotification(rental: any): Promise<void> {
    const propertyName = rental.property?.title || 'Your property';
    
    // Notification for tenant
    const tenantTitle = `Contract Expired`;
    const tenantBody = `Your rental contract for ${propertyName} has expired today. Please coordinate with your landlord for next steps.`;
    
    await NotificationService.createAndSendNotification(
      rental.tenantId,
      'RENTAL_EXPIRED',
      tenantTitle,
      tenantBody,
      {
        rentalId: rental.id,
        propertyId: rental.propertyId,
        type: 'rental_expired'
      }
    );

    // Notification for landlord
    const landlordTitle = `Tenant Contract Expired`;
    const landlordBody = `The rental contract for ${propertyName} with ${rental.tenant?.firstName} has expired today.`;
    
    await NotificationService.createAndSendNotification(
      rental.landlordId,
      'RENTAL_EXPIRED',
      landlordTitle,
      landlordBody,
      {
        rentalId: rental.id,
        propertyId: rental.propertyId,
        tenantId: rental.tenantId,
        type: 'rental_expired'
      }
    );

    console.log(`📱 [RENTAL EXPIRY] Sent expired notifications for rental ${rental.id}`);
  }

  /**
   * Send auto-renewal notification to both tenant and landlord
   */
  private static async sendRenewalNotification(rental: any, newEndDate: Date): Promise<void> {
    const propertyName = rental.property?.title || 'Your property';
    
    // Notification for tenant
    const tenantTitle = `Contract Auto-Renewed`;
    const tenantBody = `Your rental contract for ${propertyName} has been automatically renewed until ${newEndDate.toLocaleDateString()}.`;
    
    await NotificationService.createAndSendNotification(
      rental.tenantId,
      'CONTRACT_RENEWAL_REMINDER',
      tenantTitle,
      tenantBody,
      {
        rentalId: rental.id,
        propertyId: rental.propertyId,
        newEndDate: newEndDate.toISOString(),
        type: 'auto_renewal'
      }
    );

    // Notification for landlord
    const landlordTitle = `Contract Auto-Renewed`;
    const landlordBody = `The rental contract for ${propertyName} with ${rental.tenant?.firstName} has been automatically renewed until ${newEndDate.toLocaleDateString()}.`;
    
    await NotificationService.createAndSendNotification(
      rental.landlordId,
      'CONTRACT_RENEWAL_REMINDER',
      landlordTitle,
      landlordBody,
      {
        rentalId: rental.id,
        propertyId: rental.propertyId,
        tenantId: rental.tenantId,
        newEndDate: newEndDate.toISOString(),
        type: 'auto_renewal'
      }
    );

    console.log(`📱 [RENTAL EXPIRY] Sent auto-renewal notifications for rental ${rental.id}`);
  }
}

export default RentalExpiryService;