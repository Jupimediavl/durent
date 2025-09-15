import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserType } from '@prisma/client';
import { emailService } from '../services/emailService';

const prisma = new PrismaClient();

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
};

const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

export const register = async (req: Request, res: Response) => {
  try {
    let { email, password, name, phone, userType } = req.body;
    
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
    
    // Password validation - match frontend requirements
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }
    
    if (!/\d/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one special character' });
    }

    // Optional phone number validation
    if (phone) {
      const phoneRegex = /^\+\d{7,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone number format. Please include country code (e.g., +971501234567)' });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        userType,
        verified: false,
        verificationCode,
        codeExpiry,
        codeAttempts: 0,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
        verified: true,
        createdAt: true,
      },
    });

    // Send verification email
    const emailSent = await emailService.sendVerificationCode(user.email, verificationCode, user.name);
    
    if (!emailSent) {
      console.error('Failed to send verification email to:', user.email);
      // Don't fail registration if email fails, but log it
    }

    console.log(`✅ User registered: ${user.email}, verification code: ${verificationCode}`);
    
    res.status(201).json({
      message: 'Account created successfully! Please check your email for verification code.',
      user,
      requiresVerification: true,
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
    if (!user.verified) {
      console.log('Email not verified for user:', email);
      return res.status(403).json({ 
        error: 'Please verify your email first. Check your inbox for verification code.',
        code: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true
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
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    if (!user.verificationCode || !user.codeExpiry) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    if (new Date() > user.codeExpiry) {
      return res.status(400).json({ 
        error: 'Verification code has expired. Please request a new one.',
        expired: true 
      });
    }

    if (user.codeAttempts >= 3) {
      return res.status(400).json({ 
        error: 'Too many failed attempts. Please request a new verification code.',
        tooManyAttempts: true 
      });
    }

    if (user.verificationCode !== code) {
      // Increment attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { codeAttempts: user.codeAttempts + 1 }
      });
      
      const attemptsLeft = 3 - (user.codeAttempts + 1);
      return res.status(400).json({ 
        error: `Invalid verification code. ${attemptsLeft} attempts remaining.`,
        attemptsLeft 
      });
    }

    // Code is correct - verify the user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationCode: null,
        codeExpiry: null,
        codeAttempts: 0,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
        verified: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id);

    console.log(`✅ Email verified for user: ${user.email}`);

    res.json({
      message: 'Email verified successfully!',
      user: updatedUser,
      token,
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

    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update user with new code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        codeExpiry,
        codeAttempts: 0, // Reset attempts
      },
    });

    // Send new verification email
    const emailSent = await emailService.sendVerificationCode(user.email, verificationCode, user.name);
    
    if (!emailSent) {
      console.error('Failed to send verification email to:', user.email);
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    console.log(`📧 Resent verification code to: ${user.email}, new code: ${verificationCode}`);

    res.json({
      message: 'New verification code sent to your email!',
      success: true
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};