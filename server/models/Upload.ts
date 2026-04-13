import mongoose, { Document, Model, Schema } from 'mongoose';
import { isAddress } from 'ethers';
import { EXPLORER_BASE } from '../constants/networks';
import config from '../config/config';

// ── Document interface ────────────────────────────────────────────────────────
export interface IUpload extends Document {
    cid: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    walletAddress?: string;
    transactionHash?: string;
    blockchainTimestamp?: Date;
    // virtuals
    ipfsUrl: string;
    explorerUrl: string | null;
    getIpfsUrl(customGateway?: string): string;
    getExplorerUrl(network?: string): string | null;
}

// ── CID validators ────────────────────────────────────────────────────────────
const validateCID = (cid: string): boolean =>
    /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid) || /^b[a-z2-7]{58,}$/.test(cid);

const validateEthereumAddress = (address: string): boolean =>
    !address || isAddress(address);

const validateTransactionHash = (hash: string): boolean =>
    !hash || /^0x[a-fA-F0-9]{64}$/.test(hash);

// ── Schema ────────────────────────────────────────────────────────────────────
const UploadSchema = new Schema<IUpload>(
    {
        cid: {
            type: String,
            required: [true, 'CID is required'],
            unique: true,
            trim: true,
            validate: {
                validator: validateCID,
                message: '{VALUE} is not a valid IPFS CID'
            },
        },
        fileName: { type: String, trim: true },
        fileSize: { type: Number, min: 0 },
        fileType: { type: String, trim: true },
        walletAddress: {
            type: String,
            trim: true,
            lowercase: true,
            index: true,
            validate: {
                validator: validateEthereumAddress,
                message: '{VALUE} is not a valid Ethereum address'
            },
        },
        transactionHash: {
            type: String,
            trim: true,
            index: true,
            validate: {
                validator: validateTransactionHash,
                message: '{VALUE} is not a valid transaction hash'
            },
        },
        blockchainTimestamp: {
            type: Date,
        },
    },
    { versionKey: false },
);

// Compound index for common query patterns
UploadSchema.index({ walletAddress: 1, blockchainTimestamp: -1 });
// Index for sorting uploads by timestamp
UploadSchema.index({ blockchainTimestamp: -1 });

// Virtuals — use config module instead of process.env directly
UploadSchema.virtual('ipfsUrl').get(function (this: IUpload) {
    return `${config.IPFS_GATEWAY_URL}/ipfs/${this.cid}`;
});

UploadSchema.virtual('explorerUrl').get(function (this: IUpload) {
    if (!this.transactionHash || !config.ETH_NETWORK) return null;
    const network = config.ETH_NETWORK.toLowerCase();
    const base = EXPLORER_BASE[network];
    if (!base) return null;
    return `${base}/tx/${this.transactionHash}`;
});

UploadSchema.methods.getIpfsUrl = function (this: IUpload, customGateway?: string): string {
    const gateway = customGateway || config.IPFS_GATEWAY_URL;
    return `${gateway}/ipfs/${this.cid}`;
};

UploadSchema.methods.getExplorerUrl = function (this: IUpload, network?: string): string | null {
    if (!this.transactionHash) return null;
    const net = (network || config.ETH_NETWORK || '').toLowerCase();
    const base = EXPLORER_BASE[net];
    if (!base) return null;
    return `${base}/tx/${this.transactionHash}`;
};

UploadSchema.set('toJSON', { virtuals: true });
UploadSchema.set('toObject', { virtuals: true });

const Upload: Model<IUpload> = mongoose.model<IUpload>('Upload', UploadSchema);
export default Upload;
