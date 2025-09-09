import { Request, Response } from 'express';
export declare const getSubscriptionStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSubscriptionPlans: (req: Request, res: Response) => Promise<void>;
export declare const subscribeToPlan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const cancelSubscription: (req: Request, res: Response) => Promise<void>;
export declare const getCreditsBalance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const useCredits: (userId: string, amount: number, description: string) => Promise<number>;
export declare const purchaseCredits: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=subscriptionController.d.ts.map