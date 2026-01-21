"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientService = exports.ClientService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
const CLIENTS_FILE = path.join(process.cwd(), 'clients.json');
class ClientService {
    constructor() {
        this.clients = {};
        this.loadClients();
    }
    /**
     * Load clients from JSON file
     */
    loadClients() {
        try {
            if (fs.existsSync(CLIENTS_FILE)) {
                const data = fs.readFileSync(CLIENTS_FILE, 'utf-8');
                this.clients = JSON.parse(data);
                logger_1.logger.info(`Loaded ${Object.keys(this.clients).length} clients`);
            }
            else {
                this.saveClients();
                logger_1.logger.info('Created new clients database');
            }
        }
        catch (error) {
            logger_1.logger.error('Error loading clients', error);
            this.clients = {};
        }
    }
    /**
     * Save clients to JSON file
     */
    saveClients() {
        try {
            fs.writeFileSync(CLIENTS_FILE, JSON.stringify(this.clients, null, 2));
            logger_1.logger.debug('Clients saved to file');
        }
        catch (error) {
            logger_1.logger.error('Error saving clients', error);
            throw error;
        }
    }
    /**
     * Get all clients
     */
    getAllClients() {
        return Object.values(this.clients);
    }
    /**
     * Get client by ID
     */
    getClient(clientId) {
        return this.clients[clientId] || null;
    }
    /**
     * Create new client
     */
    createClient(name, googleSheetId) {
        const clientId = this.generateClientId(name);
        if (this.clients[clientId]) {
            throw new Error(`Client ID ${clientId} already exists`);
        }
        const client = {
            id: clientId,
            name,
            googleSheetId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.clients[clientId] = client;
        this.saveClients();
        logger_1.logger.info(`Created new client: ${clientId}`);
        return client;
    }
    /**
     * Update client
     */
    updateClient(clientId, updates) {
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
        logger_1.logger.info(`Updated client: ${clientId}`);
        return this.clients[clientId];
    }
    /**
     * Delete client
     */
    deleteClient(clientId) {
        if (!this.clients[clientId]) {
            throw new Error(`Client ${clientId} not found`);
        }
        delete this.clients[clientId];
        this.saveClients();
        logger_1.logger.info(`Deleted client: ${clientId}`);
    }
    /**
     * Save OAuth tokens for client
     */
    async saveOAuthTokens(clientId, tokens) {
        const client = this.clients[clientId];
        if (!client) {
            throw new Error(`Client ${clientId} not found`);
        }
        this.clients[clientId].googleOAuthTokens = tokens;
        this.clients[clientId].updatedAt = new Date().toISOString();
        this.saveClients();
        logger_1.logger.info(`Saved OAuth tokens for client: ${clientId}`);
    }
    /**
     * Check if client is authenticated
     */
    isAuthenticated(clientId) {
        const client = this.clients[clientId];
        return !!(client && client.googleOAuthTokens && client.googleOAuthTokens.access_token);
    }
    /**
     * Generate client ID from name
     */
    generateClientId(name) {
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
exports.ClientService = ClientService;
// Singleton instance
exports.clientService = new ClientService();
//# sourceMappingURL=client.service.js.map