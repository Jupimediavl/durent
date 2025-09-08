const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTestData() {
  try {
    console.log('🔍 Checking test data for George...\n');

    // 1. Find George's user
    const george = await prisma.user.findUnique({
      where: { email: 'George@durent.com' },
      select: { id: true, name: true, email: true, pushToken: true }
    });

    if (!george) {
      console.log('❌ George user not found');
      return;
    }

    console.log('👤 George user found:');
    console.log('   ID:', george.id);
    console.log('   Name:', george.name);
    console.log('   Email:', george.email);
    console.log('   Has push token:', george.pushToken ? 'YES' : 'NO');
    console.log('');

    // 2. Check George's properties
    const properties = await prisma.property.findMany({
      where: { ownerId: george.id },
      select: { 
        id: true, 
        title: true, 
        address: true,
        isPublic: true,
        availabilityStatus: true,
        createdAt: true
      }
    });

    console.log('🏠 George\'s properties:');
    if (properties.length === 0) {
      console.log('   ❌ No properties found');
    } else {
      properties.forEach((prop, i) => {
        console.log(`   ${i+1}. "${prop.title}"`);
        console.log(`      ID: ${prop.id}`);
        console.log(`      Address: ${prop.address}`);
        console.log(`      Public: ${prop.isPublic ? 'YES' : 'NO'}`);
        console.log(`      Status: ${prop.availabilityStatus || 'NULL'}`);
        console.log(`      Created: ${prop.createdAt}`);
        console.log('');
      });
    }

    // 3. Check George's zone notification preferences
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

    // 4. Check notification settings
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
    console.log('');

    // 5. Check pending notifications
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

    console.log('\n✅ Data check completed!');

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestData();