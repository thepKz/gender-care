import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { runAllSeeds } from '../seeds';

// Load environment variables
const envPaths = [
  path.join(__dirname, '../../.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'Backend/.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`✅ .env loaded from: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    // Try next path
  }
}

if (!envLoaded) {
  console.log('⚠️ No .env file found, using default config');
  dotenv.config();
}

// MongoDB connection function
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/gender-healthcare';
    console.log(`🔗 Connecting to MongoDB: ${mongoURI}`);
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

// Main seed function
const runSeedsWithConnection = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Run all seeds
    await runAllSeeds();
    
    console.log('✅ Tất cả seeds hoàn thành!');
  } catch (error) {
    console.error('❌ Lỗi khi chạy seeds:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run seeds with proper setup
runSeedsWithConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 