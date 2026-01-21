export interface Client {
    id: string;
    name: string;
    googleSheetId: string;
    googleOAuthTokens?: any;
    createdAt: string;
    updatedAt: string;
}
export interface ClientsDatabase {
    [clientId: string]: Client;
}
export declare class ClientService {
    private clients;
    constructor();
    /**
     * Load clients from JSON file
     */
    private loadClients;
    /**
     * Save clients to JSON file
     */
    private saveClients;
    /**
     * Get all clients
     */
    getAllClients(): Client[];
    /**
     * Get client by ID
     */
    getClient(clientId: string): Client | null;
    /**
     * Create new client
     */
    createClient(name: string, googleSheetId: string): Client;
    /**
     * Update client
     */
    updateClient(clientId: string, updates: Partial<Client>): Client;
    /**
     * Delete client
     */
    deleteClient(clientId: string): void;
    /**
     * Save OAuth tokens for client
     */
    saveOAuthTokens(clientId: string, tokens: any): Promise<void>;
    /**
     * Check if client is authenticated
     */
    isAuthenticated(clientId: string): boolean;
    /**
     * Generate client ID from name
     */
    private generateClientId;
}
export declare const clientService: ClientService;
//# sourceMappingURL=client.service.d.ts.map