import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

// Define type cho window.google để tránh dùng any
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            authorized_origins?: string[];
            ux_mode?: string;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme: string;
              size: string;
              width: number;
              logo_alignment: string;
              text: string;
              shape: string;
            }
          ) => void;
        };
      };
    };
  }
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
  clientId?: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [touchedFields, setTouchedFields] = useState<{
    email: boolean;
    password: boolean;
  }>({ email: false, password: false });
  
  const { handleLogin, handleGoogleLogin, error, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.google && googleButtonRef.current) {
      try {
        // Lấy current domain để thiết lập chính xác
        const currentOrigin = window.location.origin;
        console.log('Current origin:', currentOrigin);
        
        // Danh sách tất cả các origins được phép
        const authorizedOrigins = [
          'https://gender-healthcare-service-management.onrender.com',
          'http://localhost:5000',
          'http://localhost:5173',
          'http://localhost:3000',
          'https://gender-healthcare.vercel.app',
          'https://team05.ksfu.cloud', // Thêm domain hiện tại
          currentOrigin
        ];

        // Loại bỏ duplicates
        const uniqueOrigins = [...new Set(authorizedOrigins)];
        
        window.google.accounts.id.initialize({
          client_id: '203228075747-cnn4bmrbnkeqmbiouptng2kajeur2fjp.apps.googleusercontent.com',
          callback: async (response: GoogleCredentialResponse) => {
            setLoginError(null);
            try {
              console.log('Google login response received:', response);
              
              // Sử dụng handleGoogleLogin từ useAuth hook với timeout handling
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Google login timeout')), 25000); // 25 giây
              });
              
              const loginPromise = handleGoogleLogin(response.credential);
              
              const result = await Promise.race([loginPromise, timeoutPromise]) as any;
              
              if (result.success) {
                console.log('Google login success:', result);
                console.log('User data after Google login:', result.user);
                console.log('User avatar from Google:', result.user?.avatar);
                toast.success('Đăng nhập Google thành công!');
                
                // Gọi fetchProfile để lấy thông tin user mới nhất
                await fetchProfile();
                
                // Chuyển hướng dựa trên role
                const userRole = result.user?.role;
                if (userRole && ['admin', 'manager'].includes(userRole)) {
                  navigate('/dashboard/management');
                } else if (userRole && ['staff', 'doctor'].includes(userRole)) {
                  navigate('/dashboard/operational');
                } else {
                  // Customer hoặc role khác thì về trang chủ
                  navigate('/');
                }
              } else {
                setLoginError(result.error || 'Đăng nhập Google thất bại');
                toast.error(result.error || 'Đăng nhập Google thất bại');
              }
            } catch (error) {
              console.error('Google login error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Đăng nhập Google thất bại. Vui lòng thử lại sau.';
              setLoginError(errorMessage);
              toast.error(errorMessage);
            }
          },
          // Thêm các tùy chọn để giảm COOP issues
          authorized_origins: uniqueOrigins,
          ux_mode: 'popup', // Sử dụng popup mode thay vì redirect
          use_fedcm_for_prompt: false // Tắt FedCM để tránh conflict
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          logo_alignment: 'left',
          text: 'signin_with',
          shape: 'rectangular',
        });
      } catch (error) {
        console.error('Lỗi khi khởi tạo Google Sign-In:', error);
        setLoginError('Không thể khởi tạo đăng nhập Google. Vui lòng thử lại sau.');
        toast.error('Không thể khởi tạo đăng nhập Google. Vui lòng thử lại sau.');
      }
    } else {
      console.warn('Google Sign-In không khả dụng');
    }
  }, [handleGoogleLogin, fetchProfile, navigate]);

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setValidationErrors(prev => ({...prev, email: 'Vui lòng nhập email'}));
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationErrors(prev => ({...prev, email: 'Email không hợp lệ'}));
      return false;
    }
    setValidationErrors(prev => ({...prev, email: undefined}));
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setValidationErrors(prev => ({...prev, password: 'Vui lòng nhập mật khẩu'}));
      return false;
    } else if (password.length < 6) {
      setValidationErrors(prev => ({...prev, password: 'Mật khẩu phải có ít nhất 6 ký tự'}));
      return false;
    }
    setValidationErrors(prev => ({...prev, password: undefined}));
    return true;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouchedFields(prev => ({...prev, [field]: true}));
    
    if (field === 'email') {
      validateEmail(email);
    } else if (field === 'password') {
      validatePassword(password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setLoginError(null);
    setValidationErrors({});
    
    // Validate all fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    // Update touched state for all fields
    setTouchedFields({ email: true, password: true });
    
    // If any validation fails, stop form submission
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await handleLogin({ email, password });
      if (result.success) {
        // Hiển thị thông báo đăng nhập thành công
        toast.success('Đăng nhập thành công!');
        // Gọi fetchProfile để lấy avatar ngay
        await fetchProfile();
        
        // Chuyển hướng dựa trên role
        const userRole = result.user?.role;
        if (userRole && ['admin', 'manager'].includes(userRole)) {
          navigate('/dashboard/management');
        } else if (userRole && ['staff', 'doctor'].includes(userRole)) {
          navigate('/dashboard/operational');
        } else {
          // Customer hoặc role khác thì về trang chủ
          navigate('/');
        }
      } else {
        setLoginError(result.error || 'Đăng nhập thất bại, vui lòng thử lại');
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Đăng nhập thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClassName = (field: 'email' | 'password') => {
    const baseClass = "w-full px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 focus:outline-none focus:ring-1";
    const validClass = "border-gray-300 focus:ring-cyan-400";
    const errorClass = "border-red-300 focus:ring-red-500";
    
    return `${baseClass} ${touchedFields[field] && validationErrors[field] ? errorClass : validClass}`;
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="flex items-center text-cyan-600 hover:text-cyan-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Trang chủ
        </Link>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Đăng nhập</h2>
     

      
      <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            autoComplete="email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            onBlur={() => handleBlur('email')}
            className={getInputClassName('email')} 
            placeholder="Địa chỉ email"
            disabled={isSubmitting}
          />
          {touchedFields.email && validationErrors.email && !isSubmitting && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
          <div className="relative">
            <input 
              id="password" 
              name="password" 
              type={showPassword ? "text" : "password"}
              autoComplete="current-password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              onBlur={() => handleBlur('password')}
              className={getInputClassName('password')} 
              placeholder="Mật khẩu"
              disabled={isSubmitting}
            />
            <button 
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              onClick={togglePassword}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
          {touchedFields.password && validationErrors.password && !isSubmitting && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" className="h-3 w-3 text-cyan-400 focus:ring-cyan-400 border-gray-300 rounded" />
            <label htmlFor="remember-me" className="ml-1 block text-gray-700">Nhớ mật khẩu</label>
          </div>
          <div>
            <Link to="/forgot-password" className="text-cyan-600 hover:underline font-medium">Quên mật khẩu?</Link>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium shadow-sm transition-all duration-200 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </span>
          ) : 'Đăng nhập ngay'}
        </button>

        {(loginError || error) && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 rounded mb-3 text-sm" role="alert">
          <p>{loginError || error}</p>
        </div>
      )}
      </form>
      <p className="text-center p-2 text-gray-500 text-sm mt-4">Hoặc <Link to="/register" className="text-cyan-600 hover:underline font-medium">đăng ký tài khoản mới</Link></p>
      
      <div className="my-4 flex items-center justify-center">
        <span className="h-px w-1/4 bg-gray-200"></span>
        <span className="mx-2 text-gray-400 text-xs">Hoặc đăng nhập với</span>
        <span className="h-px w-1/4 bg-gray-200"></span>
      </div>
      
      <div ref={googleButtonRef} className="flex justify-center"></div>
    </>
  );
};

export default LoginPage; 