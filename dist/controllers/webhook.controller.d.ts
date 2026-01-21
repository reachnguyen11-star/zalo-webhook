import { Request, Response, NextFunction } from 'express';
export declare class WebhookController {
    /**
     * Handle Zalo webhook events
     */
    handleZaloWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Webhook verification endpoint (for Zalo initial setup)
     * Zalo may send a GET request to verify webhook URL
     */
    verifyWebhook(req: Request, res: Response): Promise<void>;
}
export declare const webhookController: WebhookController;
//# sourceMappingURL=webhook.controller.d.ts.map