import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const updatePushToken: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const viewPremiumPropertyDetails: (req: AuthRequest, res: Response) => Promise<void>;
export declare const checkPropertyViewStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePassword: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userController.d.ts.map