import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const updatePushToken = async (req: AuthRequest, res: Response) => {
  try {
    const { pushToken } = req.body;
    const userId = req.userId!;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { pushToken },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        pushToken: true
      }
    });

    res.json({ 
      message: 'Push token updated successfully',
      user 
    });
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
        name: true,
        email: true,
        phone: true,
        userType: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};