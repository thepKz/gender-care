const mongoose = require('mongoose');
const LoginHistory = require('../models/LoginHistory.ts');
const User = require('../models/User.ts');
require('dotenv').config();

const seedLoginHistory = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing login history
    await LoginHistory.deleteMany({});
    console.log('Cleared existing login history');

    // Get existing users
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      process.exit(1);
    }

    const sampleHistory = [];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const osTypes = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
    const devices = ['desktop', 'mobile', 'tablet'];
    const statuses = ['success', 'failed'];

    // Generate login history for each user
    for (const user of users) {
      // Generate 5-15 random login attempts per user
      const loginCount = Math.floor(Math.random() * 10) + 5;
      
      for (let i = 0; i < loginCount; i++) {
        const randomDaysAgo = Math.floor(Math.random() * 30);
        const randomHours = Math.floor(Math.random() * 24);
        const randomMinutes = Math.floor(Math.random() * 60);
        
        const loginDate = new Date();
        loginDate.setDate(loginDate.getDate() - randomDaysAgo);
        loginDate.setHours(randomHours, randomMinutes, 0, 0);

        const browser = browsers[Math.floor(Math.random() * browsers.length)];
        const os = osTypes[Math.floor(Math.random() * osTypes.length)];
        const device = devices[Math.floor(Math.random() * devices.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const ipBase = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        
        sampleHistory.push({
          userId: user._id,
          ipAddress: ipBase,
          userAgent: getUserAgent(browser, os, device),
          status: status,
          failReason: status === 'failed' ? getRandomFailReason() : undefined,
          loginAt: loginDate
        });
      }
    }

    // Insert all login history records
    const inserted = await LoginHistory.insertMany(sampleHistory);
    console.log(`✅ Inserted ${inserted.length} login history records`);

    console.log('\n📊 Login History Summary:');
    const successCount = inserted.filter(h => h.status === 'success').length;
    const failedCount = inserted.filter(h => h.status === 'failed').length;
    console.log(`- Success logins: ${successCount}`);
    console.log(`- Failed logins: ${failedCount}`);
    console.log(`- Total records: ${inserted.length}`);

  } catch (error) {
    console.error('❌ Error seeding login history:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

const getUserAgent = (browser, os, device) => {
  const templates = {
    Chrome: {
      Windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      macOS: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/121.0.6167.138 Mobile/15E148 Safari/604.1'
    },
    Firefox: {
      Windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      macOS: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
      mobile: 'Mozilla/5.0 (Mobile; rv:122.0) Gecko/122.0 Firefox/122.0'
    },
    Safari: {
      macOS: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      iOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
    },
    Edge: {
      Windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.2277.128'
    }
  };

  const browserTemplates = templates[browser] || templates.Chrome;
  return browserTemplates[os] || browserTemplates[Object.keys(browserTemplates)[0]];
};

const getRandomFailReason = () => {
  const reasons = [
    'Invalid password',
    'User account locked',
    'Too many login attempts',
    'Account temporarily disabled',
    'Invalid email format',
    'Network timeout'
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
};

// Run the seeder
seedLoginHistory(); 