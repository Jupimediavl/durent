import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Get all zones user is subscribed to
export const getUserNotificationZones = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const zones = await prisma.$queryRaw<Array<{zone_name: string}>>`
      SELECT zone_name 
      FROM zone_notification_preferences 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    res.json({ 
      zones: zones.map(z => z.zone_name),
      count: zones.length 
    });

  } catch (error) {
    console.error('Error getting user notification zones:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add or remove zone notification preference
export const toggleZoneNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { zoneName, isEnabled } = req.body;
    if (!zoneName) {
      return res.status(400).json({ error: 'Zone name is required' });
    }

    if (isEnabled) {
      // Adding notification
      try {
        await prisma.$queryRaw`
          INSERT INTO zone_notification_preferences (user_id, zone_name)
          VALUES (${userId}, ${zoneName})
          ON CONFLICT (user_id, zone_name) DO NOTHING
        `;
        
        res.json({ 
          success: true, 
          message: `Notifications enabled for ${zoneName}`,
          isEnabled: true
        });
      } catch (error: any) {
        if (error.message?.includes('User can track maximum 3 zones')) {
          return res.status(400).json({ 
            error: 'You can track notifications for maximum 3 zones. Remove one zone first to add another.' 
          });
        }
        throw error;
      }
    } else {
      // Removing notification
      await prisma.$queryRaw`
        DELETE FROM zone_notification_preferences 
        WHERE user_id = ${userId} AND zone_name = ${zoneName}
      `;
      
      res.json({ 
        success: true, 
        message: `Notifications disabled for ${zoneName}`,
        isEnabled: false
      });
    }

  } catch (error) {
    console.error('Error toggling zone notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if user has notifications enabled for a specific zone
export const checkZoneNotificationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { zoneName } = req.params;
    if (!zoneName) {
      return res.status(400).json({ error: 'Zone name is required' });
    }

    const result = await prisma.$queryRaw<Array<{count: number}>>`
      SELECT COUNT(*) as count 
      FROM zone_notification_preferences 
      WHERE user_id = ${userId} AND zone_name = ${zoneName}
    `;

    const isEnabled = Number(result[0]?.count) > 0;

    res.json({ 
      isEnabled,
      zoneName,
      exists: isEnabled
    });

  } catch (error) {
    console.error('Error checking zone notification status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's notification settings
export const getUserNotificationSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const settings = await prisma.$queryRaw<Array<{zone_notifications_enabled: boolean}>>`
      SELECT zone_notifications_enabled 
      FROM user_notification_settings 
      WHERE user_id = ${userId}
    `;

    // Default to enabled if no settings found
    const zoneNotificationsEnabled = settings.length > 0 ? settings[0].zone_notifications_enabled : true;

    res.json({ 
      zoneNotificationsEnabled
    });

  } catch (error) {
    console.error('Error getting user notification settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user's notification settings
export const updateUserNotificationSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { zoneNotificationsEnabled } = req.body;
    if (typeof zoneNotificationsEnabled !== 'boolean') {
      return res.status(400).json({ error: 'zoneNotificationsEnabled must be a boolean' });
    }

    await prisma.$queryRaw`
      INSERT INTO user_notification_settings (user_id, zone_notifications_enabled, updated_at)
      VALUES (${userId}, ${zoneNotificationsEnabled}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET 
        zone_notifications_enabled = ${zoneNotificationsEnabled},
        updated_at = NOW()
    `;

    res.json({ 
      success: true,
      message: `Zone notifications ${zoneNotificationsEnabled ? 'enabled' : 'disabled'}`,
      zoneNotificationsEnabled
    });

  } catch (error) {
    console.error('Error updating user notification settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};