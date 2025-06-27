const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAutoCycleLogic() {
    console.log('Testing auto cycle creation logic...');
    
    try {
        // Đầu tiên tạo user test
        console.log('Creating test user...');
        await axios.post(`${API_BASE}/auth/register`, {
            email: 'autotest@example.com',
            password: 'password123',
            gender: 'female',
            role: 'user'
        });
        console.log('User created or already exists');
    } catch (error) {
        if (error.response?.status !== 400) { // 400 = user exists
            console.error('Error creating user:', error.message);
            return;
        }
        console.log('User already exists, continue...');
    }
    
    try {
        // Đăng nhập
        console.log('Logging in...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'autotest@example.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.data.token;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('Login successful');
        
        // Tạo chu kỳ
        console.log('Creating cycle...');
        const cycleResponse = await axios.post(`${API_BASE}/menstrual-cycles`, {
            startDate: '2024-12-02'
        }, { headers });
        
        const cycleId = cycleResponse.data.data._id;
        console.log('Cycle created:', cycleId);
        
        // Thêm dữ liệu để tạo chu kỳ hoàn chỉnh
        const days = [
            { date: '2024-12-02', mucusObservation: 'có máu', feeling: 'ướt' },
            { date: '2024-12-18', mucusObservation: 'trong và âm hộ căng', feeling: 'trơn' }, // Peak day
            { date: '2024-12-19', mucusObservation: 'ít chất tiết', feeling: 'khô' }, // Day 1 after peak
            { date: '2024-12-20', mucusObservation: 'ít chất tiết', feeling: 'khô' }, // Day 2 after peak  
            { date: '2024-12-21', mucusObservation: 'ít chất tiết', feeling: 'khô' }, // Day 3 after peak
        ];
        
        for (const day of days) {
            console.log(`Adding day ${day.date}...`);
            await axios.post(`${API_BASE}/menstrual-cycles/days`, {
                cycleId,
                ...day
            }, { headers });
        }
        
        console.log('Complete cycle data added');
        
        // Bây giờ thêm máu mới để trigger auto new cycle
        console.log('Adding new blood to trigger auto cycle creation...');
        const newBloodResponse = await axios.post(`${API_BASE}/menstrual-cycles/days`, {
            cycleId,
            date: '2024-12-24',
            mucusObservation: 'có máu',
            feeling: 'ướt'
        }, { headers });
        
        console.log('Response:', JSON.stringify(newBloodResponse.data, null, 2));
        
        if (newBloodResponse.data.data?.newCycleCreated) {
            console.log('✅ AUTO CYCLE CREATION SUCCESSFUL!');
        } else {
            console.log('❌ Auto cycle creation did not trigger');
        }
        
    } catch (error) {
        console.error('Test error:', error.response?.data || error.message);
    }
}

testAutoCycleLogic(); 