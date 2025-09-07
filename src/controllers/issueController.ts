import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get issues for tenant (their reported issues)
export const getTenantIssues = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status } = req.query;
    
    const whereCondition: any = {
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
  } catch (error) {
    console.error('Get tenant issues error:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
};

// Get issues for landlord (issues from their properties)
export const getLandlordIssues = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status } = req.query;
    
    const whereCondition: any = {
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
  } catch (error) {
    console.error('Get landlord issues error:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
};

// Create new issue report (tenant only)
export const createIssueReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
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
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'Failed to create issue report' });
  }
};

// Update issue status (landlord only)
export const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
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
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({ error: 'Failed to update issue status' });
  }
};

// Get single issue details
export const getIssueDetails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
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
  } catch (error) {
    console.error('Get issue details error:', error);
    res.status(500).json({ error: 'Failed to fetch issue details' });
  }
};

// Get issues count for landlord (for notification dot)
export const getLandlordIssuesCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const count = await prisma.issueReport.count({
      where: {
        landlordId: userId,
        status: {
          in: ['REPORTED', 'IN_PROGRESS']
        }
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get issues count error:', error);
    res.status(500).json({ error: 'Failed to fetch issues count' });
  }
};

// Get issues count for tenant (for notification dot)
export const getTenantIssuesCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const count = await prisma.issueReport.count({
      where: {
        tenantId: userId,
        status: {
          not: 'CLOSED'
        }
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get tenant issues count error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant issues count' });
  }
};