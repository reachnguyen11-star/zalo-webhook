import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

const CLIENTS_FILE = path.join(process.cwd(), 'clients.json');

export interface Client {
  id: string;
  name: string;
  googleSheetId: string;
  sheetName?: string; // Optional: specific sheet tab name (default: first sheet)
  googleOAuthTokens?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ClientsDatabase {
  [clientId: string]: Client;
}

export class ClientService {
  private clients: ClientsDatabase = {};

  constructor() {
    this.loadClients();
  }

  /**
   * Load clients from JSON file
   */
  private loadClients(): void {
    try {
      if (fs.existsSync(CLIENTS_FILE)) {
        const data = fs.readFileSync(CLIENTS_FILE, 'utf-8');
        this.clients = JSON.parse(data);
        logger.info(`Loaded ${Object.keys(this.clients).length} clients`);
      } else {
        this.saveClients();
        logger.info('Created new clients database');
      }
    } catch (error) {
      logger.error('Error loading clients', error);
      this.clients = {};
    }
  }

  /**
   * Save clients to JSON file
   */
  private saveClients(): void {
    try {
      fs.writeFileSync(CLIENTS_FILE, JSON.stringify(this.clients, null, 2));
      logger.debug('Clients saved to file');
    } catch (error) {
      logger.error('Error saving clients', error);
      throw error;
    }
  }

  /**
   * Get all clients
   */
  getAllClients(): Client[] {
    return Object.values(this.clients);
  }

  /**
   * Get client by ID
   */
  getClient(clientId: string): Client | null {
    return this.clients[clientId] || null;
  }

  /**
   * Create new client
   */
  createClient(name: string, googleSheetId: string, sheetName?: string): Client {
    const clientId = this.generateClientId(name);

    if (this.clients[clientId]) {
      throw new Error(`Client ID ${clientId} already exists`);
    }

    const client: Client = {
      id: clientId,
      name,
      googleSheetId,
      sheetName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.clients[clientId] = client;
    this.saveClients();

    logger.info(`Created new client: ${clientId}`);
    return client;
  }

  /**
   * Update client
   */
  updateClient(clientId: string, updates: Partial<Client>): Client {
    const client = this.clients[clientId];
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    this.clients[clientId] = {
      ...client,
      ...updates,
      id: clientId, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };

    this.saveClients();
    logger.info(`Updated client: ${clientId}`);
    return this.clients[clientId];
  }

  /**
   * Delete client
   */
  deleteClient(clientId: string): void {
    if (!this.clients[clientId]) {
      throw new Error(`Client ${clientId} not found`);
    }

    delete this.clients[clientId];
    this.saveClients();
    logger.info(`Deleted client: ${clientId}`);
  }

  /**
   * Save OAuth tokens for client
   */
  async saveOAuthTokens(clientId: string, tokens: any): Promise<void> {
    const client = this.clients[clientId];
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    this.clients[clientId].googleOAuthTokens = tokens;
    this.clients[clientId].updatedAt = new Date().toISOString();
    this.saveClients();

    logger.info(`Saved OAuth tokens for client: ${clientId}`);
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(clientId: string): boolean {
    const client = this.clients[clientId];
    return !!(client && client.googleOAuthTokens && client.googleOAuthTokens.access_token);
  }

  /**
   * Generate client ID from name
   */
  private generateClientId(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    // Add random suffix to ensure uniqueness
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}_${suffix}`;
  }
}

// Singleton instance
export const clientService = new ClientService();
