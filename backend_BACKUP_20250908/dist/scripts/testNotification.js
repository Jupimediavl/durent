"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestNotification = createTestNotification;
const client_1 = require("@prisma/client");
const notificationService_1 = require("../services/notificationService");
const prisma = new client_1.PrismaClient();
/**
 * Create a test notification for testing the notification system
 */
async function createTestNotification() {
    try {
        console.log('🧪 Creating test notification...');
        // Get the first user to send notification to
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('❌ No users found in database');
            return;
        }
        console.log(`👤 Found user: ${user.name} (${user.email})`);
        // Create test notification
        const success = await notificationService_1.NotificationService.createAndSendNotification(user.id, 'NEW_MESSAGE', '🔔 Test Notification', 'This is a test notification from the duRent notification system! If you see this in your app, notifications are working correctly.', {
            test: true,
            timestamp: new Date().toISOString(),
            action: 'OPEN_NOTIFICATIONS'
        });
        if (success) {
            console.log('✅ Test notification created and sent successfully!');
            console.log(`📱 Check the notification bell in the app for user: ${user.name}`);
        }
        else {
            console.log('❌ Failed to create test notification');
        }
    }
    catch (error) {
        console.error('💥 Error creating test notification:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Run the script if called directly
if (require.main === module) {
    createTestNotification()
        .then(() => {
        console.log('🎉 Test notification script completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Test notification script failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=testNotification.js.map