const { PrismaClient } = require('@prisma/client');

// Use Railway database URL directly
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:VVyoKgUbrJqxTTAtWDsZxrHKsDusnaQF@trolley.proxy.rlwy.net:12664/railway"
    }
  }
});

async function checkPendingNotifications() {
  try {
    console.log('🔍 Checking pending notifications...\n');

    // Check pending notifications
    const pendingNotifs = await prisma.$queryRaw`
      SELECT property_id, zone_name, created_at 
      FROM pending_zone_notifications
    `;

    console.log('📋 Pending zone notifications:');
    if (pendingNotifs.length === 0) {
      console.log('   ❌ No pending notifications');
    } else {
      pendingNotifs.forEach((notif, i) => {
        console.log(`   ${i+1}. Property: ${notif.property_id}`);
        console.log(`      Zone: "${notif.zone_name}"`);
        console.log(`      Created: ${notif.created_at}`);
      });
    }
    console.log('');

    // Check George's zone preferences
    const george = await prisma.user.findUnique({
      where: { email: 'George@durent.com' }
    });

    if (george) {
      const zonePrefs = await prisma.$queryRaw`
        SELECT zone_name, created_at 
        FROM zone_notification_preferences 
        WHERE user_id = ${george.id}
      `;

      console.log('🔔 George\'s zone notification preferences:');
      if (zonePrefs.length === 0) {
        console.log('   ❌ No zone preferences found');
      } else {
        zonePrefs.forEach((pref, i) => {
          console.log(`   ${i+1}. Zone: "${pref.zone_name}"`);
          console.log(`      Created: ${pref.created_at}`);
        });
      }
      console.log('');

      // Check notification settings
      const notifSettings = await prisma.$queryRaw`
        SELECT zone_notifications_enabled, created_at 
        FROM user_notification_settings 
        WHERE user_id = ${george.id}
      `;

      console.log('⚙️  George\'s notification settings:');
      if (notifSettings.length === 0) {
        console.log('   ❌ No notification settings found');
      } else {
        const setting = notifSettings[0];
        console.log(`   Zone notifications enabled: ${setting.zone_notifications_enabled ? 'YES' : 'NO'}`);
        console.log(`   Created: ${setting.created_at}`);
      }
    } else {
      console.log('❌ George user not found');
    }

    console.log('\n✅ Check completed!');

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPendingNotifications();