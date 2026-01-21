import { OAuth2Client } from 'google-auth-library';
export declare class GoogleAuth {
    /**
     * Generate authorization URL for a specific client
     */
    getAuthUrlForClient(clientId: string): string;
    /**
     * Get OAuth2 client for a specific client with their tokens
     */
    getClientForOAuth(clientId: string): Promise<OAuth2Client>;
    /**
     * Check if a client has valid credentials
     */
    isClientAuthenticated(clientId: string): Promise<boolean>;
    /**
     * Exchange authorization code for tokens and save for client
     */
    getTokenFromCodeForClient(code: string, clientId: string): Promise<void>;
    /**
     * Manually refresh tokens for a client
     */
    refreshTokensForClient(clientId: string): Promise<void>;
    /**
     * Revoke tokens for a client
     */
    revokeTokensForClient(clientId: string): Promise<void>;
}
export declare const googleAuth: GoogleAuth;
//# sourceMappingURL=google-auth.d.ts.map