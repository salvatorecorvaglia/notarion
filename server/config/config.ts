import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from the root directory
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5002),
    MONGO_URI: z.string().url('MONGO_URI must be a valid URL'),
    ALLOWED_ORIGINS: z.string().default('http://localhost:3000').transform(str => str.split(',').map(s => s.trim())),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
    IPFS_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
    IPFS_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(10),
    IPFS_API_URL: z.string().url().default('http://localhost:5001'),
    IPFS_GATEWAY_URL: z.string().url().default('http://localhost:8080'),
    IPFS_TIMEOUT: z.coerce.number().default(60000),
    IPFS_MAX_RETRIES: z.coerce.number().default(2),
    MAX_FILE_SIZE: z.coerce.number().default(104857600),
    // The Ethereum network for explorer URLs (e.g. mainnet, sepolia, holesky)
    ETH_NETWORK: z.enum(['mainnet', 'sepolia', 'holesky']).optional(),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
    console.error('❌ Invalid environment variables:', envParsed.error.format());
    process.exit(1);
}

const env = envParsed.data;

const config = {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    MONGO_URI: env.MONGO_URI,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
    RATE_LIMIT: {
        WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
        MAX_REQUESTS: env.RATE_LIMIT_MAX_REQUESTS,
    },
    IPFS_RATE_LIMIT: {
        WINDOW_MS: env.IPFS_RATE_LIMIT_WINDOW_MS,
        MAX_REQUESTS: env.IPFS_RATE_LIMIT_MAX_REQUESTS,
    },
    IPFS_API_URL: env.IPFS_API_URL,
    IPFS_GATEWAY_URL: env.IPFS_GATEWAY_URL,
    IPFS_TIMEOUT: env.IPFS_TIMEOUT,
    IPFS_MAX_RETRIES: env.IPFS_MAX_RETRIES,
    MAX_FILE_SIZE: env.MAX_FILE_SIZE,
    ETH_NETWORK: env.ETH_NETWORK,
};

export default config;
