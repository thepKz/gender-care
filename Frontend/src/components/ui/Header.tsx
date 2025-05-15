import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { isAuthenticated, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await handleLogout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">Gender Care Center</Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="font-medium text-gray-700 hover:text-blue-600">Trang chủ</Link>
            <Link to="/services" className="font-medium text-gray-700 hover:text-blue-600">Dịch vụ</Link>
            <Link to="/consultants" className="font-medium text-gray-700 hover:text-blue-600">Tư vấn</Link>
            <Link to="/blog" className="font-medium text-gray-700 hover:text-blue-600">Blog</Link>
            <Link to="/contact" className="font-medium text-gray-700 hover:text-blue-600">Liên hệ</Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="font-medium text-gray-700 hover:text-blue-600">Tài khoản</Link>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-4 py-2 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 transition-all"
                >
                  Đăng nhập
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 