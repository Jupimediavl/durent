"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.updateProfile = exports.checkPropertyViewStatus = exports.viewPremiumPropertyDetails = exports.getProfile = exports.updatePushToken = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const updatePushToken = async (req, res) => {
    try {
        const { pushToken } = req.body;
        const userId = req.userId;
        await prisma.user.update({
            where: { id: userId },
            data: { pushToken }
        });
        res.json({ message: 'Push token updated successfully' });
    }
    catch (error) {
        console.error('Update push token error:', error);
        res.status(500).json({ error: 'Failed to update push token' });
    }
};
exports.updatePushToken = updatePushToken;
const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                userType: true,
                createdAt: true,
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};
exports.getProfile = getProfile;
const viewPremiumPropertyDetails = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const userId = req.userId;
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
    }
    catch (error) {
        console.error('View premium property details error:', error);
        res.status(500).json({ error: 'Failed to access property details' });
    }
};
exports.viewPremiumPropertyDetails = viewPremiumPropertyDetails;
const checkPropertyViewStatus = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const userId = req.userId;
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
    }
    catch (error) {
        console.error('Check property view status error:', error);
        res.status(500).json({ error: 'Failed to check property view status' });
    }
};
exports.checkPropertyViewStatus = checkPropertyViewStatus;
const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const userId = req.userId;
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }
        if (name.length > 20) {
            return res.status(400).json({ error: 'Name must be 20 characters or less' });
        }
        if (name.length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }
        // Basic phone number validation
        const phoneRegex = /^\+\d{7,15}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'Invalid phone number format. Please include country code (e.g., +971501234567)' });
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name, phone },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                userType: true,
                createdAt: true,
            }
        });
        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;
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
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
};
exports.updatePassword = updatePassword;
//# sourceMappingURL=userController.js.map