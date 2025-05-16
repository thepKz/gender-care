import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../ui/Footer';
import Header from '../ui/Header';

const MainLayout: React.FC = () => {
  return (
    <div>
      <Header />
          <Outlet />
      <Footer />
    </div>
  );
};

export default MainLayout; 