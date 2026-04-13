import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AppError, ERROR_CODES } from './errorHandler';

export const validate = (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array().map((e) => e.msg).join(', ');
        return next(new AppError(message, 400, ERROR_CODES.VALIDATION));
    }
    next();
};
