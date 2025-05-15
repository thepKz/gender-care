import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../ui/Footer';
import Header from '../ui/Header';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto py-6 px-4">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout; 