import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async () => {
    try {
        dns.setServers(['8.8.8.8', '8.8.4.4']);
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drawversedb');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
