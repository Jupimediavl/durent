import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Set up contract details for a rental
export const setupContract = async (req: AuthRequest, res: Response) => {
  try {
    const { rentalId, contractDuration, contractType, securityDeposit, contractStartDate, paymentDueDay, gracePeriodDays } = req.body;
    const userId = req.userId!;

    // Verify the user is the landlord
    const rental = await prisma.rentalRelationship.findFirst({
      where: {
        id: rentalId,
        landlordId: userId
      }
    });

    if (!rental) {
      return res.status(403).json({ error: 'Unauthorized or rental not found' });
    }

    // Calculate contract end date
    const startDate = new Date(contractStartDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + contractDuration);

    // Update both rental and property with contract and payment information
    const updatedRental = await prisma.rentalRelationship.update({
      where: { id: rentalId },
      data: {
        contractDuration,
        contractType,
        securityDeposit,
        contractStartDate: startDate,
        contractEndDate: endDate,
        autoRenewal: contractType === 'RENEWABLE' ? false : false // Dubai default: no auto-renewal
      },
      include: {
        tenant: true,
        property: true
      }
    });

    // Update property with payment settings
    await prisma.property.update({
      where: { id: rental.propertyId },
      data: {
        paymentDueDay: paymentDueDay || 1,
        gracePeriodDays: gracePeriodDays || 7
      }
    });

    // Auto-generate payments for the contract period (only future payments)
    await generateContractPayments(rentalId, startDate, endDate, rental.monthlyRent, paymentDueDay || 1);

    res.json({
      success: true,
      message: 'Contract setup completed',
      contract: updatedRental
    });
  } catch (error) {
    console.error('Setup contract error:', error);
    res.status(500).json({ error: 'Failed to setup contract' });
  }
};

// Generate future payments for the contract period
async function generateContractPayments(rentalId: string, startDate: Date, endDate: Date, monthlyRent: number, paymentDueDay: number = 1) {
  const payments = [];
  const now = new Date();
  
  // Start generating from current date, not contract start date
  // This ensures we only generate future payments
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDayOfMonth = now.getDate();
  
  // Determine first payment month: current month if due day hasn't passed, otherwise next month
  let firstPaymentMonth = currentMonth;
  let firstPaymentYear = currentYear;
  
  if (currentDayOfMonth >= paymentDueDay) {
    // Due day has passed this month, start from next month
    firstPaymentMonth = currentMonth + 1;
    if (firstPaymentMonth > 11) {
      firstPaymentMonth = 0;
      firstPaymentYear = currentYear + 1;
    }
  }
  
  // Generate payments from first payment date until contract end
  let paymentMonth = firstPaymentMonth;
  let paymentYear = firstPaymentYear;
  
  while (true) {
    // Implement "last day of month" logic for due dates
    const dueDate = new Date(paymentYear, paymentMonth, paymentDueDay);
    
    // Check if the due day exists in this month (handles Feb 28/29, Apr/Jun/Sep/Nov 30)
    if (dueDate.getMonth() !== paymentMonth) {
      // Due day doesn't exist in this month, use last day of the month
      dueDate.setDate(0); // This sets to last day of previous month
      dueDate.setMonth(paymentMonth + 1); // Move to next month
      dueDate.setDate(0); // Now it's last day of target month
    }
    
    // Stop if we've reached or passed the contract end date
    if (dueDate >= endDate) break;
    
    payments.push({
      rentalId,
      amount: monthlyRent,
      dueDate,
      description: `Monthly Rent - ${dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      status: 'PENDING' as const
    });
    
    // Move to next month
    paymentMonth++;
    if (paymentMonth > 11) {
      paymentMonth = 0;
      paymentYear++;
    }
  }

  // Only create payments if there are any to create
  if (payments.length > 0) {
    await prisma.payment.createMany({
      data: payments
    });
  }

  // Mark payments as generated
  await prisma.rentalRelationship.update({
    where: { id: rentalId },
    data: { paymentsGenerated: true }
  });
}

// Get contract details
export const getContract = async (req: AuthRequest, res: Response) => {
  try {
    const { rentalId } = req.params;
    const userId = req.userId!;

    const rental = await prisma.rentalRelationship.findFirst({
      where: {
        id: rentalId,
        OR: [
          { landlordId: userId },
          { tenantId: userId }
        ]
      },
      include: {
        payments: {
          orderBy: { dueDate: 'asc' }
        },
        tenant: {
          select: { id: true, name: true, email: true }
        },
        property: {
          select: { id: true, title: true, address: true }
        }
      }
    });

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Calculate contract progress
    const now = new Date();
    const totalDays = rental.contractEndDate ? 
      (rental.contractEndDate.getTime() - rental.contractStartDate!.getTime()) / (1000 * 60 * 60 * 24) : 0;
    const elapsedDays = rental.contractStartDate ? 
      Math.max(0, (now.getTime() - rental.contractStartDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    const progress = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;

    res.json({
      success: true,
      contract: {
        ...rental,
        contractProgress: Math.round(progress),
        daysRemaining: Math.max(0, Math.ceil(totalDays - elapsedDays))
      }
    });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Failed to get contract details' });
  }
};

// Check for expiring contracts (to be called by cron job)
export const checkExpiringContracts = async (req: Request, res: Response) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringContracts = await prisma.rentalRelationship.findMany({
      where: {
        contractEndDate: {
          lte: thirtyDaysFromNow
        },
        status: 'ACTIVE'
      },
      include: {
        tenant: true,
        landlord: true,
        property: true
      }
    });

    // You could send notifications here
    console.log(`Found ${expiringContracts.length} contracts expiring in the next 30 days`);

    res.json({
      success: true,
      expiringContracts: expiringContracts.length,
      contracts: expiringContracts
    });
  } catch (error) {
    console.error('Check expiring contracts error:', error);
    res.status(500).json({ error: 'Failed to check expiring contracts' });
  }
};

// Extend contract
export const extendContract = async (req: AuthRequest, res: Response) => {
  try {
    const { rentalId, additionalMonths } = req.body;
    const userId = req.userId!;

    const rental = await prisma.rentalRelationship.findFirst({
      where: {
        id: rentalId,
        landlordId: userId
      }
    });

    if (!rental || !rental.contractEndDate) {
      return res.status(404).json({ error: 'Contract not found or not set up' });
    }

    // Extend the contract end date
    const newEndDate = new Date(rental.contractEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);

    await prisma.rentalRelationship.update({
      where: { id: rentalId },
      data: {
        contractEndDate: newEndDate,
        contractDuration: (rental.contractDuration || 0) + additionalMonths
      }
    });

    // Generate additional payments
    await generateContractPayments(rentalId, rental.contractEndDate, newEndDate, rental.monthlyRent, 1);

    res.json({
      success: true,
      message: 'Contract extended successfully',
      newEndDate
    });
  } catch (error) {
    console.error('Extend contract error:', error);
    res.status(500).json({ error: 'Failed to extend contract' });
  }
};