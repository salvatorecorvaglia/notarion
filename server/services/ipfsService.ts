import axios from 'axios';
import FormData from 'form-data';
import { AppError, ERROR_CODES } from '../middleware/errorHandler';
import config from '../config/config';
import logger from '../utils/logger';

interface IpfsApiResponse {
    Name: string;
    Hash: string;
    Size: string;
}

export const uploadFileToIpfs = async (
    file: Express.Multer.File,
    sanitizedName: string
): Promise<{ IpfsHash: string; PinSize: number; Timestamp: string }> => {
    const ipfsUrl = config.IPFS_API_URL;
    const timeout = config.IPFS_TIMEOUT;
    const maxRetries = config.IPFS_MAX_RETRIES;

    const formData = new FormData();
    formData.append('file', file.buffer, { filename: sanitizedName, contentType: file.mimetype });

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logger.debug({ attempt, maxRetries, file: sanitizedName }, '[IpfsService] Upload attempt');
            // Kubo IPFS add endpoint
            const response = await axios.post<IpfsApiResponse>(`${ipfsUrl}/api/v0/add`, formData, {
                maxContentLength: config.MAX_FILE_SIZE, // Match configured max file size
                maxBodyLength: config.MAX_FILE_SIZE,
                timeout,
                headers: {
                    ...formData.getHeaders()
                },
                // Kubo API might require query parameters like ?pin=true, it is true by default
            });

            if (response.data?.Hash) {
                logger.info({ attempt, hash: response.data.Hash }, '[IpfsService] Upload successful');

                // Copy the file to MFS (Mutable File System) so it shows up in the IPFS Web UI 'Files' tab
                try {
                    // Create a directory first just in case (ignore error if it exists)
                    await axios.post(`${ipfsUrl}/api/v0/files/mkdir?arg=/notarion&parents=true`);

                    // Copy the pinned hash to the MFS directory
                    const mfsPath = `/notarion/${sanitizedName.replaceAll(/[^a-zA-Z0-9.-]/g, '_')}`;
                    await axios.post(`${ipfsUrl}/api/v0/files/cp?arg=${encodeURIComponent(`/ipfs/${response.data.Hash}`)}&arg=${encodeURIComponent(mfsPath)}`);
                    logger.debug({ mfsPath }, '[IpfsService] File linked to MFS');
                } catch (mfsErr) {
                    // We don't want to fail the whole upload just because the Web UI link failed
                    logger.warn({ err: mfsErr }, '[IpfsService] Failed to copy to MFS (Web UI)');
                }

                return {
                    IpfsHash: response.data.Hash,
                    PinSize: Number.parseInt(response.data.Size, 10),
                    Timestamp: new Date().toISOString()
                };
            }
            throw new Error('Unexpected response from IPFS node');
        } catch (err) {
            lastError = err;
            logger.warn({ err, attempt }, `[IpfsService] Attempt ${attempt} failed`);
            if (attempt < maxRetries) {
                const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 10000) + Math.random() * 500;
                await new Promise((r) => setTimeout(r, backoff));
            }
        }
    }

    if (axios.isAxiosError(lastError) && lastError.response) {
        throw new AppError(
            `IPFS upload failed: ${lastError.response.data?.Message ?? lastError.message}`,
            lastError.response.status || 502,
            ERROR_CODES.IPFS_UPLOAD
        );
    }
    throw new AppError('Failed to upload file to IPFS after multiple attempts', 502, ERROR_CODES.IPFS_UPLOAD);
};
