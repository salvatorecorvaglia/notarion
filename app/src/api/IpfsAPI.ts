import apiClient from './axios';
import axios from 'axios';
import { AppError, ERROR_TYPES } from '../errors/AppError';
import { SERVER_URL } from '../config';

export interface IpfsResponse {
    ipfsHash: string;
    pinSize: number;
    timestamp: string;
}

/**
 * Upload a file to IPFS via the backend endpoint.
 * Throws typed AppError on failure.
 */
export const uploadToIpfs = async (
    file: File,
    onProgress?: (progress: number) => void,
    signal: AbortSignal | null = null,
): Promise<IpfsResponse> => {
    if (!file) {
        throw new AppError(ERROR_TYPES.IPFS_UPLOAD_FAILED, 'No file provided for upload.');
    }

    const url = `${SERVER_URL}/api/upload/ipfs`;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await apiClient.post<{ success: boolean; data: IpfsResponse }>(
            url,
            formData,
            {
                timeout: 120000,
                signal: signal ?? undefined,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && typeof onProgress === 'function') {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total,
                        );
                        onProgress(progress);
                    }
                },
                headers: { 'Content-Type': 'multipart/form-data' },
            },
        );

        if (response.data?.success && response.data?.data?.ipfsHash) {
            return response.data.data;
        }

        throw new AppError(
            ERROR_TYPES.IPFS_UPLOAD_FAILED,
            'Unexpected response from server: ' + JSON.stringify(response.data),
        );
    } catch (error) {
        if (error instanceof AppError) throw error;

        if (axios.isCancel(error) || (error as { code?: string })?.code === 'ERR_CANCELED') {
            throw new AppError(ERROR_TYPES.UPLOAD_CANCELLED, 'Upload cancelled', error);
        }

        if (axios.isAxiosError(error)) {
            if (error.response) {
                const msg =
                    (error.response.data as { message?: string; error?: string })?.message ||
                    (error.response.data as { message?: string; error?: string })?.error ||
                    error.message;
                throw new AppError(ERROR_TYPES.IPFS_UPLOAD_FAILED, `Upload failed: ${msg}`, error);
            }
            if (error.request) {
                throw new AppError(
                    ERROR_TYPES.NETWORK_ERROR,
                    'No response from server. Please check your connection.',
                    error,
                );
            }
        }

        throw new AppError(
            ERROR_TYPES.IPFS_UPLOAD_FAILED,
            `Upload failed: ${(error as Error).message}`,
            error,
        );
    }
};

/** Create an AbortController for canceling uploads. */
export const createAbortController = (): AbortController => new AbortController();
