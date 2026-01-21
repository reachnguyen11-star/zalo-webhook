import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
/**
 * Error handling middleware
 */
export declare function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction): void;
/**
 * 404 handler
 */
export declare function notFoundHandler(req: Request, res: Response): void;
//# sourceMappingURL=error-handler.d.ts.map