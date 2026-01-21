import { Router, Request, Response } from 'express';
import { googleAuth } from '../config/google-auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /auth/google?client_id=xxx - Initiate Google OAuth flow for a specific client
 * Redirects user to Google consent screen
 */
router.get('/google', (req: Request, res: Response) => {
  try {
    const clientId = req.query.client_id as string;

    if (!clientId) {
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Missing Client ID</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                text-align: center;
              }
              .error {
                color: #d32f2f;
              }
            </style>
          </head>
          <body>
            <h1 class="error">Missing Client ID</h1>
            <p>Please provide a client_id parameter in the URL.</p>
            <p>Example: /auth/google?client_id=your_client_id</p>
          </body>
        </html>
      `);
      return;
    }

    const authUrl = googleAuth.getAuthUrlForClient(clientId);
    logger.info('Redirecting to Google OAuth', { clientId, authUrl });

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google OAuth Authorization</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            .btn {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4285f4;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-size: 16px;
              margin-top: 20px;
            }
            .btn:hover {
              background-color: #357ae8;
            }
            .client-info {
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <h1>Google Sheets Authorization</h1>
          <div class="client-info">
            <strong>Client ID:</strong> ${clientId}
          </div>
          <p>Click the button below to authorize this application to access your Google Sheets.</p>
          <p>You will be redirected to Google to grant permissions.</p>
          <a href="${authUrl}" class="btn">Authorize with Google</a>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error('Error initiating OAuth flow', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate OAuth flow',
    });
  }
});

/**
 * GET /oauth2callback - OAuth callback handler
 * Receives authorization code from Google and exchanges for tokens
 */
router.get('/oauth2callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string; // Contains client_id

    if (!code) {
      logger.warn('No authorization code received');
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Failed</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                text-align: center;
              }
              .error {
                color: #d32f2f;
              }
            </style>
          </head>
          <body>
            <h1 class="error">Authorization Failed</h1>
            <p>No authorization code received from Google.</p>
            <p>Please try again.</p>
          </body>
        </html>
      `);
      return;
    }

    if (!state) {
      logger.warn('No client ID in state parameter');
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Failed</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                text-align: center;
              }
              .error {
                color: #d32f2f;
              }
            </style>
          </head>
          <body>
            <h1 class="error">Authorization Failed</h1>
            <p>Missing client information.</p>
            <p>Please try again from the admin dashboard.</p>
          </body>
        </html>
      `);
      return;
    }

    // Exchange code for tokens and save for this client
    await googleAuth.getTokenFromCodeForClient(code, state);

    logger.info('OAuth flow completed successfully', { clientId: state });

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            .success {
              color: #388e3c;
            }
            .client-info {
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .btn {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4285f4;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-size: 16px;
              margin-top: 20px;
            }
            .btn:hover {
              background-color: #357ae8;
            }
          </style>
        </head>
        <body>
          <h1 class="success">✓ Authorization Successful!</h1>
          <div class="client-info">
            <strong>Client ID:</strong> ${state}
          </div>
          <p>This client is now connected to Google Sheets.</p>
          <p>You can now start receiving leads from Zalo Ads.</p>
          <a href="/admin" class="btn">Back to Admin Dashboard</a>
        </body>
      </html>
    `);
  } catch (error: any) {
    logger.error('Error in OAuth callback', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Error</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            .error {
              color: #d32f2f;
            }
          </style>
        </head>
        <body>
          <h1 class="error">Authorization Error</h1>
          <p>An error occurred during authorization:</p>
          <p><code>${error.message}</code></p>
          <p>Please try again.</p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /auth/status?client_id=xxx - Check authentication status for a client
 */
router.get('/status', async (req: Request, res: Response) => {
  const clientId = req.query.client_id as string;

  if (!clientId) {
    res.status(400).json({
      success: false,
      message: 'client_id parameter is required',
    });
    return;
  }

  const isAuthenticated = await googleAuth.isClientAuthenticated(clientId);

  res.json({
    success: true,
    authenticated: isAuthenticated,
    message: isAuthenticated
      ? 'Client is connected to Google Sheets'
      : 'Client not authenticated. Please authorize via /auth/google?client_id=' + clientId,
  });
});

export default router;
