import { Request, Response } from 'express';
import { PrismaClient, EndRequestStatus, RentalStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();

// Request to end rental (landlord or tenant)
export const requestEndRental = async (req: AuthRequest, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { reason } = req.body;
    const userId = req.userId!;
    
    console.log('End rental request:', { rentalId, reason, userId });

    // Get rental relationship
    const rental = await prisma.rentalRelationship.findUnique({
      where: { id: rentalId },
      include: {
        tenant: true,
        landlord: true,
        property: true,
        endRequest: true
      }
    });

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Check if user is part of this rental
    if (rental.tenantId !== userId && rental.landlordId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if rental is active
    if (rental.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Rental is not active' });
    }

    // Check if there's already a pending request
    if (rental.endRequest && rental.endRequest.status === 'PENDING') {
      return res.status(400).json({ error: 'End request already pending' });
    }

    // Check for pending payments
    const pendingPayments = await prisma.payment.findMany({
      where: {
        rentalId,
        status: { in: ['PENDING', 'VERIFICATION'] }
      }
    });

    const pendingPaymentsWarning = pendingPayments.length > 0 
      ? `Warning: There are ${pendingPayments.length} pending payment(s) for this rental.` 
      : null;

    // Calculate auto-accept date (7 days from now)
    const autoAcceptAt = new Date();
    autoAcceptAt.setDate(autoAcceptAt.getDate() + 7);

    // Delete any existing end request for this rental (if cancelled/accepted)
    if (rental.endRequest) {
      await prisma.endRequest.delete({
        where: { id: rental.endRequest.id }
      });
    }

    // Create new end request
    const endRequest = await prisma.endRequest.create({
      data: {
        rentalId,
        requestedById: userId,
        reason,
        autoAcceptAt,
        status: 'PENDING'
      }
    });

    // Update rental status
    await prisma.rentalRelationship.update({
      where: { id: rentalId },
      data: { status: 'ENDING' }
    });

    // Send notification to other party
    const otherParty = userId === rental.tenantId ? rental.landlord : rental.tenant;
    const requesterName = userId === rental.tenantId ? rental.tenant.name : rental.landlord.name;
    
    await NotificationService.sendEndRentalRequestNotification(
      otherParty.id,
      requesterName,
      rental.property.title,
      rental.propertyId,
      reason
    );

    res.status(201).json({ 
      message: 'End rental request sent',
      endRequest,
      autoAcceptDate: autoAcceptAt,
      warning: pendingPaymentsWarning
    });
  } catch (error: unknown) {
    console.error('Request end rental error:', error);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to request end rental', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
};

// Accept end rental request
export const acceptEndRental = async (req: AuthRequest, res: Response) => {
  try {
    const { rentalId } = req.params;
    const userId = req.userId!;
    
    console.log('Accept end rental request:', { rentalId, userId });

    // Get rental with end request
    const rental = await prisma.rentalRelationship.findUnique({
      where: { id: rentalId },
      include: {
        endRequest: true,
        tenant: true,
        landlord: true,
        property: true
      }
    });

    if (!rental || !rental.endRequest) {
      return res.status(404).json({ error: 'No end request found' });
    }

    // Check if user is the other party (not the requester)
    if (rental.endRequest.requestedById === userId) {
      return res.status(400).json({ error: 'You cannot accept your own request' });
    }

    // Check if user is part of this rental
    if (rental.tenantId !== userId && rental.landlordId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if request is pending
    if (rental.endRequest.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request is no longer pending' });
    }

    // Check for pending payments before accepting
    const pendingPayments = await prisma.payment.findMany({
      where: {
        rentalId,
        status: { in: ['PENDING', 'VERIFICATION'] }
      }
    });

    if (pendingPayments.length > 0) {
      return res.status(400).json({ 
        error: `Cannot end rental. ${pendingPayments.length} payment(s) still pending. Please complete all payments before ending the rental.`
      });
    }

    // Update end request
    await prisma.endRequest.update({
      where: { id: rental.endRequest.id },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date()
      }
    });

    // End the rental
    await prisma.rentalRelationship.update({
      where: { id: rentalId },
      data: {
        status: 'ENDED',
        endDate: new Date()
      }
    });

    // Send notification to requester
    const requester = rental.endRequest.requestedById === rental.tenantId ? rental.tenant : rental.landlord;
    
    await NotificationService.createAndSendNotification(
      requester.id,
      'END_RENTAL_REQUEST',
      'Rental Ended',
      `The rental for ${rental.property.title} has been ended by mutual agreement.`,
      { type: 'rental_ended', propertyId: rental.propertyId }
    );

    res.json({ 
      message: 'Rental ended successfully',
      rental: { ...rental, status: 'ENDED' }
    });
  } catch (error: unknown) {
    console.error('Accept end rental error:', error);
    res.status(500).json({ error: 'Failed to accept end rental' });
  }
};

// Get end request status
export const getEndRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { rentalId } = req.params;
    const userId = req.userId!;

    const rental = await prisma.rentalRelationship.findUnique({
      where: { id: rentalId },
      include: {
        endRequest: {
          include: {
            requestedBy: {
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

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Check if user is part of this rental
    if (rental.tenantId !== userId && rental.landlordId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ 
      endRequest: rental.endRequest,
      rentalStatus: rental.status
    });
  } catch (error: unknown) {
    console.error('Get end request status error:', error);
    res.status(500).json({ error: 'Failed to get end request status' });
  }
};

// Get past rentals for a user
export const getPastRentals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rentals = await prisma.rentalRelationship.findMany({
      where: {
        ...(user.userType === 'TENANT' 
          ? { tenantId: userId }
          : { landlordId: userId }
        ),
        status: 'ENDED'
      },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { endDate: 'desc' }
    });

    res.json({ pastRentals: rentals });
  } catch (error: unknown) {
    console.error('Get past rentals error:', error);
    res.status(500).json({ error: 'Failed to get past rentals' });
  }
};

// Get past tenants for a property
export const getPastTenants = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property || property.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pastRentals = await prisma.rentalRelationship.findMany({
      where: {
        propertyId,
        status: 'ENDED'
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            dueDate: true,
            status: true
          }
        }
      },
      orderBy: { endDate: 'desc' }
    });

    res.json({ pastTenants: pastRentals });
  } catch (error: unknown) {
    console.error('Get past tenants error:', error);
    res.status(500).json({ error: 'Failed to get past tenants' });
  }
};

