import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const setupContract: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getContract: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const checkExpiringContracts: (req: Request, res: Response) => Promise<void>;
export declare const extendContract: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=contractController.d.ts.map