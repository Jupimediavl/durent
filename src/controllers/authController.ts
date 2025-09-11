import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserType } from '@prisma/client';
import { emailService } from '../services/emailService';

const prisma = new PrismaClient();

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
};

export const register = async (req: Request, res: Response) => {
  try {
    let { email, password, name, userType } = req.body;
    
    // Normalize email to lowercase
    email = email?.toLowerCase();

    if (!email || !password || !name || !userType) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name, and userType are required' });
    }

    if (name.length > 20) {
      return res.status(400).json({ error: 'Name must be 20 characters or less' });
    }
    
    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }


    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        userType,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.name, user.id);

    res.status(201).json({
      message: 'Account created successfully! Please check your email to verify your account before logging in.',
      user,
      // Don't send token until email is verified
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
    let { email, password } = req.body;
    
    // Normalize email to lowercase
    email = email?.toLowerCase();

    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('Email not verified for user:', email);
      return res.status(403).json({ 
        error: 'Please verify your email first. Check your inbox for verification link.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    console.log('Login successful for:', email);
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error details:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const result = await emailService.verifyEmailToken(token);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Redirect to success page or return success
    res.json({
      message: 'Email verified successfully! You can now log in to your account.',
      success: true
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const sent = await emailService.resendVerificationEmail(email);

    if (!sent) {
      return res.status(400).json({ error: 'Unable to send verification email. Please check if the email is correct and not already verified.' });
    }

    res.json({
      message: 'Verification email sent successfully. Please check your inbox.',
      success: true
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};