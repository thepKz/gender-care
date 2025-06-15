import React from 'react';
import { useSelector } from 'react-redux';
import OperationalTemplate from '../../../components/dashboard/templates/OperationalTemplate';

// NOTE: MOCKDATA - Sử dụng dữ liệu giả cho development

const OperationalDashboard: React.FC = () => {
  // TODO: Replace with actual user data from Redux store
  // const user = useSelector((state: any) => state.auth.user);
  
  // MOCKDATA: Giả lập thông tin user
  const mockUser = {
    role: 'doctor', // hoặc 'staff'
    name: 'Lê Thị Mai',
    specialty: 'Sản khoa & Phụ khoa',
    experience: '5 năm'
  };

  // Determine user role - Doctor và Staff có giao diện tương tự nhưng nội dung khác
  const userRole = mockUser.role === 'doctor' ? 'doctor' : 'staff';
  
  return (
    <OperationalTemplate 
      userRole={userRole}
      userName={mockUser.name}
      welcomeMessage={
        userRole === 'doctor' 
          ? `Chào mừng Dr. ${mockUser.name}! Chuyên khoa ${mockUser.specialty}, kinh nghiệm ${mockUser.experience}.`
          : `Chào mừng ${mockUser.name}! Cảm ơn bạn đã hỗ trợ tích cực trong vận hành phòng khám.`
      }
    />
  );
};

export default OperationalDashboard;