const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Thay đổi theo user thực tế của bạn
const TEST_USER = {
  email: 'test@example.com', 
  password: 'password123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Đăng nhập...');
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    authToken = response.data.token || response.data.data?.token;
    console.log('✅ Đăng nhập thành công');
    return true;
  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error.response?.data || error.message);
    console.log('ℹ️ Vui lòng cập nhật TEST_USER trong file này với thông tin đăng nhập thực tế');
    return false;
  }
}

async function testCreateUpdate() {
  try {
    console.log('\n🧪 TESTING CREATE vs UPDATE LOGIC');
    console.log('=====================================');

    // 1. Tạo chu kỳ mới
    console.log('\n📝 Bước 1: Tạo chu kỳ mới');
    const cycleResponse = await axios.post(`${API_BASE}/menstrual-cycles`, {
      startDate: '2025-01-01'
    }, { 
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const cycle = cycleResponse.data.data;
    console.log(`✅ Đã tạo chu kỳ ${cycle.cycleNumber}, ID: ${cycle._id}`);

    const testDate = '2025-01-05';
    const cycleId = cycle._id;

    // 2. Test CREATE: Tạo cycle day lần đầu
    console.log(`\n📝 Bước 2: Tạo cycle day mới cho ngày ${testDate}`);
    
    const createResponse = await axios.post(`${API_BASE}/cycle-days`, {
      cycleId: cycleId,
      date: testDate,
      mucusObservation: 'đục',
      feeling: 'dính',
      notes: 'Test CREATE - lần 1'
    }, { 
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const createdRecord = createResponse.data.data.cycleDay;
    console.log(`✅ CREATED: ID=${createdRecord._id}, Notes="${createdRecord.notes}"`);

    // 3. Test UPDATE: Cập nhật cùng ngày (không tạo mới)
    console.log(`\n📝 Bước 3: Update cycle day cùng ngày ${testDate}`);
    
    const updateResponse = await axios.post(`${API_BASE}/cycle-days`, {
      cycleId: cycleId,
      date: testDate,
      mucusObservation: 'trong nhiều sợi',
      feeling: 'ướt',
      notes: 'Test UPDATE - lần 2 (đã cập nhật)'
    }, { 
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const updatedRecord = updateResponse.data.data.cycleDay;
    console.log(`✅ UPDATED: ID=${updatedRecord._id}, Notes="${updatedRecord.notes}"`);

    // 4. Kiểm tra kết quả
    console.log('\n📊 KIỂM TRA KẾT QUẢ:');
    
    if (createdRecord._id === updatedRecord._id) {
      console.log('✅ ĐÚNG: Cùng một record được update (ID giống nhau)');
    } else {
      console.log('❌ SAI: Tạo record mới thay vì update!');
      console.log(`   Created ID: ${createdRecord._id}`);
      console.log(`   Updated ID: ${updatedRecord._id}`);
    }

    // Kiểm tra dữ liệu đã update đúng chưa
    if (updatedRecord.mucusObservation === 'trong nhiều sợi' && 
        updatedRecord.feeling === 'ướt' &&
        updatedRecord.notes === 'Test UPDATE - lần 2 (đã cập nhật)') {
      console.log('✅ ĐÚNG: Dữ liệu đã được cập nhật chính xác');
    } else {
      console.log('❌ SAI: Dữ liệu không được cập nhật đúng');
      console.log('Expected: trong nhiều sợi, ướt, "Test UPDATE - lần 2 (đã cập nhật)"');
      console.log(`Actual: ${updatedRecord.mucusObservation}, ${updatedRecord.feeling}, "${updatedRecord.notes}"`);
    }

    // 5. Kiểm tra không có duplicate trong database
    console.log('\n📊 KIỂM TRA DUPLICATE TRONG DATABASE:');
    
    // Lấy tất cả cycle days của chu kỳ này
    const allDaysResponse = await axios.get(`${API_BASE}/menstrual-cycles/${cycleId}/cycle-days`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const allDays = allDaysResponse.data.data || allDaysResponse.data;
    const sameDateDays = allDays.filter(day => day.date.startsWith(testDate));

    console.log(`📊 Tổng cycle days: ${allDays.length}`);
    console.log(`📊 Cycle days cùng ngày ${testDate}: ${sameDateDays.length}`);

    if (sameDateDays.length === 1) {
      console.log('✅ ĐÚNG: Chỉ có 1 record cho ngày này');
    } else {
      console.log(`❌ SAI: Có ${sameDateDays.length} duplicate records!`);
      sameDateDays.forEach((day, i) => {
        console.log(`   ${i+1}. ID: ${day._id}, Notes: "${day.notes || 'N/A'}"`);
      });
    }

    // 6. Tổng kết
    console.log('\n🏁 TỔNG KẾT:');
    const isSuccess = (createdRecord._id === updatedRecord._id) && (sameDateDays.length === 1);
    console.log(isSuccess ? '✅ LOGIC CREATE/UPDATE HOẠT ĐỘNG ĐÚNG!' : '❌ LOGIC CREATE/UPDATE CÓ LỖI!');

  } catch (error) {
    console.error('❌ Lỗi test:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('ℹ️ Token có thể đã hết hạn, vui lòng kiểm tra thông tin đăng nhập');
    }
  }
}

async function main() {
  const loginSuccess = await login();
  if (!loginSuccess) {
    return;
  }

  await testCreateUpdate();
}

main().catch(console.error); 