import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MedicalRecordSyncService from '../services/medicalRecordSyncService';

// Load environment variables
dotenv.config();

/**
 * Test script cho Medical Record Sync Service
 */
async function testMedicalRecordSync() {
  try {
    console.log('🔄 Starting Medical Record Sync Test...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-booking';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Test 1: Get pending appointments
    console.log('\n📋 Test 1: Getting pending appointments...');
    const Appointment = mongoose.model('Appointments');
    const completedAppointments = await Appointment.find({
      status: { $in: ['done_testResult', 'done_testResultItem', 'completed'] }
    }).populate('profileId', 'fullName').populate('doctorId', 'userId');

    console.log(`Found ${completedAppointments.length} completed appointments:`);
    completedAppointments.forEach((apt: any, index: number) => {
      console.log(`  ${index + 1}. ${apt._id} - ${apt.status} - ${apt.profileId?.fullName || 'Unknown'}`);
    });

    if (completedAppointments.length === 0) {
      console.log('❌ No completed appointments found to sync');
      return;
    }

    // Test 2: Check existing medical records
    console.log('\n🔍 Test 2: Checking existing medical records...');
    const MedicalRecords = mongoose.model('MedicalRecords');
    const existingRecords = await MedicalRecords.find({
      appointmentId: { $in: completedAppointments.map((a: any) => a._id) }
    });

    console.log(`Found ${existingRecords.length} existing medical records:`);
    existingRecords.forEach((record: any, index: number) => {
      console.log(`  ${index + 1}. ${record._id} - Appointment: ${record.appointmentId}`);
    });

    // Test 3: Find appointments that need sync
    const existingAppointmentIds = new Set(
      existingRecords.map((mr: any) => mr.appointmentId.toString())
    );

    const pendingAppointments = completedAppointments.filter(
      (appointment: any) => !existingAppointmentIds.has(appointment._id.toString())
    );

    console.log(`\n📝 Found ${pendingAppointments.length} appointments that need sync:`);
    pendingAppointments.forEach((apt: any, index: number) => {
      console.log(`  ${index + 1}. ${apt._id} - ${apt.status} - ${apt.profileId?.fullName || 'Unknown'}`);
    });

    if (pendingAppointments.length === 0) {
      console.log('✅ All appointments already have medical records');
      return;
    }

    // Test 4: Sync first appointment
    console.log('\n🔄 Test 4: Syncing first appointment...');
    const firstAppointment = pendingAppointments[0];
    console.log(`Syncing appointment: ${firstAppointment._id}`);

    try {
      const medicalRecord = await MedicalRecordSyncService.syncAppointmentToMedicalRecord(
        firstAppointment._id.toString()
      );

      if (medicalRecord) {
        console.log('✅ Successfully created medical record:');
        console.log(`  ID: ${medicalRecord._id}`);
        console.log(`  Appointment: ${medicalRecord.appointmentId}`);
        console.log(`  Profile: ${medicalRecord.profileId}`);
        console.log(`  Doctor: ${medicalRecord.doctorId}`);
        console.log(`  Conclusion: ${medicalRecord.conclusion}`);
        console.log(`  Status: ${medicalRecord.status}`);
      } else {
        console.log('⚠️ No medical record created (may already exist)');
      }
    } catch (error) {
      console.error('❌ Error syncing appointment:', error);
    }

    // Test 5: Verify medical record was created
    console.log('\n🔍 Test 5: Verifying medical record creation...');
    const newRecord = await MedicalRecords.findOne({ 
      appointmentId: firstAppointment._id 
    }).populate([
      { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName email' } },
      { path: 'profileId', select: 'fullName gender phone' },
      { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
    ]);

    if (newRecord) {
      console.log('✅ Medical record found in database:');
      console.log(`  ID: ${newRecord._id}`);
      console.log(`  Profile: ${(newRecord as any).profileId?.fullName}`);
      console.log(`  Doctor: ${(newRecord as any).doctorId?.userId?.fullName}`);
      console.log(`  Appointment Date: ${(newRecord as any).appointmentId?.appointmentDate}`);
      console.log(`  Conclusion: ${newRecord.conclusion}`);
      console.log(`  Treatment: ${newRecord.treatment}`);
      console.log(`  Status: ${newRecord.status}`);
    } else {
      console.log('❌ Medical record not found in database');
    }

    console.log('\n🎉 Medical Record Sync Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testMedicalRecordSync()
    .then(() => {
      console.log('✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export default testMedicalRecordSync;
