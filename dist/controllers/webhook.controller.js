"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookController = exports.WebhookController = void 0;
const zalo_service_1 = require("../services/zalo.service");
const google_auth_1 = require("../config/google-auth");
const client_service_1 = require("../services/client.service");
const sheets_service_1 = require("../services/sheets.service");
const logger_1 = require("../utils/logger");
const phone_normalizer_1 = require("../utils/phone-normalizer");
class WebhookController {
    /**
     * Handle Zalo webhook events
     */
    async handleZaloWebhook(req, res, next) {
        try {
            // Extract client_id from query parameters
            const clientId = req.query.client_id;
            if (!clientId) {
                logger_1.logger.warn('Missing client_id in webhook request');
                res.status(400).json({
                    success: false,
                    message: 'Missing client_id parameter',
                });
                return;
            }
            logger_1.logger.info('Received webhook request', {
                clientId,
                headers: req.headers,
                body: req.body,
            });
            // Get client configuration
            const client = await client_service_1.clientService.getClient(clientId);
            if (!client) {
                logger_1.logger.warn('Client not found', { clientId });
                res.status(404).json({
                    success: false,
                    message: 'Client not found',
                });
                return;
            }
            // Check if client is authenticated
            const isAuthenticated = await google_auth_1.googleAuth.isClientAuthenticated(clientId);
            if (!isAuthenticated) {
                logger_1.logger.warn('Client not authenticated', { clientId });
                res.status(401).json({
                    success: false,
                    message: 'Client not authenticated with Google Sheets',
                });
                return;
            }
            // Verify webhook signature if present
            const signature = req.headers['x-zalo-signature'];
            if (signature) {
                const payload = JSON.stringify(req.body);
                const isValid = zalo_service_1.zaloService.verifyWebhookSignature(payload, signature);
                if (!isValid) {
                    logger_1.logger.warn('Invalid webhook signature', { clientId });
                    res.status(401).json({
                        success: false,
                        message: 'Invalid signature',
                    });
                    return;
                }
            }
            // Parse webhook event
            const event = zalo_service_1.zaloService.parseWebhookEvent(req.body);
            // Extract form data
            const formDataRaw = zalo_service_1.zaloService.extractFormData(event);
            if (!formDataRaw || !formDataRaw.fields || formDataRaw.fields.length === 0) {
                logger_1.logger.warn('No form data in webhook event', { clientId });
                res.status(400).json({
                    success: false,
                    message: 'No form data found in event',
                });
                return;
            }
            // Convert fields to key-value object
            const formData = zalo_service_1.zaloService.fieldsToObject(formDataRaw.fields);
            if (!formData || Object.keys(formData).length === 0) {
                logger_1.logger.warn('No form fields in webhook event', { clientId });
                res.status(400).json({
                    success: false,
                    message: 'No form data found in event',
                });
                return;
            }
            // Get phone number and validate
            const phoneField = Object.keys(formData).find((key) => key.toLowerCase() === 'phone' || key.toLowerCase() === 'số điện thoại');
            if (!phoneField || !formData[phoneField]) {
                logger_1.logger.warn('Phone number is required', { clientId, formData });
                res.status(400).json({
                    success: false,
                    message: 'Phone number is required',
                });
                return;
            }
            const normalizedPhone = phone_normalizer_1.PhoneNormalizer.normalize(formData[phoneField]);
            if (!normalizedPhone || !phone_normalizer_1.PhoneNormalizer.isValid(normalizedPhone)) {
                logger_1.logger.warn('Invalid phone number format', { clientId, phone: formData[phoneField] });
                res.status(400).json({
                    success: false,
                    message: 'Invalid phone number format',
                });
                return;
            }
            // Create SheetsService for this client
            const oauth2Client = await google_auth_1.googleAuth.getClientForOAuth(clientId);
            const sheetsService = new sheets_service_1.SheetsService(oauth2Client, client.googleSheetId, clientId);
            // Check for duplicate
            const isDuplicate = await sheetsService.findDuplicatePhone(normalizedPhone);
            if (isDuplicate) {
                logger_1.logger.info('Duplicate lead detected, skipping', { clientId, phone: normalizedPhone });
                res.status(200).json({
                    success: true,
                    message: 'Duplicate phone number, skipped',
                    isDuplicate: true,
                });
                return;
            }
            // Prepare lead data with normalized phone
            const leadData = {
                ...formData,
                phone: normalizedPhone,
                timestamp: new Date().toISOString(),
            };
            // Format and append to sheet
            const row = await sheetsService.formatLeadData(leadData);
            await sheetsService.appendRow(row);
            logger_1.logger.info('Lead successfully added to Google Sheets', {
                clientId,
                phone: normalizedPhone,
            });
            res.status(200).json({
                success: true,
                message: 'Lead successfully added to Google Sheets',
                isDuplicate: false,
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling webhook', error);
            next(error);
        }
    }
    /**
     * Webhook verification endpoint (for Zalo initial setup)
     * Zalo may send a GET request to verify webhook URL
     */
    async verifyWebhook(req, res) {
        try {
            const challenge = req.query.challenge || req.query['hub.challenge'];
            if (challenge) {
                logger_1.logger.info('Webhook verification request', { challenge });
                res.status(200).send(challenge);
            }
            else {
                res.status(200).json({
                    success: true,
                    message: 'Webhook endpoint is active',
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error verifying webhook', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }
}
exports.WebhookController = WebhookController;
exports.webhookController = new WebhookController();
//# sourceMappingURL=webhook.controller.js.map