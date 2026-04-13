import mongoose from 'mongoose';
import config from './config';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
    const mongoURI = config.MONGO_URI;

    const options: mongoose.ConnectOptions = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };

    const maxAttempts = Number(process.env.MONGO_MAX_RETRIES) || 5;
    const retryDelay = Number(process.env.MONGO_RETRY_DELAY_MS) || 3000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await mongoose.connect(mongoURI, options);
            logger.info('MongoDB connected successfully');
            break;
        } catch (error) {
            logger.error(
                { err: error, attempt, maxAttempts },
                'Error connecting to MongoDB',
            );
            if (attempt >= maxAttempts) {
                logger.error('Max connection attempts reached, exiting...');
                throw error; // Re-throw to let caller handle
            }
            logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
            await new Promise((res) => setTimeout(res, retryDelay));
        }
    }

    // Register connection event listeners only once
    if (mongoose.connection.listeners('connected').length === 0) {
        mongoose.connection.on('connected', () => logger.info('Mongoose connected to MongoDB'));
    }
    if (mongoose.connection.listeners('error').length === 0) {
        mongoose.connection.on('error', (err: Error) => logger.error({ err }, 'Mongoose connection error'));
    }
    if (mongoose.connection.listeners('disconnected').length === 0) {
        mongoose.connection.on('disconnected', () => logger.warn('Mongoose disconnected from MongoDB'));
    }
};

export default connectDB;
