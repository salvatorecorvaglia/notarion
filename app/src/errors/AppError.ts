/**
 * Centralized error types for the frontend application.
 */

export const ERROR_TYPES = {
    // MetaMask / wallet
    USER_REJECTED: 'USER_REJECTED',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    METAMASK_NOT_FOUND: 'METAMASK_NOT_FOUND',
    WALLET_CONNECTION: 'WALLET_CONNECTION',

    // IPFS
    IPFS_UPLOAD_FAILED: 'IPFS_UPLOAD_FAILED',
    UPLOAD_CANCELLED: 'UPLOAD_CANCELLED',

    // Blockchain
    TX_FAILED: 'TX_FAILED',
    NETWORK_ERROR: 'NETWORK_ERROR',

    // Database
    DB_SAVE_FAILED: 'DB_SAVE_FAILED',

    // File validation
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',

    // Generic
    UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];

/** Typed application error for the frontend. */
export class AppError extends Error {
    public readonly type: ErrorType;
    public readonly originalError: Error | unknown | null;

    constructor(
        type: ErrorType = ERROR_TYPES.UNKNOWN,
        message = 'An unknown error occurred',
        originalError: Error | unknown | null = null,
    ) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.originalError = originalError;
    }
}
