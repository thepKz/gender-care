import React from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import DoctorProfiles from './DoctorProfiles';
import { useAuth } from '../../../hooks/useAuth';

const DoctorProfilesPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() as 'admin' | 'manager' | 'staff' | 'doctor';

  return (
    <DashboardLayout userRole={userRole || 'admin'}>
      <DoctorProfiles />
    </DashboardLayout>
  );
};

export default DoctorProfilesPage; 