import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import ManagementTemplate from '../../../components/dashboard/templates/ManagementTemplate';

const ManagementDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fallback nếu user không xác định (không nên xảy ra do đã check auth ở route)
  const role: 'admin' | 'manager' = user && user.role === 'admin' ? 'admin' : 'manager';

  return (
    <ManagementTemplate
      userRole={role}
      userName={user?.fullName || 'Người dùng'}
    />
  );
};

export default ManagementDashboard;