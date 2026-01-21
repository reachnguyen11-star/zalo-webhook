import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger';
import { PhoneNormalizer } from '../utils/phone-normalizer';
import { ExternalAPIError } from '../utils/errors';

export interface LeadData {
  [key: string]: any;
  phone?: string;
  timestamp?: string;
}

export class SheetsService {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  private clientId: string;

  constructor(oauth2Client: OAuth2Client, spreadsheetId: string, clientId: string) {
    this.sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    this.spreadsheetId = spreadsheetId;
    this.clientId = clientId;
  }

  /**
   * Append a new row to the spreadsheet
   */
  async appendRow(values: any[]): Promise<void> {
    try {
      logger.debug('Appending row to sheet', { clientId: this.clientId, values });

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:Z', // Auto-detect columns
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });

      logger.info('Successfully appended row to sheet', {
        clientId: this.clientId,
        updatedCells: response.data.updates?.updatedCells,
        updatedRange: response.data.updates?.updatedRange,
      });
    } catch (error: any) {
      logger.error('Error appending row to sheet', { clientId: this.clientId, error });
      throw new ExternalAPIError('Google Sheets', error.message);
    }
  }

  /**
   * Get all phone numbers from the sheet for deduplication
   * Assumes phone is in column C (index 2)
   */
  async getAllPhones(phoneColumnIndex: number = 2): Promise<Set<string>> {
    try {
      logger.debug('Fetching all phone numbers from sheet', { clientId: this.clientId });

      const columnLetter = this.getColumnLetter(phoneColumnIndex);
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `Sheet1!${columnLetter}:${columnLetter}`,
      });

      const phones = new Set<string>();
      const rows = response.data.values || [];

      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const phone = rows[i]?.[0];
        if (phone) {
          const normalized = PhoneNormalizer.normalize(phone);
          if (normalized) {
            phones.add(normalized);
          }
        }
      }

      logger.info(`Loaded ${phones.size} unique phone numbers from sheet`, {
        clientId: this.clientId,
      });
      return phones;
    } catch (error: any) {
      logger.error('Error fetching phones from sheet', { clientId: this.clientId, error });
      throw new ExternalAPIError('Google Sheets', error.message);
    }
  }

  /**
   * Find if a phone number already exists in the sheet
   */
  async findDuplicatePhone(phone: string, phoneColumnIndex: number = 2): Promise<boolean> {
    const normalized = PhoneNormalizer.normalize(phone);
    if (!normalized) {
      logger.warn('Invalid phone number format', { clientId: this.clientId, phone });
      return false;
    }

    const allPhones = await this.getAllPhones(phoneColumnIndex);
    const isDuplicate = allPhones.has(normalized);

    if (isDuplicate) {
      logger.warn('Duplicate phone number detected', {
        clientId: this.clientId,
        phone: normalized,
      });
    }

    return isDuplicate;
  }

  /**
   * Initialize sheet with headers if empty
   */
  async initializeHeaders(headers: string[]): Promise<void> {
    try {
      // Check if sheet has any data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A1:Z1',
      });

      if (!response.data.values || response.data.values.length === 0) {
        // Sheet is empty, add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Sheet1!A1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
        logger.info('Initialized sheet with headers', {
          clientId: this.clientId,
          headers,
        });
      } else {
        logger.debug('Sheet already has headers', { clientId: this.clientId });
      }
    } catch (error: any) {
      logger.error('Error initializing headers', { clientId: this.clientId, error });
      throw new ExternalAPIError('Google Sheets', error.message);
    }
  }

  /**
   * Get existing headers from sheet
   */
  async getHeaders(): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A1:Z1',
      });

      return response.data.values?.[0] || [];
    } catch (error: any) {
      logger.error('Error fetching headers', { clientId: this.clientId, error });
      throw new ExternalAPIError('Google Sheets', error.message);
    }
  }

  /**
   * Convert column index to letter (0 -> A, 1 -> B, etc.)
   */
  private getColumnLetter(index: number): string {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }

  /**
   * Format lead data into row array based on headers
   */
  async formatLeadData(leadData: LeadData, customHeaders?: string[]): Promise<any[]> {
    const headers = customHeaders || (await this.getHeaders());

    if (headers.length === 0) {
      // No headers yet, create default ones from lead data
      const defaultHeaders = [
        'Timestamp',
        'Name',
        'Phone',
        'Email',
        ...Object.keys(leadData).filter(
          (k) => !['timestamp', 'name', 'phone', 'email'].includes(k.toLowerCase())
        ),
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
      const leadKey = Object.keys(leadData).find(
        (k) => k.toLowerCase() === key || k.toLowerCase().replace(/\s+/g, '_') === key
      );

      return leadKey ? leadData[leadKey] : '';
    });

    return row;
  }
}
