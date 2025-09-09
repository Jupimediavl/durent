"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireOldRequests = exports.getChangeRequestHistory = exports.respondToChangeRequest = exports.getPendingChangeRequests = exports.proposePaymentDateChange = void 0;
const client_1 = require("@prisma/client");
const notificationService_1 = require("../services/notificationService");
const prisma = new client_1.PrismaClient();
// Propose a payment date change (landlord only)
const proposePaymentDateChange = async (req, res) => {
    try {
        const { propertyId, proposedDate, reason } = req.body;
        const userId = req.userId;
        // Validate proposed date
        if (!proposedDate || proposedDate < 1 || proposedDate > 31) {
            return res.status(400).json({ error: 'Invalid payment due date. Must be between 1 and 31.' });
        }
        // Check if user is landlord of this property
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                rentals: {
                    where: { status: 'ACTIVE' },
                    include: { tenant: true }
                }
            }
        });
        if (!property || property.ownerId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!property.paymentDueDay) {
            return res.status(400).json({ error: 'Payment due date not yet set. Please set initial date first.' });
        }
        if (property.paymentDueDay === proposedDate) {
            return res.status(400).json({ error: 'Proposed date is the same as current date' });
        }
        // Check if there's no active rental
        if (!property.rentals || property.rentals.length === 0) {
            // No tenant, can change directly
            await prisma.property.update({
                where: { id: propertyId },
                data: { paymentDueDay: proposedDate }
            });
            return res.json({
                message: 'Payment date updated successfully (no active tenant)',
                paymentDueDay: proposedDate
            });
        }
        // Check for pending requests
        const pendingRequest = await prisma.paymentDateChangeRequest.findFirst({
            where: {
                propertyId,
                status: 'PENDING'
            }
        });
        if (pendingRequest) {
            return res.status(400).json({ error: 'A change request is already pending' });
        }
        // Check for recent requests (no more than once per month)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentRequest = await prisma.paymentDateChangeRequest.findFirst({
            where: {
                propertyId,
                createdAt: { gte: thirtyDaysAgo }
            }
        });
        if (recentRequest) {
            return res.status(400).json({
                error: 'You can only request a payment date change once per month'
            });
        }
        // Create the change request
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1); // First day of next month
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to respond
        const changeRequest = await prisma.paymentDateChangeRequest.create({
            data: {
                propertyId,
                currentDate: property.paymentDueDay,
                proposedDate,
                proposedById: userId,
                reason,
                effectiveFrom: nextMonth,
                expiresAt,
                status: 'PENDING'
            },
            include: {
                property: true,
                proposedBy: true
            }
        });
        // Send notification to tenant
        const tenant = property.rentals[0].tenant;
        await notificationService_1.NotificationService.sendPaymentDateChangeRequestNotification(tenant.id, changeRequest.proposedBy.name, property.title, property.paymentDueDay, proposedDate, propertyId, changeRequest.id);
        res.status(201).json({ changeRequest });
    }
    catch (error) {
        console.error('Propose payment date change error:', error);
        res.status(500).json({ error: 'Failed to propose payment date change' });
    }
};
exports.proposePaymentDateChange = proposePaymentDateChange;
// Get pending change requests (tenant)
const getPendingChangeRequests = async (req, res) => {
    try {
        const userId = req.userId;
        // Get all properties where user is tenant
        const rentals = await prisma.rentalRelationship.findMany({
            where: {
                tenantId: userId,
                status: 'ACTIVE'
            },
            include: {
                property: {
                    include: {
                        changeRequests: {
                            where: {
                                status: 'PENDING',
                                expiresAt: { gt: new Date() }
                            },
                            include: {
                                proposedBy: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const pendingRequests = rentals.flatMap(rental => rental.property.changeRequests.map(request => ({
            ...request,
            propertyTitle: rental.property.title
        })));
        res.json({ requests: pendingRequests });
    }
    catch (error) {
        console.error('Get pending change requests error:', error);
        res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
};
exports.getPendingChangeRequests = getPendingChangeRequests;
// Respond to change request (tenant)
const respondToChangeRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { approved, responseNote } = req.body;
        const userId = req.userId;
        const changeRequest = await prisma.paymentDateChangeRequest.findUnique({
            where: { id: requestId },
            include: {
                property: {
                    include: {
                        rentals: {
                            where: {
                                status: 'ACTIVE',
                                tenantId: userId
                            }
                        },
                        owner: true
                    }
                }
            }
        });
        if (!changeRequest) {
            return res.status(404).json({ error: 'Change request not found' });
        }
        // Verify user is tenant of this property
        if (!changeRequest.property.rentals || changeRequest.property.rentals.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (changeRequest.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request is no longer pending' });
        }
        if (new Date() > changeRequest.expiresAt) {
            // Mark as expired
            await prisma.paymentDateChangeRequest.update({
                where: { id: requestId },
                data: { status: 'EXPIRED' }
            });
            return res.status(400).json({ error: 'Request has expired' });
        }
        const newStatus = approved ? 'APPROVED' : 'REJECTED';
        // Update the request
        const updatedRequest = await prisma.paymentDateChangeRequest.update({
            where: { id: requestId },
            data: {
                status: newStatus,
                respondedById: userId,
                responseDate: new Date(),
                responseNote
            }
        });
        // If approved, update the property payment date (will take effect from effectiveFrom date)
        if (approved) {
            await prisma.property.update({
                where: { id: changeRequest.propertyId },
                data: { paymentDueDay: changeRequest.proposedDate }
            });
        }
        // Send notification to landlord
        const landlord = changeRequest.property.owner;
        await notificationService_1.NotificationService.sendPaymentDateChangeResponseNotification(landlord.id, approved, changeRequest.property.title, changeRequest.proposedDate, changeRequest.propertyId);
        res.json({
            message: approved ? 'Change request approved' : 'Change request rejected',
            request: updatedRequest
        });
    }
    catch (error) {
        console.error('Respond to change request error:', error);
        res.status(500).json({ error: 'Failed to respond to change request' });
    }
};
exports.respondToChangeRequest = respondToChangeRequest;
// Get change request history for a property
const getChangeRequestHistory = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const userId = req.userId;
        // Verify user has access to this property
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                rentals: {
                    where: {
                        status: 'ACTIVE',
                        OR: [
                            { tenantId: userId },
                            { landlordId: userId }
                        ]
                    }
                }
            }
        });
        if (!property || property.ownerId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const history = await prisma.paymentDateChangeRequest.findMany({
            where: { propertyId },
            include: {
                proposedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                respondedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ history });
    }
    catch (error) {
        console.error('Get change request history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
exports.getChangeRequestHistory = getChangeRequestHistory;
// Check and expire old requests (can be called by a cron job)
const expireOldRequests = async (req, res) => {
    try {
        const expiredRequests = await prisma.paymentDateChangeRequest.updateMany({
            where: {
                status: 'PENDING',
                expiresAt: { lt: new Date() }
            },
            data: {
                status: 'EXPIRED'
            }
        });
        res.json({
            message: `Expired ${expiredRequests.count} pending requests`
        });
    }
    catch (error) {
        console.error('Expire old requests error:', error);
        res.status(500).json({ error: 'Failed to expire old requests' });
    }
};
exports.expireOldRequests = expireOldRequests;
//# sourceMappingURL=paymentDateChangeController.js.map