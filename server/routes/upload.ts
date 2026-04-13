import express, { Request, Response } from 'express';
import { body, query, param } from 'express-validator';
import { AppError, ERROR_CODES } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import * as uploadService from '../services/uploadService';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

// ── Pagination helper ─────────────────────────────────────────────────────────
const parsePagination = (q: Request['query']): { limit: number; skip: number } => ({
    limit: Number.parseInt(q.limit as string, 10) || 10,
    skip: Number.parseInt(q.skip as string, 10) || 0,
});

// ── POST / — Save CID + metadata ──────────────────────────────────────────────
router.post(
    '/',
    [
        body('cid').notEmpty().withMessage('CID is required').isString().trim(),
        body('fileName').optional().isString().trim(),
        body('fileSize').optional().isInt({ min: 0 }).withMessage('File size must be a positive number'),
        body('fileType').optional().isString().trim(),
        body('walletAddress').optional().isString().trim(),
        body('transactionHash').optional().isString().trim(),
        validate,
    ],
    catchAsync(async (req: Request, res: Response) => {
        const newUpload = await uploadService.createUploadRecord(req.body);
        return res.status(201).json({ success: true, message: 'Upload record created successfully', upload: newUpload });
    }),
);

// ── GET /cid/:cid ─────────────────────────────────────────────────────────────
router.get(
    '/cid/:cid',
    [
        param('cid')
            .notEmpty().withMessage('CID is required')
            .isString().trim()
            .matches(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58,})$/).withMessage('Invalid CID format'),
        validate,
    ],
    catchAsync(async (req: Request, res: Response) => {
        const upload = await uploadService.findUploadByCid(req.params.cid as string);
        if (!upload) throw new AppError('Upload not found', 404, ERROR_CODES.NOT_FOUND);
        return res.status(200).json({ success: true, upload });
    }),
);

// ── GET /wallet/:address ──────────────────────────────────────────────────────
router.get(
    '/wallet/:address',
    [
        param('address')
            .notEmpty().withMessage('Wallet address is required')
            .isString().trim()
            .matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid Ethereum address format'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a positive number'),
        validate,
    ],
    catchAsync(async (req: Request, res: Response) => {
        const { limit, skip } = parsePagination(req.query);
        const { uploads, total } = await uploadService.findUploadsByWallet(req.params.address as string, limit, skip);
        return res.status(200).json({ success: true, uploads, pagination: { total, limit, skip, hasMore: skip + uploads.length < total } });
    }),
);

// ── GET / — All uploads (paginated) ──────────────────────────────────────────
router.get(
    '/',
    [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a positive number'),
        validate,
    ],
    catchAsync(async (req: Request, res: Response) => {
        const { limit, skip } = parsePagination(req.query);
        const { uploads, total } = await uploadService.findAllUploads(limit, skip);
        return res.status(200).json({ success: true, uploads, pagination: { total, limit, skip, hasMore: skip + uploads.length < total } });
    }),
);

export default router;
