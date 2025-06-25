const mongoose = require('mongoose');
require('dotenv').config();

const ServiceSchema = new mongoose.Schema({
  serviceName: String,
  price: Number,
  description: String,
  serviceType: String,
  availableAt: [String],
  isDeleted: { type: Number, default: 0 }
}, { timestamps: true });

const Service = mongoose.model('Service', ServiceSchema);

const checkServices = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const services = await Service.find({ isDeleted: { $ne: 1 } });
    console.log(`\n📋 Found ${services.length} active services:`);
    
    services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.serviceName}`);
      console.log(`   💰 Price: ${service.price.toLocaleString()}đ`);
      console.log(`   📝 Type: ${service.serviceType}`);
      console.log(`   📍 Available: ${service.availableAt.join(', ')}`);
      console.log('');
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkServices(); 