import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../redux/slices/authSlice';
import { AppDispatch } from '../../../redux/store';

interface LogoutButtonProps {
  className?: string;
  text?: string;
  redirectTo?: string;
  variant?: 'primary' | 'outline' | 'text'; 
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = '', 
  text = 'Đăng xuất', 
  redirectTo = '/login',
  variant = 'primary'
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const getButtonClasses = () => {
    const baseClasses = 'px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white`;
      case 'outline':
        return `${baseClasses} border border-red-600 text-red-600 hover:bg-red-50`;
      case 'text':
        return `${baseClasses} text-red-600 hover:bg-red-50`;
      default:
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white`;
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      navigate(redirectTo);
    } catch (error) {
      console.error('Đăng xuất thất bại:', error);
      // Vẫn chuyển hướng ngay cả khi có lỗi
      navigate(redirectTo);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`${getButtonClasses()} ${className}`}
      type="button"
    >
      {text}
    </button>
  );
};

export default LogoutButton; 