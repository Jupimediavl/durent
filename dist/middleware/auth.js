"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        console.log('🔐 Auth middleware - token received:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        if (!token) {
            console.log('❌ Auth failed: No token provided');
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded, userId:', decoded.userId);
        const user = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.log('❌ Auth failed with error:', error?.message || error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map