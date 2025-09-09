import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get current subscription status
export const getSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        userType: true,
        credits: true,
        subscriptionType: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        trialEndDate: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if trial or subscription is active
    const now = new Date();
    let isActive = false;
    let daysRemaining = 0;

    if (user.userType === 'LANDLORD') {
      // Check trial first
      if (user.trialEndDate && user.trialEndDate > now && user.subscriptionType === 'FREE') {
        isActive = true;
        daysRemaining = Math.ceil((user.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      // Then check subscription
      else if (user.subscriptionEndDate && user.subscriptionEndDate > now) {
        isActive = true;
        daysRemaining = Math.ceil((user.subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    } else {
      // Tenants always active with credits system
      isActive = true;
    }

    res.json({
      userType: user.userType,
      credits: user.credits,
      subscriptionType: user.subscriptionType,
      isActive,
      daysRemaining,
      trialEndDate: user.trialEndDate,
      subscriptionEndDate: user.subscriptionEndDate,
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
};

// Get subscription plans
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 19.90,
      currency: 'AED',
      duration: 30,
      features: [
        'Unlimited Properties',
        'All Features',
        'Priority Support',
        'Analytics Dashboard'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: 149.90,
      currency: 'AED',
      duration: 365,
      savings: 89.00,
      features: [
        'Unlimited Properties',
        'All Features', 
        'Priority Support',
        'Analytics Dashboard',
        'Save 25%'
      ]
    }
  ];

  res.json({ plans });
};

// Subscribe to a plan (mock - needs payment integration)
export const subscribeToPlan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { planId, paymentMethod } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true }
    });

    if (user?.userType !== 'LANDLORD') {
      return res.status(403).json({ error: 'Only landlords can subscribe to plans' });
    }

    // Determine plan details
    let subscriptionType: 'MONTHLY' | 'YEARLY';
    let amount: number;
    let duration: number;

    if (planId === 'monthly') {
      subscriptionType = 'MONTHLY';
      amount = 19.90;
      duration = 30;
    } else if (planId === 'yearly') {
      subscriptionType = 'YEARLY';
      amount = 149.90;
      duration = 365;
    } else {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    // Update user subscription
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
      }
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        userId,
        type: subscriptionType,
        startDate,
        endDate,
        amount,
        status: 'active',
        paymentMethod: paymentMethod || 'card',
      }
    });

    res.json({
      message: 'Subscription activated successfully',
      subscription: {
        type: subscriptionType,
        startDate,
        endDate,
        amount,
      }
    });
  } catch (error) {
    console.error('Subscribe to plan error:', error);
    res.status(500).json({ error: 'Failed to process subscription' });
  }
};

// Cancel subscription
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Update user to free plan
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: 'FREE',
        // Keep end date so they can use until it expires
      }
    });

    // Update latest subscription status
    const latestSubscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' }
    });

    if (latestSubscription) {
      await prisma.subscription.update({
        where: { id: latestSubscription.id },
        data: { status: 'cancelled' }
      });
    }

    res.json({ message: 'Subscription cancelled. You can continue using premium features until the end of your billing period.' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Get credits balance (tenant)
export const getCreditsBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        userType: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent transactions
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      balance: user.credits,
      transactions,
    });
  } catch (error) {
    console.error('Get credits balance error:', error);
    res.status(500).json({ error: 'Failed to fetch credits balance' });
  }
};

// Use credits (internal function)
export const useCredits = async (userId: string, amount: number, description: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true }
  });

  if (!user || user.credits < amount) {
    throw new Error('Insufficient credits');
  }

  const newBalance = user.credits - amount;

  // Update user credits
  await prisma.user.update({
    where: { id: userId },
    data: { credits: newBalance }
  });

  // Create transaction record
  await prisma.creditTransaction.create({
    data: {
      userId,
      amount: -amount, // negative for usage
      balance: newBalance,
      type: 'USAGE',
      description,
    }
  });

  return newBalance;
};

// Add credits (for purchases - mock)
export const purchaseCredits = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { packageId, paymentMethod } = req.body;

    // Credit packages
    const packages: Record<string, { credits: number; price: number }> = {
      'small': { credits: 100, price: 10 },
      'medium': { credits: 500, price: 40 },
      'large': { credits: 1200, price: 80 },
    };

    const selectedPackage = packages[packageId];
    if (!selectedPackage) {
      return res.status(400).json({ error: 'Invalid package ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newBalance = user.credits + selectedPackage.credits;

    // Update user credits
    await prisma.user.update({
      where: { id: userId },
      data: { credits: newBalance }
    });

    // Create transaction record
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: selectedPackage.credits,
        balance: newBalance,
        type: 'PURCHASE',
        description: `Purchased ${selectedPackage.credits} credits`,
      }
    });

    res.json({
      message: 'Credits added successfully',
      newBalance,
      creditsAdded: selectedPackage.credits,
    });
  } catch (error) {
    console.error('Purchase credits error:', error);
    res.status(500).json({ error: 'Failed to purchase credits' });
  }
};