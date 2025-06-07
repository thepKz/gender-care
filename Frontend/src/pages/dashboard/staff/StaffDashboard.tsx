import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import DashboardLayout from '../../../layouts/DashboardLayout';
import StaffDashboard from './index';

const StaffDashboardWrapper: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Kiểm tra authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra role có phải staff hoặc doctor không
  if (!user || !['staff', 'doctor'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout userRole={user.role as 'staff' | 'doctor'}>
      <StaffDashboard />
    </DashboardLayout>
  );
};

export default StaffDashboardWrapper; 