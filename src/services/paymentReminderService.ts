import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notificationService';
import { addDays, isSameDay } from 'date-fns';

const prisma = new PrismaClient();

export class PaymentReminderService {
  /**
   * Check and send payment reminders for upcoming payments
   * Runs daily at 10:00 Dubai time
   */
  async sendPaymentReminders(): Promise<void> {
    try {
      console.log('🔔 Starting payment reminders check...');

      // Get all upcoming payments that need reminders
      const upcomingPayments = await this.getUpcomingPaymentsNeedingReminders();
      
      if (upcomingPayments.length === 0) {
        console.log('✅ No payment reminders to send today');
        return;
      }

      console.log(`📋 Found ${upcomingPayments.length} payments needing reminders`);

      // Send reminders for each payment
      let sentCount = 0;
      for (const payment of upcomingPayments) {
        const sent = await this.sendReminderForPayment(payment);
        if (sent) sentCount++;
      }

      console.log(`✅ Payment reminders completed! Sent ${sentCount} reminders`);

    } catch (error) {
      console.error('❌ Error in payment reminders process:', error);
      throw error;
    }
  }

  private async getUpcomingPaymentsNeedingReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all payments with their rental relationships and user settings
    const payments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: today, // Due date is today or in the future
        }
      },
      include: {
        rental: {
          include: {
            tenant: {
              include: {
                notificationSettings: true
              }
            },
            property: true
          }
        }
      }
    });

    // Filter payments that need reminders today
    const paymentsNeedingReminders = payments.filter(payment => {
      const settings = payment.rental.tenant.notificationSettings;
      
      // Check if user has payment reminders enabled
      if (!settings || !settings.paymentReminders) {
        return false;
      }

      // Calculate reminder date
      const reminderDaysBefore = settings.reminderDaysBefore || 3;
      const reminderDate = addDays(payment.dueDate, -reminderDaysBefore);
      
      // Check if today is the reminder date
      return isSameDay(today, reminderDate);
    });

    return paymentsNeedingReminders;
  }

  private async sendReminderForPayment(payment: any): Promise<boolean> {
    try {
      const tenant = payment.rental.tenant;
      const property = payment.rental.property;
      const daysUntilDue = Math.ceil((payment.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // Format the message
      const title = 'Payment Reminder';
      const body = `Your rent payment of AED ${payment.amount} for ${property.title} is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`;

      // Send both in-app and push notification
      await NotificationService.createAndSendNotification(
        tenant.id,
        'PAYMENT_REMINDER',
        title,
        body,
        {
          paymentId: payment.id,
          propertyId: property.id,
          propertyTitle: property.title,
          amount: payment.amount,
          dueDate: payment.dueDate.toISOString(),
          daysUntilDue
        }
      );

      console.log(`📱 Sent payment reminder to ${tenant.name} for ${property.title}: ${daysUntilDue} days until due`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to send payment reminder:`, error);
      return false;
    }
  }

  /**
   * Check and send overdue payment notifications
   * Also runs daily at 10:00 Dubai time
   */
  async sendOverdueNotifications(): Promise<void> {
    try {
      console.log('⚠️  Starting overdue payment notifications check...');

      const overduePayments = await prisma.payment.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            lt: new Date() // Due date is in the past
          }
        },
        include: {
          rental: {
            include: {
              tenant: {
                include: {
                  notificationSettings: true
                }
              },
              property: true
            }
          }
        }
      });

      if (overduePayments.length === 0) {
        console.log('✅ No overdue payments found');
        return;
      }

      console.log(`📋 Found ${overduePayments.length} overdue payments`);

      // Send notifications for overdue payments
      let sentCount = 0;
      for (const payment of overduePayments) {
        // Only send if payment reminders are enabled
        const settings = payment.rental.tenant.notificationSettings;
        if (!settings || !settings.paymentReminders) continue;

        const tenant = payment.rental.tenant;
        const property = payment.rental.property;
        const daysOverdue = Math.ceil((Date.now() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Send notification
        await NotificationService.createAndSendNotification(
          tenant.id,
          'PAYMENT_OVERDUE',
          'Payment Overdue',
          `Your rent payment of AED ${payment.amount} for ${property.title} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
          {
            paymentId: payment.id,
            propertyId: property.id,
            propertyTitle: property.title,
            amount: payment.amount,
            dueDate: payment.dueDate.toISOString(),
            daysOverdue
          }
        );

        console.log(`⚠️  Sent overdue notification to ${tenant.name} for ${property.title}: ${daysOverdue} days overdue`);
        sentCount++;
      }

      console.log(`✅ Overdue notifications completed! Sent ${sentCount} notifications`);

    } catch (error) {
      console.error('❌ Error in overdue notifications process:', error);
      throw error;
    }
  }
}

export const paymentReminderService = new PaymentReminderService();