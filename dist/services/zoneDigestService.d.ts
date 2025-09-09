export declare class ZoneDigestService {
    sendDailyDigest(): Promise<void>;
    private getPendingNotifications;
    private getUsersWithZonePreferences;
    private groupNotificationsByZone;
    private sendNotificationsForUser;
    private getAvailableProperties;
    private sendZoneNotification;
    private clearProcessedNotifications;
    addPropertyToPendingNotifications(propertyId: string, zoneName: string): Promise<void>;
}
export declare const zoneDigestService: ZoneDigestService;
//# sourceMappingURL=zoneDigestService.d.ts.map