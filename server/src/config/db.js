import mongoose from 'mongoose';
import config from './env.js';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      // Keep connection pool sized for expected concurrency
      maxPoolSize: 20,
      minPoolSize: 5,
      // Fail fast rather than hanging indefinitely
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Return a buffer timeout error instead of silently queuing
      bufferCommands: false,
    });
    console.log('MongoDB Connected.');
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
