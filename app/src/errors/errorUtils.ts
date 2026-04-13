import { AppError, ERROR_TYPES } from './AppError';
import { ERROR_CODES, STATUS_MESSAGES } from '../constants';

/**
 * Parses any caught error into a typed AppError.
 */
export const parseError = (error: unknown): AppError => {
    if (error instanceof AppError) return error;

    const err = error as Record<string, unknown>;
    const message = typeof err?.message === 'string' ? err.message : '';
    const code = err?.code;

    if (message === 'Upload cancelled' || code === 'ERR_CANCELED') {
        return new AppError(ERROR_TYPES.UPLOAD_CANCELLED, message, error);
    }
    if (code === 'ACTION_REJECTED' || code === ERROR_CODES.USER_REJECTED || code === 4001) {
        return new AppError(ERROR_TYPES.USER_REJECTED, message, error);
    }
    if (
        message.toLowerCase().includes(String(ERROR_CODES.INSUFFICIENT_FUNDS)) ||
        message.toLowerCase().includes('insufficient funds')
    ) {
        return new AppError(ERROR_TYPES.INSUFFICIENT_FUNDS, message, error);
    }
    if (message.toLowerCase().includes('metamask') && message.toLowerCase().includes('not found')) {
        return new AppError(ERROR_TYPES.METAMASK_NOT_FOUND, message, error);
    }
    if (code === 'ERR_NETWORK' || code === 'ECONNREFUSED' || message.includes('No response from server')) {
        return new AppError(ERROR_TYPES.NETWORK_ERROR, message, error);
    }
    if (message.toLowerCase().includes('upload failed') || message.toLowerCase().includes('ipfs')) {
        return new AppError(ERROR_TYPES.IPFS_UPLOAD_FAILED, message, error);
    }
    if (message.toLowerCase().includes('database') || message.toLowerCase().includes('db')) {
        return new AppError(ERROR_TYPES.DB_SAVE_FAILED, message, error);
    }

    return new AppError(ERROR_TYPES.UNKNOWN, message || 'An unknown error occurred', error);
};

/**
 * Maps a typed AppError to the corresponding i18n key from STATUS_MESSAGES.
 * The caller is responsible for calling t(key) to get the translated string.
 */
export const getStatusMessageKey = (appError: AppError): string => {
    const map: Record<string, string> = {
        [ERROR_TYPES.USER_REJECTED]: STATUS_MESSAGES.TX_CANCELLED,
        [ERROR_TYPES.INSUFFICIENT_FUNDS]: STATUS_MESSAGES.INSUFFICIENT_FUNDS,
        [ERROR_TYPES.METAMASK_NOT_FOUND]: 'status.metamask_not_found',
        [ERROR_TYPES.WALLET_CONNECTION]: 'status.wallet_connection_failed',
        [ERROR_TYPES.IPFS_UPLOAD_FAILED]: STATUS_MESSAGES.IPFS_FAILED,
        [ERROR_TYPES.UPLOAD_CANCELLED]: STATUS_MESSAGES.TX_CANCELLED,
        [ERROR_TYPES.TX_FAILED]: STATUS_MESSAGES.TX_FAILED,
        [ERROR_TYPES.NETWORK_ERROR]: 'status.network_error',
        [ERROR_TYPES.DB_SAVE_FAILED]: STATUS_MESSAGES.TX_SUCCESS_DB_FAILED,
        [ERROR_TYPES.INVALID_FILE_TYPE]: STATUS_MESSAGES.INVALID_FILE_TYPE,
        [ERROR_TYPES.FILE_TOO_LARGE]: STATUS_MESSAGES.FILE_TOO_LARGE,
        [ERROR_TYPES.UNKNOWN]: STATUS_MESSAGES.ERROR,
    };
    return map[appError.type] ?? STATUS_MESSAGES.ERROR;
};

/** @deprecated Use getStatusMessageKey + t() instead */
export const getStatusMessage = getStatusMessageKey;
