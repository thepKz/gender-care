import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedServices } from '../seeds/servicesSeed';

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        const options = {
            serverSelectionTimeoutMS: 10000, // 10 seconds
            socketTimeoutMS: 45000, // 45 seconds
        };
        
        await mongoose.connect(process.env.MONGO_URI as string, options);
        console.log('✅ MongoDB connected for services seeding');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

const runSeed = async () => {
    try {
        await connectDB();
        await seedServices();
        console.log('✅ Services seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

runSeed(); 