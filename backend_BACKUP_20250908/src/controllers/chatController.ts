import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { prisma } from '../lib/prisma';

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { content, receiverId, propertyId } = req.body;
    const senderId = req.userId!;

    // Verify sender has access to this property
    const user = await prisma.user.findUnique({
      where: { id: senderId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if sender is landlord or tenant of this property
    let hasAccess = false;
    
    if (user.userType === 'LANDLORD') {
      const property = await prisma.property.findFirst({
        where: { id: propertyId, ownerId: senderId }
      });
      hasAccess = !!property;
    } else {
      const rental = await prisma.rentalRelationship.findFirst({
        where: { 
          propertyId, 
          tenantId: senderId,
          status: 'ACTIVE'
        }
      });
      hasAccess = !!rental;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this property' });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        propertyId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        }
      }
    });

    // Send push notification to receiver
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    // Commented out: We don't want message notifications to appear in the notification bell
    // Messages already show in the MESSAGES card with unread count
    /*
    if (receiver && property) {
      await NotificationService.sendNewMessageNotification(
        receiverId,
        message.sender.name,
        content,
        property.title,
        propertyId
      );
    }
    */

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;
    
    // Get pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15; // Default 15 messages per page
    const skip = (page - 1) * limit;

    // Verify user has access to this property
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let hasAccess = false;
    
    if (user.userType === 'LANDLORD') {
      const property = await prisma.property.findFirst({
        where: { id: propertyId, ownerId: userId }
      });
      hasAccess = !!property;
    } else {
      const rental = await prisma.rentalRelationship.findFirst({
        where: { 
          propertyId, 
          tenantId: userId,
          status: 'ACTIVE'
        }
      });
      hasAccess = !!rental;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this property' });
    }

    // Get total count for pagination info
    const totalMessages = await prisma.message.count({
      where: {
        propertyId,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    // For page 1, get the most recent messages
    // For page 2+, get older messages working backwards
    const messages = await prisma.message.findMany({
      where: {
        propertyId,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Get newest first
      },
      skip: skip,
      take: limit
    });

    // For page 1 (most recent), reverse to chronological order for display
    // For page 2+ (older messages), keep desc order so they appear above existing messages
    const orderedMessages = page === 1 ? messages.reverse() : messages;

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        propertyId,
        receiverId: userId,
        read: false
      },
      data: {
        read: true
      }
    });

    // Pagination info
    const totalPages = Math.ceil(totalMessages / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.json({ 
      messages: orderedMessages,
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        hasNextPage,
        hasPreviousPage,
        messagesPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let conversations = [];

    if (user.userType === 'LANDLORD') {
      // Get all properties with active tenants
      const properties = await prisma.property.findMany({
        where: { ownerId: userId },
        include: {
          rentals: {
            where: { status: 'ACTIVE' },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          messages: {
            where: {
              OR: [
                { senderId: userId },
                { receiverId: userId }
              ]
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });

      // Format conversations
      for (const property of properties) {
        for (const rental of property.rentals) {
          const unreadCount = await prisma.message.count({
            where: {
              propertyId: property.id,
              senderId: rental.tenant.id,
              receiverId: userId,
              read: false
            }
          });

          conversations.push({
            propertyId: property.id,
            propertyTitle: property.title,
            otherUser: rental.tenant,
            lastMessage: property.messages[0] || null,
            unreadCount
          });
        }
      }
    } else {
      // Get all active rentals for tenant
      const rentals = await prisma.rentalRelationship.findMany({
        where: { 
          tenantId: userId,
          status: 'ACTIVE'
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
              },
              messages: {
                where: {
                  OR: [
                    { senderId: userId },
                    { receiverId: userId }
                  ]
                },
                orderBy: {
                  createdAt: 'desc'
                },
                take: 1
              }
            }
          }
        }
      });

      // Format conversations
      for (const rental of rentals) {
        const unreadCount = await prisma.message.count({
          where: {
            propertyId: rental.property.id,
            senderId: rental.property.owner.id,
            receiverId: userId,
            read: false
          }
        });

        conversations.push({
          propertyId: rental.property.id,
          propertyTitle: rental.property.title,
          otherUser: rental.property.owner,
          lastMessage: rental.property.messages[0] || null,
          unreadCount
        });
      }
    }

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    await prisma.message.updateMany({
      where: {
        propertyId,
        receiverId: userId,
        read: false
      },
      data: {
        read: true
      }
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};