import React from 'react';
import { Outlet } from 'react-router-dom';
import Image1 from '../assets/images/image1.jpg';

const AuthLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="flex w-full max-w-5xl shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px]">
        {/* Hình ảnh minh họa - 45% trên desktop, ẩn trên tablet */}
        <div className="hidden lg:flex lg:w-2/5 items-center justify-center bg-gradient-to-br from-blue-primary/5 to-green-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-primary/10 to-green-primary/10"></div>
          <div className="relative z-10 w-full h-full flex flex-col">
            <img
              src={Image1}
              alt="Tư vấn sức khỏe phụ nữ"
              className="object-cover w-full flex-1 opacity-90"
            />
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-bold text-blue-primary mb-1">
                  Chăm sóc sức khỏe phụ nữ
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Dịch vụ tư vấn chuyên nghiệp, an toàn và riêng tư
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form - 55% trên desktop, full width trên mobile/tablet */}
        <div className="flex-1 lg:w-3/5 flex items-center justify-center p-6 lg:p-10 bg-white">
          <div className="w-full max-w-md">
            {children ? children : <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 