import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();

interface PaymentGenerationResult {
  success: number;
  skipped: number;
  errors: string[];
}

/**
 * Auto-generates monthly payments for active rental relationships
 * Based on property's paymentDueDay and paymentFrequency settings
 */
export async function autoGeneratePayments(): Promise<PaymentGenerationResult> {
  const result: PaymentGenerationResult = {
    success: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Get all active rental relationships with properties that have payment settings configured
    const activeRentals = await prisma.rentalRelationship.findMany({
      where: {
        status: 'ACTIVE',
        property: {
          paymentDueDay: {
            not: null
          }
        }
      },
      include: {
        property: true,
        tenant: true,
        landlord: true
      }
    });

    console.log(`🔍 Found ${activeRentals.length} active rentals to process`);

    for (const rental of activeRentals) {
      try {
        await generatePaymentForRental(rental, result);
      } catch (error) {
        const errorMsg = `Failed to generate payment for rental ${rental.id}: ${error}`;
        console.error('❌', errorMsg);
        result.errors.push(errorMsg);
      }
    }

    console.log(`✅ Payment generation completed:`, result);
    return result;

  } catch (error) {
    console.error('❌ Auto payment generation failed:', error);
    result.errors.push(`Global error: ${error}`);
    return result;
  }
}

async function generatePaymentForRental(rental: any, result: PaymentGenerationResult) {
  const { property, tenant, landlord } = rental;
  
  // Calculate next payment due date based on payment frequency
  const paymentFrequency = property.paymentFrequency || 12; // Default to monthly
  const paymentDueDay = property.paymentDueDay;
  
  // Determine the next payment period
  const today = new Date();
  const nextPaymentDate = calculateNextPaymentDate(today, paymentDueDay, paymentFrequency);
  
  // Check if payment already exists for this period
  const existingPayment = await prisma.payment.findFirst({
    where: {
      rentalId: rental.id,
      dueDate: {
        gte: startOfPeriod(nextPaymentDate, paymentFrequency),
        lt: endOfPeriod(nextPaymentDate, paymentFrequency)
      }
    }
  });

  if (existingPayment) {
    console.log(`⏭️  Payment already exists for rental ${rental.id}, period: ${nextPaymentDate.toISOString()}`);
    result.skipped++;
    return;
  }

  // Only generate payment if the due date is within reasonable range (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  if (nextPaymentDate > thirtyDaysFromNow) {
    console.log(`⏭️  Payment date too far in future for rental ${rental.id}: ${nextPaymentDate.toISOString()}`);
    result.skipped++;
    return;
  }

  // Calculate payment amount based on frequency
  const annualRent = rental.monthlyRent * 12;
  const paymentAmount = Math.round(annualRent / paymentFrequency);

  // Create the payment
  const payment = await prisma.payment.create({
    data: {
      amount: paymentAmount,
      dueDate: nextPaymentDate,
      description: `Rent payment for ${property.title} (${getPaymentFrequencyLabel(paymentFrequency)})`,
      rentalId: rental.id
    }
  });

  // Send notification to tenant
  await NotificationService.sendPaymentReminderNotification(
    tenant.id,
    property.title,
    paymentAmount,
    nextPaymentDate.toLocaleDateString(),
    property.id
  );

  console.log(`✅ Generated payment for rental ${rental.id}: ${paymentAmount} AED due ${nextPaymentDate.toLocaleDateString()}`);
  result.success++;
}

function calculateNextPaymentDate(today: Date, dueDay: number, frequency: number): Date {
  const year = today.getFullYear();
  const month = today.getMonth();
  
  // For monthly payments (frequency 12)
  if (frequency === 12) {
    // If today is before the due day, generate for current month
    // Otherwise, generate for next month
    let targetMonth = today.getDate() <= dueDay ? month : month + 1;
    let targetYear = year;
    
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear++;
    }
    
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const effectiveDay = Math.min(dueDay, lastDayOfMonth);
    
    return new Date(targetYear, targetMonth, effectiveDay);
  }
  
  // For other frequencies, calculate based on the period
  const monthsPerPayment = 12 / frequency;
  let targetMonth = month;
  
  // Find next payment month
  while (targetMonth % monthsPerPayment !== 0) {
    targetMonth++;
  }
  
  if (targetMonth >= 12) {
    targetMonth = targetMonth % 12;
  }
  
  const lastDayOfMonth = new Date(year, targetMonth + 1, 0).getDate();
  const effectiveDay = Math.min(dueDay, lastDayOfMonth);
  
  return new Date(year, targetMonth, effectiveDay);
}

function startOfPeriod(date: Date, frequency: number): Date {
  if (frequency === 12) {
    // Monthly - start of month
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  
  // For other frequencies, use a wider range
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 15);
  return startDate;
}

function endOfPeriod(date: Date, frequency: number): Date {
  if (frequency === 12) {
    // Monthly - end of month
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  }
  
  // For other frequencies, use a wider range
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 15);
  return endDate;
}

function getPaymentFrequencyLabel(frequency: number): string {
  switch (frequency) {
    case 1: return 'Annual';
    case 2: return 'Bi-annual';
    case 4: return 'Quarterly';
    case 6: return 'Bi-monthly';
    case 12: return 'Monthly';
    default: return `${frequency}x per year`;
  }
}

// Run the script if called directly
if (require.main === module) {
  autoGeneratePayments()
    .then((result) => {
      console.log('🎉 Auto payment generation completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Auto payment generation failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}