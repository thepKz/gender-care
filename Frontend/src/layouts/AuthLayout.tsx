import React from 'react';
import { Outlet } from 'react-router-dom';
import Image1 from '../assets/images/image1.jpg';

const AuthLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex w-full max-w-5xl shadow-2xl rounded-2xl overflow-hidden bg-white min-h-[600px]">
        {/* Hình ảnh minh họa */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-cyan-200 to-blue-200">
          <img
            src={Image1}
            alt="Tư vấn sức khỏe"
            className="object-cover w-full h-full"
          />
        </div>
        {/* Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            {children ? children : <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 