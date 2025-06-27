import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import './profileLayout.css';

const ProfileLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="personal-layout-container">
          <div className="personal-layout-content">
            <div className="personal-layout-main">
              {children ? children : <Outlet />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileLayout;