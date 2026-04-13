const getEnvVar = (name: string): string => {
    const value = import.meta.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

export const SERVER_URL: string = getEnvVar('VITE_SERVER_URL');
export const IPFS_GATEWAY_URL: string = getEnvVar('VITE_IPFS_GATEWAY_URL');