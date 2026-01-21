"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuth = exports.GoogleAuth = void 0;
const googleapis_1 = require("googleapis");
const env_config_1 = require("./env.config");
const logger_1 = require("../utils/logger");
const client_service_1 = require("../services/client.service");
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
class GoogleAuth {
    /**
     * Generate authorization URL for a specific client
     */
    getAuthUrlForClient(clientId) {
        const oauth2Client = new googleapis_1.google.auth.OAuth2(env_config_1.config.google.clientId, env_config_1.config.google.clientSecret, env_config_1.config.google.redirectUri);
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent', // Force consent screen to get refresh token
            state: clientId, // Pass client ID through state parameter
        });
    }
    /**
     * Get OAuth2 client for a specific client with their tokens
     */
    async getClientForOAuth(clientId) {
        const client = await client_service_1.clientService.getClient(clientId);
        if (!client) {
            throw new Error(`Client not found: ${clientId}`);
        }
        const oauth2Client = new googleapis_1.google.auth.OAuth2(env_config_1.config.google.clientId, env_config_1.config.google.clientSecret, env_config_1.config.google.redirectUri);
        if (client.googleOAuthTokens) {
            oauth2Client.setCredentials(client.googleOAuthTokens);
            // Setup auto refresh for this client
            oauth2Client.on('tokens', async (tokens) => {
                logger_1.logger.info('Tokens refreshed automatically', { clientId });
                if (tokens.refresh_token) {
                    // Update refresh token if provided
                    oauth2Client.setCredentials({
                        ...oauth2Client.credentials,
                        refresh_token: tokens.refresh_token,
                    });
                }
                await client_service_1.clientService.saveOAuthTokens(clientId, oauth2Client.credentials);
            });
        }
        return oauth2Client;
    }
    /**
     * Check if a client has valid credentials
     */
    async isClientAuthenticated(clientId) {
        try {
            const client = await client_service_1.clientService.getClient(clientId);
            if (!client || !client.googleOAuthTokens) {
                return false;
            }
            return !!(client.googleOAuthTokens.access_token);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Exchange authorization code for tokens and save for client
     */
    async getTokenFromCodeForClient(code, clientId) {
        try {
            const oauth2Client = new googleapis_1.google.auth.OAuth2(env_config_1.config.google.clientId, env_config_1.config.google.clientSecret, env_config_1.config.google.redirectUri);
            const { tokens } = await oauth2Client.getToken(code);
            await client_service_1.clientService.saveOAuthTokens(clientId, tokens);
            logger_1.logger.info('OAuth tokens obtained and saved successfully', { clientId });
        }
        catch (error) {
            logger_1.logger.error('Error exchanging code for tokens', { clientId, error });
            throw error;
        }
    }
    /**
     * Manually refresh tokens for a client
     */
    async refreshTokensForClient(clientId) {
        try {
            const oauth2Client = await this.getClientForOAuth(clientId);
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
            await client_service_1.clientService.saveOAuthTokens(clientId, credentials);
            logger_1.logger.info('Tokens manually refreshed', { clientId });
        }
        catch (error) {
            logger_1.logger.error('Error refreshing tokens', { clientId, error });
            throw error;
        }
    }
    /**
     * Revoke tokens for a client
     */
    async revokeTokensForClient(clientId) {
        try {
            const oauth2Client = await this.getClientForOAuth(clientId);
            await oauth2Client.revokeCredentials();
            await client_service_1.clientService.saveOAuthTokens(clientId, null);
            logger_1.logger.info('Tokens revoked and cleared', { clientId });
        }
        catch (error) {
            logger_1.logger.error('Error revoking tokens', { clientId, error });
            throw error;
        }
    }
}
exports.GoogleAuth = GoogleAuth;
// Singleton instance
exports.googleAuth = new GoogleAuth();
//# sourceMappingURL=google-auth.js.map