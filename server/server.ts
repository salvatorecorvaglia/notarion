import mongoose from 'mongoose';
import config from './config/config';
import connectDB from './config/db';
import app from './app';
import logger from './utils/logger';

// Start
const PORT = config.PORT;

// Connect to MongoDB first, then start server
connectDB()
    .then(() => {
        const server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${config.NODE_ENV}`);
            logger.info(`Allowed origins: ${config.ALLOWED_ORIGINS.join(', ')}`);
        });

        // Shutdown guard to prevent race conditions
        let isShuttingDown = false;

        const shutdown = (signal: string) => {
            if (isShuttingDown) return;
            isShuttingDown = true;

            logger.info(`${signal} signal received: closing HTTP server`);
            const shutdownTimeout = setTimeout(() => {
                logger.error('Shutdown timeout reached, forcing exit...');
                process.exit(1);
            }, 10_000); // 10 second timeout

            server.close(() => {
                clearTimeout(shutdownTimeout);
                logger.info('HTTP server closed');
                mongoose.connection.close().then(() => {
                    logger.info('MongoDB connection closed');
                    process.exit(0);
                }).catch((err) => {
                    logger.error({ err }, 'Error closing MongoDB connection');
                    process.exit(1);
                });
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        process.on('uncaughtException', (err: Error) => {
            logger.fatal({ err }, 'UNCAUGHT EXCEPTION! Shutting down...');
            if (isShuttingDown) return;
            isShuttingDown = true;
            // Attempt graceful cleanup before exit
            server.close(() => {
                mongoose.connection.close().finally(() => {
                    process.exit(1);
                });
            });
            // Force exit after timeout if graceful shutdown fails
            setTimeout(() => process.exit(1), 5000).unref();
        });

        process.on('unhandledRejection', (err: unknown) => {
            logger.fatal({ err }, 'UNHANDLED REJECTION! Shutting down...');
            if (isShuttingDown) return;
            isShuttingDown = true;
            server.close(() => {
                mongoose.connection.close().finally(() => {
                    process.exit(1);
                });
            });
            // Force exit after timeout if graceful shutdown fails
            setTimeout(() => process.exit(1), 5000).unref();
        });
    })
    .catch((err) => {
        logger.fatal({ err }, 'Failed to connect to database on startup');
        process.exit(1);
    });
