import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-300px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ">
      <div className="text-center my-24">
        <h1 className="text-9xl font-extrabold text-blue-600 tracking-widest">404</h1>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 text-sm rounded-md rotate-12 absolute">
          Trang không tồn tại
        </div>
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Xin lỗi! Chúng tôi không tìm thấy trang bạn yêu cầu
          </h2>
          <p className="text-gray-600 mb-8">
            Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
          </p>
          <Link 
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all font-medium"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 