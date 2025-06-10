import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';

// Dashboard Home Pages
import AdminDashboard from '../../pages/dashboard/admin/index';
import ManagerDashboard from '../../pages/dashboard/manager/index';
import StaffDashboard from '../../pages/dashboard/staff/index';
import DoctorDashboard from '../../pages/dashboard/doctors/index';

// Admin Pages
import AdminDoctorProfilesPage from '../../pages/dashboard/admin/DoctorProfilesPage';
import AdminDoctorSchedulePage from '../../pages/dashboard/admin/DoctorSchedulePage';
import AdminDoctorPerformancePage from '../../pages/dashboard/admin/DoctorPerformancePage';
import AdminDoctorSpecialtiesPage from '../../pages/dashboard/admin/DoctorSpecialtiesPage';

// Manager Pages
import ManagerDoctorProfilesPage from '../../pages/dashboard/manager/DoctorProfilesPage';
import ManagerDoctorSchedulePage from '../../pages/dashboard/manager/DoctorSchedulePage';
import ManagerDoctorPerformancePage from '../../pages/dashboard/manager/DoctorPerformancePage';
import ManagerDoctorSpecialtiesPage from '../../pages/dashboard/manager/DoctorSpecialtiesPage';
import UserManagementPage from '../../pages/dashboard/manager/UserManagementPage';

// Staff Pages
import StaffDoctorSchedulePage from '../../pages/dashboard/staff/DoctorSchedulePage';

// Doctor Pages
import DoctorMySchedulePage from '../../pages/dashboard/doctors/DoctorMySchedulePage';

const DashboardWrapper: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Kiểm tra authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra role
  if (!user || !['admin', 'manager', 'staff', 'doctor'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  const userRole = user.role as 'admin' | 'manager' | 'staff' | 'doctor';

  return (
    <DashboardLayout userRole={userRole}>
      <Routes>
        {/* Admin Routes */}
        {(userRole === 'admin') && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/doctors/profiles" element={<AdminDoctorProfilesPage />} />
            <Route path="/admin/doctors/schedule" element={<AdminDoctorSchedulePage />} />
            <Route path="/admin/doctors/performance" element={<AdminDoctorPerformancePage />} />
            <Route path="/admin/doctors/specialties" element={<AdminDoctorSpecialtiesPage />} />
            <Route path="/" element={<Navigate to="/dashboard/admin" replace />} />
          </>
        )}

        {/* Manager Routes */}
        {(userRole === 'manager') && (
          <>
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/manager/users" element={<UserManagementPage />} />
            <Route path="/manager/doctors/profiles" element={<ManagerDoctorProfilesPage />} />
            <Route path="/manager/doctors/schedule" element={<ManagerDoctorSchedulePage />} />
            <Route path="/manager/doctors/performance" element={<ManagerDoctorPerformancePage />} />
            <Route path="/manager/doctors/specialties" element={<ManagerDoctorSpecialtiesPage />} />
            <Route path="/" element={<Navigate to="/dashboard/manager" replace />} />
          </>
        )}

        {/* Staff Routes */}
        {(userRole === 'staff') && (
          <>
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/staff/schedule" element={<StaffDoctorSchedulePage />} />
            <Route path="/" element={<Navigate to="/dashboard/staff" replace />} />
          </>
        )}

        {/* Doctor Routes */}
        {(userRole === 'doctor') && (
          <>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/my-schedule" element={<DoctorMySchedulePage />} />
            <Route path="/" element={<Navigate to="/dashboard/doctor" replace />} />
          </>
        )}

        {/* Fallback - redirect based on role */}
        <Route path="*" element={<Navigate to={`/dashboard/${userRole}`} replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default DashboardWrapper; 