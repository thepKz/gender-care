const axios = require('axios');

// Cấu hình API base URL
const API_BASE = 'http://localhost:5000/api';

// Token của manager (thay thế bằng token thực tế)
const MANAGER_TOKEN = 'your-manager-jwt-token-here';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${MANAGER_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Test CRUD operations
async function testManagerCRUD() {
  console.log('🚀 Testing Manager CRUD APIs...\n');

  try {
    // 1. GET - Lấy danh sách users
    console.log('1. 📋 Testing GET /users');
    const users = await apiClient.get('/users?page=1&limit=10');
    console.log('✅ GET Users:', users.data.success ? 'SUCCESS' : 'FAILED');
    console.log('   Total users:', users.data.data?.pagination?.totalUsers || 0);

    // 2. GET - Thống kê hệ thống
    console.log('\n2. 📊 Testing GET /users/statistics');
    const stats = await apiClient.get('/users/statistics');
    console.log('✅ GET Statistics:', stats.data.success ? 'SUCCESS' : 'FAILED');

    // 3. POST - Tạo user mới
    console.log('\n3. ➕ Testing POST /users');
    const newUser = {
      email: 'test-manager-create@example.com',
      password: 'password123',
      fullName: 'Test User Created by Manager',
      phone: '0123456789',
      role: 'customer'
    };
    
    try {
      const createResult = await apiClient.post('/users', newUser);
      console.log('✅ POST Create User:', createResult.data.success ? 'SUCCESS' : 'FAILED');
      
      if (createResult.data.success) {
        const userId = createResult.data.data._id;
        console.log('   Created user ID:', userId);
        
        // 4. GET - Lấy chi tiết user vừa tạo
        console.log('\n4. 🔍 Testing GET /users/:userId');
        const userDetail = await apiClient.get(`/users/${userId}`);
        console.log('✅ GET User Detail:', userDetail.data.success ? 'SUCCESS' : 'FAILED');
        
        // 5. PATCH - Toggle status
        console.log('\n5. 🔄 Testing PATCH /users/:userId/toggle-status');
        const toggleResult = await apiClient.patch(`/users/${userId}/toggle-status`, {
          reason: 'Test toggle by manager'
        });
        console.log('✅ PATCH Toggle Status:', toggleResult.data.success ? 'SUCCESS' : 'FAILED');
        
        // 6. PUT - Update role
        console.log('\n6. 🔧 Testing PUT /users/:userId/role');
        const roleUpdate = await apiClient.put(`/users/${userId}/role`, {
          newRole: 'staff',
          reason: 'Test role update by manager'
        });
        console.log('✅ PUT Update Role:', roleUpdate.data.success ? 'SUCCESS' : 'FAILED');
        
        // 7. DELETE - Xóa user (soft delete)
        console.log('\n7. 🗑️ Testing DELETE /users/:userId');
        const deleteResult = await apiClient.delete(`/users/${userId}`, {
          data: { reason: 'Test delete by manager' }
        });
        console.log('✅ DELETE User:', deleteResult.data.success ? 'SUCCESS' : 'FAILED');
      }
    } catch (createError) {
      console.log('❌ POST Create User: FAILED');
      console.log('   Error:', createError.response?.data?.message || createError.message);
    }

    // Test các ràng buộc của manager
    console.log('\n8. 🛡️ Testing Manager Restrictions');
    
    // Thử tạo admin (should fail)
    try {
      await apiClient.post('/users', {
        email: 'admin-test@example.com',
        password: 'password123',
        fullName: 'Test Admin',
        role: 'admin'
      });
      console.log('❌ Manager create admin: SHOULD HAVE FAILED');
    } catch (adminError) {
      console.log('✅ Manager create admin: PROPERLY BLOCKED');
      console.log('   Error:', adminError.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Chạy test
testManagerCRUD(); 