import { useCallback, useState } from 'react';
import axios from 'axios';
import { uploadToIpfs } from '../api/IpfsAPI';
import { STATUS_MESSAGES } from '../constants';
import { SERVER_URL } from '../config';
import { getStatusMessageKey, parseError } from '../errors/errorUtils';
import type { PendingFile } from '../types';


export const useIpfsUpload = () => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [statusKey, setStatusKey] = useState<string | null>(null);

    const uploadFile = useCallback(async (file: File) => {
        setIsUploading(true);
        setStatusKey(STATUS_MESSAGES.UPLOADING_IPFS);
        setUploadProgress(0);

        try {
            const ipfsData = await uploadToIpfs(file, (p) => setUploadProgress(p));
            if (!ipfsData?.ipfsHash) {
                setStatusKey(STATUS_MESSAGES.IPFS_FAILED);
                setIsUploading(false);
                return null;
            }

            // Check if duplicate CID already exists in DB.
            // Uses raw axios (not apiClient) because a 404 here is expected/silent:
            // it means the CID is new and we can proceed.
            // We must pass baseURL explicitly since this is not the apiClient instance.
            try {
                const response = await axios.get(`${SERVER_URL}/api/upload/cid/${ipfsData.ipfsHash}`);
                if (response.data?.success) {
                    setStatusKey(STATUS_MESSAGES.FILE_ALREADY_EXISTS);
                    setIsUploading(false);
                    return null;
                }
            } catch (err: unknown) {
                if (!axios.isAxiosError(err) || err.response?.status !== 404) {
                    console.error('Error checking duplicate CID:', err);
                }
            }

            setIsUploading(false);
            return {
                cid: ipfsData.ipfsHash,
                meta: { name: file.name, size: file.size, type: file.type } as PendingFile
            };
        } catch (error) {
            setStatusKey(getStatusMessageKey(parseError(error)));
            setUploadProgress(0);
            setIsUploading(false);
            return null;
        }
    }, []);

    return { uploadFile, uploadProgress, isUploading, statusKey, setStatusKey };
};
