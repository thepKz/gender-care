const mongoose = require('mongoose');
require('dotenv').config();

async function createTestAppointments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Define Appointment Schema (simple version for test)
    const appointmentSchema = new mongoose.Schema({
      createdByUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
      profileId: { type: mongoose.Schema.Types.ObjectId, required: true },
      serviceId: { type: mongoose.Schema.Types.ObjectId },
      doctorId: { type: mongoose.Schema.Types.ObjectId },
      appointmentDate: { type: Date, required: true },
      appointmentTime: { type: String, required: true },
      appointmentType: { type: String, enum: ["consultation", "test", "other"], required: true },
      typeLocation: { type: String, enum: ["clinic", "home", "Online"], required: true },
      address: String,
      description: String,
      notes: String,
      status: { 
        type: String, 
        enum: ["pending_payment", "pending", "scheduled", "confirmed", "consulting", "completed", "cancelled"],
        default: "pending_payment"
      },
      totalAmount: Number,
      paymentStatus: { type: String, enum: ["unpaid", "paid", "partial", "refunded"], default: "unpaid" }
    }, { timestamps: true });

    const TestAppointment = mongoose.model('Appointments', appointmentSchema);

    // Create test appointments with past times
    const now = new Date();
    const pastTime1 = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    const pastTime2 = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    const testAppointments = [
      {
        createdByUserId: new mongoose.Types.ObjectId(),
        profileId: new mongoose.Types.ObjectId(),
        serviceId: new mongoose.Types.ObjectId(),
        doctorId: new mongoose.Types.ObjectId(),
        appointmentDate: pastTime1,
        appointmentTime: '09:00',
        appointmentType: 'consultation',
        typeLocation: 'clinic',
        description: 'Test consultation for auto-transition - Tư vấn sức khỏe phụ nữ',
        status: 'confirmed',
        totalAmount: 500000,
        paymentStatus: 'paid'
      },
      {
        createdByUserId: new mongoose.Types.ObjectId(),
        profileId: new mongoose.Types.ObjectId(),
        serviceId: new mongoose.Types.ObjectId(),
        doctorId: new mongoose.Types.ObjectId(),
        appointmentDate: pastTime2,
        appointmentTime: '10:30',
        appointmentType: 'test',
        typeLocation: 'clinic',
        description: 'Test xét nghiệm for auto-transition - Xét nghiệm máu tổng quát',
        status: 'confirmed',
        totalAmount: 300000,
        paymentStatus: 'paid'
      },
      {
        createdByUserId: new mongoose.Types.ObjectId(),
        profileId: new mongoose.Types.ObjectId(),
        serviceId: new mongoose.Types.ObjectId(),
        doctorId: new mongoose.Types.ObjectId(),
        appointmentDate: new Date(), // today
        appointmentTime: '14:00',
        appointmentType: 'consultation',
        typeLocation: 'clinic',
        description: 'Future appointment - should NOT auto-transition yet',
        status: 'confirmed',
        totalAmount: 600000,
        paymentStatus: 'paid'
      }
    ];

    // Insert test appointments
    const result = await TestAppointment.insertMany(testAppointments);
    console.log(`\n✅ Created ${result.length} test appointments:`);
    
    result.forEach((apt, index) => {
      const isPast = now >= new Date(`${apt.appointmentDate.toDateString()} ${apt.appointmentTime}`);
      console.log(`${index + 1}. ${apt._id} - ${apt.appointmentType} - ${apt.appointmentDate.toDateString()} ${apt.appointmentTime} - Should transition: ${isPast ? 'YES' : 'NO'}`);
    });

    console.log('\n🤖 Auto-transition service should pick up the past appointments within 5 minutes!');
    console.log('🎯 Check server logs for "[AUTO-TRANSITION]" messages');
    console.log('💡 Then test the buttons in frontend with appointments that have status "consulting"');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('🔄 Check your appointment management page for the new test appointments!');
  }
}

createTestAppointments(); 