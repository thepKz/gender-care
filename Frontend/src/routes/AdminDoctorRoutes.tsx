import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DoctorProfilesPage from '../pages/dashboard/admin/DoctorProfilesPage';
import DoctorSchedulePage from '../pages/dashboard/admin/DoctorSchedulePage';
import DoctorPerformancePage from '../pages/dashboard/admin/DoctorPerformancePage';
import DoctorSpecialtiesPage from '../pages/dashboard/admin/DoctorSpecialtiesPage';

const AdminDoctorRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="profiles" element={<DoctorProfilesPage />} />
      <Route path="schedule" element={<DoctorSchedulePage />} />
      <Route path="performance" element={<DoctorPerformancePage />} />
      <Route path="specialties" element={<DoctorSpecialtiesPage />} />
    </Routes>
  );
};

export default AdminDoctorRoutes; 