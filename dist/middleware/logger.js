"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("../utils/logger");
/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info('HTTP Request', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('user-agent'),
        });
    });
    next();
}
//# sourceMappingURL=logger.js.map