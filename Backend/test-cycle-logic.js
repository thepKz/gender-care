const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Google user credentials  
const googleUser = {
    email: 'nttltommy010220@gmail.com',
    password: 'Truong3979'
};

let authToken = '';

// Helper function để login qua Google
async function loginWithGoogle() {
    try {
        const response = await axios.post(`${API_BASE}/auth/login-google`, {
            email: googleUser.email,
            name: 'Test User',
            picture: 'https://example.com/avatar.jpg'
        });
        
        authToken = response.data.data.token;
        console.log('✅ Google login thành công cho user:', googleUser.email);
        return true;
    } catch (error) {
        console.error('❌ Lỗi Google login:', error.response?.data || error.message);
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

// Test thêm ngày có máu để trigger tạo chu kỳ mới
async function testCycleAutoCreation() {
    try {
        console.log('\n🩸 Test thêm máu mới để tạo chu kỳ mới tự động...');
        
        // Lấy danh sách chu kỳ hiện tại
        const currentCyclesResponse = await axios.get(`${API_BASE}/menstrual-cycles`, {
            headers: getHeaders()
        });
        
        const currentCycles = currentCyclesResponse.data.data.cycles || currentCyclesResponse.data.data;
        console.log(`📊 Hiện tại có ${currentCycles.length} chu kỳ`);
        
        if (currentCycles.length === 0) {
            console.log('❌ Không có chu kỳ nào để test');
            return;
        }
        
        // Lấy chu kỳ đang hoạt động (incomplete)
        const activeCycle = currentCycles.find(c => !c.isCompleted) || currentCycles[currentCycles.length - 1];
        console.log(`🎯 Test với chu kỳ ${activeCycle.cycleNumber}`);
        
        // Thêm ngày có máu mới (hôm nay)
        const today = new Date();
        const testDate = today.toISOString().split('T')[0];
        
        console.log(`📅 Thêm máu ngày ${testDate}...`);
        
        const response = await axios.post(`${API_BASE}/menstrual-cycles/days`, {
            cycleId: activeCycle._id,
            date: testDate,
            mucusObservation: 'có máu',
            feeling: 'ướt'
        }, { headers: getHeaders() });
        
        console.log('📋 Kết quả API:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.data?.newCycleCreated) {
            console.log('\n🎉 CHU KỲ MỚI ĐÃ ĐƯỢC TẠO TỰ ĐỘNG!');
            console.log(`  ✅ Chu kỳ cũ (${response.data.data.completedCycle.cycleNumber}) đã hoàn thành`);
            console.log(`  ✅ Chu kỳ mới (${response.data.data.newCycle.cycleNumber}) đã được tạo`);
            console.log(`  ✅ Ngày máu đã chuyển sang chu kỳ mới`);
            return true;
        } else {
            console.log('\n⚠️ Chu kỳ mới chưa được tạo tự động');
            
            // In ra lý do từ response
            if (response.data.data?.autoCreateCheck) {
                console.log('🔍 Kết quả kiểm tra tự động tạo chu kỳ:');
                console.log(`   Nên tạo: ${response.data.data.autoCreateCheck.shouldCreate}`);
                console.log(`   Lý do: ${response.data.data.autoCreateCheck.reason}`);
            }
            
            console.log('\n💡 Có thể do:');
            console.log('   - Chu kỳ hiện tại chưa đủ điều kiện hoàn thành');
            console.log('   - Chưa có ngày đỉnh hoặc chưa đủ 3 ngày sau đỉnh');
            console.log('   - 3 ngày sau đỉnh chưa hoàn toàn khô');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Lỗi test tạo chu kỳ mới:', error.response?.data || error.message);
        return false;
    }
}

// Xem danh sách chu kỳ để verification
async function showCurrentCycles() {
    try {
        console.log('\n📋 Danh sách chu kỳ hiện tại:');
        
        const response = await axios.get(`${API_BASE}/menstrual-cycles`, {
            headers: getHeaders()
        });
        
        const cycles = response.data.data.cycles || response.data.data;
        console.log(`📊 Tổng cộng: ${cycles.length} chu kỳ\n`);
        
        cycles.forEach((cycle, index) => {
            console.log(`${index + 1}. Chu kỳ ${cycle.cycleNumber}:`);
            console.log(`   📅 Bắt đầu: ${new Date(cycle.startDate).toLocaleDateString('vi-VN')}`);
            console.log(`   📅 Kết thúc: ${cycle.endDate ? new Date(cycle.endDate).toLocaleDateString('vi-VN') : 'Đang diễn ra'}`);
            console.log(`   ✅ Hoàn thành: ${cycle.isCompleted ? 'Có' : 'Không'}`);
            console.log(`   📊 Trạng thái: ${cycle.status}`);
            console.log(`   📏 Độ dài: ${cycle.cycleLength || 'Chưa xác định'} ngày\n`);
        });
        
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách chu kỳ:', error.response?.data || error.message);
    }
}

// Main test function
async function runTest() {
    console.log('🧪 TEST LOGIC TỰ ĐỘNG TẠO CHU KỲ MỚI');
    console.log('=====================================');
    
    // 1. Đăng nhập với Google
    const loginSuccess = await loginWithGoogle();
    if (!loginSuccess) {
        console.log('❌ Không thể đăng nhập, dừng test');
        return;
    }
    
    // 2. Xem chu kỳ hiện tại
    await showCurrentCycles();
    
    // 3. Test logic tự động tạo chu kỳ
    const autoCreateSuccess = await testCycleAutoCreation();
    
    // 4. Xem lại chu kỳ sau khi test
    await showCurrentCycles();
    
    if (autoCreateSuccess) {
        console.log('\n🎉 TEST THÀNH CÔNG!');
        console.log('✅ Logic tự động tạo chu kỳ mới hoạt động chính xác.');
    } else {
        console.log('\n⚠️ TEST CHƯA TẠO CHU KỲ MỚI');
        console.log('ℹ️ Có thể do chưa đủ điều kiện hoặc cần kiểm tra logic.');
    }
    
    console.log('\n=====================================');
    console.log('🏁 KẾT THÚC TEST');
}

// Chạy test
runTest().catch(console.error); 