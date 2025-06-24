/**
 * Tạo một hàm debounce để giới hạn số lần gọi hàm
 * Hữu ích cho các sự kiện như resize, scroll, và nhập liệu
 * 
 * @param func Hàm cần được giới hạn gọi
 * @param wait Thời gian chờ tính bằng mili giây
 * @returns Hàm đã được debounce
 */
export function debounce<T extends string>(
  func: (param: T) => void,
  wait: number
): (param: T) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(param: T) {
    const later = () => {
      timeout = null;
      func(param);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Chuyển đổi số thành định dạng tiền tệ Việt Nam (VND)
 * 
 * @param amount Số tiền cần định dạng
 * @returns Chuỗi đã được định dạng theo tiền tệ Việt Nam
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Rút gọn một chuỗi nếu nó dài hơn độ dài tối đa
 * 
 * @param str Chuỗi cần rút gọn
 * @param maxLength Độ dài tối đa
 * @returns Chuỗi đã được rút gọn
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * Kiểm tra token có đúng format cơ bản không
 * @param token JWT token string
 * @returns boolean
 */
export const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Loại bỏ khoảng trắng
  const cleanToken = token.trim();
  
  // JWT phải có 3 phần ngăn cách bởi dấu chấm và không được rỗng
  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Kiểm tra từng phần không được rỗng
  return parts.every(part => part.length > 0);
};

/**
 * Làm sạch và validate token từ localStorage
 * @param tokenKey key của token trong localStorage
 * @returns token hợp lệ hoặc null
 */
export const getValidTokenFromStorage = (tokenKey: string): string | null => {
  try {
    const token = localStorage.getItem(tokenKey);
    
    if (!token) {
      return null;
    }
    
    // Loại bỏ khoảng trắng thừa
    const cleanToken = token.trim();
    
    // Kiểm tra format JWT
    if (!isValidJWTFormat(cleanToken)) {
      // Xóa token không hợp lệ
      localStorage.removeItem(tokenKey);
      return null;
    }
    
    return cleanToken;
  } catch {
    localStorage.removeItem(tokenKey);
    return null;
  }
};

/**
 * Làm sạch tất cả tokens không hợp lệ trong localStorage
 */
export const cleanupInvalidTokens = (): void => {
  const tokenKeys = ['access_token', 'refresh_token', 'token']; // Bao gồm cả key cũ 'token'
  
  tokenKeys.forEach(key => {
    const token = localStorage.getItem(key);
    if (token && !isValidJWTFormat(token.trim())) {
      localStorage.removeItem(key);
    }
  });
  
  // Nếu access_token không hợp lệ, cũng xóa user_info
  if (!getValidTokenFromStorage('access_token')) {
    localStorage.removeItem('user_info');
  }
};

/**
 * Force logout và cleanup tất cả auth data
 */
export const forceLogout = (): void => {
  // Remove all auth-related data
  const authKeys = ['access_token', 'refresh_token', 'token', 'user_info'];
  authKeys.forEach(key => localStorage.removeItem(key));
  
  // Redirect to login page
  window.location.href = '/auth/login';
};

/**
 * Kiểm tra và fix JWT token từ localStorage
 * Nếu token invalid, sẽ force logout
 */
export const validateAndFixAuthToken = (): boolean => {
  const token = getValidTokenFromStorage('access_token');
  
  if (!token) {
    forceLogout();
    return false;
  }
  
  return true;
}; 