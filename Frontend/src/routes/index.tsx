import { Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layouts/MainLayout';

// Pages
import LoginPage from '../pages/auth/Login';
import RegisterPage from '../pages/auth/Register';
import HomePage from '../pages/home';
import NotFoundPage from '../pages/notFound';

// Hooks
import { useAuth } from '../hooks/useAuth';

const AppRoutes: React.FC = () => {
  const { token, fetchProfile } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const initApp = async () => {
      if (token) {
        await fetchProfile();
      }
      setIsLoading(false);
    };
    
    initApp();
  }, [token, fetchProfile]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        
        {/* Các routes không cần đăng nhập */}
        <Route path="login" element={
          !token ? <LoginPage /> : <Navigate to="/" replace />
        } />
        <Route path="register" element={
          !token ? <RegisterPage /> : <Navigate to="/" replace />
        } />
        
        {/* Các routes cần đăng nhập - thêm sau */}
        {/* <Route path="profile" element={
          token ? <ProfilePage /> : <Navigate to="/login" replace />
        } /> */}
        
        {/* Nested routes - thêm sau */}
        {/* <Route path="services">
          <Route index element={<ServicesPage />} />
          <Route path="details/:id" element={<ServiceDetailPage />} />
        </Route> */}
        
        {/* Catch all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 