const SystemLog = require('./dist/models/SystemLogs.js').default;
const mongoose = require('mongoose');

async function testLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/menstrual_cycle_db');
    console.log('Connected to MongoDB');
    
    const totalCount = await SystemLog.countDocuments({});
    console.log('Total logs in database:', totalCount);
    
    const publicManagerCount = await SystemLog.countDocuments({
      level: { $in: ['public', 'manager'] }
    });
    console.log('Public + Manager logs:', publicManagerCount);
    
    const recentLogs = await SystemLog.find({}).sort({ createdAt: -1 }).limit(5);
    console.log('Recent 5 logs:', recentLogs.map(log => ({ 
      action: log.action, 
      level: log.level, 
      message: log.message.substring(0, 50),
      createdAt: log.createdAt
    })));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testLogs(); 