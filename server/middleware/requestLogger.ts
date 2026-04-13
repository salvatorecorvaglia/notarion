import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';

const generateRequestId = (): string =>
    `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
    req.requestId = generateRequestId();
    res.setHeader('X-Request-ID', req.requestId);
    next();
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    logger.debug({
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    }, '📥 Incoming Request');

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const log = {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        };
        if (res.statusCode >= 500) {
            logger.error(log, '❌ Response');
        } else if (res.statusCode >= 400) {
            logger.warn(log, '⚠️  Response');
        } else {
            logger.debug(log, '✅ Response');
        }
    });

    next();
};
