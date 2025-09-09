import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getPricingPlans: (req: Request, res: Response) => Promise<void>;
export declare const getActionPricing: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const startChatWithOwner: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const viewContactDetails: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const checkChatStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const checkContactDetailsStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=pricingController.d.ts.map