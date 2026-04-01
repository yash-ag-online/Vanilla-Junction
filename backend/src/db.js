import mongoose from 'mongoose';
import { envValues } from './utils.js';

export const connectToMongoDB = async () => {
  try {
    const connection = await mongoose.connect(envValues.mongodb_uri);
    console.log(`mongodb connected successfully on ${connection.connection.client.s.url}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
