import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const updatePushToken = async (req: AuthRequest, res: Response) => {
  try {
    const { pushToken } = req.body;
    const userId = req.userId!;

    await prisma.user.update({
      where: { id: userId },
      data: { pushToken }
    });

    res.json({ message: 'Push token updated successfully' });
  } catch (error) {
    console.error('Update push token error:', error);
    res.status(500).json({ error: 'Failed to update push token' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const viewPremiumPropertyDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    // Record property view (for analytics)
    await prisma.propertyView.upsert({
      where: {
        user_property_view: {
          userId,
          propertyId
        }
      },
      create: {
        userId,
        propertyId,
        viewedAt: new Date()
      },
      update: {
        viewedAt: new Date()
      }
    });

    res.json({ message: 'Property details accessed successfully' });
  } catch (error) {
    console.error('View premium property details error:', error);
    res.status(500).json({ error: 'Failed to access property details' });
  }
};

export const checkPropertyViewStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    const propertyView = await prisma.propertyView.findUnique({
      where: {
        user_property_view: {
          userId,
          propertyId
        }
      }
    });

    const hasViewed = !!propertyView;

    res.json({ 
      hasViewed,
      viewedAt: propertyView?.viewedAt || null
    });
  } catch (error) {
    console.error('Check property view status error:', error);
    res.status(500).json({ error: 'Failed to check property view status' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const userId = req.userId!;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (name.length > 20) {
      return res.status(400).json({ error: 'Name must be 20 characters or less' });
    }
    
    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        createdAt: true,
      }
    });

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId!;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};