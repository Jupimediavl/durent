import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestNotification() {
  try {
    // Create test notification for tenant user
    const notification = await prisma.notification.create({
      data: {
        userId: 'cmezja9e40001jkrar0a0iyqw', // Tenant Florin's ID
        type: 'PAYMENT_REMINDER',
        title: '🔔 Payment Reminder',
        body: 'Your rent payment of AED 5,000 is due in 3 days. Please make sure to submit your payment on time to avoid late fees.',
        data: {
          propertyId: 'test-property',
          amount: 5000,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        read: false
      }
    });

    console.log('✅ Test notification created:', notification);

    // Create another unread notification
    const notification2 = await prisma.notification.create({
      data: {
        userId: 'cmezja9e40001jkrar0a0iyqw',
        type: 'NEW_MESSAGE',
        title: '💬 New Message',
        body: 'You have received a new message from your landlord.',
        data: {
          propertyId: 'test-property',
          senderId: 'landlord-id'
        },
        read: false
      }
    });

    console.log('✅ Second test notification created:', notification2);

    // Create a read notification
    const notification3 = await prisma.notification.create({
      data: {
        userId: 'cmezja9e40001jkrar0a0iyqw',
        type: 'PAYMENT_APPROVED',
        title: '✅ Payment Approved',
        body: 'Your payment for last month has been verified and approved.',
        data: {
          propertyId: 'test-property',
          paymentId: 'payment-123'
        },
        read: true,
        sentAt: new Date()
      }
    });

    console.log('✅ Third test notification created:', notification3);

    console.log('\n🎉 All test notifications created successfully!');
    console.log('📱 Check your mobile app - the bell icon should now show a badge with "2" (unread notifications)');
    
  } catch (error) {
    console.error('❌ Error creating test notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNotification();