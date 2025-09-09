"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
const register = async (req, res) => {
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
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
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
    }
    catch (error) {
        console.error('Login error details:', error);
        console.error('Request body:', req.body);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
//# sourceMappingURL=authController.js.map