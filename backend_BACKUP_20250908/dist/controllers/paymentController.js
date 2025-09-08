"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentConfig = exports.handleStripeWebhook = exports.confirmJoinPaymentAndExecute = exports.confirmPaymentAndExecute = exports.checkExistingInviteCode = exports.createJoinPaymentIntent = exports.createInvitePaymentIntent = exports.markPaymentNotReceived = exports.deletePayment = exports.getPaymentsForVerification = exports.verifyPayment = exports.generatePaymentForProperty = exports.getPaymentHistory = exports.getUpcomingPayments = exports.markPaymentAsPaid = exports.getPayments = exports.createPayment = void 0;
const client_1 = require("@prisma/client");
const stripeService_1 = require("../services/stripeService");
const prisma = new client_1.PrismaClient();
const createPayment = async (req, res) => {
    try {
        const { amount, description, rentalId } = req.body;
        const userId = req.userId;
        // Verify that the user is associated with this rental
        const rental = await prisma.rentalRelationship.findFirst({
            where: {
                id: rentalId,
                OR: [
                    { tenantId: userId },
                    { landlordId: userId }
                ]
            }
        });
        if (!rental) {
            return res.status(403).json({ error: 'Unauthorized to create payment for this rental' });
        }
        const payment = await prisma.payment.create({
            data: {
                amount,
                description,
                rentalId,
                dueDate: new Date(),
                status: 'PENDING'
            }
        });
        res.status(201).json({ payment });
    }
    catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
};
exports.createPayment = createPayment;
const getPayments = async (req, res) => {
    try {
        const userId = req.userId;
        // Get all rentals where user is either tenant or landlord
        const rentals = await prisma.rentalRelationship.findMany({
            where: {
                OR: [
                    { tenantId: userId },
                    { landlordId: userId }
                ]
            },
            include: {
                payments: {
                    orderBy: { dueDate: 'desc' }
                }
            }
        });
        const payments = rentals.flatMap(rental => rental.payments);
        res.json({ payments });
    }
    catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Failed to get payments' });
    }
};
exports.getPayments = getPayments;
const markPaymentAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                rental: true
            }
        });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        // Only landlord can mark payment as paid
        if (payment.rental.landlordId !== userId) {
            return res.status(403).json({ error: 'Only landlord can mark payment as paid' });
        }
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
                status: 'PAID',
                paidDate: new Date()
            }
        });
        res.json({ payment: updatedPayment });
    }
    catch (error) {
        console.error('Mark payment as paid error:', error);
        res.status(500).json({ error: 'Failed to mark payment as paid' });
    }
};
exports.markPaymentAsPaid = markPaymentAsPaid;
const getUpcomingPayments = async (req, res) => {
    try {
        const userId = req.userId;
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const upcomingPayments = await prisma.payment.findMany({
            where: {
                rental: {
                    OR: [
                        { tenantId: userId },
                        { landlordId: userId }
                    ]
                },
                status: 'PENDING',
                dueDate: {
                    gte: now,
                    lte: thirtyDaysFromNow
                }
            },
            include: {
                rental: {
                    include: {
                        property: true
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });
        res.json({ upcomingPayments });
    }
    catch (error) {
        console.error('Get upcoming payments error:', error);
        res.status(500).json({ error: 'Failed to get upcoming payments' });
    }
};
exports.getUpcomingPayments = getUpcomingPayments;
const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const paymentHistory = await prisma.payment.findMany({
            where: {
                rental: {
                    OR: [
                        { tenantId: userId },
                        { landlordId: userId }
                    ]
                },
                status: {
                    in: ['PAID', 'CANCELLED']
                }
            },
            include: {
                rental: {
                    include: {
                        property: true
                    }
                }
            },
            orderBy: { paidDate: 'desc' }
        });
        res.json({ paymentHistory });
    }
    catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Failed to get payment history' });
    }
};
exports.getPaymentHistory = getPaymentHistory;
const generatePaymentForProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const userId = req.userId;
        // Verify user owns the property
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                rentals: {
                    where: { status: 'ACTIVE' }
                }
            }
        });
        if (!property || property.ownerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to generate payment for this property' });
        }
        const activeRentals = property.rentals;
        if (activeRentals.length === 0) {
            return res.status(400).json({ error: 'No active rentals found for this property' });
        }
        const rental = activeRentals[0]; // Assuming one active rental per property
        const dueDay = property.paymentDueDay || 1;
        // Calculate next payment due date
        const now = new Date();
        const nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
        const payment = await prisma.payment.create({
            data: {
                amount: rental.monthlyRent,
                description: `Monthly rent for ${property.title}`,
                rentalId: rental.id,
                dueDate: nextPaymentDate,
                status: 'PENDING'
            }
        });
        res.json({ payment });
    }
    catch (error) {
        console.error('Generate payment error:', error);
        res.status(500).json({ error: 'Failed to generate payment' });
    }
};
exports.generatePaymentForProperty = generatePaymentForProperty;
const verifyPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { verify } = req.body;
        const userId = req.userId;
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                rental: true
            }
        });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        // Only landlord can verify payments
        if (payment.rental.landlordId !== userId) {
            return res.status(403).json({ error: 'Only landlord can verify payments' });
        }
        const newStatus = verify ? 'PAID' : 'PENDING';
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
                status: newStatus,
                paidDate: verify ? new Date() : null
            }
        });
        res.json({ payment: updatedPayment });
    }
    catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
};
exports.verifyPayment = verifyPayment;
const getPaymentsForVerification = async (req, res) => {
    try {
        const userId = req.userId;
        const paymentsForVerification = await prisma.payment.findMany({
            where: {
                rental: {
                    landlordId: userId
                },
                status: 'VERIFICATION'
            },
            include: {
                rental: {
                    include: {
                        property: true,
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ payments: paymentsForVerification });
    }
    catch (error) {
        console.error('Get payments for verification error:', error);
        res.status(500).json({ error: 'Failed to get payments for verification' });
    }
};
exports.getPaymentsForVerification = getPaymentsForVerification;
const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                rental: true
            }
        });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        // Only landlord can delete payments
        if (payment.rental.landlordId !== userId) {
            return res.status(403).json({ error: 'Only landlord can delete payments' });
        }
        await prisma.payment.delete({
            where: { id }
        });
        res.json({ message: 'Payment deleted successfully' });
    }
    catch (error) {
        console.error('Delete payment error:', error);
        res.status(500).json({ error: 'Failed to delete payment' });
    }
};
exports.deletePayment = deletePayment;
const markPaymentNotReceived = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                rental: true
            }
        });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        // Only landlord can mark payment as not received
        if (payment.rental.landlordId !== userId) {
            return res.status(403).json({ error: 'Only landlord can mark payment as not received' });
        }
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
                status: 'PENDING',
                paidDate: null
            }
        });
        res.json({ payment: updatedPayment });
    }
    catch (error) {
        console.error('Mark payment not received error:', error);
        res.status(500).json({ error: 'Failed to mark payment as not received' });
    }
};
exports.markPaymentNotReceived = markPaymentNotReceived;
// ===== STRIPE FUNCTIONS - TEMPORARILY DISABLED =====
const createInvitePaymentIntent = async (req, res) => {
    try {
        const { propertyId } = req.body;
        const userId = req.userId;
        if (!propertyId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Verify user owns the property
        const property = await prisma.property.findUnique({
            where: { id: propertyId }
        });
        if (!property || property.ownerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to generate invite code for this property' });
        }
        // Create Stripe payment intent for 9.90 AED
        const paymentIntent = await stripeService_1.stripeService.createPaymentIntent({
            amount: 990, // 9.90 AED in fils
            currency: 'aed',
            metadata: {
                userId,
                actionType: 'INVITE_CODE_GENERATION',
                propertyId,
            },
        });
        res.json({
            clientSecret: paymentIntent.clientSecret,
            paymentIntentId: paymentIntent.paymentIntentId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            publishableKey: stripeService_1.stripeService.getPublishableKey(),
        });
    }
    catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
};
exports.createInvitePaymentIntent = createInvitePaymentIntent;
const createJoinPaymentIntent = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const userId = req.userId;
        if (!inviteCode || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Check if invite code is valid
        const invite = await prisma.invite.findFirst({
            where: {
                code: inviteCode,
                usedAt: null, // Not used yet
                expiresAt: {
                    gt: new Date() // Not expired
                }
            },
            include: {
                property: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
        if (!invite) {
            return res.status(404).json({ error: 'Invalid or expired invite code' });
        }
        // Create Stripe payment intent for 9.90 AED
        const paymentIntent = await stripeService_1.stripeService.createPaymentIntent({
            amount: 990, // 9.90 AED in fils
            currency: 'aed',
            metadata: {
                userId,
                actionType: 'INVITE_CODE_USAGE',
                inviteCode,
                propertyId: invite.propertyId,
            },
        });
        res.json({
            clientSecret: paymentIntent.clientSecret,
            paymentIntentId: paymentIntent.paymentIntentId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            publishableKey: stripeService_1.stripeService.getPublishableKey(),
            property: {
                id: invite.property.id,
                title: invite.property.title,
                address: invite.property.address,
                monthlyRent: invite.property.monthlyRent,
                bedrooms: invite.property.bedrooms,
                bathrooms: invite.property.bathrooms,
                area: invite.property.area
            },
            landlord: invite.property.owner
        });
    }
    catch (error) {
        console.error('Error creating join payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
};
exports.createJoinPaymentIntent = createJoinPaymentIntent;
// Check for existing unused invite code for a property
const checkExistingInviteCode = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const userId = req.userId;
        // Verify user owns the property
        const property = await prisma.property.findUnique({
            where: { id: propertyId }
        });
        if (!property || property.ownerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to check invite codes for this property' });
        }
        // Look for existing unused invite code
        const existingInvite = await prisma.invite.findFirst({
            where: {
                propertyId,
                createdById: userId,
                usedAt: null, // Not used yet
                expiresAt: {
                    gt: new Date() // Not expired
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        if (existingInvite) {
            return res.json({
                hasExistingCode: true,
                inviteCode: existingInvite.code,
                createdAt: existingInvite.createdAt,
                expiresAt: existingInvite.expiresAt
            });
        }
        res.json({
            hasExistingCode: false
        });
    }
    catch (error) {
        console.error('Check existing invite code error:', error);
        res.status(500).json({ error: 'Failed to check existing invite code' });
    }
};
exports.checkExistingInviteCode = checkExistingInviteCode;
const confirmPaymentAndExecute = async (req, res) => {
    try {
        const { paymentIntentId, propertyId } = req.body;
        const userId = req.userId;
        if (!paymentIntentId || !propertyId) {
            return res.status(400).json({ error: 'Payment Intent ID and Property ID required' });
        }
        // Verify user owns the property
        const property = await prisma.property.findUnique({
            where: { id: propertyId }
        });
        if (!property || property.ownerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to generate invite code for this property' });
        }
        // Check for existing unused invite code first
        const existingInvite = await prisma.invite.findFirst({
            where: {
                propertyId,
                createdById: userId,
                usedAt: null,
                expiresAt: {
                    gt: new Date()
                }
            }
        });
        if (existingInvite) {
            return res.json({
                success: true,
                inviteCode: existingInvite.code,
                message: 'Using existing unused invite code',
                isExisting: true
            });
        }
        // For now, simulate successful payment and generate new invite code
        // TODO: Re-enable Stripe confirmation after database schema is fully synced
        // Generate new invite code
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        // Save invite code to database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days
        await prisma.invite.create({
            data: {
                code: inviteCode,
                propertyId,
                createdById: userId,
                expiresAt
            }
        });
        return res.json({
            success: true,
            inviteCode: inviteCode,
            message: 'Payment confirmed and new invite code generated',
            isExisting: false
        });
    }
    catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: 'Failed to confirm payment and execute action' });
    }
};
exports.confirmPaymentAndExecute = confirmPaymentAndExecute;
const confirmJoinPaymentAndExecute = async (req, res) => {
    try {
        const { paymentIntentId, inviteCode } = req.body;
        const userId = req.userId;
        if (!paymentIntentId || !inviteCode) {
            return res.status(400).json({ error: 'Payment Intent ID and Invite Code required' });
        }
        // Verify invite code is valid and unused
        const invite = await prisma.invite.findFirst({
            where: {
                code: inviteCode,
                usedAt: null,
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                property: true
            }
        });
        if (!invite) {
            return res.status(404).json({ error: 'Invalid or expired invite code' });
        }
        // For now, simulate successful payment and accept the invite
        // TODO: Re-enable Stripe confirmation after database schema is fully synced
        // Create rental relationship (similar to acceptInvite but with payment verification)
        const rental = await prisma.rentalRelationship.create({
            data: {
                propertyId: invite.propertyId,
                landlordId: invite.createdById,
                tenantId: userId,
                startDate: new Date(),
                monthlyRent: invite.property.monthlyRent,
                status: 'ACTIVE',
                inviteCode: null, // Clear the invite code since it's now used
            },
            include: {
                property: true,
                landlord: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        // Mark invite as used
        await prisma.invite.update({
            where: { id: invite.id },
            data: {
                usedAt: new Date(),
                usedById: userId
            }
        });
        return res.json({
            success: true,
            message: 'Payment confirmed and successfully joined property',
            rental: rental
        });
    }
    catch (error) {
        console.error('Confirm join payment error:', error);
        res.status(500).json({ error: 'Failed to confirm payment and join property' });
    }
};
exports.confirmJoinPaymentAndExecute = confirmJoinPaymentAndExecute;
const handleStripeWebhook = async (req, res) => {
    res.status(501).json({ error: 'Stripe integration temporarily disabled' });
};
exports.handleStripeWebhook = handleStripeWebhook;
const getPaymentConfig = async (req, res) => {
    try {
        res.json({
            publishableKey: stripeService_1.stripeService.getPublishableKey(),
            prices: {
                inviteCodeGeneration: 990, // 9.90 AED in fils
                inviteCodeUsage: 990, // 9.90 AED in fils
            },
            currency: 'aed',
        });
    }
    catch (error) {
        console.error('Error getting payment config:', error);
        res.status(500).json({ error: 'Failed to get payment configuration' });
    }
};
exports.getPaymentConfig = getPaymentConfig;
//# sourceMappingURL=paymentController.js.map