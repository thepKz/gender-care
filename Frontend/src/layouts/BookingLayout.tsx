import React from 'react';

const BookingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="w-full max-w-xl p-4 sm:p-8 bg-white/90 rounded-2xl shadow-xl border border-gray-100">
        {children}
      </div>
    </div>
  );
};

export default BookingLayout; 