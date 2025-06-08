import React from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import DoctorPerformance from './DoctorPerformance';
import { useAuth } from '../../../hooks/useAuth';

const DoctorPerformancePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout userRole={user?.role || 'admin'}>
      <DoctorPerformance />
    </DashboardLayout>
  );
};

export default DoctorPerformancePage; 