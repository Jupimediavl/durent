import { Request, Response } from 'express';
export declare const getTenantIssues: (req: Request, res: Response) => Promise<void>;
export declare const getLandlordIssues: (req: Request, res: Response) => Promise<void>;
export declare const createIssueReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateIssueStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getIssueDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getLandlordIssuesCount: (req: Request, res: Response) => Promise<void>;
export declare const getTenantIssuesCount: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=issueController.d.ts.map