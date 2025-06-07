import React from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import DoctorSchedule from './DoctorSchedule';
import { useAuth } from '../../../hooks/useAuth';

const DoctorSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() as 'admin' | 'manager' | 'staff' | 'doctor';

  return (
    <DashboardLayout userRole={userRole || 'admin'}>
      <DoctorSchedule />
    </DashboardLayout>
  );
};

export default DoctorSchedulePage; 