import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getUserNotifications: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markNotificationAsRead: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markAllNotificationsAsRead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getNotificationSettings: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateNotificationSettings: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteNotification: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUnreadCount: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map