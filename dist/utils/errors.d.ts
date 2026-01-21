export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class DuplicateError extends AppError {
    constructor(message: string);
}
export declare class ExternalAPIError extends AppError {
    constructor(service: string, message: string);
}
//# sourceMappingURL=errors.d.ts.map