import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../ui/Footer';
import Header from '../ui/Header';

const MainLayout: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  
  useEffect(() => {
    // Lấy chiều cao của header
    const header = document.querySelector('header');
    if (header) {
      const height = header.offsetHeight;
      setHeaderHeight(height);
    }
    
    // Thiết lập lại khi resize window
    const handleResize = () => {
      const header = document.querySelector('header');
      if (header) {
        const height = header.offsetHeight;
        setHeaderHeight(height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="flex flex-col min-h-[600px]">
      <Header />
      {/* Placeholder cho header */}
      <div style={{ height: `${headerHeight}px` }}></div>
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout; 