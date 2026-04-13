import express, { Request, Response } from 'express';
import multer from 'multer';
import { fromBuffer } from 'file-type';
import { AppError, ERROR_CODES } from '../middleware/errorHandler';
import * as ipfsService from '../services/ipfsService';
import { catchAsync } from '../utils/catchAsync';
import config from '../config/config';
import logger from '../utils/logger';

const router = express.Router();

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/json',
    'application/zip',
    'application/x-zip-compressed',
    'video/mp4'
]);

const sanitizeFileName = (fileName: string): string =>
    fileName.replaceAll(/[^a-zA-Z0-9._-]/g, '_').replaceAll(/\.{2,}/g, '.').substring(0, 255);

// ── Multer ────────────────────────────────────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError('Invalid file type. Only PDF, PNG, JPEG, JSON, ZIP, and MP4 files are allowed.', 400, ERROR_CODES.FILE_TYPE));
        }
    },
});

// ── POST /api/upload/ipfs ─────────────────────────────────────────────────────
router.post('/', upload.single('file'), catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new AppError('No file provided', 400, ERROR_CODES.FILE_MISSING);
    }

    // ── Magic-byte MIME validation ─────────────────────────────────────
    let isValidContentType = false;
    let detected = 'unknown';

    if (req.file.mimetype === 'application/json') {
        // Limit JSON parsing to 1MB to prevent DoS
        const JSON_SIZE_LIMIT = 1 * 1024 * 1024; // 1MB
        if (req.file.buffer.length > JSON_SIZE_LIMIT) {
            logger.warn({ size: req.file.buffer.length }, '[IPFS] JSON file exceeds parsing limit');
            throw new AppError(`JSON file too large for validation (max ${JSON_SIZE_LIMIT / 1024 / 1024}MB)`, 400, ERROR_CODES.FILE_SIZE);
        }
        try {
            JSON.parse(req.file.buffer.toString('utf8'));
            isValidContentType = true;
            detected = 'application/json';
        } catch (error) {
            logger.error({ error: (error as Error).message }, '[IPFS] Invalid JSON content');
            detected = 'invalid-json';
        }
    } else {
        const detectedType = await fromBuffer(req.file.buffer);
        if (detectedType && ALLOWED_MIME_TYPES.has(detectedType.mime)) {
            isValidContentType = true;
            detected = detectedType.mime;
        } else {
            detected = detectedType?.mime ?? 'unknown';
        }
    }

    if (!isValidContentType) {
        logger.warn({ declared: req.file.mimetype, detected }, '[IPFS] Magic-byte mismatch');
        throw new AppError(`Invalid file content. Detected type "${detected}" is not allowed.`, 400, ERROR_CODES.FILE_TYPE);
    }
    logger.info({ detected }, '[IPFS] Magic-byte check passed');

    const sanitizedName = sanitizeFileName(req.file.originalname);
    const ipfsData = await ipfsService.uploadFileToIpfs(req.file, sanitizedName);

    return res.status(200).json({
        success: true,
        message: 'File uploaded to IPFS successfully',
        data: {
            ipfsHash: ipfsData.IpfsHash,
            pinSize: ipfsData.PinSize,
            timestamp: ipfsData.Timestamp,
        },
    });
}));

export default router;
