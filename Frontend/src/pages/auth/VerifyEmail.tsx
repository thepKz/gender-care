import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api';
import axiosInstance from '../../api/axiosConfig';
import { useAuth } from '../../hooks/useAuth';

interface OtpTimerStorage {
  timestamp: number;
  email: string;
}

const VerifyEmail: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [email, setEmail] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { user, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Khởi tạo refs cho các input
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
    
    // Focus vào input đầu tiên khi load trang
    if (inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 500);
    }
  }, []);

  // Lấy email từ user hoặc từ query params hoặc từ localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    const storedEmail = localStorage.getItem('verify_email');
    
    // Ưu tiên thứ tự: query param > user object > localStorage
    let emailToUse = '';
    if (emailParam) {
      emailToUse = emailParam;
    } else if (user?.email) {
      emailToUse = user.email;
    } else if (storedEmail) {
      emailToUse = storedEmail;
    }
    
    if (emailToUse) {
      setEmail(emailToUse);
      // Lưu email vào localStorage để sử dụng sau này (ví dụ khi tải lại trang)
      localStorage.setItem('verify_email', emailToUse);
    } else {
      // Nếu không có email, chuyển hướng về trang đăng nhập
      toast.error('Không tìm thấy thông tin email, vui lòng đăng nhập lại');
      navigate('/login');
    }
  }, [user, location.search, navigate]);

  // Kiểm tra xem đã xác thực email chưa khi load trang
  useEffect(() => {
    if (user?.emailVerified) {
      navigate('/');
    }
  }, [user, navigate]);

  // Kiểm tra OTP timer khi trang tải lần đầu nhưng KHÔNG tự động gửi lại OTP
  // Tránh gửi thêm email OTP không cần thiết khi vừa đăng ký thành công.
  useEffect(() => {
    if (!isInitialLoad || !email) return;

    const storedOtpTimer = localStorage.getItem('otpTimer');
    if (storedOtpTimer) {
      try {
        const otpTimer: OtpTimerStorage = JSON.parse(storedOtpTimer);
        const now = Date.now();
        const elapsedTime = Math.floor((now - otpTimer.timestamp) / 1000);

        // Nếu OTP đã được gửi cho cùng email và còn thời gian chờ thì khôi phục countdown
        if (otpTimer.email === email && elapsedTime < 60) {
          setCountdown(60 - elapsedTime);
          setVerificationSent(true);
        }
      } catch (_) {
        // Nếu lỗi parse JSON, xóa timer để tránh trạng thái sai
        localStorage.removeItem('otpTimer');
      }
    }

    // Đánh dấu đã xử lý lần khởi tạo đầu tiên
    setIsInitialLoad(false);
  }, [email, isInitialLoad]);

  // Logic cho đếm ngược
  useEffect(() => {
    if (!verificationSent) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, verificationSent]);

  // Hàm gửi mã xác thực
  const handleSendVerification = async (isInitial = false) => {
    if (!email) return;
    
    setError(null);
    
    try {
      // Gọi API gửi mã xác thực thật
      await authApi.sendNewVerifyEmail(email);
      
      // Lưu thời gian gửi OTP
      const now = Date.now();
      const otpTimer: OtpTimerStorage = {
        timestamp: now,
        email
      };
      localStorage.setItem('otpTimer', JSON.stringify(otpTimer));
      
      setVerificationSent(true);
      setCountdown(60);
      
      if (!isInitial) {
        toast.success('Đã gửi mã xác thực mới!');
      }
    } catch (error) {
      console.error('Lỗi khi gửi mã xác thực:', error);
      setError('Không thể gửi mã xác thực. Vui lòng thử lại sau.');
    }
  };

  // Xử lý khi nhập OTP
  const handleOtpChange = (index: number, value: string) => {
    // Chỉ cho phép nhập số
    const regex = /^[0-9\b]+$/;
    if (value === '' || regex.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Tự động focus vào ô tiếp theo khi đã nhập
      if (value !== '' && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Xử lý khi nhấn phím
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      // Focus vào ô trước đó khi xóa ô trống
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Xử lý paste OTP
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Kiểm tra xem dữ liệu dán có phải là dạng số không
    if (!/^\d+$/.test(pastedData)) return;
    
    // Chỉ lấy tối đa 6 ký tự đầu tiên
    const digits = pastedData.slice(0, 6).split('');
    
    // Điền vào các ô OTP
    const newOtp = [...otp];
    for (let i = 0; i < digits.length; i++) {
      newOtp[i] = digits[i];
    }
    setOtp(newOtp);
    
    // Focus vào ô cuối cùng nếu đã điền đủ, hoặc ô tiếp theo nếu chưa đủ
    if (digits.length < 6) {
      inputRefs.current[digits.length]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  // Xử lý gửi mã xác thực mới
  const handleResendVerification = async () => {
    if (countdown > 0) return; // Không thể gửi lại nếu đang trong thời gian chờ
    handleSendVerification();
  };

  // Xử lý xác thực OTP
  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    // Kiểm tra OTP có đầy đủ 6 số không
    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      setError('Vui lòng nhập mã xác thực 6 số');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
      // Kiểm tra email đã có chưa
      if (!email) {
        throw new Error('Không tìm thấy thông tin email, vui lòng thử lại');
      }
      
      // Gọi API xác thực email với email và OTP
      await authApi.verifyEmail(email, otpCode);
      
      // Cập nhật thông tin người dùng sau khi xác thực thành công
      await fetchProfile();
      
      setSuccess(true);
      toast.success('Xác thực email thành công!');
      
      // Xóa dữ liệu OTP timer khỏi localStorage
      localStorage.removeItem('otpTimer');
      localStorage.removeItem('verify_email');
      
      // Tự động chuyển hướng người dùng sau 3 giây
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Lỗi khi xác thực mã:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Mã xác thực không hợp lệ hoặc đã hết hạn');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Thêm hàm refreshAccessToken
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    try {
      const response = await axiosInstance.post('/auth/refresh-token', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      if (accessToken && newRefreshToken) {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
        return true;
      }
      return false;
    } catch (error) {
      // Nếu refresh thất bại, xóa luôn refreshToken
      localStorage.removeItem('refresh_token');
      return false;
    }
  };

  // Trong useEffect kiểm tra accessToken khi load trang
  useEffect(() => {
    const checkAndRestoreToken = async () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      if (!accessToken && refreshToken) {
        // Thử refresh token
        const ok = await refreshAccessToken();
        if (!ok) {
          toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
          navigate('/login');
        }
      } else if (!accessToken && !refreshToken) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        navigate('/login');
      }
    };
    checkAndRestoreToken();
  }, [navigate]);

  // Nếu đã đăng nhập và đã xác thực email thì không hiện trang này
  if (user?.emailVerified) {
    return (
      <div className="text-center min-h-[calc(100vh-100px)] flex flex-col justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold mt-4 text-gray-800">Email đã được xác thực</h2>
        <p className="mt-2 text-gray-600">Tài khoản của bạn đã được xác thực thành công.</p>
        <Link
          to="/"
          className="mt-6 inline-block px-6 py-3 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  // Hiện trang nhập OTP
  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col justify-center">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Xác thực email</h2>
      
      {!success ? (
        <>
          <p className="text-gray-600 mb-6 text-center">
            Chúng tôi đã gửi mã xác thực đến email 
            <span className="font-semibold"> 
              {email || 'của bạn'}
            </span>
          </p>

          <div className="flex justify-center space-x-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength={1}
                className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:outline-none"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
              />
            ))}
          </div>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          <div className="flex flex-col items-center">
            <button
              onClick={handleVerify}
              disabled={isVerifying || otp.join('').length !== 6}
              className={`w-full py-3 rounded-lg font-medium ${
                isVerifying || otp.join('').length !== 6
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-600'
              } text-white transition-colors mb-4`}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xác thực...
                </span>
              ) : (
                'Xác thực'
              )}
            </button>
            
            <div className="text-sm text-gray-600 text-center">
              Không nhận được mã?{' '}
              {countdown > 0 ? (
                <span className="text-gray-500">
                  Gửi lại sau {countdown}s
                </span>
              ) : (
                <button
                  onClick={handleResendVerification}
                  className="text-cyan-600 hover:underline"
                >
                  Gửi lại mã
                </button>
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-500 text-center">
              <p>Bạn có thể sao chép và dán mã OTP từ email vào ô đầu tiên</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold mt-4 text-gray-800">Xác thực thành công!</h2>
          <p className="mt-2 text-gray-600">Email của bạn đã được xác thực thành công.</p>
          <p className="mt-2 text-gray-500">Đang chuyển hướng về trang chủ...</p>
          <Link
            to="/"
            className="mt-6 inline-block px-6 py-3 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail; 