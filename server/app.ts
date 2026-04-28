import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import config from './config/config';
import uploadRoutes from './routes/upload';
import ipfsRoutes from './routes/ipfs';
import { errorHandler, AppError, ERROR_CODES } from './middleware/errorHandler';
import { requestId, requestLogger } from './middleware/requestLogger';
import compression from 'compression';
import logger from './utils/logger';
import { version } from './package.json';


const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const isAllowedOrigin = config.ALLOWED_ORIGINS.includes(origin);

        if (config.NODE_ENV === 'development') {
            // In development, allow localhost origins and allowed origins
            const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
            if (isLocalhost || isAllowedOrigin) {
                return callback(null, true);
            }
        } else {
            // In production, only allow configured origins
            if (isAllowedOrigin) {
                return callback(null, true);
            }
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Rate limiters
const genericLimiter = rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS,
    max: config.RATE_LIMIT.MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const ipfsLimiter = rateLimit({
    windowMs: config.IPFS_RATE_LIMIT.WINDOW_MS,
    max: config.IPFS_RATE_LIMIT.MAX_REQUESTS,
    message: 'Too many IPFS upload requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Middleware pipeline (order matters) ──────────────────────────────────────
// 1. Request ID + structured logger (before rate limiter to capture all requests)
// 2. Rate limiter (BEFORE body parsing to avoid resource exhaustion)
// 3. Compression + JSON body parsing
app.use(requestId);
app.use(requestLogger);

// Apply rate limiter BEFORE parsing request bodies
app.use(genericLimiter);

// Health check (before compression/body parsing for efficiency)
app.get('/health', (_req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    if (config.NODE_ENV === 'production') {
        // Minimal health info in production to avoid leaking infrastructure details
        res.status(dbStatus === 'connected' ? 200 : 503).json({
            status: dbStatus === 'connected' ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
        });
        return;
    }

    const mem = process.memoryUsage();
    const health = {
        status: dbStatus === 'connected' ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: { status: dbStatus, name: mongoose.connection.name || 'N/A' },
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || version,
        memory: {
            heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
            rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
        },
    };
    if (dbStatus !== 'connected') {
        logger.warn({ health }, 'Health check: database degraded');
    }
    res.status(dbStatus === 'connected' ? 200 : 503).json(health);
});

app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/upload/ipfs', ipfsLimiter, ipfsRoutes);
app.use('/api/upload', uploadRoutes);

// 404 — use AppError pattern for consistent error handling
app.use((req, _res, next) => {
    next(new AppError(`Route not found: ${req.method} ${req.path}`, 404, ERROR_CODES.NOT_FOUND));
});

// Error handler
app.use(errorHandler);

export default app;
