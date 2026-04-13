import Upload, { IUpload } from '../models/Upload';
import logger from '../utils/logger';

export const createUploadRecord = async (data: Partial<IUpload>): Promise<IUpload> => {
    const newUpload = new Upload(data);
    return await newUpload.save();
};

export const findUploadByCid = async (cid: string): Promise<IUpload | null> => {
    return await Upload.findOne({ cid });
};


export const findUploadsByWallet = async (
    walletAddress: string,
    limit: number = 10,
    skip: number = 0
): Promise<{ uploads: IUpload[]; total: number }> => {
    // walletAddress is always stored lowercase thanks to the Mongoose schema (lowercase: true)
    const addrLower = walletAddress.toLowerCase();

    logger.debug({ address: addrLower, limit, skip }, '[UploadService] Fetching history for wallet');

    const [uploads, total] = await Promise.all([
        Upload.find({ walletAddress: addrLower })
            .sort({ blockchainTimestamp: -1 })
            .limit(limit)
            .skip(skip),
        Upload.countDocuments({ walletAddress: addrLower }),
    ]);

    logger.debug({ found: uploads.length, total }, '[UploadService] Wallet history results');
    return { uploads, total };
};

export const findAllUploads = async (
    limit: number = 10,
    skip: number = 0
): Promise<{ uploads: IUpload[]; total: number }> => {
    const [uploads, total] = await Promise.all([
        Upload.find()
            .sort({ blockchainTimestamp: -1 })
            .limit(limit)
            .skip(skip),
        Upload.countDocuments(),
    ]);
    return { uploads, total };
};
