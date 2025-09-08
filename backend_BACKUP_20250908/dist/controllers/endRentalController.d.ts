import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const requestEndRental: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const acceptEndRental: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getEndRequestStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPastRentals: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPastTenants: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const cancelEndRental: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const autoAcceptExpiredRequests: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=endRentalController.d.ts.map