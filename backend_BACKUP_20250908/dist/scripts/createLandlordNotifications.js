"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createLandlordNotifications() {
    try {
        // Find all landlord users
        const landlords = await prisma.user.findMany({
            where: { userType: 'LANDLORD' }
        });
        console.log('Found landlords:', landlords.map(l => `${l.name} (${l.email})`));
        if (landlords.length === 0) {
            console.log('❌ No landlord accounts found');
            return;
        }
        // Create notifications for the first landlord
        const landlord = landlords[0];
        console.log(`Creating notifications for landlord: ${landlord.name}`);
        // Create notifications using raw SQL
        await prisma.$executeRaw `
      INSERT INTO notifications (id, "userId", type, title, body, data, read, "createdAt")
      VALUES (
        'cm0landlord1' || floor(random() * 100000)::text,
        ${landlord.id},
        'PAYMENT_VERIFICATION_NEEDED'::"NotificationType",
        '🔍 Payment Verification Required',
        'Tenant John Doe has submitted payment proof for review. Please verify the payment of AED 5,000.',
        '{"tenantName": "John Doe", "amount": 5000, "paymentId": "pay123"}'::jsonb,
        false,
        NOW()
      )
    `;
        await prisma.$executeRaw `
      INSERT INTO notifications (id, "userId", type, title, body, data, read, "createdAt")
      VALUES (
        'cm0landlord2' || floor(random() * 100000)::text,
        ${landlord.id},
        'NEW_MESSAGE'::"NotificationType",
        '💬 New Message from Tenant',
        'You have received a new message from your tenant about property maintenance.',
        '{"senderId": "tenant123", "propertyId": "prop456"}'::jsonb,
        false,
        NOW()
      )
    `;
        await prisma.$executeRaw `
      INSERT INTO notifications (id, "userId", type, title, body, data, read, "createdAt")
      VALUES (
        'cm0landlord3' || floor(random() * 100000)::text,
        ${landlord.id},
        'END_RENTAL_REQUEST'::"NotificationType",
        '🏠 End Rental Request',
        'Tenant Sarah Smith has requested to end the rental agreement. Please review and respond within 7 days.',
        '{"tenantName": "Sarah Smith", "propertyId": "prop789", "requestDate": "2025-09-03"}'::jsonb,
        false,
        NOW()
      )
    `;
        console.log('✅ Landlord notifications created successfully!');
        console.log(`📱 Landlord ${landlord.name} should now see 3 notifications with badge!`);
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createLandlordNotifications();
//# sourceMappingURL=createLandlordNotifications.js.map