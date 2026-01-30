import { Request, Response, NextFunction } from 'express';
import { logger, logError } from '../utils/logger';

// Custom error class for application errors
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Global error handler middleware
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Log the error with context
    logError(err, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: (req as any).user?.id,
        tenantId: (req as any).user?.tenantId,
        body: req.body,
        query: req.query,
    });

    // Determine status code
    const statusCode = err instanceof AppError ? err.statusCode : 500;

    // Determine if error details should be exposed
    const isProduction = process.env.NODE_ENV === 'production';
    const isOperational = err instanceof AppError ? err.isOperational : false;

    // Build error response
    const errorResponse: any = {
        status: 'error',
        message: err.message || 'Internal server error',
    };

    // In development or for operational errors, include more details
    if (!isProduction || isOperational) {
        errorResponse.stack = err.stack;
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
};

// Async error wrapper - catches async errors and passes to error handler
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
    next(error);
};
