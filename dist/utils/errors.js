"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalAPIError = exports.DuplicateError = exports.NotFoundError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class DuplicateError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}
exports.DuplicateError = DuplicateError;
class ExternalAPIError extends AppError {
    constructor(service, message) {
        super(`${service} API Error: ${message}`, 502);
    }
}
exports.ExternalAPIError = ExternalAPIError;
//# sourceMappingURL=errors.js.map