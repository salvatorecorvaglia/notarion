// Application Constants

// Accepted file types for upload
export const ACCEPTED_FILE_TYPES: string[] = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/json',
    'application/zip',
    'application/x-zip-compressed',
    'video/mp4'
];

// File type labels for UI
export const FILE_TYPE_LABELS: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/png': 'PNG',
    'image/jpeg': 'JPEG/JPG',
    'application/json': 'JSON',
    'application/zip': 'ZIP',
    'application/x-zip-compressed': 'ZIP',
    'video/mp4': 'MP4',
};

// Maximum file size in bytes (100 MB)
export const MAX_FILE_SIZE: number = 100 * 1024 * 1024;

// Maximum file size label for UI
export const MAX_FILE_SIZE_LABEL: string = '100 MB';

// Status message keys (match keys in i18n/it.json → status.*)
export const STATUS_MESSAGES = {
    CONNECT_WALLET: 'status.connect_wallet',
    UPLOAD_FILE: 'status.upload_file',
    UPLOADING_IPFS: 'status.uploading_ipfs',
    SAVING_BLOCKCHAIN: 'status.saving_blockchain',
    CONFIRMING_TX: 'status.confirming_tx',
    SUCCESS: 'status.success',
    TX_SUCCESS_DB_FAILED: 'status.tx_success_db_failed',
    TX_FAILED: 'status.tx_failed',
    IPFS_FAILED: 'status.ipfs_failed',
    TX_CANCELLED: 'status.tx_cancelled',
    INSUFFICIENT_FUNDS: 'status.insufficient_funds',
    ERROR: 'status.error',
    INVALID_FILE_TYPE: 'status.invalid_file_type',
    FILE_TOO_LARGE: 'status.file_too_large',
    FILE_ALREADY_EXISTS: 'status.file_already_exists',
} as const;

export type StatusMessageKey = typeof STATUS_MESSAGES[keyof typeof STATUS_MESSAGES];

// Error codes (ethers/MetaMask)
export const ERROR_CODES = {
    USER_REJECTED: 4001,
    INSUFFICIENT_FUNDS: 'insufficient funds',
} as const;

// API timeout settings (in milliseconds)
export const TIMEOUTS = {
    IPFS_UPLOAD: 60000,    // 60 seconds
    BLOCKCHAIN_TX: 120000, // 2 minutes
    DATABASE_SAVE: 10000,  // 10 seconds
} as const;
