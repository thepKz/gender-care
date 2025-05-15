import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Các trang public
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import HomePage from './pages/home';
import NotFoundPage from './pages/notFound';

// Layout component
import MainLayout from './components/layouts/MainLayout';

const App: React.FC = () => {
  const { token, fetchProfile } = useAuth();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App; 