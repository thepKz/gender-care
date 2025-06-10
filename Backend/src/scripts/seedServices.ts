import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedServices } from '../seeds/servicesSeed';

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ MongoDB connected for services seeding');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

const runServicesSeed = async () => {
    try {
        await connectDB();
        await seedServices();
        console.log('🎉 Services seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running services seed:', error);
        process.exit(1);
    }
};

runServicesSeed(); 