import { Response } from 'express';
import multer from 'multer';
import { AuthRequest } from '../middleware/auth';
export declare const upload: multer.Multer;
export declare const uploadPropertyPhotos: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=uploadController.d.ts.map