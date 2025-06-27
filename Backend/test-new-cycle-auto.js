const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
    email: 'test@example.com',
    password: 'password123'
};

let authToken = '';

// Helper function để login và lấy token
async function login() {
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, testUser);
        authToken = response.data.data.token;
        console.log('✅ Đăng nhập thành công');
        return true;
    } catch (error) {
        console.error('❌ Lỗi đăng nhập:', error.response?.data || error.message);
        return false;
    }
}

// Helper function để tạo headers với auth
function getHeaders() {
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}

// Test tạo chu kỳ hoàn chỉnh
async function createCompleteCycle() {
    try {
        console.log('\n📅 Tạo chu kỳ hoàn chỉnh để test...');
        
        // 1. Tạo chu kỳ mới
        const cycleResponse = await axios.post(`${API_BASE}/menstrual-cycles`, {
            startDate: '2024-12-02'
        }, { headers: getHeaders() });
        
        const cycle = cycleResponse.data.data;
        console.log(`✅ Tạo chu kỳ ${cycle.cycleNumber} thành công`);
        
        // 2. Thêm các ngày chu kỳ
        const cycleDays = [
            { date: '2024-12-02', mucusObservation: 'có máu', feeling: 'ướt' },
            { date: '2024-12-03', mucusObservation: 'có máu', feeling: 'ướt' },
            { date: '2024-12-04', mucusObservation: 'ít chất tiết', feeling: 'khô' },
            { date: '2024-12-05', mucusObservation: 'ít chất tiết', feeling: 'khô' },
            { date: '2024-12-18', mucusObservation: 'trong và âm hộ căng', feeling: 'trơn' }, // Ngày đỉnh
            { date: '2024-12-19', mucusObservation: 'ít chất tiết', feeling: 'khô' }, // Ngày 1 sau đỉnh
            { date: '2024-12-20', mucusObservation: 'ít chất tiết', feeling: 'khô' }, // Ngày 2 sau đỉnh  
            { date: '2024-12-21', mucusObservation: 'ít chất tiết', feeling: 'khô' }, // Ngày 3 sau đỉnh
        ];
        
        for (const day of cycleDays) {
            await axios.post(`${API_BASE}/menstrual-cycles/days`, {
                cycleId: cycle._id,
                ...day
            }, { headers: getHeaders() });
            console.log(`  ✅ Thêm ngày ${day.date}: ${day.mucusObservation} + ${day.feeling}`);
        }
        
        console.log('✅ Chu kỳ hoàn chỉnh đã được tạo');
        return cycle._id;
        
    } catch (error) {
        console.error('❌ Lỗi tạo chu kỳ hoàn chỉnh:', error.response?.data || error.message);
        return null;
    }
}

// Test thêm máu mới để trigger tạo chu kỳ mới  
async function testAutoNewCycleCreation(cycleId) {
    try {
        console.log('\n🩸 Test thêm máu mới để tạo chu kỳ mới tự động...');
        
        // Thêm ngày có máu mới (24/12/2024) - đây sẽ trigger tạo chu kỳ mới
        const response = await axios.post(`${API_BASE}/menstrual-cycles/days`, {
            cycleId: cycleId,
            date: '2024-12-24',
            mucusObservation: 'có máu',
            feeling: 'ướt'
        }, { headers: getHeaders() });
        
        console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.data?.newCycleCreated) {
            console.log('🎉 CHU KỲ MỚI ĐÃ ĐƯỢC TẠO TỰ ĐỘNG!');
            console.log(`  - Chu kỳ cũ (${response.data.data.completedCycle.cycleNumber}) đã hoàn thành`);
            console.log(`  - Chu kỳ mới (${response.data.data.newCycle.cycleNumber}) đã được tạo`);
            console.log(`  - Ngày máu đã chuyển sang chu kỳ mới`);
            
            return response.data.data.newCycle._id;
        } else {
            console.log('⚠️ Chu kỳ mới chưa được tạo tự động');
            console.log('Lý do có thể:');
            console.log('- Chu kỳ hiện tại chưa đủ điều kiện hoàn thành');
            console.log('- Chưa có ngày đỉnh hoặc chưa đủ 3 ngày sau đỉnh');
            console.log('- 3 ngày sau đỉnh chưa hoàn toàn khô');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Lỗi test tạo chu kỳ mới:', error.response?.data || error.message);
        return null;
    }
}

// Test lấy danh sách chu kỳ để xác nhận
async function verifyNewCycles() {
    try {
        console.log('\n📋 Kiểm tra danh sách chu kỳ...');
        
        const response = await axios.get(`${API_BASE}/menstrual-cycles`, {
            headers: getHeaders()
        });
        
        const cycles = response.data.data.cycles || response.data.data;
        console.log(`📊 Tổng cộng có ${cycles.length} chu kỳ:`);
        
        cycles.forEach((cycle, index) => {
            console.log(`  ${index + 1}. Chu kỳ ${cycle.cycleNumber}:`);
            console.log(`     - Bắt đầu: ${new Date(cycle.startDate).toLocaleDateString('vi-VN')}`);
            console.log(`     - Kết thúc: ${cycle.endDate ? new Date(cycle.endDate).toLocaleDateString('vi-VN') : 'Đang diễn ra'}`);
            console.log(`     - Hoàn thành: ${cycle.isCompleted ? 'Có' : 'Không'}`);
            console.log(`     - Trạng thái: ${cycle.status}`);
        });
        
    } catch (error) {
        console.error('❌ Lỗi kiểm tra chu kỳ:', error.response?.data || error.message);
    }
}

// Main test function
async function runTest() {
    console.log('🧪 BẮT ĐẦU TEST TỰ ĐỘNG TẠO CHU KỲ MỚI');
    console.log('=====================================');
    
    // 1. Đăng nhập
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Không thể đăng nhập, dừng test');
        return;
    }
    
    // 2. Tạo chu kỳ hoàn chỉnh
    const cycleId = await createCompleteCycle();
    if (!cycleId) {
        console.log('❌ Không thể tạo chu kỳ hoàn chỉnh, dừng test');
        return;
    }
    
    // 3. Test tạo chu kỳ mới tự động
    const newCycleId = await testAutoNewCycleCreation(cycleId);
    
    // 4. Xác nhận kết quả
    await verifyNewCycles();
    
    if (newCycleId) {
        console.log('\n🎉 TEST THÀNH CÔNG!');
        console.log('Tính năng tự động tạo chu kỳ mới hoạt động chính xác.');
    } else {
        console.log('\n⚠️ TEST CHƯA THÀNH CÔNG');
        console.log('Cần kiểm tra lại logic hoặc dữ liệu test.');
    }
    
    console.log('\n=====================================');
    console.log('🏁 KẾT THÚC TEST');
}

// Chạy test
runTest().catch(console.error); 