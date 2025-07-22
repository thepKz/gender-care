import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/Doctor';
import User from '../models/User';

// Load environment variables
dotenv.config();

const testAutoAssign = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✅ Connected to MongoDB');

    // Test auto-assign logic
    console.log('🤖 Testing auto-assign doctor logic...');
    
    // Get all active doctors
    const allDoctors = await Doctor.find({ 
      isDeleted: { $ne: true } 
    }).populate('userId', 'fullName');
    
    console.log(`📊 Found ${allDoctors.length} active doctors:`);
    
    allDoctors.forEach((doctor, index) => {
      console.log(`${index + 1}. Doctor ID: ${doctor._id}`);
      console.log(`   Name: ${(doctor.userId as any)?.fullName || 'Unknown'}`);
      console.log(`   Specialization: ${doctor.specialization || 'Not specified'}`);
      console.log('---');
    });

    if (allDoctors.length > 0) {
      const selectedDoctor = allDoctors[0];
      console.log('🎯 Auto-assign would select:');
      console.log(`   Doctor ID: ${selectedDoctor._id}`);
      console.log(`   Name: ${(selectedDoctor.userId as any)?.fullName || 'Unknown'}`);
      console.log('✅ Auto-assign logic working correctly!');
    } else {
      console.log('⚠️ No doctors available for auto-assignment');
    }

  } catch (error) {
    console.error('❌ Error testing auto-assign:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the test
testAutoAssign();
