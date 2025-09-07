import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserType } from '@prisma/client';

const prisma = new PrismaClient();

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, userType } = req.body;

    if (!email || !password || !name || !phone || !userType) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name, phone, and userType are required' });
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

    // Basic phone number validation (should start with + and contain only digits and +)
    const phoneRegex = /^\+\d{7,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format. Please include country code (e.g., +971501234567)' });
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
        phone,
        userType,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
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