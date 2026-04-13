import { NextFunction, Request, Response } from 'express';
import config from '../config/config';
import logger from '../utils/logger';

// ─── Error codes ────────────────────────────────────────────────────────────
export const ERROR_CODES = {
    VALIDATION: 'ERR_VALIDATION',
    NOT_FOUND: 'ERR_NOT_FOUND',
    DUPLICATE: 'ERR_DUPLICATE',
    IPFS_CONFIG: 'ERR_IPFS_CONFIG',
    IPFS_UPLOAD: 'ERR_IPFS_UPLOAD',
    FILE_MISSING: 'ERR_FILE_MISSING',
    FILE_TYPE: 'ERR_FILE_TYPE',
    FILE_SIZE: 'ERR_FILE_SIZE',
    CORS: 'ERR_CORS',
    RATE_LIMIT: 'ERR_RATE_LIMIT',
    INTERNAL: 'ERR_INTERNAL',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ─── AppError class ──────────────────────────────────────────────────────────
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: ErrorCode;
    public readonly isOperational: boolean;
    public readonly timestamp: string;

    constructor(
        message: string,
        statusCode: number,
        errorCode: ErrorCode = ERROR_CODES.INTERNAL,
        isOperational = true,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

// ─── Middleware ──────────────────────────────────────────────────────────────
export const errorHandler = (
    err: Error & { statusCode?: number; errorCode?: string; code?: number | string; name?: string },
    req: Request,
    res: Response,
     
    _next: NextFunction,
): void => {
    // If headers already sent, cannot send error response
    if (res.headersSent) {
        logger.error({ err }, '[ErrorHandler] Headers already sent, cannot send error response');
        return;
    }

    const isDevelopment = config.NODE_ENV !== 'production';

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errorCode: string = err.errorCode || ERROR_CODES.INTERNAL;

    // Use if/else if to prevent override of earlier matches
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid resource ID';
        errorCode = ERROR_CODES.VALIDATION;
    } else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value: resource already exists';
        errorCode = ERROR_CODES.DUPLICATE;
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
        const valErr = err as unknown as { errors: Record<string, { message: string }> };
        message = Object.values(valErr.errors).map((v) => v.message).join(', ');
        errorCode = ERROR_CODES.VALIDATION;
    } else if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File size exceeds the maximum allowed limit';
        errorCode = ERROR_CODES.FILE_SIZE;
    } else if (err.message?.includes('CORS')) {
        statusCode = 403;
        errorCode = ERROR_CODES.CORS;
    }

    logger.error({
        errorCode,
        message,
        statusCode,
        path: req.path,
        method: req.method,
        requestId: req.requestId,
        ...(isDevelopment && { stack: err.stack }),
    }, '[ErrorHandler]');

    res.status(statusCode).json({
        success: false,
        errorCode,
        error: message,
        ...(req.requestId && { requestId: req.requestId }),
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: err.stack }),
    });
};
