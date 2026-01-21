import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  adminPassword: string;
  zalo: {
    appId: string;
    appSecret: string;
    webhookSecret: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  spreadsheetId: string;
  logLevel: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue || '';
}

export const config: EnvConfig = {
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