// Cancel end rental request (only by requester)
export const cancelEndRental = async (req: AuthRequest, res: Response) => {
  try {
    const { rentalId } = req.params;
    const userId = req.userId!;
    
    console.log('Cancel end rental request:', { rentalId, userId });

    // Get rental with end request
    const rental = await prisma.rentalRelationship.findUnique({
      where: { id: rentalId },
      include: {
        endRequest: true,
        tenant: true,
        landlord: true,
        property: true
      }
    });

    if (!rental || !rental.endRequest) {
      return res.status(404).json({ error: 'No end request found' });
    }

    // Check if user is the requester
    if (rental.endRequest.requestedById !== userId) {
      return res.status(403).json({ error: 'Only the requester can cancel the request' });
    }

    // Check if request is still pending
    if (rental.endRequest.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request is no longer pending' });
    }

    // Update end request status
    await prisma.endRequest.update({
      where: { id: rental.endRequest.id },
      data: {
        status: 'CANCELLED',
        respondedAt: new Date()
      }
    });

    // Revert rental status back to ACTIVE
    await prisma.rentalRelationship.update({
      where: { id: rentalId },
      data: { status: 'ACTIVE' }
    });

    // Send notification to other party
    const otherParty = userId === rental.tenantId ? rental.landlord : rental.tenant;
    const requesterName = userId === rental.tenantId ? rental.tenant.name : rental.landlord.name;
    
    await NotificationService.createAndSendNotification(
      otherParty.id,
      'END_RENTAL_REQUEST',
      'End Request Cancelled',
      `${requesterName} cancelled the end rental request for ${rental.property.title}.`,
      { type: 'end_rental_cancelled', propertyId: rental.propertyId }
    );

    res.json({ 
      message: 'End rental request cancelled',
      rental: { ...rental, status: 'ACTIVE' }
    });
  } catch (error: unknown) {
    console.error('Cancel end rental error:', error);
    res.status(500).json({ error: 'Failed to cancel end rental request' });
  }
};

// Auto-accept expired requests (called by cron job)
export const autoAcceptExpiredRequests = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Find all pending requests that should auto-accept
    const expiredRequests = await prisma.endRequest.findMany({
      where: {
        status: 'PENDING',
        autoAcceptAt: { lte: now }
      },
      include: {
        rental: {
          include: {
            tenant: true,
            landlord: true,
            property: true
          }
        }
      }
    });

    const results = [];

    for (const request of expiredRequests) {
      // Check for pending payments before auto-accepting
      const pendingPayments = await prisma.payment.findMany({
        where: {
          rentalId: request.rentalId,
          status: { in: ['PENDING', 'VERIFICATION'] }
        }
      });

      // Skip auto-accept if there are pending payments
      if (pendingPayments.length > 0) {
        console.log(`Skipping auto-accept for rental ${request.rentalId} - ${pendingPayments.length} pending payments`);
        continue;
      }

      // Update request status
      await prisma.endRequest.update({
        where: { id: request.id },
        data: {
          status: 'AUTO_ACCEPTED',
          respondedAt: now
        }
      });

      // End the rental
      await prisma.rentalRelationship.update({
        where: { id: request.rentalId },
        data: {
          status: 'ENDED',
          endDate: now
        }
      });

      // Send notifications
      const tenant = request.rental.tenant;
      const landlord = request.rental.landlord;
      const propertyTitle = request.rental.property.title;

      await NotificationService.createAndSendNotification(
        tenant.id,
        'END_RENTAL_AUTO_ACCEPT_WARNING',
        'Rental Ended',
        `The rental for ${propertyTitle} has been automatically ended after 7 days.`,
        { type: 'rental_auto_ended', propertyId: request.rental.propertyId }
      );

      await NotificationService.createAndSendNotification(
        landlord.id,
        'END_RENTAL_AUTO_ACCEPT_WARNING',
        'Rental Ended',
        `The rental for ${propertyTitle} has been automatically ended after 7 days.`,
        { type: 'rental_auto_ended', propertyId: request.rental.propertyId }
      );

      results.push({
        rentalId: request.rentalId,
        property: propertyTitle
      });
    }

    res.json({ 
      message: `Auto-accepted ${results.length} end requests`,
      results 
    });
  } catch (error: unknown) {
    console.error('Auto-accept expired requests error:', error);
    res.status(500).json({ error: 'Failed to auto-accept expired requests' });
  }
};


