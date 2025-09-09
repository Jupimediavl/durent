import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const proposePaymentDateChange: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPendingChangeRequests: (req: AuthRequest, res: Response) => Promise<void>;
export declare const respondToChangeRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getChangeRequestHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const expireOldRequests: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=paymentDateChangeController.d.ts.map