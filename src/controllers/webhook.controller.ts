import { Request, Response, NextFunction } from 'express';
import { zaloService } from '../services/zalo.service';
import { googleAuth } from '../config/google-auth';
import { clientService } from '../services/client.service';
import { SheetsService } from '../services/sheets.service';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';
import { PhoneNormalizer } from '../utils/phone-normalizer';

export class WebhookController {
  /**
   * Handle Zalo webhook events
   */
  async handleZaloWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract client_id from query parameters
      const clientId = req.query.client_id as string;

      if (!clientId) {
        logger.warn('Missing client_id in webhook request');
        res.status(400).json({
          success: false,
          message: 'Missing client_id parameter',
        });
        return;
      }

      logger.info('Received webhook request', {
        clientId,
        headers: req.headers,
        body: req.body,
      });

      // Get client configuration
      const client = await clientService.getClient(clientId);
      if (!client) {
        logger.warn('Client not found', { clientId });
        res.status(404).json({
          success: false,
          message: 'Client not found',
        });
        return;
      }

      // Check if client is authenticated
      const isAuthenticated = await googleAuth.isClientAuthenticated(clientId);
      if (!isAuthenticated) {
        logger.warn('Client not authenticated', { clientId });
        res.status(401).json({
          success: false,
          message: 'Client not authenticated with Google Sheets',
        });
        return;
      }

      // Verify webhook signature if present
      const signature = req.headers['x-zalo-signature'] as string;
      if (signature) {
        const payload = JSON.stringify(req.body);
        const isValid = zaloService.verifyWebhookSignature(payload, signature);

        if (!isValid) {
          logger.warn('Invalid webhook signature', { clientId });
          res.status(401).json({
            success: false,
            message: 'Invalid signature',
          });
          return;
        }
      }

      // Handle webhook verification request (empty body or test ping)
      if (!req.body || Object.keys(req.body).length === 0) {
        logger.info('Webhook verification request (empty body)', { clientId });
        res.status(200).json({
          success: true,
          message: 'Webhook endpoint is active',
        });
        return;
      }

      // Parse webhook event
      const event = zaloService.parseWebhookEvent(req.body);

      // Extract form data
      const formDataRaw = zaloService.extractFormData(event);
      if (!formDataRaw || !formDataRaw.fields || formDataRaw.fields.length === 0) {
        // Might be a verification ping, return success
        logger.info('No form data in webhook event (possibly verification)', { clientId, body: req.body });
        res.status(200).json({
          success: true,
          message: 'Webhook received',
        });
        return;
      }

      // Convert fields to key-value object
      const formData = zaloService.fieldsToObject(formDataRaw.fields);
      if (!formData || Object.keys(formData).length === 0) {
        logger.warn('No form fields in webhook event', { clientId });
        res.status(400).json({
          success: false,
          message: 'No form data found in event',
        });
        return;
      }

      // Get phone number and validate
      const phoneField = Object.keys(formData).find(
        (key) => key.toLowerCase() === 'phone' || key.toLowerCase() === 'số điện thoại'
      );

      if (!phoneField || !formData[phoneField]) {
        logger.warn('Phone number is required', { clientId, formData });
        res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
        return;
      }

      const normalizedPhone = PhoneNormalizer.normalize(formData[phoneField] as string);
      if (!normalizedPhone || !PhoneNormalizer.isValid(normalizedPhone)) {
        logger.warn('Invalid phone number format', { clientId, phone: formData[phoneField] });
        res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
        });
        return;
      }

      // Create SheetsService for this client
      const oauth2Client = await googleAuth.getClientForOAuth(clientId);
      const sheetsService = new SheetsService(oauth2Client, client.googleSheetId, clientId);

      // Check for duplicate
      const isDuplicate = await sheetsService.findDuplicatePhone(normalizedPhone);
      if (isDuplicate) {
        logger.info('Duplicate lead detected, skipping', { clientId, phone: normalizedPhone });
        res.status(200).json({
          success: true,
          message: 'Duplicate phone number, skipped',
          isDuplicate: true,
        });
        return;
      }

      // Prepare lead data with normalized phone and metadata
      const leadData = {
        ...formData,
        phone: normalizedPhone,
        timestamp: new Date().toISOString(),
        // Add metadata for tracking
        form_id: formDataRaw.form_id,
        form_name: formDataRaw.form_name || 'N/A',
        oa_id: formDataRaw.oa_id || 'N/A',
        campaign_id: formDataRaw.campaign_id || 'N/A',
        user_id: formDataRaw.user_info?.user_id || 'N/A',
        source: 'Zalo Ads',
      };

      // Format and append to sheet
      const row = await sheetsService.formatLeadData(leadData);
      await sheetsService.appendRow(row);

      logger.info('Lead successfully added to Google Sheets', {
        clientId,
        phone: normalizedPhone,
      });

      res.status(200).json({
        success: true,
        message: 'Lead successfully added to Google Sheets',
        isDuplicate: false,
      });
    } catch (error: any) {
      logger.error('Error handling webhook', error);
      next(error);
    }
  }

  /**
   * Webhook verification endpoint (for Zalo initial setup)
   * Zalo may send a GET request to verify webhook URL
   */
  async verifyWebhook(req: Request, res: Response): Promise<void> {
    try {
      const challenge = req.query.challenge || req.query['hub.challenge'];

      if (challenge) {
        logger.info('Webhook verification request', { challenge });
        res.status(200).send(challenge);
      } else {
        res.status(200).json({
          success: true,
          message: 'Webhook endpoint is active',
        });
      }
    } catch (error: any) {
      logger.error('Error verifying webhook', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const webhookController = new WebhookController();
