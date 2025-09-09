const { PrismaClient } = require('@prisma/client');

// Use Railway database URL directly
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:VVyoKgUbrJqxTTAtWDsZxrHKsDusnaQF@trolley.proxy.rlwy.net:12664/railway"
    }
  }
});

async function addTestNotification() {
  try {
    console.log('🔧 Adding test notification for Railway test...\n');

    // Add Test property back to pending notifications for Dubai Marina
    await prisma.$queryRaw`
      INSERT INTO pending_zone_notifications (property_id, zone_name)
      VALUES ('cmfatvilz0003pb3re6rzoscq', 'Dubai Marina')
      ON CONFLICT DO NOTHING
    `;

    console.log('✅ Added Test property to pending notifications for Dubai Marina');
    console.log('📱 Ready for George to receive notification when trigger runs');

    console.log('\n✅ Test setup completed!');

  } catch (error) {
    console.error('❌ Error adding test notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestNotification();