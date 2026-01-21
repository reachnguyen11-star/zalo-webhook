import express, { Express, Request, Response } from 'express';
import path from 'path';
import { config } from './config/env.config';
import { logger } from './utils/logger';
import webhookRoutes from './routes/webhook.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/logger';

class App {
  private app: Express;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(requestLogger);

    // CORS (if needed)
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
      });
    });

    // Root endpoint - redirect to admin dashboard
    this.app.get('/', (req: Request, res: Response) => {
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

            <p><small>Environment: ${config.nodeEnv}</small></p>
          </body>
        </html>
      `);
    });

    // API routes (verification files are handled by admin.routes.ts)
    this.app.use('/auth', authRoutes);
    this.app.use('/webhook', webhookRoutes);
    this.app.use('/admin', adminRoutes);

    // Direct callback route (without /auth prefix for Google OAuth)
    this.app.use('/', authRoutes);
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`Server started on port ${this.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Visit http://localhost:${this.port} to get started`);
      logger.info(`Admin dashboard: http://localhost:${this.port}/admin`);
    });
  }
}

// Start the application
const app = new App();
app.start();
