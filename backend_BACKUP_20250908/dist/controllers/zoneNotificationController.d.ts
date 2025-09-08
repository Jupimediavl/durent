import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const setZoneNotificationPreference: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getZoneNotificationPreferences: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getZoneNotificationPreference: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteZoneNotificationPreference: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=zoneNotificationController.d.ts.map