import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

const BookingLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50 relative">
      {/* Back Button - Fixed Position - NO ICON */}
      <button
        onClick={handleGoBack}
        className="fixed top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 text-gray-700 hover:text-gray-900"
      >
        <span className="text-lg">←</span>
        <span className="font-medium">Quay lại</span>
      </button>

      {/* Main Content */}
    <main className="flex-grow">
        <Outlet />
      </main>
      </div>
  );
};

export default BookingLayout; 