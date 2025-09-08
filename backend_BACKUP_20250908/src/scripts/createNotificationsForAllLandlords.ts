import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createNotificationsForAllLandlords() {
  try {
    // Find all landlord users
    const landlords = await prisma.user.findMany({
      where: { userType: 'LANDLORD' }
    });

    console.log('Found landlords:', landlords.map(l => `${l.name} (${l.email}) - ID: ${l.id}`));

    for (const landlord of landlords) {
      console.log(`\nCreating notifications for: ${landlord.name} (${landlord.email})`);

      // Create different notifications for each landlord
      await prisma.$executeRaw`
        INSERT INTO notifications (id, "userId", type, title, body, data, read, "createdAt")
        VALUES (
          'cm0ll_' || ${landlord.id.slice(-8)} || '_' || floor(random() * 1000)::text,
          ${landlord.id},
          'PAYMENT_VERIFICATION_NEEDED'::"NotificationType",
          '💰 Payment Verification Needed',
          'New payment proof submitted by tenant requires your verification.',
          '{"amount": 7500, "propertyAddress": "Dubai Marina Tower"}'::jsonb,
          false,
          NOW()
        )
      `;

      await prisma.$executeRaw`
        INSERT INTO notifications (id, "userId", type, title, body, data, read, "createdAt")
        VALUES (
          'cm0msg_' || ${landlord.id.slice(-8)} || '_' || floor(random() * 1000)::text,
          ${landlord.id},
          'NEW_MESSAGE'::"NotificationType",
          '📱 New Tenant Message',
          'Your tenant has sent you an important message about the property.',
          '{"subject": "AC Maintenance Request"}'::jsonb,
          false,
          NOW()
        )
      `;

      console.log(`✅ Created 2 notifications for ${landlord.name}`);
    }

    console.log('\n🎉 All landlord notifications created!');
    console.log('📱 Check your landlord account - the bell should show notifications now!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNotificationsForAllLandlords();