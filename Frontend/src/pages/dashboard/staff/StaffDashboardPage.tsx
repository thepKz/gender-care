import React from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import StaffDashboard from './index';
import { useAppSelector } from '../../../redux/hooks';

const StaffDashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role as 'admin' | 'manager' | 'staff' | 'doctor';

  return (
    <DashboardLayout userRole={userRole || 'staff'}>
      <StaffDashboard />
    </DashboardLayout>
  );
};

export default StaffDashboardPage; 