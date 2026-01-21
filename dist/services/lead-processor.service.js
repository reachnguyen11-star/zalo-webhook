"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadProcessorService = exports.LeadProcessorService = void 0;
const zalo_service_1 = require("./zalo.service");
const phone_normalizer_1 = require("../utils/phone-normalizer");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class LeadProcessorService {
    /**
     * Process incoming webhook event from Zalo
     */
    async processWebhookEvent(event) {
        try {
            logger_1.logger.info('Processing webhook event', {
                event_name: event.event_name,
                timestamp: event.timestamp,
            });
            // Extract form data from event
            const formData = zalo_service_1.zaloService.extractFormData(event);
            if (!formData) {
                throw new errors_1.ValidationError('Could not extract form data from event');
            }
            // Process the form submission
            return await this.processFormSubmission(formData);
        }
        catch (error) {
            logger_1.logger.error('Error processing webhook event', error);
            return {
                success: false,
                message: error.message || 'Unknown error',
            };
        }
    }
    /**
     * Process form submission data
     * NOTE: This service is deprecated. Use webhook.controller.ts directly for multi-client support.
     */
    async processFormSubmission(formData) {
        try {
            // Convert form fields to object
            const leadData = this.convertFormDataToLead(formData);
            logger_1.logger.info('Processing form submission', {
                form_id: formData.form_id,
                fields: Object.keys(leadData),
            });
            // Validate phone number exists
            if (!leadData.phone) {
                logger_1.logger.warn('No phone number in form submission', { leadData });
                throw new errors_1.ValidationError('Phone number is required');
            }
            // Normalize phone number
            const normalizedPhone = phone_normalizer_1.PhoneNormalizer.normalize(leadData.phone);
            if (!phone_normalizer_1.PhoneNormalizer.isValid(normalizedPhone)) {
                throw new errors_1.ValidationError(`Invalid phone number format: ${leadData.phone}`);
            }
            leadData.phone = normalizedPhone;
            // NOTE: Duplicate check and sheet operations moved to webhook.controller.ts
            // This requires a SheetsService instance specific to the client
            throw new Error('This service is deprecated. Use webhook.controller.ts for multi-client support.');
            // Add timestamp
            leadData.timestamp = new Date(formData.submit_time).toISOString();
            return {
                success: true,
                message: 'Lead successfully added to Google Sheets',
                isDuplicate: false,
                leadData,
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing form submission', error);
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.DuplicateError) {
                throw error;
            }
            throw new Error(`Failed to process form submission: ${error.message}`);
        }
    }
    /**
     * Convert Zalo form data to lead object
     */
    convertFormDataToLead(formData) {
        const leadData = {};
        // Convert fields array to object
        const fieldsObject = zalo_service_1.zaloService.fieldsToObject(formData.fields);
        // Map common field names (case-insensitive)
        for (const [key, value] of Object.entries(fieldsObject)) {
            const lowerKey = key.toLowerCase();
            // Map to standard field names
            if (lowerKey.includes('phone') || lowerKey.includes('số điện thoại') || lowerKey.includes('sdt')) {
                leadData.phone = value;
            }
            else if (lowerKey.includes('name') || lowerKey.includes('tên') || lowerKey.includes('họ')) {
                leadData.name = value;
            }
            else if (lowerKey.includes('email')) {
                leadData.email = value;
            }
            else {
                // Keep other fields as-is
                leadData[key] = value;
            }
        }
        // Add user info if available
        if (formData.user_info) {
            if (!leadData.name && formData.user_info.user_name) {
                leadData.name = formData.user_info.user_name;
            }
            leadData.zalo_user_id = formData.user_info.user_id;
        }
        // Add form metadata
        leadData.form_id = formData.form_id;
        leadData.submit_time = new Date(formData.submit_time).toISOString();
        return leadData;
    }
    /**
     * Extract phone from lead data (handles multiple possible field names)
     */
    extractPhone(leadData) {
        const phoneFields = ['phone', 'Phone', 'PHONE', 'số điện thoại', 'sdt', 'SDT', 'mobile'];
        for (const field of phoneFields) {
            if (leadData[field]) {
                return leadData[field];
            }
        }
        // Try to extract from any field containing phone-like value
        for (const value of Object.values(leadData)) {
            if (typeof value === 'string') {
                const extracted = phone_normalizer_1.PhoneNormalizer.extract(value);
                if (extracted) {
                    return extracted;
                }
            }
        }
        return null;
    }
}
exports.LeadProcessorService = LeadProcessorService;
// Singleton instance
exports.leadProcessorService = new LeadProcessorService();
//# sourceMappingURL=lead-processor.service.js.map