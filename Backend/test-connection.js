const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
    
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not found in environment variables');
      return;
    }

    // Set timeout options
    const options = {
      serverSelectionTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 45000, // 45 seconds
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log('✅ MongoDB connected successfully!');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections`);
    
    mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection(); 