import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import OperationalTemplate from '../../../components/dashboard/templates/OperationalTemplate';

const OperationalDashboard: React.FC = () => {
  const { user } = useAuth();

  const role: 'doctor' | 'staff' = user && user.role === 'doctor' ? 'doctor' : 'staff';

  return (
    <OperationalTemplate
      userRole={role}
      userName={user?.fullName || 'Người dùng'}
    />
  );
};

export default OperationalDashboard;

// Operational Dashboard Pages - Doctor Role
export { default as AppointmentManagement } from './AppointmentManagement';
export { default as MedicalRecordsManagement } from './MedicalRecordsManagement';
export { default as ConsultationManagement } from './ConsultationManagement';
export { default as MeetingHistoryManagement } from './MeetingHistoryManagement';
export { default as RefundManagement } from './RefundManagement';     