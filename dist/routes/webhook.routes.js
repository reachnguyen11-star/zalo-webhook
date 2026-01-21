"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
/**
 * GET /webhook/zalo - Webhook verification
 * Used by Zalo to verify webhook URL during setup
 */
router.get('/zalo', (req, res) => webhook_controller_1.webhookController.verifyWebhook(req, res));
/**
 * POST /webhook/zalo - Receive webhook events
 * Main endpoint for receiving Zalo form submissions
 */
router.post('/zalo', (req, res, next) => webhook_controller_1.webhookController.handleZaloWebhook(req, res, next));
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map