import React from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import AdminDashboard from './index';
import { useAppSelector } from '../../../redux/hooks';

const AdminDashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role as 'admin' | 'manager' | 'staff' | 'doctor';

  return (
    <DashboardLayout userRole={userRole || 'admin'}>
      <AdminDashboard />
    </DashboardLayout>
  );
};

export default AdminDashboardPage; 