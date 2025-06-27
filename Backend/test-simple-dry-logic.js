const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Sử dụng token từ user đã login (lấy từ browser hoặc Postman)
let authToken = ''; // User cần điền token vào đây

// Helper function để tạo headers với auth
function getHeaders() {
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}

// Test thêm ngày có máu để trigger tạo chu kỳ mới
async function testDryLogic() {
    try {
        console.log('🧪 TEST LOGIC NGÀY KHÔ ĐÃ ĐƯỢC SỬA');
        console.log('=====================================');
        
        if (!authToken) {
            console.log('❌ Vui lòng điền token vào script trước khi chạy');
            console.log('💡 Lấy token từ browser Developer Tools > Application > Local Storage > token');
            return;
        }
        
        console.log('🔍 Kiểm tra chu kỳ hiện tại...');
        
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
        console.log(`📅 Bắt đầu: ${new Date(activeCycle.startDate).toLocaleDateString('vi-VN')}`);
        
        // Thêm ngày có máu mới (hôm nay + 1)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const testDate = tomorrow.toISOString().split('T')[0];
        
        console.log(`\n🩸 Thêm máu ngày ${testDate} để test logic...`);
        
        const response = await axios.post(`${API_BASE}/menstrual-cycles/days`, {
            cycleId: activeCycle._id,
            date: testDate,
            mucusObservation: 'có máu',
            feeling: 'ướt'
        }, { headers: getHeaders() });
        
        console.log('\n📋 Kết quả từ API:');
        
        if (response.data.data?.newCycleCreated) {
            console.log('🎉 CHU KỲ MỚI ĐÃ ĐƯỢC TẠO TỰ ĐỘNG!');
            console.log(`  ✅ Chu kỳ cũ (${response.data.data.completedCycle.cycleNumber}) đã hoàn thành`);
            console.log(`  ✅ Chu kỳ mới (${response.data.data.newCycle.cycleNumber}) đã được tạo`);
            console.log(`  ✅ Logic ngày khô hoạt động CHÍNH XÁC`);
            
            console.log('\n🔧 LOGIC ĐÃ ĐƯỢC SỬA THÀNH CÔNG!');
            console.log('   Ngày undefined bây giờ được coi là ngày khô');
            return true;
        } else {
            console.log('⚠️ Chu kỳ mới chưa được tạo tự động');
            
            // In ra lý do từ response
            if (response.data.data?.autoCreateCheck) {
                console.log('\n🔍 Kết quả kiểm tra tự động tạo chu kỳ:');
                console.log(`   Nên tạo: ${response.data.data.autoCreateCheck.shouldCreate}`);
                console.log(`   Lý do: ${response.data.data.autoCreateCheck.reason}`);
                
                if (response.data.data.autoCreateCheck.reason.includes('undefined')) {
                    console.log('\n❌ VẪN CÒN LỖI LOGIC NGÀY KHÔ!');
                    console.log('   Logic vẫn coi undefined là không khô');
                } else {
                    console.log('\n✅ Logic ngày khô đã hoạt động');
                    console.log('   Lý do không tạo chu kỳ mới là khác');
                }
            }
            
            console.log('\n💡 Các lý do có thể:');
            console.log('   - Chưa có ngày đỉnh');
            console.log('   - Chưa đủ 3 ngày sau đỉnh');
            console.log('   - Có ngày sau đỉnh không khô (không phải undefined)');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Lỗi test:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n🔑 Token không hợp lệ hoặc đã hết hạn');
            console.log('💡 Vui lòng lấy token mới từ browser và cập nhật script');
        }
        
        return false;
    }
}

// Chạy test
console.log('🚀 Vui lòng điền token vào biến authToken trước khi chạy test');
console.log('💡 Lấy token từ: Browser > F12 > Application > Local Storage > token');
console.log('📝 Sau khi điền token, chạy lại: node test-simple-dry-logic.js\n');

if (authToken) {
    testDryLogic().catch(console.error);
} else {
    console.log('⏹️ Dừng test - cần token để tiếp tục');
} 