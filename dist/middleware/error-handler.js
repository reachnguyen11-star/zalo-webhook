"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
/**
 * Error handling middleware
 */
function errorHandler(err, req, res, next) {
    if (err instanceof errors_1.AppError) {
        logger_1.logger.error('Application error', {
            message: err.message,
            statusCode: err.statusCode,
            path: req.path,
        });
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }
    else {
        logger_1.logger.error('Unexpected error', {
            message: err.message,
            stack: err.stack,
            path: req.path,
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && {
                error: err.message,
                stack: err.stack,
            }),
        });
    }
}
/**
 * 404 handler
 */
function notFoundHandler(req, res) {
    logger_1.logger.warn('Route not found', { path: req.path, method: req.method });
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
    });
}
//# sourceMappingURL=error-handler.js.map