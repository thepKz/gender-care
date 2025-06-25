const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Appointments } = require('./dist/models');

const testAutoTransition = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // 1. Check existing appointments
    const existingAppointments = await Appointments.find({}).limit(5);
    console.log('\n📋 Current appointments in database:');
    existingAppointments.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.patientName} - ${apt.status} - ${apt.appointmentDate} ${apt.appointmentTime}`);
    });

    // 2. Create test appointments with past times to trigger auto-transition
    const now = new Date();
    const pastTime1 = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    const pastTime2 = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    const testAppointments = [
      {
        patientName: 'Nguyen Van Test 1',
        patientPhone: '0123456789',
        appointmentDate: pastTime1,
        appointmentTime: '09:00',
        appointmentType: 'consultation',
        typeLocation: 'clinic',
        serviceName: 'Tư vấn sức khỏe phụ nữ',
        status: 'confirmed',
        description: 'Test appointment for auto-transition',
        profileId: new mongoose.Types.ObjectId(),
        serviceId: new mongoose.Types.ObjectId(),
      },
      {
        patientName: 'Tran Thi Test 2',
        patientPhone: '0987654321',
        appointmentDate: pastTime2,
        appointmentTime: '10:30',
        appointmentType: 'test',
        typeLocation: 'clinic',
        serviceName: 'Xét nghiệm máu',
        status: 'confirmed',
        description: 'Test appointment for auto-transition',
        profileId: new mongoose.Types.ObjectId(),
        serviceId: new mongoose.Types.ObjectId(),
      }
    ];

    // Insert test appointments
    const insertedAppointments = await Appointments.insertMany(testAppointments);
    console.log(`\n✅ Created ${insertedAppointments.length} test appointments with past times`);

    // 3. Check appointments that should be auto-transitioned
    const confirmedPastAppointments = await Appointments.find({
      status: 'confirmed',
      appointmentDate: { $lte: now }
    });

    console.log(`\n🔍 Found ${confirmedPastAppointments.length} confirmed appointments with past dates:`);
    confirmedPastAppointments.forEach((apt, index) => {
      const aptDateTime = new Date(`${apt.appointmentDate.toDateString()} ${apt.appointmentTime}`);
      const isPast = now >= aptDateTime;
      console.log(`${index + 1}. ${apt.patientName} - ${apt.appointmentDate.toDateString()} ${apt.appointmentTime} - Should transition: ${isPast ? 'YES' : 'NO'}`);
    });

    console.log('\n🤖 Auto-transition service should pick these up within 5 minutes...');
    console.log('💡 Check server logs for auto-transition activity');
    console.log('🎯 Then test the buttons in frontend with status = "consulting"');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run test
testAutoTransition(); 