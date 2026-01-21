"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const env_config_1 = require("./config/env.config");
const logger_1 = require("./utils/logger");
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const error_handler_1 = require("./middleware/error-handler");
const logger_2 = require("./middleware/logger");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = env_config_1.config.port;
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddlewares() {
        // Body parser
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Request logging
        this.app.use(logger_2.requestLogger);
        // CORS (if needed)
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
    }
    initializeRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'Server is running',
                timestamp: new Date().toISOString(),
            });
        });
        // Root endpoint - redirect to admin dashboard
        this.app.get('/', (req, res) => {
            res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Zalo Ads to Google Sheets - Multi-Client</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                text-align: center;
              }
              h1 {
                color: #0068ff;
              }
              .btn {
                display: inline-block;
                padding: 15px 30px;
                background-color: #0068ff;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                margin: 20px 5px;
                font-size: 18px;
              }
              .btn:hover {
                background-color: #0056d6;
              }
              .description {
                margin: 20px 0;
                color: #666;
              }
            </style>
          </head>
          <body>
            <h1>Zalo Ads to Google Sheets Integration</h1>
            <p class="description">Multi-client lead management system for Zalo Ads campaigns</p>

            <a href="/admin" class="btn">Go to Admin Dashboard</a>

            <p class="description">
              Manage multiple clients, configure Google Sheets, and monitor webhook endpoints from the admin dashboard.
            </p>

            <p><small>Environment: ${env_config_1.config.nodeEnv}</small></p>
          </body>
        </html>
      `);
        });
        // API routes (verification files are handled by admin.routes.ts)
        this.app.use('/auth', auth_routes_1.default);
        this.app.use('/webhook', webhook_routes_1.default);
        this.app.use('/admin', admin_routes_1.default);
        // Direct callback route (without /auth prefix for Google OAuth)
        this.app.use('/', auth_routes_1.default);
    }
    initializeErrorHandling() {
        // 404 handler
        this.app.use(error_handler_1.notFoundHandler);
        // Error handler
        this.app.use(error_handler_1.errorHandler);
    }
    start() {
        this.app.listen(this.port, () => {
            logger_1.logger.info(`Server started on port ${this.port}`);
            logger_1.logger.info(`Environment: ${env_config_1.config.nodeEnv}`);
            logger_1.logger.info(`Visit http://localhost:${this.port} to get started`);
            logger_1.logger.info(`Admin dashboard: http://localhost:${this.port}/admin`);
        });
    }
}
// Start the application
const app = new App();
app.start();
//# sourceMappingURL=index.js.map