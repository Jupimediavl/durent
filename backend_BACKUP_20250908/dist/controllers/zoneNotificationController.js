"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteZoneNotificationPreference = exports.getZoneNotificationPreference = exports.getZoneNotificationPreferences = exports.setZoneNotificationPreference = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// TODO: Temporarily disabled until database migration completes
const TEMP_DISABLED = true;
// Set zone notification preference
const setZoneNotificationPreference = async (req, res) => {
    if (TEMP_DISABLED) {
        return res.status(503).json({
            error: 'Zone notifications temporarily disabled during database migration'
        });
    }
    try {
        const { zoneName, isEnabled } = req.body;
        const userId = req.userId;
        if (!zoneName || typeof isEnabled !== 'boolean') {
            return res.status(400).json({
                error: 'Zone name and isEnabled flag are required'
            });
        }
        console.log('Setting zone notification preference:', { userId, zoneName, isEnabled });
        // TODO: Re-enable after DB migration
        /*
        // Upsert the notification preference
        const preference = await prisma.zoneNotificationPreference.upsert({
          where: {
            userId_zoneName: {
              userId,
              zoneName
            }
          },
          update: {
            isEnabled,
            updatedAt: new Date()
          },
          create: {
            userId,
            zoneName,
            isEnabled
          }
        });
        */
        res.json({
            success: true,
            // preference,
            message: isEnabled
                ? `Notifications enabled for ${zoneName}`
                : `Notifications disabled for ${zoneName}`
        });
    }
    catch (error) {
        console.error('Set zone notification preference error:', error);
        res.status(500).json({
            error: 'Failed to set notification preference',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.setZoneNotificationPreference = setZoneNotificationPreference;
// Get zone notification preferences for user
const getZoneNotificationPreferences = async (req, res) => {
    if (TEMP_DISABLED) {
        return res.json({ preferences: [] });
    }
    try {
        const userId = req.userId;
        const preferences = await prisma.zoneNotificationPreference.findMany({
            where: { userId },
            select: {
                zoneName: true,
                isEnabled: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json({ preferences });
    }
    catch (error) {
        console.error('Get zone notification preferences error:', error);
        res.status(500).json({
            error: 'Failed to get notification preferences',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.getZoneNotificationPreferences = getZoneNotificationPreferences;
// Get specific zone notification preference
const getZoneNotificationPreference = async (req, res) => {
    if (TEMP_DISABLED) {
        return res.json({ isEnabled: false, exists: false });
    }
    try {
        const { zoneName } = req.params;
        const userId = req.userId;
        if (!zoneName) {
            return res.status(400).json({ error: 'Zone name is required' });
        }
        const preference = await prisma.zoneNotificationPreference.findUnique({
            where: {
                userId_zoneName: {
                    userId,
                    zoneName
                }
            }
        });
        res.json({
            isEnabled: preference?.isEnabled || false,
            exists: !!preference
        });
    }
    catch (error) {
        console.error('Get zone notification preference error:', error);
        res.status(500).json({
            error: 'Failed to get zone notification preference',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.getZoneNotificationPreference = getZoneNotificationPreference;
// Delete zone notification preference (stop notifications)
const deleteZoneNotificationPreference = async (req, res) => {
    if (TEMP_DISABLED) {
        return res.json({ success: true, message: 'Notifications disabled (temp)' });
    }
    try {
        const { zoneName } = req.params;
        const userId = req.userId;
        await prisma.zoneNotificationPreference.delete({
            where: {
                userId_zoneName: {
                    userId,
                    zoneName
                }
            }
        });
        res.json({
            success: true,
            message: `Notifications disabled for ${zoneName}`
        });
    }
    catch (error) {
        console.error('Delete zone notification preference error:', error);
        res.status(500).json({
            error: 'Failed to delete notification preference',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.deleteZoneNotificationPreference = deleteZoneNotificationPreference;
//# sourceMappingURL=zoneNotificationController.js.map