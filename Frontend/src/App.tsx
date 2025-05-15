import React, { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import AppRoutes from './routes';

const App: React.FC = () => {
  const { token, fetchProfile } = useAuth();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  return <AppRoutes />;
};

export default App; 