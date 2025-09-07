import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { stripeService } from '../services/stripeService';

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

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let whereClause: any = {
      OR: [
        // Payments that are completely finished
        { status: 'PAID' },
        { status: 'CANCELLED' },
        // Overdue payments that are past grace period (considered historical)
        {
          status: 'OVERDUE',
          dueDate: {
            // More than 30 days past due = historical
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      ]
    };

    if (user.userType === 'TENANT') {
      whereClause.rental = {
        tenantId: userId,
        status: { in: ['ACTIVE', 'ENDING', 'ENDED'] }
      };
    } else {
      whereClause.rental = {
        landlordId: userId,
        status: { in: ['ACTIVE', 'ENDING', 'ENDED'] }
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
        dueDate: 'desc' // Most recent first in history
      }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

export const getUpcomingPayments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    console.log('💰 Getting upcoming payments for user:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log('💰 User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('💰 User found:', user.name, user.userType);

    let whereClause: any = {
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

    console.log('💰 Where clause:', JSON.stringify(whereClause, null, 2));

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
    
    console.log('💰 Found payments:', payments.length);
    console.log('💰 Payments data:', payments.map(p => ({
      id: p.id,
      amount: p.amount,
      dueDate: p.dueDate,
      status: p.status,
      propertyTitle: p.rental.property.title,
      tenantName: p.rental.tenant?.name
    })));

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

export const markPaymentNotReceived = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
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

    // Only landlord can mark as not received
    if (payment.rental.landlordId !== userId) {
      return res.status(403).json({ error: 'Only landlord can mark payment as not received' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Payment must be in pending status' });
    }

    // Reset payment to require proof
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: 'VERIFICATION',
        paidDate: null,
        method: null,
        reference: null,
        proofImage: null
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

    // Send notification to tenant requesting proof
    await NotificationService.sendPaymentRejectedNotification(
      payment.rental.tenantId,
      payment.rental.property.title,
      payment.amount,
      payment.rental.propertyId,
      reason || 'Payment not received. Please upload proof of payment.'
    );

    res.json({ 
      message: 'Payment marked as not received. Tenant has been notified to provide proof.',
      payment: updatedPayment 
    });
  } catch (error) {
    console.error('Mark payment not received error:', error);
    res.status(500).json({ error: 'Failed to mark payment as not received' });
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

// STRIPE PAYMENT FUNCTIONS

// Create payment intent for invite code generation (landlord)
export const createInvitePaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.body;
    const userId = req.userId!;

    if (!propertyId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Stripe payment intent for 9.90 AED
    const paymentIntent = await stripeService.createPaymentIntent({
      amount: 990, // 9.90 AED in fils
      currency: 'aed',
      metadata: {
        userId,
        actionType: 'INVITE_CODE_GENERATION',
        propertyId,
      },
    });

    res.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      publishableKey: stripeService.getPublishableKey(),
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Create payment intent for invite code usage (tenant) - TEMPORARILY DISABLED
export const createJoinPaymentIntent = async (req: AuthRequest, res: Response) => {
  // TODO: Re-enable after fixing Stripe integration
  res.status(501).json({ error: 'Stripe integration temporarily disabled' });
};

// Confirm payment and execute action - TEMPORARILY DISABLED  
export const confirmPaymentAndExecute = async (req: AuthRequest, res: Response) => {
  // TODO: Re-enable after fixing Stripe integration
  res.status(501).json({ error: 'Stripe integration temporarily disabled' });
};

    if (actionType === 'INVITE_CODE_GENERATION') {
      // Generate invite code for landlord
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const invite = await prisma.invite.create({
        data: {
          code,
          propertyId,
          ownerId: userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return res.json({
        success: true,
        inviteCode: invite.code,
        expiresAt: invite.expiresAt,
      });
      
    } else if (actionType === 'INVITE_CODE_USAGE') {
      // Accept invite code for tenant
      const invite = await prisma.invite.findUnique({
        where: { code: inviteCode }
      });

      if (!invite || invite.used) {
        return res.status(400).json({ error: 'Invalid or expired invite code' });
      }

      // Get property details
      const property = await prisma.property.findUnique({
        where: { id: invite.propertyId }
      });

      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Create rental relationship
      const rental = await prisma.rentalRelationship.create({
        data: {
          propertyId: invite.propertyId,
          tenantId: userId,
          landlordId: property.ownerId,
          status: 'ACTIVE',
          startDate: new Date(),
          monthlyRent: property.monthlyRent,
        },
        include: {
          property: true,
        },
      });

      // Update invite status
      await prisma.invite.update({
        where: { id: invite.id },
        data: {
          used: true,
          usedBy: userId,
        },
      });

      return res.json({
        success: true,
        rental,
        message: `Successfully joined property: ${invite.property.title}`,
      });
    }

    res.status(400).json({ error: 'Unknown action type' });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment and execute action' });
  }
};

// Stripe webhook handler
export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const result = await stripeService.handleWebhook(req.body, signature);
    
    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

// Get payment configuration for client
export const getPaymentConfig = async (req: Request, res: Response) => {
  try {
    res.json({
      publishableKey: stripeService.getPublishableKey(),
      prices: {
        inviteCodeGeneration: 990, // 9.90 AED in fils
        inviteCodeUsage: 990, // 9.90 AED in fils
      },
      currency: 'aed',
    });
  } catch (error) {
    console.error('Error getting payment config:', error);
    res.status(500).json({ error: 'Failed to get payment configuration' });
  }
};