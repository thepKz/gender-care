import { Spin } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProfileLayout from '../layouts/ProfileLayout';

// Pages
import ForgotPasswordPage from '../pages/auth/ForgotPassword';
import LoginPage from '../pages/auth/Login';
import RegisterPage from '../pages/auth/Register';
import VerifyEmailPage from '../pages/auth/VerifyEmail';
import HomePage from '../pages/home';
import NotFoundPage from '../pages/notFound';
import ProfilePage from '../pages/profile';
import ProfileEditPage from '../pages/profile/edit';

// New Pages
import AboutGCCPage from '../pages/about-gcc';
import BlogPage from '../pages/blog';
import CounselorsPage from '../pages/counselors';
import PicturePage from '../pages/picture';
import ServicesPage from '../pages/services';

// Booking Pages
import BookingPage from '../pages/booking';
import BookingHistoryPage from '../pages/booking-history';
import FeedbackPage from '../pages/feedback';

// Demo Pages
import DemoIndexPage from '../pages/demo';
import ComponentShowcasePage from '../pages/demo/components';

// Hooks
import { useAuth } from '../hooks/useAuth';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const initialLoadDone = useRef(false);
  
  useEffect(() => {
    // Chỉ hiển thị màn hình loading khi tải lần đầu, không cần fetch lại profile ở đây
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      // Đặt timeout ngắn để đảm bảo UI không bị nhấp nháy
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Auth routes - không header/footer */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/" replace />} />
        <Route path="/verify-email" element={isAuthenticated ? <VerifyEmailPage /> : <Navigate to="/login" replace />} />
        {/* Thêm các trang xác thực khác nếu có */}
      </Route>
      {/* Profile routes - không header/footer, nền gradient */}
      <Route element={<ProfileLayout />}>
        <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />} />
        <Route path="/profile/edit" element={isAuthenticated ? <ProfileEditPage /> : <Navigate to="/login" replace />} />
      </Route>
      {/* Main routes - có header/footer */}
      <Route element={<MainLayout />}>
        <Route index path="/" element={<HomePage />} />
        
        {/* New Pages */}
        <Route path="/picture" element={<PicturePage />} />
        <Route path="/counselors" element={<CounselorsPage />} />
        <Route path="/about-gcc" element={<AboutGCCPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/services" element={<ServicesPage />} />
        
        {/* All service booking routes redirect to main booking page */}
        <Route path="/services/consulting" element={<Navigate to="/booking?service=consultation" replace />} />
        <Route path="/services/sti-test" element={<Navigate to="/booking?service=sti-testing" replace />} />
        <Route path="/services/home-sampling" element={<Navigate to="/booking?service=home-sampling" replace />} />
        <Route path="/services/cycle-tracking" element={<Navigate to="/booking?service=cycle-tracking" replace />} />
        
        {/* Booking Pages */}
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking-history" element={<BookingHistoryPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        
        {/* Demo Pages */}
        <Route path="/demo" element={<DemoIndexPage />} />
        <Route path="/demo/components" element={<ComponentShowcasePage />} />
        
        {/* Các route khác */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 