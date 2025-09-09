import { NotificationType } from '@prisma/client';
export interface NotificationData {
    title: string;
    body: string;
    data?: any;
}
export declare class NotificationService {
    static createAndSendNotification(userId: string, type: NotificationType, title: string, body: string, data?: any): Promise<boolean>;
    static shouldSendNotification(user: any, type: NotificationType): boolean;
    private static sendPushNotification;
    static sendPaymentReminderNotification(tenantId: string, propertyTitle: string, amount: number, dueDate: string, propertyId: string): Promise<boolean>;
    static sendPaymentOverdueNotification(tenantId: string, landlordId: string, propertyTitle: string, amount: number, daysPastDue: number, propertyId: string): Promise<boolean>;
    static sendPaymentApprovedNotification(tenantId: string, propertyTitle: string, amount: number, propertyId: string): Promise<boolean>;
    static sendPaymentRejectedNotification(tenantId: string, propertyTitle: string, amount: number, propertyId: string, reason?: string): Promise<boolean>;
    static sendPaymentVerificationNotification(landlordId: string, tenantName: string, propertyTitle: string, amount: number, propertyId: string, paymentId: string): Promise<boolean>;
    static sendEndRentalRequestNotification(receiverId: string, requesterName: string, propertyTitle: string, propertyId: string, reason?: string): Promise<boolean>;
    static sendEndRentalAutoAcceptWarning(userId: string, propertyTitle: string, hoursLeft: number, propertyId: string): Promise<boolean>;
    static sendPaymentDateChangeRequestNotification(landlordId: string, tenantName: string, propertyTitle: string, currentDate: number, proposedDate: number, propertyId: string, requestId: string): Promise<boolean>;
    static sendPaymentDateChangeResponseNotification(tenantId: string, approved: boolean, propertyTitle: string, newDate: number, propertyId: string): Promise<boolean>;
    static sendNewTenantJoinedNotification(landlordId: string, tenantName: string, propertyTitle: string, propertyId: string): Promise<boolean>;
    static sendNewMessageNotification(receiverId: string, senderName: string, messageContent: string, propertyTitle: string, propertyId: string): Promise<boolean>;
    static markNotificationAsRead(notificationId: string): Promise<boolean>;
    static getUserNotifications(userId: string, limit?: number): Promise<{
        userId: string;
        id: string;
        createdAt: Date | null;
        updatedAt: Date | null;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        message: string | null;
        read: boolean | null;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        body: string;
        sentAt: Date | null;
    }[]>;
    static getUnreadCount(userId: string): Promise<number>;
}
//# sourceMappingURL=notificationService.d.ts.map