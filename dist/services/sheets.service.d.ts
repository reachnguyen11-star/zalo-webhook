import { OAuth2Client } from 'google-auth-library';
export interface LeadData {
    [key: string]: any;
    phone?: string;
    timestamp?: string;
}
export declare class SheetsService {
    private sheets;
    private spreadsheetId;
    private clientId;
    private sheetName;
    constructor(oauth2Client: OAuth2Client, spreadsheetId: string, clientId: string, sheetName?: string);
    /**
     * Append a new row to the spreadsheet
     */
    appendRow(values: any[]): Promise<void>;
    /**
     * Get all phone numbers from the sheet for deduplication
     * Assumes phone is in column C (index 2)
     */
    getAllPhones(phoneColumnIndex?: number): Promise<Set<string>>;
    /**
     * Find if a phone number already exists in the sheet
     */
    findDuplicatePhone(phone: string, phoneColumnIndex?: number): Promise<boolean>;
    /**
     * Initialize sheet with headers if empty
     */
    initializeHeaders(headers: string[]): Promise<void>;
    /**
     * Get existing headers from sheet
     */
    getHeaders(): Promise<string[]>;
    /**
     * Convert column index to letter (0 -> A, 1 -> B, etc.)
     */
    private getColumnLetter;
    /**
     * Escape sheet name for Google Sheets API range notation
     * Sheet names with special characters need to be wrapped in single quotes
     */
    private escapeSheetName;
    /**
     * Normalize Vietnamese text by removing diacritics and replacing spaces with underscores
     */
    private normalizeVietnamese;
    /**
     * Format lead data into row array based on headers
     */
    formatLeadData(leadData: LeadData, customHeaders?: string[]): Promise<any[]>;
}
//# sourceMappingURL=sheets.service.d.ts.map