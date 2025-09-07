import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Get all active pricing plans
export const getPricingPlans = async (req: Request, res: Response) => {
  try {
    const pricingPlans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { cost: 'asc' }
    });

    res.json({ pricingPlans });
  } catch (error) {
    console.error('Get pricing plans error:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
};

// Get specific pricing for an action
export const getActionPricing = async (req: Request, res: Response) => {
  try {
    const { actionType } = req.params;

    const pricing = await prisma.pricingPlan.findFirst({
      where: { 
        actionType: actionType,
        isActive: true 
      }
    });

    if (!pricing) {
      return res.status(404).json({ error: 'Pricing not found for this action' });
    }

    res.json({ pricing });
  } catch (error) {
    console.error('Get action pricing error:', error);
    res.status(500).json({ error: 'Failed to fetch action pricing' });
  }
};

// Premium action: Chat with owner
export const startChatWithOwner = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { propertyId } = req.params;

    console.log('🗨️  START CHAT WITH OWNER:', { userId, propertyId });

    // Check if user has already paid for this action within 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const existingAction = await prisma.premiumAction.findFirst({
      where: {
        userId,
        propertyId,
        actionType: 'CHAT_WITH_OWNER',
        performedAt: {
          gte: twentyFourHoursAgo
        }
      }
    });

    // Get property and owner info
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: true }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }

    if (existingAction) {
      // User has already paid for this action within 24 hours - no charge
      console.log('🎉 FREE ACCESS: Chat already unlocked within 24 hours');
      return res.json({
        message: 'Chat access (no charge - unlocked within 24 hours)',
        alreadyUnlocked: true,
        unlockedAt: existingAction.performedAt,
        ownerInfo: {
          id: property.owner.id,
          name: property.owner.name
        },
        propertyInfo: {
          id: property.id,
          title: property.title
        }
      });
    }

    // Get pricing for chat action
    const pricing = await prisma.pricingPlan.findFirst({
      where: { actionType: 'CHAT_WITH_OWNER', isActive: true }
    });

    if (!pricing) {
      return res.status(500).json({ error: 'Chat pricing not configured' });
    }

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.credits < pricing.cost) {
      return res.status(400).json({ 
        error: 'Insufficient credits',
        currentCredits: user.credits,
        required: pricing.cost
      });
    }

    const newBalance = user.credits - pricing.cost;

    // Use transaction to deduct credits and record the action
    const result = await prisma.$transaction(async (tx) => {
      // Update user credits
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: newBalance }
      });

      // Create credit transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId: userId,
          amount: -pricing.cost,
          balance: newBalance,
          type: 'USAGE',
          description: `Chat with owner unlocked - Property: ${property.title}`
        }
      });

      // Record the premium action
      const premiumAction = await tx.premiumAction.create({
        data: {
          userId: userId,
          propertyId: propertyId,
          actionType: 'CHAT_WITH_OWNER'
        }
      });
      
      return { updatedUser, transaction, premiumAction };
    });

    res.json({
      message: 'Chat with owner unlocked successfully',
      newBalance: result.updatedUser.credits,
      transaction: result.transaction,
      alreadyUnlocked: false,
      ownerInfo: {
        id: property.owner.id,
        name: property.owner.name
      },
      propertyInfo: {
        id: property.id,
        title: property.title
      }
    });

  } catch (error) {
    console.error('Start chat with owner error:', error);
    res.status(500).json({ error: 'Failed to start chat with owner' });
  }
};

// Premium action: View contact details
export const viewContactDetails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { propertyId } = req.params;

    console.log('📞 VIEW CONTACT DETAILS:', { userId, propertyId });

    // Check if user has already paid for this action within 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const existingAction = await prisma.premiumAction.findFirst({
      where: {
        userId,
        propertyId,
        actionType: 'VIEW_CONTACT_DETAILS',
        performedAt: {
          gte: twentyFourHoursAgo
        }
      }
    });

    // Get property and owner info
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: { select: { id: true, name: true, email: true, phone: true } } }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.ownerId === userId) {
      return res.status(400).json({ error: 'This is your own property' });
    }

    if (existingAction) {
      // User has already paid for this action within 24 hours - no charge
      console.log('🎉 FREE ACCESS: Contact details already unlocked within 24 hours');
      return res.json({
        message: 'Contact details access (no charge - unlocked within 24 hours)',
        alreadyUnlocked: true,
        unlockedAt: existingAction.performedAt,
        contactDetails: {
          ownerName: property.owner.name,
          email: property.owner.email,
          phone: property.owner.phone,
          propertyTitle: property.title
        }
      });
    }

    // Get pricing for contact details action
    const pricing = await prisma.pricingPlan.findFirst({
      where: { actionType: 'VIEW_CONTACT_DETAILS', isActive: true }
    });

    if (!pricing) {
      return res.status(500).json({ error: 'Contact details pricing not configured' });
    }

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.credits < pricing.cost) {
      return res.status(400).json({ 
        error: 'Insufficient credits',
        currentCredits: user.credits,
        required: pricing.cost
      });
    }

    const newBalance = user.credits - pricing.cost;

    // Use transaction to deduct credits and record the action
    const result = await prisma.$transaction(async (tx) => {
      // Update user credits
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: newBalance }
      });

      // Create credit transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId: userId,
          amount: -pricing.cost,
          balance: newBalance,
          type: 'USAGE',
          description: `Owner contact details unlocked - Property: ${property.title}`
        }
      });

      // Record the premium action
      const premiumAction = await tx.premiumAction.create({
        data: {
          userId: userId,
          propertyId: propertyId,
          actionType: 'VIEW_CONTACT_DETAILS'
        }
      });
      
      return { updatedUser, transaction, premiumAction };
    });

    res.json({
      message: 'Owner contact details unlocked successfully',
      newBalance: result.updatedUser.credits,
      transaction: result.transaction,
      alreadyUnlocked: false,
      contactDetails: {
        ownerName: property.owner.name,
        email: property.owner.email,
        phone: property.owner.phone,
        propertyTitle: property.title
      }
    });

  } catch (error) {
    console.error('View contact details error:', error);
    res.status(500).json({ error: 'Failed to view contact details' });
  }
};

// Check if user has access to chat with owner (within 24 hours)
export const checkChatStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Check if user has access to chat within 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const existingAction = await prisma.premiumAction.findFirst({
      where: {
        userId,
        propertyId,
        actionType: 'CHAT_WITH_OWNER',
        performedAt: {
          gte: twentyFourHoursAgo
        }
      }
    });

    res.json({
      hasAccess: !!existingAction,
      unlockedAt: existingAction?.performedAt || null
    });

  } catch (error) {
    console.error('Check chat status error:', error);
    res.status(500).json({ error: 'Failed to check chat status' });
  }
};

// Check if user has access to contact details (within 24 hours)
export const checkContactDetailsStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Check if user has access to contact details within 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const existingAction = await prisma.premiumAction.findFirst({
      where: {
        userId,
        propertyId,
        actionType: 'VIEW_CONTACT_DETAILS',
        performedAt: {
          gte: twentyFourHoursAgo
        }
      }
    });

    res.json({
      hasAccess: !!existingAction,
      unlockedAt: existingAction?.performedAt || null
    });

  } catch (error) {
    console.error('Check contact details status error:', error);
    res.status(500).json({ error: 'Failed to check contact details status' });
  }
};