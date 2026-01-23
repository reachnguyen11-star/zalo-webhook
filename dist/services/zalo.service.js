"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zaloService = exports.ZaloService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const zalo_config_1 = require("../config/zalo-config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class ZaloService {
    /**
     * Verify Zalo webhook signature
     * Zalo signs webhooks with HMAC-SHA256
     */
    verifyWebhookSignature(payload, signature) {
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', zalo_config_1.zaloConfig.webhookSecret)
                .update(payload)
                .digest('hex');
            const isValid = signature === expectedSignature;
            if (!isValid) {
                logger_1.logger.warn('Invalid webhook signature', {
                    expected: expectedSignature.substring(0, 10) + '...',
                    received: signature.substring(0, 10) + '...',
                });
            }
            return isValid;
        }
        catch (error) {
            logger_1.logger.error('Error verifying webhook signature', error);
            return false;
        }
    }
    /**
     * Parse Zalo webhook event
     */
    parseWebhookEvent(body) {
        if (!body || !body.event_name) {
            throw new errors_1.ValidationError('Invalid webhook payload: missing event_name');
        }
        return {
            event_name: body.event_name,
            app_id: body.app_id,
            timestamp: body.timestamp || new Date().toISOString(),
            data: body.data || body,
        };
    }
    /**
     * Extract form data from webhook event
     */
    extractFormData(event) {
        try {
            // Different event types may have different structures
            // Adjust this based on actual Zalo webhook payload
            const data = event.data;
            if (!data) {
                logger_1.logger.warn('No data in webhook event');
                return null;
            }
            // Handle form submission event
            // Zalo uses 'user_submit_info' for form submissions in OA
            if (event.event_name === 'form_submit' || event.event_name === 'user_submit_info' || event.event_name === 'follow' || data.form_id) {
                return {
                    form_id: data.form_id || data.id,
                    form_name: data.form_name || data.name,
                    oa_id: data.oa_id || event.app_id,
                    campaign_id: data.campaign_id || data.ad_id,
                    submit_time: data.submit_time || data.timestamp || Date.now(),
                    fields: this.normalizeFields(data.fields || data.form_data || []),
                    user_info: data.user_info || data.user,
                };
            }
            logger_1.logger.warn('Unhandled event type', { event_name: event.event_name });
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error extracting form data', error);
            return null;
        }
    }
    /**
     * Normalize form fields to consistent structure
     */
    normalizeFields(fields) {
        if (!Array.isArray(fields)) {
            return [];
        }
        return fields.map((field) => ({
            id: field.id || field.field_id || '',
            name: field.name || field.label || field.field_name || '',
            value: field.value || field.answer || '',
            type: field.type || field.field_type || 'text',
        }));
    }
    /**
     * Convert form fields to key-value object
     */
    fieldsToObject(fields) {
        const result = {};
        for (const field of fields) {
            const key = field.name || field.id;
            if (key) {
                result[key] = field.value;
            }
        }
        return result;
    }
    /**
     * Get access token from Zalo (if needed for API calls)
     */
    async getAccessToken(authCode) {
        try {
            const params = new URLSearchParams({
                app_id: zalo_config_1.zaloConfig.appId,
                app_secret: zalo_config_1.zaloConfig.appSecret,
                ...(authCode && { code: authCode }),
            });
            const response = await axios_1.default.post(zalo_config_1.zaloConfig.endpoints.token, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            if (response.data.access_token) {
                logger_1.logger.info('Successfully obtained Zalo access token');
                return response.data.access_token;
            }
            throw new Error('No access token in response');
        }
        catch (error) {
            logger_1.logger.error('Error getting Zalo access token', error);
            throw new errors_1.ExternalAPIError('Zalo', error.message);
        }
    }
    /**
     * Fetch form submission data from Zalo API (alternative to webhook)
     */
    async fetchFormData(formId, accessToken) {
        try {
            const response = await axios_1.default.get(zalo_config_1.zaloConfig.endpoints.formData, {
                headers: {
                    'access_token': accessToken,
                },
                params: {
                    form_id: formId,
                },
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Error fetching form data from Zalo API', error);
            throw new errors_1.ExternalAPIError('Zalo', error.message);
        }
    }
}
exports.ZaloService = ZaloService;
// Singleton instance
exports.zaloService = new ZaloService();
//# sourceMappingURL=zalo.service.js.map