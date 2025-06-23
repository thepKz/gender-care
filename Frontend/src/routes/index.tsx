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
import CounselorsPage from '../pages/counselors';
import OnlineConsultationPage from '../pages/online-consultation';
import PicturePage from '../pages/picture';
import PublicServicesPage from '../pages/services/PublicServicesPage';

// Doctor Pages
import DoctorDetail from '../pages/doctors/DoctorDetail';

// Booking Pages
import BookingPage from '../pages/booking';
import BookingHistoryPage from '../pages/booking-history';
import FeedbackPage from '../pages/feedback';


// Consultation Pages
import PaymentPage from '../pages/consultation/PaymentPage';
import ConsultationPaymentSuccessPage from '../pages/consultation/PaymentSuccessPage';
import ServicesPage from '../pages/services';

// Payment Pages
import PaymentProcessPage from '../pages/payment/PaymentProcessPage';
import PaymentSuccessPage from '../pages/payment/PaymentSuccessPageNew';
import PaymentCancelPage from '../pages/payment/PaymentCancelPage';

// Demo Pages
import DemoIndexPage from '../pages/demo';
import ComponentShowcasePage from '../pages/demo/components';
import RichTextComposerDemo from '../pages/demo/RichTextComposerDemo';

// Dashboard Wrapper Components
import ManagementDashboardPage from '../pages/dashboard/management';

// Manager Dashboard Components  

// Import các trang hồ sơ bệnh án
// XÓA: import HealthProfilesPage from '../pages/profile/health-profiles';
import CreateProfilePage from '../pages/profile/create-profile';
import EditProfilePage from '../pages/profile/edit-profile';
import UserProfilesPage from '../pages/profile/UserProfilesPage';
import ViewProfilePage from '../pages/profile/view-profile';
import PurchasedPackagesPage from '../pages/purchased-packages';

// Import Cycle Page
import CyclePage from '../pages/cycle';

// Hooks
import { useAuth } from '../hooks/useAuth';

// New import
import OperationalDashboardPage from '../pages/dashboard/operational';

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
        <Route path="/profile/create-profile" element={<Navigate to="/user-profiles/create" replace />} />
        <Route path="/profile/edit-profile/:profileId" element={isAuthenticated ? <EditProfilePage /> : <Navigate to="/login" replace />} />
        <Route path="/profile/view-profile/:profileId" element={isAuthenticated ? <ViewProfilePage /> : <Navigate to="/login" replace />} />
        <Route path="/medical-records/:profileId" element={isAuthenticated ? <NotFoundPage /> : <Navigate to="/login" replace />} />
      </Route>
      
      {/* Main routes - có header/footer */}
      <Route element={<MainLayout />}>
        <Route index path="/" element={<HomePage />} />
        
        {/* New Pages */}
        <Route path="/picture" element={<PicturePage />} />
        <Route path="/counselors" element={<CounselorsPage />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />
        <Route path="/about-gcc" element={<AboutGCCPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/online-consultation" element={<OnlineConsultationPage />} />
        <Route path="/services/public" element={<PublicServicesPage />} />
        
        {/* All service booking routes redirect to main booking page */}
        <Route path="/services/consulting" element={<Navigate to="/booking?service=consultation" replace />} />
        <Route path="/services/sti-test" element={<Navigate to="/booking?service=sti-testing" replace />} />
        <Route path="/services/home-sampling" element={<Navigate to="/booking?service=home-sampling" replace />} />
        <Route path="/services/cycle-tracking" element={<Navigate to="/booking?service=cycle-tracking" replace />} />
        
        {/* User Profiles Page */}
        <Route path="/user-profiles" element={isAuthenticated ? <UserProfilesPage /> : <Navigate to="/login" replace />} />
        <Route path="/user-profiles/create" element={isAuthenticated ? <CreateProfilePage /> : <Navigate to="/login" replace />} />
        
        {/* Purchased Packages Page */}
        <Route path="/purchased-packages" element={isAuthenticated ? <PurchasedPackagesPage /> : <Navigate to="/login" replace />} />
        
        {/* Cycle Tracking Page */}
        <Route path="/cycle" element={isAuthenticated ? <CyclePage /> : <Navigate to="/login" replace />} />
        
        {/* Booking Pages */}
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking-history" element={<BookingHistoryPage />} />

        <Route path="/feedback" element={<FeedbackPage />} />
        
        {/* Payment Processing Pages */}
        <Route path="/payment/process" element={<PaymentProcessPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        
        {/* Consultation Pages */}
        <Route path="/consultation/payment/:qaId" element={<PaymentPage />} />
        <Route path="/consultation/success/:qaId?" element={<ConsultationPaymentSuccessPage />} />
        
        {/* Demo Pages */}
        <Route path="/demo" element={<DemoIndexPage />} />
        <Route path="/demo/components" element={<ComponentShowcasePage />} />
        <Route path="/demo/composer" element={<RichTextComposerDemo />} />
        
        {/* Các route khác */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      
      {/* Legacy Dashboard Redirects (tạm giữ để không 404, chuyển sang cấu trúc mới) */}
      <Route path="/admin-dashboard" element={<Navigate to="/dashboard/management" replace />} />
      <Route path="/staff-dashboard" element={<Navigate to="/dashboard/operational" replace />} />

      {/* Dashboard Routes - template based (không dùng DashboardWrapper) */}
      <Route path="/dashboard/management" element={isAuthenticated ? <ManagementDashboardPage /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/operational" element={isAuthenticated ? <OperationalDashboardPage /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes; 