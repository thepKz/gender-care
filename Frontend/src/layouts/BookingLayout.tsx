import React from 'react';

const BookingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <main className="flex-grow">
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        {children}
      </div>
    </main>
  );
};

export default BookingLayout; 