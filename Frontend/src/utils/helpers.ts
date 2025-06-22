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
 * Kiểm tra token JWT có đúng format không
 * @param token JWT token string
 * @returns boolean
 */
export const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    console.warn('[isValidJWTFormat] Token is not a string:', typeof token);
    return false;
  }
  
  // Loại bỏ khoảng trắng và ký tự đặc biệt
  const cleanToken = token.trim();
  
  // JWT phải có 3 phần ngăn cách bởi dấu chấm
  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    console.warn('[isValidJWTFormat] Token không có 3 phần:', parts.length);
    return false;
  }
  
  // Kiểm tra từng phần có thể decode được không
  try {
    // Decode header
    const header = JSON.parse(atob(parts[0]));
    // Decode payload  
    const payload = JSON.parse(atob(parts[1]));
    
    // Verify cơ bản JWT structure
    if (!header.alg || !payload.exp) {
      console.warn('[isValidJWTFormat] Missing required JWT fields');
      return false;
    }
    
    // Check token chưa expire
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.warn('[isValidJWTFormat] Token đã hết hạn');
      return false;
    }
    
    console.log('[isValidJWTFormat] Token valid:', { 
      user: payload.email,
      role: payload.role,
      exp: new Date(payload.exp * 1000).toLocaleString()
    });
    
    return true;
  } catch (error) {
    console.error('[isValidJWTFormat] Decode error:', error);
    return false;
  }
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
      console.warn(`[getValidTokenFromStorage] Invalid JWT format for key: ${tokenKey}`);
      // Xóa token không hợp lệ
      localStorage.removeItem(tokenKey);
      return null;
    }
    
    return cleanToken;
  } catch (error) {
    console.error(`[getValidTokenFromStorage] Error getting token for key: ${tokenKey}`, error);
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
      console.warn(`[cleanupInvalidTokens] Removing invalid token: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Nếu access_token không hợp lệ, cũng xóa user_info
  if (!getValidTokenFromStorage('access_token')) {
    localStorage.removeItem('user_info');
    console.log('[cleanupInvalidTokens] Removed user_info due to invalid access_token');
  }
};

/**
 * Force logout và cleanup tất cả auth data
 */
export const forceLogout = (): void => {
  console.log('[forceLogout] Cleaning up auth data...');
  
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
  console.log('[validateAndFixAuthToken] Checking auth token...');
  
  const token = getValidTokenFromStorage('access_token');
  
  if (!token) {
    console.warn('[validateAndFixAuthToken] No valid token found, force logout');
    forceLogout();
    return false;
  }
  
  console.log('[validateAndFixAuthToken] Token is valid');
  return true;
}; 