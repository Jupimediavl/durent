const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

// Use Railway database URL directly
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:VVyoKgUbrJqxTTAtWDsZxrHKsDusnaQF@trolley.proxy.rlwy.net:12664/railway"
    }
  }
});

class TestZoneDigestService {
  async sendDailyDigest() {
    try {
      console.log('🕐 Starting daily zone notifications digest process...');

      // 1. Get all pending notifications
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
      console.log('📊 Notifications by zone:', notificationsByZone);

      // 4. Process notifications for each user
      let totalNotificationsSent = 0;
      for (const user of usersWithZonePrefs) {
        console.log(`👤 Processing user: ${user.userName} (zones: ${user.zones.join(', ')})`);
        const sentCount = await this.sendNotificationsForUser(user, notificationsByZone);
        totalNotificationsSent += sentCount;
      }

      // 5. Clear processed notifications
      await this.clearProcessedNotifications();

      console.log(`✅ Daily digest completed! Sent ${totalNotificationsSent} notifications to ${usersWithZonePrefs.length} users`);

    } catch (error) {
      console.error('❌ Error in daily digest process:', error);
      throw error;
    }
  }

  async getPendingNotifications() {
    const notifications = await prisma.$queryRaw`
      SELECT id, property_id, zone_name, created_at 
      FROM pending_zone_notifications 
      ORDER BY created_at DESC
    `;
    return notifications;
  }

  async getUsersWithZonePreferences() {
    const users = await prisma.$queryRaw`
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
        console.log(`  ⏭️  No new properties in zone: ${zone}`);
        continue;
      }

      // Get property details
      const availableProperties = await this.getAvailableProperties(propertyIds);
      if (availableProperties.length === 0) {
        console.log(`  ⏭️  All properties in zone ${zone} became unavailable`);
        continue;
      }

      console.log(`  📱 Would send notification for ${zone}: ${availableProperties.length} properties`);
      console.log(`     Properties: ${availableProperties.map(p => p.title).join(', ')}`);
      console.log(`     Push token: ${user.userPushToken ? 'PRESENT' : 'MISSING'}`);
      
      // For testing, just log instead of sending actual notification
      sentCount++;
    }

    return sentCount;
  }

  async getAvailableProperties(propertyIds) {
    if (propertyIds.length === 0) return [];

    const properties = await prisma.$queryRaw`
      SELECT id, title, address, "monthlyRent" as price, "propertyType" as type, bedrooms, bathrooms, photos 
      FROM properties 
      WHERE id = ANY(${propertyIds})
        AND ("availabilityStatus" = 'AVAILABLE' OR "isPublic" = true)
      ORDER BY "createdAt" DESC
    `;

    return properties;
  }

  async clearProcessedNotifications() {
    const result = await prisma.$queryRaw`
      DELETE FROM pending_zone_notifications
    `;
    console.log('🧹 Cleared all processed notifications');
    return result;
  }
}

async function testRailwayTrigger() {
  console.log('🧪 Testing Railway database zone digest...\n');
  
  const testService = new TestZoneDigestService();
  await testService.sendDailyDigest();
  
  console.log('\n✅ Test completed!');
  await prisma.$disconnect();
}

testRailwayTrigger().catch(console.error);