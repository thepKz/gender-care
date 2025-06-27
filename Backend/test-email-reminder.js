const axios = require('axios');

// Script để test tính năng gửi email nhắc nhở chu kì kinh nguyệt
async function testEmailReminder() {
  try {
    console.log('🧪 Testing Menstrual Cycle Email Reminder...\n');

    const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
    
    // 1. Test trigger all reminders (không cần auth)
    console.log('1️⃣ Testing trigger all reminders...');
    try {
      const triggerResponse = await axios.post(`${BASE_URL}/reminders/notify`);
      console.log('✅ Trigger all reminders successful:');
      console.log(`   - Notified: ${triggerResponse.data.data.notified} users`);
      console.log(`   - Skipped: ${triggerResponse.data.data.skipped} users`);
      console.log(`   - Errors: ${triggerResponse.data.data.errors} errors\n`);
    } catch (error) {
      console.log('❌ Trigger all reminders failed:', error.response?.data?.message || error.message);
    }

    // 2. Test với user đã đăng nhập (cần có token)
    const testToken = process.env.TEST_TOKEN; // Cần set biến môi trường này
    
    if (testToken) {
      console.log('2️⃣ Testing with authenticated user...');
      
      const headers = {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      };

      try {
        // Test lấy cài đặt reminder
        console.log('   📋 Getting reminder settings...');
        const settingsResponse = await axios.get(`${BASE_URL}/reminders`, { headers });
        console.log('   ✅ Reminder settings:', settingsResponse.data.data);

        // Test cập nhật cài đặt reminder
        console.log('   ⚙️ Updating reminder settings...');
        const updateResponse = await axios.put(`${BASE_URL}/reminders`, {
          reminderEnabled: true,
          reminderTime: "20:00"
        }, { headers });
        console.log('   ✅ Updated reminder settings successfully');

        // Test gửi email test
        console.log('   📧 Sending test email...');
        const testEmailResponse = await axios.post(`${BASE_URL}/reminders/test-email`, {}, { headers });
        console.log('   ✅ Test email sent successfully:');
        console.log(`      - User ID: ${testEmailResponse.data.data.userId}`);
        console.log(`      - Email: ${testEmailResponse.data.data.email}`);
        console.log(`      - Sent at: ${testEmailResponse.data.data.sentAt}`);

        // Test lấy stats (nếu là admin)
        console.log('   📊 Getting reminder stats...');
        try {
          const statsResponse = await axios.get(`${BASE_URL}/reminders/stats`, { headers });
          console.log('   ✅ Reminder stats:', statsResponse.data.data);
        } catch (error) {
          console.log('   ⚠️ Stats request failed (might need admin role):', error.response?.data?.message);
        }

      } catch (error) {
        console.log('   ❌ Authenticated test failed:', error.response?.data?.message || error.message);
      }
    } else {
      console.log('2️⃣ Skipping authenticated tests (no TEST_TOKEN provided)');
      console.log('   Set TEST_TOKEN environment variable with a valid JWT token to test');
    }

    console.log('\n🎉 Email reminder test completed!');
    console.log('\n📧 Check your email if you ran the test with a valid token');
    console.log('📝 Email will be sent to users who haven\'t updated their cycle data today');

  } catch (error) {
    console.error('💥 Test script error:', error.message);
  }
}

// Chạy test
testEmailReminder(); 