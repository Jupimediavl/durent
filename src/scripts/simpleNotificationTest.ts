import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSimpleNotification() {
  try {
    // Use raw SQL to insert notification
    await prisma.$executeRaw`
      INSERT INTO notifications (id, "userId", type, title, body, data, read, "createdAt")
      VALUES (
        'cm0abc' || floor(random() * 100000)::text,
        'cmezja9e40001jkrar0a0iyqw',
        'PAYMENT_REMINDER'::"NotificationType",
        '🔔 Payment Reminder',
        'Your rent payment of AED 5,000 is due in 3 days.',
        '{"amount": 5000, "dueDate": "2025-09-06"}'::jsonb,
        false,
        NOW()
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO notifications (id, "userId", type, title, body, data, read, "createdAt")
      VALUES (
        'cm0def' || floor(random() * 100000)::text,
        'cmezja9e40001jkrar0a0iyqw',
        'NEW_MESSAGE'::"NotificationType",
        '💬 New Message',
        'You have received a new message from your landlord.',
        '{"senderId": "landlord"}'::jsonb,
        false,
        NOW()
      )
    `;

    console.log('✅ Test notifications created successfully!');
    console.log('📱 Check your mobile app - the bell should show a badge now!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleNotification();