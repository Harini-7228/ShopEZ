import mongoose from 'mongoose';
import dns from 'node:dns/promises';
import config from './env.js';

const withTimeout = (promise, timeoutMs, label) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const connectDB = async () => {
  try {
    if (config.mongoUri.startsWith('mongodb+srv://')) {
      const { hostname } = new URL(config.mongoUri);
      await withTimeout(
        dns.resolveSrv(`_mongodb._tcp.${hostname}`),
        Math.min(config.dbConnectTimeoutMs, 5000),
        'MongoDB SRV DNS lookup'
      );
    }

    await withTimeout(
      mongoose.connect(config.mongoUri, {
        maxPoolSize: 20,
        minPoolSize: config.env === 'production' ? 5 : 0,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      }),
      config.dbConnectTimeoutMs,
      'MongoDB connection'
    );
    console.log('MongoDB Connected.');
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
