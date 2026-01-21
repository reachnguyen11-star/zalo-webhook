export interface ZaloWebhookEvent {
    event_name: string;
    app_id: string;
    timestamp: string;
    data?: any;
}
export interface ZaloFormData {
    form_id: string;
    submit_time: number;
    fields: Array<{
        id: string;
        name: string;
        value: string;
        type: string;
    }>;
    user_info?: {
        user_id: string;
        user_name?: string;
    };
}
export declare class ZaloService {
    /**
     * Verify Zalo webhook signature
     * Zalo signs webhooks with HMAC-SHA256
     */
    verifyWebhookSignature(payload: string, signature: string): boolean;
    /**
     * Parse Zalo webhook event
     */
    parseWebhookEvent(body: any): ZaloWebhookEvent;
    /**
     * Extract form data from webhook event
     */
    extractFormData(event: ZaloWebhookEvent): ZaloFormData | null;
    /**
     * Normalize form fields to consistent structure
     */
    private normalizeFields;
    /**
     * Convert form fields to key-value object
     */
    fieldsToObject(fields: ZaloFormData['fields']): Record<string, any>;
    /**
     * Get access token from Zalo (if needed for API calls)
     */
    getAccessToken(authCode?: string): Promise<string>;
    /**
     * Fetch form submission data from Zalo API (alternative to webhook)
     */
    fetchFormData(formId: string, accessToken: string): Promise<any>;
}
export declare const zaloService: ZaloService;
//# sourceMappingURL=zalo.service.d.ts.map