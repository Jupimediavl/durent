import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { rentalId, amount, dueDate, description } = req.body;
    const userId = req.userId!;

    // Verify user is landlord of this rental
    const rental = await prisma.rentalRelationship.findUnique({
      where: { id: rentalId },
      include: {
        property: true,
        tenant: true
      }
    });

    if (!rental || rental.landlordId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payment = await prisma.payment.create({
      data: {
        amount,
        dueDate: new Date(dueDate),
        description: description || `Monthly rent for ${rental.property.title}`,
        rentalId
      },
      include: {
        rental: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    });

    // Send notification to tenant
    await NotificationService.sendPaymentReminderNotification(
      rental.tenantId,
      rental.property.title,
      amount,
      new Date(dueDate).toLocaleDateString(),
      rental.propertyId
    );

    res.status(201).json({ payment });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { rentalId, status } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let whereClause: any = {};

    if (rentalId) {
      whereClause.rentalId = rentalId as string;
    }

    if (status) {
      whereClause.status = status as string;
    }

    // Filter based on user type
    if (user.userType === 'TENANT') {
      whereClause.rental = {
        tenantId: userId,
        status: { in: ['ACTIVE', 'ENDING'] }
      };
    } else {
      whereClause.rental = {
        landlordId: userId,
        status: { in: ['ACTIVE', 'ENDING'] }
      };
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        rental: {
          include: {
            property: true,
            tenant: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            landlord: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const markPaymentAsPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { method, reference, proofImage } = req.body;
    const userId = req.userId!;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        rental: {
          include: {
            property: true,
            tenant: true,
            landlord: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify access (tenant can mark their own payments, landlord can mark payments for their properties)
    const hasAccess = payment.rental.tenantId === userId || payment.rental.landlordId === userId;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: 'VERIFICATION',
        paidDate: new Date(),
        method: method || 'Not specified',
        reference,
        proofImage
      },
      include: {
        rental: {
          include: {
            property: true,
            tenant: true,
            landlord: true
          }
        }
      }
    });

    // Send notification to landlord if tenant submitted payment for verification
    if (userId === payment.rental.tenantId) {
      await NotificationService.sendPaymentVerificationNotification(
        payment.rental.landlordId,
        payment.rental.tenant.name,
        payment.rental.property.title,
        payment.amount,
        payment.rental.propertyId,
        payment.id
      );
    }

    res.json({ payment: updatedPayment });
  } catch (error) {
    console.error('Mark payment as paid error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
};

export const getUpcomingPayments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let whereClause: any = {
      dueDate: {
        lte: thirtyDaysFromNow
      },
      status: {
        in: ['PENDING', 'VERIFICATION', 'OVERDUE']
      }
    };

    if (user.userType === 'TENANT') {
      whereClause.rental = {
        tenantId: userId,
        status: { in: ['ACTIVE', 'ENDING'] }
      };
    } else {
      whereClause.rental = {
        landlordId: userId,
        status: { in: ['ACTIVE', 'ENDING'] }
      };
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        rental: {
          include: {
            property: true,
            tenant: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get upcoming payments error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming payments' });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const userId = req.userId!;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        rental: {
          include: {
            property: true,
            tenant: true,
            landlord: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Only landlord can verify payments
    if (payment.rental.landlordId !== userId) {
      return res.status(403).json({ error: 'Only landlord can verify payments' });
    }

    if (payment.status !== 'VERIFICATION') {
      return res.status(400).json({ error: 'Payment is not in verification status' });
    }

    const newStatus = approved ? 'PAID' : 'PENDING';
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: newStatus,
        // Reset payment data if rejected
        ...(approved ? {} : {
          paidDate: null,
          method: null,
          reference: null,
          proofImage: null
        })
      },
      include: {
        rental: {
          include: {
            property: true,
            tenant: true,
            landlord: true
          }
        }
      }
    });

    // Send notification to tenant
    if (approved) {
      await NotificationService.sendPaymentApprovedNotification(
        payment.rental.tenantId,
        payment.rental.property.title,
        payment.amount,
        payment.rental.propertyId
      );
    } else {
      await NotificationService.sendPaymentRejectedNotification(
        payment.rental.tenantId,
        payment.rental.property.title,
        payment.amount,
        payment.rental.propertyId,
        'Please resubmit.'
      );
    }

    res.json({ payment: updatedPayment });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

export const getPaymentsForVerification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Only landlords can access verification queue
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.userType !== 'LANDLORD') {
      return res.status(403).json({ error: 'Only landlords can access verification queue' });
    }

    const paymentsToVerify = await prisma.payment.findMany({
      where: {
        status: 'VERIFICATION',
        rental: {
          landlordId: userId
        }
      },
      include: {
        rental: {
          include: {
            property: true,
            tenant: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        paidDate: 'desc'
      }
    });

    res.json({ payments: paymentsToVerify });
  } catch (error) {
    console.error('Get payments for verification error:', error);
    res.status(500).json({ error: 'Failed to fetch payments for verification' });
  }
};

export const deletePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        rental: {
          include: {
            property: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Only landlord can delete payments
    if (payment.rental.landlordId !== userId) {
      return res.status(403).json({ error: 'Only landlord can delete payments' });
    }

    await prisma.payment.delete({
      where: { id }
    });

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};

export const generatePaymentForProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    // Only landlords can generate payments
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.userType !== 'LANDLORD') {
      return res.status(403).json({ error: 'Only landlords can generate payments' });
    }

    // Get active rental for this property
    const activeRental = await prisma.rentalRelationship.findFirst({
      where: {
        propertyId,
        landlordId: userId,
        status: 'ACTIVE'
      },
      include: {
        property: true,
        tenant: true
      }
    });

    if (!activeRental) {
      return res.status(404).json({ error: 'No active rental found for this property' });
    }

    if (!activeRental.property.paymentDueDay) {
      return res.status(400).json({ 
        error: 'Payment due day not set. Please configure payment settings first.' 
      });
    }

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Calculate due date with smart month adjustment
    const year = nextMonth.getFullYear();
    const month = nextMonth.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const effectiveDay = Math.min(activeRental.property.paymentDueDay as number, lastDayOfMonth);
    const dueDate = new Date(year, month, effectiveDay);
    
    // Check if payment already exists for next month
    const existingPayment = await prisma.payment.findFirst({
      where: {
        rentalId: activeRental.id,
        dueDate: {
          gte: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1),
          lt: new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 1)
        }
      }
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already exists for next month' });
    }

    const payment = await prisma.payment.create({
      data: {
        amount: activeRental.monthlyRent,
        dueDate: dueDate,
        description: `Monthly rent for ${activeRental.property.title}`,
        rentalId: activeRental.id
      }
    });

    // Send notification to tenant
    await NotificationService.sendPaymentReminderNotification(
      activeRental.tenantId,
      activeRental.property.title,
      activeRental.monthlyRent,
      dueDate.toLocaleDateString(),
      activeRental.propertyId
    );

    res.json({ 
      message: 'Payment generated successfully',
      payment,
      dueDate: dueDate.toLocaleDateString()
    });
  } catch (error) {
    console.error('Generate payment for property error:', error);
    res.status(500).json({ error: 'Failed to generate payment' });
  }
};