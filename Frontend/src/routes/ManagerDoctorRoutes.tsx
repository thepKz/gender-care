import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ManagerDoctorPerformancePage from '../pages/dashboard/manager/DoctorPerformancePage';
import ManagerDoctorProfilesPage from '../pages/dashboard/manager/DoctorProfilesPage';
import ManagerDoctorSchedulePage from '../pages/dashboard/manager/DoctorSchedulePage';
import ManagerDoctorSpecialtiesPage from '../pages/dashboard/manager/DoctorSpecialtiesPage';

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