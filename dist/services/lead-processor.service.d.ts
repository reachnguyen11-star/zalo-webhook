import { ZaloWebhookEvent, ZaloFormData } from './zalo.service';
import { LeadData } from './sheets.service';
export interface ProcessResult {
    success: boolean;
    message: string;
    isDuplicate?: boolean;
    leadData?: LeadData;
}
export declare class LeadProcessorService {
    /**
     * Process incoming webhook event from Zalo
     */
    processWebhookEvent(event: ZaloWebhookEvent): Promise<ProcessResult>;
    /**
     * Process form submission data
     * NOTE: This service is deprecated. Use webhook.controller.ts directly for multi-client support.
     */
    processFormSubmission(formData: ZaloFormData): Promise<ProcessResult>;
    /**
     * Convert Zalo form data to lead object
     */
    private convertFormDataToLead;
    /**
     * Extract phone from lead data (handles multiple possible field names)
     */
    private extractPhone;
}
export declare const leadProcessorService: LeadProcessorService;
//# sourceMappingURL=lead-processor.service.d.ts.map