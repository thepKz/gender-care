const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/gender-healthcare', {useNewUrlParser: true});

mongoose.connection.once('open', async () => {
  try {
    console.log('🔗 Connected to database');
    
    const Appointments = mongoose.model('Appointments', new mongoose.Schema({}, {strict: false}));
    
    const count = await Appointments.countDocuments();
    console.log('📊 Total appointments in DB:', count);
    
    if (count > 0) {
      const sample = await Appointments.find().limit(5);
      console.log('📋 Sample appointments:');
      sample.forEach((apt, i) => {
        console.log(`${i+1}. ID: ${apt._id}`);
        console.log(`   Type: ${apt.appointmentType}`);
        console.log(`   Status: ${apt.status}`);
        console.log(`   Date: ${apt.appointmentDate}`);
        console.log(`   ProfileId: ${apt.profileId}`);
        console.log('   ---');
      });
      
      const typeStats = await Appointments.aggregate([
        { $group: { _id: '$appointmentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('📈 Appointment types:', typeStats);
      
      const statusStats = await Appointments.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('📊 Appointment statuses:', statusStats);
      
    } else {
      console.log('❌ No appointments found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}); 