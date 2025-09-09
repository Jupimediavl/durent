"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zoneDigestService = exports.ZoneDigestService = void 0;
const client_1 = require("@prisma/client");
const notificationService_1 = require("./notificationService");
const prisma = new client_1.PrismaClient();
class ZoneDigestService {
    // Send daily digest notifications at 20:00 Dubai time
    async sendDailyDigest() {
        try {
            console.log('🕐 Starting daily zone notifications digest process...');
            // 1. Get all pending notifications from today
            const pendingNotifications = await this.getPendingNotifications();
            console.log(`📋 Found ${pendingNotifications.length} pending notifications`);
            if (pendingNotifications.length === 0) {
                console.log('✅ No pending notifications to process');
                return;
            }
            // 2. Get users with zone preferences
            const usersWithZonePrefs = await this.getUsersWithZonePreferences();
            console.log(`👥 Found ${usersWithZonePrefs.length} users with zone preferences`);
            if (usersWithZonePrefs.length === 0) {
                console.log('✅ No users with zone preferences found');
                await this.clearProcessedNotifications();
                return;
            }
            // 3. Group notifications by zone
            const notificationsByZone = this.groupNotificationsByZone(pendingNotifications);
            // 4. Process notifications for each user
            let totalNotificationsSent = 0;
            for (const user of usersWithZonePrefs) {
                const sentCount = await this.sendNotificationsForUser(user, notificationsByZone);
                totalNotificationsSent += sentCount;
            }
            // 5. Clear processed notifications
            await this.clearProcessedNotifications();
            console.log(`✅ Daily digest completed! Sent ${totalNotificationsSent} notifications to ${usersWithZonePrefs.length} users`);
        }
        catch (error) {
            console.error('❌ Error in daily digest process:', error);
            throw error;
        }
    }
    async getPendingNotifications() {
        const notifications = await prisma.$queryRaw `
      SELECT id, property_id, zone_name, created_at 
      FROM pending_zone_notifications 
      ORDER BY created_at DESC
    `;
        return notifications;
    }
    async getUsersWithZonePreferences() {
        const users = await prisma.$queryRaw `
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u."pushToken" as user_push_token,
        STRING_AGG(znp.zone_name, ',') as zones
      FROM users u
      INNER JOIN zone_notification_preferences znp ON u.id = znp.user_id
      INNER JOIN user_notification_settings uns ON u.id = uns.user_id
      WHERE uns.zone_notifications_enabled = true
        AND u."pushToken" IS NOT NULL
        AND u."pushToken" != ''
      GROUP BY u.id, u.name, u."pushToken"
    `;
        return users.map(user => ({
            userId: user.user_id,
            userName: user.user_name,
            userPushToken: user.user_push_token,
            zones: user.zones.split(',')
        }));
    }
    groupNotificationsByZone(notifications) {
        const grouped = {};
        for (const notification of notifications) {
            if (!grouped[notification.zone_name]) {
                grouped[notification.zone_name] = [];
            }
            grouped[notification.zone_name].push(notification.property_id);
        }
        return grouped;
    }
    async sendNotificationsForUser(user, notificationsByZone) {
        let sentCount = 0;
        for (const zone of user.zones) {
            const propertyIds = notificationsByZone[zone];
            if (!propertyIds || propertyIds.length === 0) {
                continue; // No new properties in this zone
            }
            // Get property details for available properties only
            const availableProperties = await this.getAvailableProperties(propertyIds);
            if (availableProperties.length === 0) {
                continue; // All properties in this zone became unavailable
            }
            // Send notification
            await this.sendZoneNotification(user, zone, availableProperties);
            sentCount++;
        }
        return sentCount;
    }
    async getAvailableProperties(propertyIds) {
        if (propertyIds.length === 0)
            return [];
        const placeholders = propertyIds.map((_, i) => `$${i + 1}`).join(',');
        const properties = await prisma.$queryRaw `
      SELECT id, title, address, "monthlyRent" as price, "propertyType" as type, bedrooms, bathrooms, photos 
      FROM properties 
      WHERE id = ANY(${propertyIds})
        AND ("availabilityStatus" = 'AVAILABLE' OR "isPublic" = true)
      ORDER BY "createdAt" DESC
    `;
        return properties;
    }
    async sendZoneNotification(user, zoneName, properties) {
        const propertyCount = properties.length;
        const title = propertyCount === 1
            ? `New Property in ${zoneName}`
            : `${propertyCount} New Properties in ${zoneName}`;
        const body = propertyCount === 1
            ? `${properties[0].title} - AED ${properties[0].price}/month`
            : `${propertyCount} new properties now available in ${zoneName}`;
        try {
            await notificationService_1.NotificationService.createAndSendNotification(user.userId, 'NEW_MESSAGE', title, body, {
                type: 'zone_digest',
                zoneName,
                propertyCount: propertyCount.toString(),
                properties: properties.map(p => ({ id: p.id, title: p.title, price: p.price }))
            });
            console.log(`📱 Sent notification to ${user.userName} for ${zoneName}: ${propertyCount} properties`);
        }
        catch (error) {
            console.error(`❌ Failed to send notification to ${user.userName}:`, error);
        }
    }
    async clearProcessedNotifications() {
        await prisma.$queryRaw `
      DELETE FROM pending_zone_notifications
    `;
        console.log('🧹 Cleared all processed notifications');
    }
    // Method to add property to pending notifications when it becomes available
    async addPropertyToPendingNotifications(propertyId, zoneName) {
        try {
            await prisma.$queryRaw `
        INSERT INTO pending_zone_notifications (property_id, zone_name)
        VALUES (${propertyId}, ${zoneName})
        ON CONFLICT DO NOTHING
      `;
            console.log(`📝 Added property ${propertyId} to pending notifications for zone ${zoneName}`);
        }
        catch (error) {
            console.error(`❌ Failed to add property to pending notifications:`, error);
        }
    }
}
exports.ZoneDigestService = ZoneDigestService;
exports.zoneDigestService = new ZoneDigestService();
//# sourceMappingURL=zoneDigestService.js.map