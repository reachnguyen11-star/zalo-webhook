"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getEnvVar(key, defaultValue) {
    const value = process.env[key];
    if (!value && !defaultValue) {
        throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value || defaultValue || '';
}
exports.config = {
    port: parseInt(getEnvVar('PORT', '3000'), 10),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    adminPassword: getEnvVar('ADMIN_PASSWORD', 'admin123'),
    zalo: {
        appId: getEnvVar('ZALO_APP_ID'),
        appSecret: getEnvVar('ZALO_APP_SECRET'),
        webhookSecret: getEnvVar('ZALO_WEBHOOK_SECRET'),
    },
    google: {
        clientId: getEnvVar('GOOGLE_CLIENT_ID'),
        clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
        redirectUri: getEnvVar('GOOGLE_REDIRECT_URI'),
    },
    spreadsheetId: getEnvVar('SPREADSHEET_ID'),
    logLevel: getEnvVar('LOG_LEVEL', 'info'),
};
//# sourceMappingURL=env.config.js.map