import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const sendMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMessages: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getConversations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markAsRead: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=chatController.d.ts.map