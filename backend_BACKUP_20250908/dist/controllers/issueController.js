"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantIssuesCount = exports.getLandlordIssuesCount = exports.getIssueDetails = exports.updateIssueStatus = exports.createIssueReport = exports.getLandlordIssues = exports.getTenantIssues = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get issues for tenant (their reported issues)
const getTenantIssues = async (req, res) => {
    try {
        const userId = req.userId;
        const { status } = req.query;
        const whereCondition = {
            tenantId: userId
        };
        if (status && status !== 'ALL') {
            whereCondition.status = status;
        }
        const issues = await prisma.issueReport.findMany({
            where: whereCondition,
            include: {
                property: {
                    select: {
                        title: true,
                        address: true
                    }
                },
                landlord: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                reportedAt: 'desc'
            }
        });
        res.json({ issues });
    }
    catch (error) {
        console.error('Get tenant issues error:', error);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
};
exports.getTenantIssues = getTenantIssues;
// Get issues for landlord (issues from their properties)
const getLandlordIssues = async (req, res) => {
    try {
        const userId = req.userId;
        const { status } = req.query;
        const whereCondition = {
            landlordId: userId
        };
        if (status && status !== 'ALL') {
            whereCondition.status = status;
        }
        const issues = await prisma.issueReport.findMany({
            where: whereCondition,
            include: {
                property: {
                    select: {
                        title: true,
                        address: true
                    }
                },
                tenant: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: [
                { status: 'asc' },
                { priority: 'desc' },
                { reportedAt: 'desc' }
            ]
        });
        res.json({ issues });
    }
    catch (error) {
        console.error('Get landlord issues error:', error);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
};
exports.getLandlordIssues = getLandlordIssues;
// Create new issue report (tenant only)
const createIssueReport = async (req, res) => {
    try {
        const userId = req.userId;
        const { title, description, category, priority, photos, propertyId } = req.body;
        // Verify tenant has access to this property
        const rental = await prisma.rentalRelationship.findFirst({
            where: {
                tenantId: userId,
                propertyId: propertyId,
                status: {
                    in: ['ACTIVE', 'ENDING']
                }
            },
            include: {
                property: {
                    select: {
                        ownerId: true
                    }
                }
            }
        });
        if (!rental) {
            return res.status(403).json({ error: 'You do not have access to report issues for this property' });
        }
        const issue = await prisma.issueReport.create({
            data: {
                title,
                description,
                category,
                priority: priority || 'MEDIUM',
                photos: photos || [],
                tenantId: userId,
                landlordId: rental.property.ownerId,
                propertyId,
                rentalId: rental.id
            },
            include: {
                property: {
                    select: {
                        title: true,
                        address: true
                    }
                },
                landlord: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.status(201).json({ issue });
    }
    catch (error) {
        console.error('Create issue error:', error);
        res.status(500).json({ error: 'Failed to create issue report' });
    }
};
exports.createIssueReport = createIssueReport;
// Update issue status (landlord only)
const updateIssueStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const { issueId } = req.params;
        const { status } = req.body;
        // Verify landlord owns this property
        const issue = await prisma.issueReport.findFirst({
            where: {
                id: issueId,
                landlordId: userId
            }
        });
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found or unauthorized' });
        }
        const updatedIssue = await prisma.issueReport.update({
            where: { id: issueId },
            data: {
                status,
                resolvedAt: status === 'RESOLVED' || status === 'CLOSED' ? new Date() : null
            },
            include: {
                property: {
                    select: {
                        title: true,
                        address: true
                    }
                },
                tenant: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json({ issue: updatedIssue });
    }
    catch (error) {
        console.error('Update issue status error:', error);
        res.status(500).json({ error: 'Failed to update issue status' });
    }
};
exports.updateIssueStatus = updateIssueStatus;
// Get single issue details
const getIssueDetails = async (req, res) => {
    try {
        const userId = req.userId;
        const { issueId } = req.params;
        const issue = await prisma.issueReport.findFirst({
            where: {
                id: issueId,
                OR: [
                    { tenantId: userId },
                    { landlordId: userId }
                ]
            },
            include: {
                property: {
                    select: {
                        title: true,
                        address: true
                    }
                },
                tenant: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                landlord: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found or unauthorized' });
        }
        res.json({ issue });
    }
    catch (error) {
        console.error('Get issue details error:', error);
        res.status(500).json({ error: 'Failed to fetch issue details' });
    }
};
exports.getIssueDetails = getIssueDetails;
// Get issues count for landlord (for notification dot)
const getLandlordIssuesCount = async (req, res) => {
    try {
        const userId = req.userId;
        const count = await prisma.issueReport.count({
            where: {
                landlordId: userId,
                status: {
                    in: ['REPORTED', 'IN_PROGRESS']
                }
            }
        });
        res.json({ count });
    }
    catch (error) {
        console.error('Get issues count error:', error);
        res.status(500).json({ error: 'Failed to fetch issues count' });
    }
};
exports.getLandlordIssuesCount = getLandlordIssuesCount;
// Get issues count for tenant (for notification dot)
const getTenantIssuesCount = async (req, res) => {
    try {
        const userId = req.userId;
        const count = await prisma.issueReport.count({
            where: {
                tenantId: userId,
                status: {
                    not: 'CLOSED'
                }
            }
        });
        res.json({ count });
    }
    catch (error) {
        console.error('Get tenant issues count error:', error);
        res.status(500).json({ error: 'Failed to fetch tenant issues count' });
    }
};
exports.getTenantIssuesCount = getTenantIssuesCount;
//# sourceMappingURL=issueController.js.map