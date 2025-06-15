import React from 'react';
import { useSelector } from 'react-redux';
import ManagementTemplate from '../../../components/dashboard/templates/ManagementTemplate';

// NOTE: MOCKDATA - Sử dụng dữ liệu giả cho development

const ManagementDashboard: React.FC = () => {
  // TODO: Replace with actual user data from Redux store
  // const user = useSelector((state: any) => state.auth.user);
  
  // MOCKDATA: Giả lập thông tin user
  const mockUser = {
    role: 'admin', // hoặc 'manager'
    name: 'Nguyễn Văn Admin',
    permissions: ['read', 'write', 'delete', 'manage_users']
  };

  // Determine user role - Admin có nhiều quyền hơn Manager
  const userRole = mockUser.role === 'admin' ? 'admin' : 'manager';
  
  return (
    <ManagementTemplate 
      userRole={userRole}
      userName={mockUser.name}
      welcomeMessage={
        userRole === 'admin' 
          ? `Chào mừng ${mockUser.name}! Bạn có toàn quyền quản lý hệ thống và ${mockUser.permissions.length} quyền truy cập.`
          : `Chào mừng ${mockUser.name}! Bạn có quyền quản lý vận hành phòng khám và giám sát nhân viên.`
      }
    />
  );
};

export default ManagementDashboard;