import axios, { AxiosError } from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authApi from '../../api/endpoints/auth';
import { useAuth } from '../../hooks/useAuth';
import { debounce } from '../../utils/index';

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

// Component hiển thị dấu * bắt buộc
const RequiredMark = (): JSX.Element => (
  <span className="text-red-500 ml-1">*</span>
);

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    phone: '',
  });
  
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    gender?: string;
    phone?: string;
  }>({});
  
  const [validFields, setValidFields] = useState<{
    fullName: boolean;
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
    gender: boolean;
    phone: boolean;
  }>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    gender: false,
    phone: false,
  });
  
  // Debounce refs
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  // Loading state for each field
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  // Giảm tần suất thay đổi trạng thái validating để tránh re-render liên tục
  const [inputChanged, setInputChanged] = useState<Record<string, boolean>>({});
  // Hiển thị animation cho các lỗi mới
  const [newErrors, setNewErrors] = useState<Record<string, boolean>>({});

  // State để theo dõi trạng thái kiểm tra email/phone
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  
  const { handleRegister, handleGoogleLogin, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Cải thiện thời gian debounce cho việc kiểm tra email
  const checkEmailDebounced = useRef<(email: string) => void>(
    debounce((emailValue: string) => {
      if (!emailValue || !validateEmail(emailValue)) return;
      
      setCheckingEmail(true);
      // Thêm console.log để debug
      console.log('Gửi request kiểm tra email:', new Date().toISOString());
      authApi.checkEmail({ email: emailValue })
        .then(response => {
          console.log('Nhận response kiểm tra email:', new Date().toISOString());
          if (!response.data.available) {
            setErrors(prev => ({
              ...prev,
              email: 'Email này đã được sử dụng!'
            }));
            setValidFields(prev => ({
              ...prev,
              email: false
            }));
            // Hiệu ứng cho lỗi
            setNewErrors(prev => ({
              ...prev,
              email: true
            }));
            setTimeout(() => {
              setNewErrors(prev => ({
                ...prev,
                email: false
              }));
            }, 500);
          }
        })
        .catch((error: AxiosError) => {
          // Xử lý lỗi HTTP một cách thân thiện
          console.error('Lỗi kiểm tra email:', error);
          
          // Không hiển thị lỗi kỹ thuật cho người dùng
          let errorMessage = 'Không thể kiểm tra email. Vui lòng thử lại sau.';
          
          // Phân loại lỗi theo mã HTTP
          if (error.response?.status) {
            switch (error.response.status) {
              case 400:
                errorMessage = 'Email không hợp lệ';
                break;
              case 401:
              case 403:
                errorMessage = 'Bạn không có quyền thực hiện hành động này';
                break;
              case 404:
                errorMessage = 'Không tìm thấy thông tin email';
                break;
              case 500:
              case 502:
              case 503:
                errorMessage = 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau';
                break;
              default:
                // Giữ thông báo mặc định
                break;
            }
          } else {
            // Lỗi không nhận được phản hồi từ server (network error)
            errorMessage = 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng';
          }
          
          // Cập nhật lỗi nhưng không đánh dấu là lỗi mới để không hiện animation pulse
          setErrors(prev => ({
            ...prev,
            email: errorMessage
          }));
        })
        .finally(() => {
          setCheckingEmail(false);
        });
    }, 200) as unknown as (email: string) => void // Giảm thời gian debounce xuống 200ms
  ).current;
  
  // Giảm thời gian debounce cho kiểm tra số điện thoại
  const checkPhoneDebounced = useRef<(phone: string) => void>(
    debounce((phoneValue: string) => {
      if (!phoneValue || !/^[0-9]{10,11}$/.test(phoneValue)) return;
      
      setCheckingPhone(true);
      authApi.checkPhone({ phone: phoneValue })
        .then(response => {
          if (!response.data.available) {
            setErrors(prev => ({
              ...prev,
              phone: 'Số điện thoại này đã được sử dụng!'
            }));
            setValidFields(prev => ({
              ...prev,
              phone: false
            }));
            // Hiệu ứng cho lỗi
            setNewErrors(prev => ({
              ...prev,
              phone: true
            }));
            setTimeout(() => {
              setNewErrors(prev => ({
                ...prev,
                phone: false
              }));
            }, 500);
          }
        })
        .catch((error: AxiosError) => {
          // Xử lý lỗi HTTP một cách thân thiện
          console.error('Lỗi kiểm tra số điện thoại:', error);
          
          // Không hiển thị lỗi kỹ thuật cho người dùng
          let errorMessage = 'Không thể kiểm tra số điện thoại. Vui lòng thử lại sau.';
          
          // Phân loại lỗi theo mã HTTP
          if (axios.isAxiosError(error)) {
            const statusCode = error.response?.status;
            switch (statusCode) {
              case 400:
                errorMessage = 'Số điện thoại không hợp lệ';
                break;
              case 401:
              case 403:
                errorMessage = 'Bạn không có quyền thực hiện hành động này';
                break;
              case 404:
                errorMessage = 'Không tìm thấy thông tin số điện thoại';
                break;
              case 500:
              case 502:
              case 503:
                errorMessage = 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau';
                break;
              default:
                // Giữ thông báo mặc định
                break;
            }
          } else {
            // Lỗi không nhận được phản hồi từ server (network error)
            errorMessage = 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng';
          }
          
          // Cập nhật lỗi nhưng không đánh dấu là lỗi mới để không hiện animation pulse
          setErrors(prev => ({
            ...prev,
            phone: errorMessage
          }));
        })
        .finally(() => {
          setCheckingPhone(false);
        });
    }, 200) as unknown as (phone: string) => void // Giảm xuống 200ms
  ).current;

  // Google OAuth setup
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
            setRegisterError(null);
            try {
              console.log('Google register response received:', response);
              
              // Sử dụng handleGoogleLogin từ useAuth hook với timeout handling
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Google register timeout')), 25000); // 25 giây
              });
              
              const loginPromise = handleGoogleLogin(response.credential);
              
              const result = await Promise.race([loginPromise, timeoutPromise]) as { success: boolean; user?: any; error?: string };
              
              if (result.success) {
                console.log('Google register success:', result);
                console.log('User data after Google register:', result.user);
                console.log('User avatar from Google:', result.user?.avatar);
                toast.success('Đăng ký Google thành công!');
                
                // Gọi fetchProfile để lấy thông tin user mới nhất
                await fetchProfile();
                
                // Chuyển hướng đến trang chủ
                navigate('/');
              } else {
                setRegisterError(result.error || 'Đăng ký Google thất bại');
                toast.error(result.error || 'Đăng ký Google thất bại');
              }
            } catch (error) {
              console.error('Google register error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Đăng ký Google thất bại. Vui lòng thử lại sau.';
              setRegisterError(errorMessage);
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
          text: 'signup_with',
          shape: 'rectangular',
        });
      } catch (error) {
        console.error('Lỗi khi khởi tạo Google Sign-Up:', error);
        setRegisterError('Không thể khởi tạo đăng ký Google. Vui lòng thử lại sau.');
        toast.error('Không thể khởi tạo đăng ký Google. Vui lòng thử lại sau.');
      }
    } else {
      console.warn('Google Sign-Up không khả dụng');
    }
  }, [handleGoogleLogin, fetchProfile, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Đánh dấu đã thay đổi nội dung nhưng không thay đổi trạng thái validating liên tục
    setInputChanged(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Chỉ xóa lỗi nếu giá trị thay đổi đáng kể
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
      
      // Reset trạng thái lỗi mới
      setNewErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
    
    // Giảm thời gian debounce validation
    if (debounceTimers.current[name]) {
      clearTimeout(debounceTimers.current[name]);
    }
    
    debounceTimers.current[name] = setTimeout(() => {
      // Chỉ validate nếu field đã được chạm vào
      if (touchedFields[name] && inputChanged[name]) {
        // Bắt đầu validate
        setValidating(prev => ({
          ...prev,
          [name]: true
        }));
        
        // Thực hiện validate sau 30ms để UI có thể cập nhật
        setTimeout(() => {
          const hasError = !validateField(name, value);
          
          if (hasError) {
            // Đánh dấu lỗi mới để hiển thị animation
            setNewErrors(prev => ({
              ...prev,
              [name]: true
            }));
            
            // Tự động reset trạng thái lỗi mới sau khi animation hoàn thành
            setTimeout(() => {
              setNewErrors(prev => ({
                ...prev,
                [name]: false
              }));
            }, 500);
          }
          
          // Kết thúc validate
          setValidating(prev => ({
            ...prev,
            [name]: false
          }));
          
          // Reset trạng thái changed
          setInputChanged(prev => ({
            ...prev,
            [name]: false
          }));
        }, 30); // Giảm thời gian xuống 30ms
      }
    }, 200); // Giảm thời gian debounce xuống 200ms
    
    // Xóa thông báo lỗi chung
    setRegisterError(null);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    
    // Đánh dấu field đã được chạm vào
    if (!touchedFields[name]) {
      setTouchedFields(prev => ({
        ...prev,
        [name]: true
      }));
    }
    
    // Hủy debounce timer hiện tại nếu có
    if (debounceTimers.current[name]) {
      clearTimeout(debounceTimers.current[name]);
    }
    
    // Validate ngay khi người dùng rời khỏi field, đảm bảo phản hồi nhanh
    setValidating(prev => ({
      ...prev,
      [name]: true
    }));
    
    setTimeout(() => {
      const hasError = !validateField(name, formData[name as keyof typeof formData]);
      
      if (hasError) {
        // Đánh dấu lỗi mới để hiển thị animation
        setNewErrors(prev => ({
          ...prev,
          [name]: true
        }));
        
        // Tự động reset trạng thái lỗi mới sau khi animation hoàn thành
        setTimeout(() => {
          setNewErrors(prev => ({
            ...prev,
            [name]: false
          }));
        }, 500);
      }
      
      setValidating(prev => ({
        ...prev,
        [name]: false
      }));
      
      setInputChanged(prev => ({
        ...prev,
        [name]: false
      }));
    }, 50);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  const validateField = (name: string, value: string) => {
    let isValid = false;
    let errorMessage = '';
    
    switch(name) {
      case 'fullName':
        if (!value.trim()) {
          errorMessage = 'Vui lòng nhập họ tên';
        } else if (value.trim().length < 3 || value.trim().length > 50) {
          errorMessage = 'Họ tên phải có độ dài từ 3 đến 50 ký tự';
        } else {
          isValid = true;
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          errorMessage = 'Vui lòng nhập email';
        } else if (!validateEmail(value)) {
          errorMessage = 'Email không hợp lệ';
        } else {
          isValid = true;
          // Chỉ kiểm tra email khi người dùng đã chạm vào trường và không phải trong quá trình submit
          if (touchedFields.email && !isSubmitting) {
            checkEmailDebounced(value);
          }
        }
        break;
        
      case 'password':
        if (!value) {
          errorMessage = 'Vui lòng nhập mật khẩu';
        } else if (!validatePassword(value)) {
          errorMessage = 'Mật khẩu phải chứa chữ thường, in hoa, số, ký tự đặc biệt và từ 6 đến 30 ký tự';
        } else {
          isValid = true;
        }
        // Re-validate confirmPassword when password changes
        if (formData.confirmPassword && touchedFields.confirmPassword) {
          setTimeout(() => {
            validateField('confirmPassword', formData.confirmPassword);
          }, 100);
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          errorMessage = 'Vui lòng nhập lại mật khẩu';
        } else if (value !== formData.password) {
          errorMessage = 'Mật khẩu nhập lại không khớp';
        } else {
          isValid = true;
        }
        break;
        
      case 'gender':
        if (!value) {
          errorMessage = 'Vui lòng chọn giới tính';
        } else {
          isValid = true;
        }
        break;
        
      case 'phone':
        if (value && !/^[0-9]{10,11}$/.test(value)) {
          errorMessage = 'Số điện thoại không hợp lệ';
        } else if (value) {
          isValid = true;
          // Chỉ kiểm tra số điện thoại khi người dùng đã chạm vào trường và không phải trong quá trình submit
          if (touchedFields.phone && !isSubmitting) {
            (checkPhoneDebounced as (phone: string) => void)(value);
          }
        } else {
          isValid = true; // Số điện thoại không bắt buộc
        }
        break;
    }
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage || undefined
    }));
    
    // Update valid fields state
    setValidFields(prev => ({
      ...prev,
      [name]: isValid
    }));
    
    return isValid;
  };

  const validateEmail = (email: string): boolean => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password: string): boolean => {
    // Validate password complexity
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,30})/;
    return re.test(String(password));
  };
  
  const validateForm = (): boolean => {
    // Check all required fields
    const requiredFields = ['fullName', 'email', 'password', 'confirmPassword', 'gender'];
    let isValid = true;
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    requiredFields.forEach(field => {
      allTouched[field] = true;
    });
    
    if (formData.phone) {
      allTouched.phone = true;
    }
    
    setTouchedFields(allTouched);
    
    // Validate each field
    requiredFields.forEach(field => {
      const fieldValid = validateField(field, formData[field as keyof typeof formData]);
      if (!fieldValid) {
        isValid = false;
      }
    });
    
    // Validate phone if provided
    if (formData.phone) {
      const phoneValid = validateField('phone', formData.phone);
      if (!phoneValid) {
        isValid = false;
      }
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Chặn double submit
    setIsSubmitting(true);
    try {
      // Reset lỗi và trạng thái touched
      setRegisterError(null);
      setErrors({});
      // Nếu đang có quá trình kiểm tra bất đồng bộ, không cho phép submit
      if (checkingEmail || checkingPhone) {
        setRegisterError("Vui lòng đợi hệ thống kiểm tra thông tin của bạn");
        setIsSubmitting(false);
        return;
      }
      
      // Validate form trước khi thực hiện API call để tiết kiệm thời gian
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }
      
      // Bắt đầu quá trình đăng ký
      // (đã đánh dấu isSubmitting trước khi validate)
      
      const result = await handleRegister({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        gender: formData.gender,
      });
      
      if (result.success) {
        // Xóa tất cả các lỗi trước khi chuyển hướng
        setErrors({});
        setRegisterError(null);
        
        toast.success("Đăng ký thành công! Vui lòng xác thực email của bạn.");
        
        // Chỉ gọi navigate 1 lần duy nhất
        setTimeout(() => {
          navigate('/verify-email');
        }, 300); // Thêm delay nhỏ để tránh double navigate do render lại
      } else {
        // Hiển thị lỗi cụ thể từ server nếu có
        if (result.error?.includes('Email')) {
          setErrors(prev => ({
            ...prev,
            email: result.error
          }));
          setTouchedFields(prev => ({
            ...prev,
            email: true
          }));
          // Đánh dấu lỗi mới để hiệu ứng
          setNewErrors(prev => ({
            ...prev,
            email: true
          }));
          setTimeout(() => {
            setNewErrors(prev => ({
              ...prev,
              email: false
            }));
          }, 1000);
        } else if (result.error?.includes('điện thoại') || result.error?.includes('phone')) {
          setErrors(prev => ({
            ...prev,
            phone: result.error
          }));
          setTouchedFields(prev => ({
            ...prev,
            phone: true
          }));
          // Đánh dấu lỗi mới để hiệu ứng
          setNewErrors(prev => ({
            ...prev,
            phone: true
          }));
          setTimeout(() => {
            setNewErrors(prev => ({
              ...prev,
              phone: false
            }));
          }, 1000);
        } else {
          setRegisterError(result.error || 'Đăng ký thất bại');
        }
      }
    } catch (error: unknown) {
      // Phân tích lỗi để hiển thị thông báo rõ ràng hơn
      let errorMessage = 'Đăng ký thất bại';
      console.error('Lỗi đăng ký:', error);
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        switch (statusCode) {
          case 400:
            errorMessage = 'Thông tin đăng ký không hợp lệ. Vui lòng kiểm tra lại';
            break;
          case 401:
          case 403:
            errorMessage = 'Bạn không có quyền thực hiện hành động này';
            break;
          case 409:
            errorMessage = 'Email hoặc số điện thoại đã được sử dụng';
            break;
          case 429:
            errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau';
            break;
          default:
            errorMessage = 'Đăng ký thất bại. Vui lòng thử lại sau';
            break;
        }
      }
      setRegisterError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClassName = (fieldName: keyof typeof formData) => {
    const isTouched = touchedFields[fieldName];
    const isInvalid = errors[fieldName];
    const isLoading = validating[fieldName] || 
                     (fieldName === 'email' && checkingEmail) || 
                     (fieldName === 'phone' && checkingPhone);
    
    let className = 'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 bg-white text-gray-800 transition-all duration-200 ';
    
    if (isLoading) {
      className += 'border-gray-300 focus:ring-blue-500';
    } else if (isTouched && isInvalid) {
      className += 'border-red-300 focus:ring-red-500';
    } else if (isTouched && validFields[fieldName]) {
      className += 'border-green-300 focus:ring-green-500';
    } else {
      className += 'border-gray-300 focus:ring-cyan-400';
    }
    
    return className;
  };
  
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const getErrorAnimationClass = (fieldName: string) => {
    return newErrors[fieldName] ? 'animate-pulse text-red-700 font-medium' : '';
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
      
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Đăng ký tài khoản</h2>
      
      <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Họ và tên<RequiredMark />
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClassName('fullName')}
            placeholder="Nhập họ và tên của bạn"
            disabled={isSubmitting}
          />
          <div className="h-5 mt-1">
            {touchedFields.fullName && errors.fullName && !isSubmitting && (
              <p className={`text-sm text-red-600 transition-all duration-150 ${getErrorAnimationClass('fullName')}`}>{errors.fullName}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email<RequiredMark />
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClassName('email')}
              placeholder="Nhập địa chỉ email"
              disabled={isSubmitting}
            />
            <div className="h-5 mt-1">
              {touchedFields.email && errors.email && !isSubmitting && (
                <p className={`text-sm text-red-600 transition-all duration-150 ${getErrorAnimationClass('email')}`}>{errors.email}</p>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClassName('phone')}
              placeholder="Nhập số điện thoại"
              disabled={isSubmitting}
            />
            <div className="h-5 mt-1">
              {touchedFields.phone && errors.phone && !isSubmitting && (
                <p className={`text-sm text-red-600 transition-all duration-150 ${getErrorAnimationClass('phone')}`}>{errors.phone}</p>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Giới tính<RequiredMark />
          </label>
          <select
            id="gender"
            name="gender"
            required
            value={formData.gender}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClassName('gender')}
            disabled={isSubmitting}
          >
            <option value="">Chọn giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
          <div className="h-5 mt-1">
            {touchedFields.gender && errors.gender && !isSubmitting && (
              <p className={`text-sm text-red-600 transition-all duration-150 ${getErrorAnimationClass('gender')}`}>{errors.gender}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu<RequiredMark />
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClassName('password')}
              placeholder="Nhập mật khẩu mới"
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
          <div className="h-5 mt-1">
            {touchedFields.password && errors.password && !isSubmitting && (
              <p className={`text-sm text-red-600 transition-all duration-150 ${getErrorAnimationClass('password')}`}>{errors.password}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Nhập lại mật khẩu<RequiredMark />
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClassName('confirmPassword')}
              placeholder="Nhập lại mật khẩu"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              onClick={toggleConfirmPassword}
            >
              {showConfirmPassword ? (
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
          <div className="h-5 mt-1">
            {touchedFields.confirmPassword && errors.confirmPassword && !isSubmitting && (
              <p className={`text-sm text-red-600 transition-all duration-150 ${getErrorAnimationClass('confirmPassword')}`}>{errors.confirmPassword}</p>
            )}
          </div>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </div>
        
        {/* Khu vực hiển thị lỗi từ server - có chiều cao cố định để tránh layout shift */}
        <div className="h-5">
          {registerError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 rounded text-sm animate-pulse" role="alert">
              <p>{registerError}</p>
            </div>
          )}
        </div>
      </form>
      
      <p className="text-center p-2 text-gray-500 text-sm mt-2">
        Bạn đã có tài khoản? <Link to="/login" className="text-cyan-600 hover:underline font-medium">Đăng nhập ngay</Link>
      </p>
      
      <div className="my-4 flex items-center justify-center">
        <span className="h-px w-1/4 bg-gray-200"></span>
        <span className="mx-2 text-gray-400 text-xs">Hoặc đăng ký với</span>
        <span className="h-px w-1/4 bg-gray-200"></span>
      </div>
      
      <div ref={googleButtonRef} className="flex justify-center"></div>
      
      <p className="text-center text-xs text-gray-500 mt-4">
        Bằng cách đăng ký, bạn đồng ý với <a href="/terms" className="text-cyan-600 hover:underline">Điều khoản</a> và <a href="/privacy" className="text-cyan-600 hover:underline">Chính sách</a> của chúng tôi
      </p>
    </>
  );
};

export default RegisterPage;