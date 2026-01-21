import crypto from 'crypto';
import axios from 'axios';
import { zaloConfig } from '../config/zalo-config';
import { logger } from '../utils/logger';
import { ValidationError, ExternalAPIError } from '../utils/errors';

export interface ZaloWebhookEvent {
  event_name: string;
  app_id: string;
  timestamp: string;
  data?: any;
}

export interface ZaloFormData {
  form_id: string;
  form_name?: string;
  oa_id?: string;
  campaign_id?: string;
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

export class ZaloService {
  /**
   * Verify Zalo webhook signature
   * Zalo signs webhooks with HMAC-SHA256
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', zaloConfig.webhookSecret)
        .update(payload)
        .digest('hex');

      const isValid = signature === expectedSignature;

      if (!isValid) {
        logger.warn('Invalid webhook signature', {
          expected: expectedSignature.substring(0, 10) + '...',
          received: signature.substring(0, 10) + '...',
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  /**
   * Parse Zalo webhook event
   */
  parseWebhookEvent(body: any): ZaloWebhookEvent {
    if (!body || !body.event_name) {
      throw new ValidationError('Invalid webhook payload: missing event_name');
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
  extractFormData(event: ZaloWebhookEvent): ZaloFormData | null {
    try {
      // Different event types may have different structures
      // Adjust this based on actual Zalo webhook payload
      const data = event.data;

      if (!data) {
        logger.warn('No data in webhook event');
        return null;
      }

      // Handle form submission event
      if (event.event_name === 'form_submit' || event.event_name === 'follow' || data.form_id) {
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

      logger.warn('Unhandled event type', { event_name: event.event_name });
      return null;
    } catch (error) {
      logger.error('Error extracting form data', error);
      return null;
    }
  }

  /**
   * Normalize form fields to consistent structure
   */
  private normalizeFields(fields: any[]): ZaloFormData['fields'] {
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
  fieldsToObject(fields: ZaloFormData['fields']): Record<string, any> {
    const result: Record<string, any> = {};

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
  async getAccessToken(authCode?: string): Promise<string> {
    try {
      const params = new URLSearchParams({
        app_id: zaloConfig.appId,
        app_secret: zaloConfig.appSecret,
        ...(authCode && { code: authCode }),
      });

      const response = await axios.post(zaloConfig.endpoints.token, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.data.access_token) {
        logger.info('Successfully obtained Zalo access token');
        return response.data.access_token;
      }

      throw new Error('No access token in response');
    } catch (error: any) {
      logger.error('Error getting Zalo access token', error);
      throw new ExternalAPIError('Zalo', error.message);
    }
  }

  /**
   * Fetch form submission data from Zalo API (alternative to webhook)
   */
  async fetchFormData(formId: string, accessToken: string): Promise<any> {
    try {
      const response = await axios.get(zaloConfig.endpoints.formData, {
        headers: {
          'access_token': accessToken,
        },
        params: {
          form_id: formId,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching form data from Zalo API', error);
      throw new ExternalAPIError('Zalo', error.message);
    }
  }
}

// Singleton instance
export const zaloService = new ZaloService();
