"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const env_config_1 = require("../config/env.config");
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
class Logger {
    constructor() {
        this.currentLevel = LOG_LEVELS[env_config_1.config.logLevel] || LOG_LEVELS.info;
    }
    shouldLog(level) {
        return LOG_LEVELS[level] >= this.currentLevel;
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }
    debug(message, meta) {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, meta));
        }
    }
    info(message, meta) {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message, meta));
        }
    }
    warn(message, meta) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }
    error(message, error) {
        if (this.shouldLog('error')) {
            const errorDetails = error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error;
            console.error(this.formatMessage('error', message, errorDetails));
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map