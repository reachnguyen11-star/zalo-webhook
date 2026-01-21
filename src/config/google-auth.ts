import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from './env.config';
import { logger } from '../utils/logger';
import { clientService } from '../services/client.service';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export class GoogleAuth {
  /**
   * Generate authorization URL for a specific client
   */
  getAuthUrlForClient(clientId: string): string {
    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

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
  async getClientForOAuth(clientId: string): Promise<OAuth2Client> {
    const client = await clientService.getClient(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    if (client.googleOAuthTokens) {
      oauth2Client.setCredentials(client.googleOAuthTokens);

      // Setup auto refresh for this client
      oauth2Client.on('tokens', async (tokens) => {
        logger.info('Tokens refreshed automatically', { clientId });
        if (tokens.refresh_token) {
          // Update refresh token if provided
          oauth2Client.setCredentials({
            ...oauth2Client.credentials,
            refresh_token: tokens.refresh_token,
          });
        }
        await clientService.saveOAuthTokens(clientId, oauth2Client.credentials);
      });
    }

    return oauth2Client;
  }

  /**
   * Check if a client has valid credentials
   */
  async isClientAuthenticated(clientId: string): Promise<boolean> {
    try {
      const client = await clientService.getClient(clientId);
      if (!client || !client.googleOAuthTokens) {
        return false;
      }
      return !!(client.googleOAuthTokens.access_token);
    } catch (error) {
      return false;
    }
  }

  /**
   * Exchange authorization code for tokens and save for client
   */
  async getTokenFromCodeForClient(code: string, clientId: string): Promise<void> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        config.google.clientId,
        config.google.clientSecret,
        config.google.redirectUri
      );

      const { tokens } = await oauth2Client.getToken(code);
      await clientService.saveOAuthTokens(clientId, tokens);
      logger.info('OAuth tokens obtained and saved successfully', { clientId });
    } catch (error) {
      logger.error('Error exchanging code for tokens', { clientId, error });
      throw error;
    }
  }

  /**
   * Manually refresh tokens for a client
   */
  async refreshTokensForClient(clientId: string): Promise<void> {
    try {
      const oauth2Client = await this.getClientForOAuth(clientId);
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      await clientService.saveOAuthTokens(clientId, credentials);
      logger.info('Tokens manually refreshed', { clientId });
    } catch (error) {
      logger.error('Error refreshing tokens', { clientId, error });
      throw error;
    }
  }

  /**
   * Revoke tokens for a client
   */
  async revokeTokensForClient(clientId: string): Promise<void> {
    try {
      const oauth2Client = await this.getClientForOAuth(clientId);
      await oauth2Client.revokeCredentials();
      await clientService.saveOAuthTokens(clientId, null);
      logger.info('Tokens revoked and cleared', { clientId });
    } catch (error) {
      logger.error('Error revoking tokens', { clientId, error });
      throw error;
    }
  }
}

// Singleton instance
export const googleAuth = new GoogleAuth();
