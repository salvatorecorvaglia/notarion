import { NextFunction, Request, Response } from 'express';

/**
 * Wrapper for async route controllers.
 * Catches any rejected promises and passes the error to the Express next() middleware.
 * This eliminates the need for try-catch blocks in every async controller.
 */
export const catchAsync = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
