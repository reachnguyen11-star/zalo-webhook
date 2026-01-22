"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetsService = void 0;
const googleapis_1 = require("googleapis");
const logger_1 = require("../utils/logger");
const phone_normalizer_1 = require("../utils/phone-normalizer");
const errors_1 = require("../utils/errors");
class SheetsService {
    constructor(oauth2Client, spreadsheetId, clientId, sheetName) {
        this.sheets = googleapis_1.google.sheets({ version: 'v4', auth: oauth2Client });
        this.spreadsheetId = spreadsheetId;
        this.clientId = clientId;
        this.sheetName = sheetName || 'Sheet1'; // Default to Sheet1 if not specified
    }
    /**
     * Append a new row to the spreadsheet
     */
    async appendRow(values) {
        try {
            logger_1.logger.debug('Appending row to sheet', { clientId: this.clientId, sheetName: this.sheetName, values });
            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${this.escapeSheetName(this.sheetName)}!A:Z`, // Use specified sheet name with proper escaping
                valueInputOption: 'RAW',
                requestBody: {
                    values: [values],
                },
            });
            logger_1.logger.info('Successfully appended row to sheet', {
                clientId: this.clientId,
                sheetName: this.sheetName,
                updatedCells: response.data.updates?.updatedCells,
                updatedRange: response.data.updates?.updatedRange,
            });
        }
        catch (error) {
            logger_1.logger.error('Error appending row to sheet', { clientId: this.clientId, sheetName: this.sheetName, error });
            throw new errors_1.ExternalAPIError('Google Sheets', error.message);
        }
    }
    /**
     * Get all phone numbers from the sheet for deduplication
     * Assumes phone is in column C (index 2)
     */
    async getAllPhones(phoneColumnIndex = 2) {
        try {
            logger_1.logger.debug('Fetching all phone numbers from sheet', { clientId: this.clientId });
            const columnLetter = this.getColumnLetter(phoneColumnIndex);
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.escapeSheetName(this.sheetName)}!${columnLetter}:${columnLetter}`,
            });
            const phones = new Set();
            const rows = response.data.values || [];
            // Skip header row
            for (let i = 1; i < rows.length; i++) {
                const phone = rows[i]?.[0];
                if (phone) {
                    const normalized = phone_normalizer_1.PhoneNormalizer.normalize(phone);
                    if (normalized) {
                        phones.add(normalized);
                    }
                }
            }
            logger_1.logger.info(`Loaded ${phones.size} unique phone numbers from sheet`, {
                clientId: this.clientId,
            });
            return phones;
        }
        catch (error) {
            logger_1.logger.error('Error fetching phones from sheet', { clientId: this.clientId, error });
            throw new errors_1.ExternalAPIError('Google Sheets', error.message);
        }
    }
    /**
     * Find if a phone number already exists in the sheet
     */
    async findDuplicatePhone(phone, phoneColumnIndex = 2) {
        const normalized = phone_normalizer_1.PhoneNormalizer.normalize(phone);
        if (!normalized) {
            logger_1.logger.warn('Invalid phone number format', { clientId: this.clientId, phone });
            return false;
        }
        const allPhones = await this.getAllPhones(phoneColumnIndex);
        const isDuplicate = allPhones.has(normalized);
        if (isDuplicate) {
            logger_1.logger.warn('Duplicate phone number detected', {
                clientId: this.clientId,
                phone: normalized,
            });
        }
        return isDuplicate;
    }
    /**
     * Initialize sheet with headers if empty
     */
    async initializeHeaders(headers) {
        try {
            // Check if sheet has any data
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.escapeSheetName(this.sheetName)}!A1:Z1`,
            });
            if (!response.data.values || response.data.values.length === 0) {
                // Sheet is empty, add headers
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${this.escapeSheetName(this.sheetName)}!A1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [headers],
                    },
                });
                logger_1.logger.info('Initialized sheet with headers', {
                    clientId: this.clientId,
                    headers,
                });
            }
            else {
                logger_1.logger.debug('Sheet already has headers', { clientId: this.clientId });
            }
        }
        catch (error) {
            logger_1.logger.error('Error initializing headers', { clientId: this.clientId, error });
            throw new errors_1.ExternalAPIError('Google Sheets', error.message);
        }
    }
    /**
     * Get existing headers from sheet
     */
    async getHeaders() {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.escapeSheetName(this.sheetName)}!A1:Z1`,
            });
            return response.data.values?.[0] || [];
        }
        catch (error) {
            logger_1.logger.error('Error fetching headers', { clientId: this.clientId, error });
            throw new errors_1.ExternalAPIError('Google Sheets', error.message);
        }
    }
    /**
     * Convert column index to letter (0 -> A, 1 -> B, etc.)
     */
    getColumnLetter(index) {
        let letter = '';
        while (index >= 0) {
            letter = String.fromCharCode((index % 26) + 65) + letter;
            index = Math.floor(index / 26) - 1;
        }
        return letter;
    }
    /**
     * Escape sheet name for Google Sheets API range notation
     * Sheet names with special characters need to be wrapped in single quotes
     */
    escapeSheetName(sheetName) {
        // If sheet name contains special characters like spaces, parentheses, etc., wrap in single quotes
        if (/[^A-Za-z0-9_]/.test(sheetName)) {
            // Escape single quotes by doubling them
            const escaped = sheetName.replace(/'/g, "''");
            return `'${escaped}'`;
        }
        return sheetName;
    }
    /**
     * Format lead data into row array based on headers
     */
    async formatLeadData(leadData, customHeaders) {
        const headers = customHeaders || (await this.getHeaders());
        if (headers.length === 0) {
            // No headers yet, create default ones from lead data
            const defaultHeaders = [
                'Timestamp',
                'Name',
                'Phone',
                'Email',
                ...Object.keys(leadData).filter((k) => !['timestamp', 'name', 'phone', 'email'].includes(k.toLowerCase())),
                'Source',
            ];
            await this.initializeHeaders(defaultHeaders);
            return this.formatLeadData(leadData, defaultHeaders);
        }
        // Map lead data to header positions
        const row = headers.map((header) => {
            const key = header.toLowerCase().replace(/\s+/g, '_');
            // Handle common field mappings
            if (key === 'timestamp') {
                return leadData.timestamp || new Date().toISOString();
            }
            if (key === 'source') {
                return 'Zalo Ads';
            }
            // Handle phone number - prefix with apostrophe to force text format in Sheets
            if (key === 'phone') {
                const leadKey = Object.keys(leadData).find((k) => k.toLowerCase() === 'phone');
                return leadKey && leadData[leadKey] ? `'${leadData[leadKey]}` : '';
            }
            // Find matching field in lead data (case-insensitive)
            const leadKey = Object.keys(leadData).find((k) => k.toLowerCase() === key || k.toLowerCase().replace(/\s+/g, '_') === key);
            return leadKey ? leadData[leadKey] : '';
        });
        return row;
    }
}
exports.SheetsService = SheetsService;
//# sourceMappingURL=sheets.service.js.map