import React from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import DoctorSpecialties from './DoctorSpecialties';
import { useAuth } from '../../../hooks/useAuth';

const DoctorSpecialtiesPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout userRole={user?.role || 'admin'}>
      <DoctorSpecialties />
    </DashboardLayout>
  );
};

export default DoctorSpecialtiesPage; 