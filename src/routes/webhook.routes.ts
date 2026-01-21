import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';

const router = Router();

/**
 * GET /webhook/zalo - Webhook verification
 * Used by Zalo to verify webhook URL during setup
 */
router.get('/zalo', (req, res) => webhookController.verifyWebhook(req, res));

/**
 * POST /webhook/zalo - Receive webhook events
 * Main endpoint for receiving Zalo form submissions
 */
router.post('/zalo', (req, res, next) => webhookController.handleZaloWebhook(req, res, next));

export default router;
