import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import DashboardLayout from '../../../layouts/DashboardLayout';
import AdminDashboard from './index';

const AdminDashboardWrapper: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Kiểm tra authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra role có phải admin hoặc manager không
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout userRole={user.role as 'admin' | 'manager'}>
      <AdminDashboard />
    </DashboardLayout>
  );
};

export default AdminDashboardWrapper; 