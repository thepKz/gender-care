/**
 * Utils để xử lý localStorage an toàn và hiệu quả
 * QUAN TRỌNG: Module này phải được dùng cho mọi thao tác với localStorage trong ứng dụng
 */

/**
 * Lưu trữ dữ liệu vào localStorage với việc kiểm tra trình duyệt hỗ trợ
 * @param key Khóa lưu trữ
 * @param value Giá trị cần lưu trữ
 * 
 * !IMPORTANT: Luôn sử dụng hàm này thay vì gọi localStorage trực tiếp
 */
export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    // Kiểm tra xem localStorage có khả dụng không
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage không khả dụng!');
      return;
    }

    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);

    // Kiểm tra xem dữ liệu đã được lưu thành công chưa
    const savedValue = localStorage.getItem(key);
    if (!savedValue) {
      console.warn(`Không thể lưu ${key} vào localStorage!`);
    }
  } catch (error) {
    console.error('Lỗi khi lưu vào localStorage:', error);
  }
};

/**
 * Lấy dữ liệu từ localStorage với kiểm tra an toàn
 * @param key Khóa lưu trữ
 * @param defaultValue Giá trị mặc định nếu không tìm thấy
 * @returns Dữ liệu đã lưu hoặc giá trị mặc định
 * 
 * !IMPORTANT: Luôn sử dụng hàm này thay vì gọi localStorage trực tiếp
 */
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    // Kiểm tra xem localStorage có khả dụng không
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage không khả dụng!');
      return defaultValue;
    }

    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) {
      return defaultValue;
    }
    return JSON.parse(serializedValue) as T;
  } catch (error) {
    console.error(`Lỗi khi lấy ${key} từ localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Xóa dữ liệu từ localStorage an toàn
 * @param key Khóa lưu trữ
 * 
 * !IMPORTANT: Luôn sử dụng hàm này thay vì gọi localStorage trực tiếp
 */
export const removeFromStorage = (key: string): void => {
  try {
    // Kiểm tra xem localStorage có khả dụng không
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage không khả dụng!');
      return;
    }

    localStorage.removeItem(key);
    
    // Kiểm tra xem đã xóa thành công chưa
    if (localStorage.getItem(key) !== null) {
      console.warn(`Không thể xóa ${key} từ localStorage!`);
    }
  } catch (error) {
    console.error(`Lỗi khi xóa ${key} từ localStorage:`, error);
  }
};

/**
 * Kiểm tra xem có dữ liệu được lưu với khóa chỉ định không
 * @param key Khóa lưu trữ
 * @returns true nếu tồn tại dữ liệu
 * 
 * !IMPORTANT: Luôn sử dụng hàm này thay vì kiểm tra localStorage trực tiếp
 */
export const existsInStorage = (key: string): boolean => {
  try {
    // Kiểm tra xem localStorage có khả dụng không
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Lỗi khi kiểm tra ${key} trong localStorage:`, error);
    return false;
  }
};

/**
 * Xóa tất cả dữ liệu trong localStorage
 * 
 * !IMPORTANT: Cẩn thận khi sử dụng - sẽ xóa tất cả dữ liệu
 */
export const clearStorage = (): void => {
  try {
    // Kiểm tra xem localStorage có khả dụng không
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage không khả dụng!');
      return;
    }
    
    localStorage.clear();
  } catch (error) {
    console.error('Lỗi khi xóa tất cả dữ liệu từ localStorage:', error);
  }
};

// Các khóa lưu trữ được sử dụng trong ứng dụng
// !IMPORTANT: Sử dụng các khóa này thay vì hardcode chuỗi
export const STORAGE_KEYS = {
  // Xác thực và người dùng
  USER: 'gender_healthcare_user',
  
  // Cài đặt ứng dụng
  THEME: 'gender_healthcare_theme',
  LANGUAGE: 'gender_healthcare_language',
  
  // Dữ liệu người dùng
  LAST_MENSTRUAL_DATE: 'gender_healthcare_last_menstrual_date',
  CYCLE_LENGTH: 'gender_healthcare_cycle_length',
  MEDICATION_REMINDERS: 'gender_healthcare_medication_reminders',
}; 