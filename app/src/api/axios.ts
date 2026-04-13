import axios from 'axios';
import { getStatusMessageKey, parseError } from '../errors/errorUtils';
import { SERVER_URL } from '../config';

const axiosInstance = axios.create({
    baseURL: SERVER_URL,
});

// Add a response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // No error, forward the response
        return response;
    },
    (error) => {
        // If there's an error, parse it into AppError
        const appError = parseError(error);

        // If the error is not intentionally cancelled, show it globally
        if (appError.type !== 'UPLOAD_CANCELLED') {
            const messageKey = getStatusMessageKey(appError);
            // Emit a custom event that will be caught by GlobalNotification
            globalThis.dispatchEvent(
                new CustomEvent('app-notification', {
                    detail: { type: 'error', messageKey, originalMessage: appError.message },
                })
            );
        }

        // Re-throw the error so the local chain can handle it (if necessary)
        return Promise.reject(appError);
    }
);

export default axiosInstance;
