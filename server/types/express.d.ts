/**
 * TypeScript augmentation for Express.Request.
 * Adds the `requestId` property injected by the requestLogger middleware.
 */
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}

export {};
