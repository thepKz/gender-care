import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ManagerDoctorProfilesPage from '../pages/dashboard/manager/DoctorProfilesPage';
import { 
  DoctorSchedulePage as ManagerDoctorSchedulePage,
  DoctorPerformancePage as ManagerDoctorPerformancePage,
  DoctorSpecialtiesPage as ManagerDoctorSpecialtiesPage
} from '../pages/dashboard/admin'; // Reuse admin components

const ManagerDoctorRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="profiles" element={<ManagerDoctorProfilesPage />} />
      <Route path="schedule" element={<ManagerDoctorSchedulePage />} />
      <Route path="performance" element={<ManagerDoctorPerformancePage />} />
      <Route path="specialties" element={<ManagerDoctorSpecialtiesPage />} />
    </Routes>
  );
};

export default ManagerDoctorRoutes; 