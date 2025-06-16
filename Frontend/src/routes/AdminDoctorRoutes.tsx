import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Result, Button } from 'antd';

// Temporary placeholder components for missing pages
const DoctorProfilesPage = () => (
  <Result
    status="404"
    title="Trang đang phát triển"
    subTitle="Trang quản lý hồ sơ bác sĩ đang được phát triển"
    extra={<Button type="primary">Quay lại</Button>}
  />
);

const DoctorSchedulePage = () => (
  <Result
    status="404"
    title="Trang đang phát triển"
    subTitle="Trang lịch làm việc bác sĩ đang được phát triển"
    extra={<Button type="primary">Quay lại</Button>}
  />
);

const DoctorPerformancePage = () => (
  <Result
    status="404"
    title="Trang đang phát triển"
    subTitle="Trang hiệu suất bác sĩ đang được phát triển"
    extra={<Button type="primary">Quay lại</Button>}
  />
);

const DoctorSpecialtiesPage = () => (
  <Result
    status="404"
    title="Trang đang phát triển"
    subTitle="Trang chuyên khoa bác sĩ đang được phát triển"
    extra={<Button type="primary">Quay lại</Button>}
  />
);

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