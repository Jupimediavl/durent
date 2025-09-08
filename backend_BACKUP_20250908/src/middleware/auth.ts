import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('🔐 Auth middleware - token received:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    if (!token) {
      console.log('❌ Auth failed: No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    console.log('✅ Token decoded, userId:', decoded.userId);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, userType: true },
    });
    console.log('👤 User lookup result:', user ? `${user.name} (${user.userType})` : 'NOT FOUND');

    if (!user) {
      console.log('❌ Auth failed: User not found');
      return res.status(401).json({ error: 'User not found' });
    }

    req.userId = user.id;
    req.user = user;
    console.log('✅ Auth successful for:', user.name);
    next();
  } catch (error: any) {
    console.log('❌ Auth failed with error:', error?.message || error);
    res.status(401).json({ error: 'Invalid token' });
  }
};