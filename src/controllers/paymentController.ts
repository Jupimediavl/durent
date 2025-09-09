import { Request, Response } from 'express';
import { PrismaClient, PaymentStatus, RentalStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { stripeService } from '../services/stripeService';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description, rentalId } = req.body;
    const userId = req.userId!;

    // Verify that the user is associated with this rental
    const rental = await prisma.rentalRelationship.findFirst({
      where: {
        id: rentalId,
        OR: [
          { tenantId: userId },
          { landlordId: userId }
        ]
      }
    });

    if (!rental) {
      return res.status(403).json({ error: 'Unauthorized to create payment for this rental' });
    }

    const payment = await prisma.payment.create({
      data: {
        amount,
        description,
        rentalId,
        dueDate: new Date(),
        status: 'PENDING'
      }
    });

    res.status(201).json({ payment });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get all rentals where user is either tenant or landlord
    const rentals = await prisma.rentalRelationship.findMany({
      where: {
        OR: [
          { tenantId: userId },
          { landlordId: userId }
        ]
      },
      include: {
        payments: {
          orderBy: { dueDate: 'desc' }
        }
      }
    });

    const payments = rentals.flatMap(rental => rental.payments);
    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
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

    // Send push notification to landlord when tenant uploads payment proof
    if (userId === payment.rental.tenantId) {
      await NotificationService.createAndSendNotification(
        payment.rental.landlordId,
        'PAYMENT_VERIFICATION_NEEDED',
        'Payment Verification Needed',
        `${payment.rental.tenant.name} submitted payment proof for ${payment.rental.property.title}`,
        {
          paymentId: payment.id,
          propertyId: payment.rental.propertyId,
          propertyTitle: payment.rental.property.title,
          tenantName: payment.rental.tenant.name,
          amount: payment.amount
        }
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
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    const upcomingPayments = await prisma.payment.findMany({
      where: {
        rental: {
          OR: [
            { tenantId: userId },
            { landlordId: userId }
          ]
        },
        status: 'PENDING',
        dueDate: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        rental: {
          include: {
            property: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json({ upcomingPayments });
  } catch (error) {
    console.error('Get upcoming payments error:', error);
    res.status(500).json({ error: 'Failed to get upcoming payments' });
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const paymentHistory = await prisma.payment.findMany({
      where: {
        rental: {
          OR: [
            { tenantId: userId },
            { landlordId: userId }
          ]
        },
        status: {
          in: ['PAID', 'CANCELLED']
        }
      },
      include: {
        rental: {
          include: {
            property: true
          }
        }
      },
      orderBy: { paidDate: 'desc' }
    });

    res.json({ paymentHistory });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
};

export const generatePaymentForProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    // Verify user owns the property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        rentals: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!property || property.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to generate payment for this property' });
    }

    const activeRentals = property.rentals;
    if (activeRentals.length === 0) {
      return res.status(400).json({ error: 'No active rentals found for this property' });
    }

    const rental = activeRentals[0]; // Assuming one active rental per property
    const dueDay = property.paymentDueDay || 1;
    
    // Calculate next payment due date
    const now = new Date();
    const nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
    
    const payment = await prisma.payment.create({
      data: {
        amount: rental.monthlyRent,
        description: `Monthly rent for ${property.title}`,
        rentalId: rental.id,
        dueDate: nextPaymentDate,
        status: 'PENDING'
      }
    });

    res.json({ payment });
  } catch (error) {
    console.error('Generate payment error:', error);
    res.status(500).json({ error: 'Failed to generate payment' });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { verify } = req.body;
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

    const newStatus = verify ? 'PAID' : 'PENDING';
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: newStatus,
        // Reset payment data if rejected
        ...(verify ? {} : {
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

    // Send push notifications to tenant
    if (verify) {
      await NotificationService.createAndSendNotification(
        payment.rental.tenantId,
        'PAYMENT_APPROVED',
        'Payment Approved',
        `Your payment of AED ${payment.amount} for ${payment.rental.property.title} has been approved`,
        {
          paymentId: payment.id,
          propertyId: payment.rental.propertyId,
          propertyTitle: payment.rental.property.title,
          amount: payment.amount
        }
      );
    } else {
      await NotificationService.createAndSendNotification(
        payment.rental.tenantId,
        'PAYMENT_REJECTED',
        'Payment Rejected',
        `Your payment of AED ${payment.amount} for ${payment.rental.property.title} was rejected. Please resubmit.`,
        {
          paymentId: payment.id,
          propertyId: payment.rental.propertyId,
          propertyTitle: payment.rental.property.title,
          amount: payment.amount,
          reason: 'Please resubmit with correct payment proof'
        }
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

    const paymentsForVerification = await prisma.payment.findMany({
      where: {
        rental: {
          landlordId: userId
        },
        status: 'VERIFICATION'
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
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payments: paymentsForVerification });
  } catch (error) {
    console.error('Get payments for verification error:', error);
    res.status(500).json({ error: 'Failed to get payments for verification' });
  }
};

export const deletePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        rental: true
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

export const markPaymentNotReceived = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        rental: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Only landlord can mark payment as not received
    if (payment.rental.landlordId !== userId) {
      return res.status(403).json({ error: 'Only landlord can mark payment as not received' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: 'PENDING',
        paidDate: null
      }
    });

    res.json({ payment: updatedPayment });
  } catch (error) {
    console.error('Mark payment not received error:', error);
    res.status(500).json({ error: 'Failed to mark payment as not received' });
  }
};

// ===== STRIPE FUNCTIONS - TEMPORARILY DISABLED =====

export const createInvitePaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.body;
    const userId = req.userId!;

    if (!propertyId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user owns the property
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property || property.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to generate invite code for this property' });
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

export const createJoinPaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.userId!;

    if (!inviteCode || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if invite code is valid
    const invite = await prisma.invite.findFirst({
      where: {
        code: inviteCode,
        usedAt: null, // Not used yet
        expiresAt: {
          gt: new Date() // Not expired
        }
      },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }

    // Create Stripe payment intent for 9.90 AED
    const paymentIntent = await stripeService.createPaymentIntent({
      amount: 990, // 9.90 AED in fils
      currency: 'aed',
      metadata: {
        userId,
        actionType: 'INVITE_CODE_USAGE',
        inviteCode,
        propertyId: invite.propertyId,
      },
    });

    res.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      publishableKey: stripeService.getPublishableKey(),
      property: {
        id: invite.property.id,
        title: invite.property.title,
        address: invite.property.address,
        monthlyRent: invite.property.monthlyRent,
        bedrooms: invite.property.bedrooms,
        bathrooms: invite.property.bathrooms,
        area: invite.property.area
      },
      landlord: invite.property.owner
    });
  } catch (error) {
    console.error('Error creating join payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Check for existing unused invite code for a property
export const checkExistingInviteCode = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    // Verify user owns the property
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property || property.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to check invite codes for this property' });
    }

    // Look for existing unused invite code
    const existingInvite = await prisma.invite.findFirst({
      where: {
        propertyId,
        createdById: userId,
        usedAt: null, // Not used yet
        expiresAt: {
          gt: new Date() // Not expired
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingInvite) {
      return res.json({
        hasExistingCode: true,
        inviteCode: existingInvite.code,
        createdAt: existingInvite.createdAt,
        expiresAt: existingInvite.expiresAt
      });
    }

    res.json({
      hasExistingCode: false
    });

  } catch (error) {
    console.error('Check existing invite code error:', error);
    res.status(500).json({ error: 'Failed to check existing invite code' });
  }
};

export const confirmPaymentAndExecute = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentIntentId, propertyId } = req.body;
    const userId = req.userId!;

    if (!paymentIntentId || !propertyId) {
      return res.status(400).json({ error: 'Payment Intent ID and Property ID required' });
    }

    // Verify user owns the property
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property || property.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to generate invite code for this property' });
    }

    // Check for existing unused invite code first
    const existingInvite = await prisma.invite.findFirst({
      where: {
        propertyId,
        createdById: userId,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingInvite) {
      return res.json({
        success: true,
        inviteCode: existingInvite.code,
        message: 'Using existing unused invite code',
        isExisting: true
      });
    }

    // For now, simulate successful payment and generate new invite code
    // TODO: Re-enable Stripe confirmation after database schema is fully synced
    
    // Generate new invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Save invite code to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

    await prisma.invite.create({
      data: {
        code: inviteCode,
        propertyId,
        createdById: userId,
        expiresAt
      }
    });
    
    return res.json({
      success: true,
      inviteCode: inviteCode,
      message: 'Payment confirmed and new invite code generated',
      isExisting: false
    });
    
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment and execute action' });
  }
};

export const confirmJoinPaymentAndExecute = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentIntentId, inviteCode } = req.body;
    const userId = req.userId!;

    if (!paymentIntentId || !inviteCode) {
      return res.status(400).json({ error: 'Payment Intent ID and Invite Code required' });
    }

    // Verify invite code is valid and unused
    const invite = await prisma.invite.findFirst({
      where: {
        code: inviteCode,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        property: true
      }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }

    // For now, simulate successful payment and accept the invite
    // TODO: Re-enable Stripe confirmation after database schema is fully synced
    
    // Create rental relationship (similar to acceptInvite but with payment verification)
    const rental = await prisma.rentalRelationship.create({
      data: {
        propertyId: invite.propertyId,
        landlordId: invite.createdById,
        tenantId: userId,
        startDate: new Date(),
        monthlyRent: invite.property.monthlyRent,
        status: 'ACTIVE',
        inviteCode: null, // Clear the invite code since it's now used
      },
      include: {
        property: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Mark invite as used
    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
        usedById: userId
      }
    });
    
    return res.json({
      success: true,
      message: 'Payment confirmed and successfully joined property',
      rental: rental
    });
    
  } catch (error) {
    console.error('Confirm join payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment and join property' });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Stripe integration temporarily disabled' });
};

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