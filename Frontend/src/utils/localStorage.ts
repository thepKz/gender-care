/**
 * Lưu trữ dữ liệu vào localStorage
 * @param key Khóa lưu trữ
 * @param value Giá trị cần lưu trữ
 */
export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Lấy dữ liệu từ localStorage
 * @param key Khóa lưu trữ
 * @param defaultValue Giá trị mặc định nếu không tìm thấy
 * @returns Dữ liệu đã lưu hoặc giá trị mặc định
 */
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) {
      return defaultValue;
    }
    return JSON.parse(serializedValue) as T;
  } catch (error) {
    console.error('Error getting from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Xóa dữ liệu từ localStorage
 * @param key Khóa lưu trữ
 */
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

/**
 * Kiểm tra xem có dữ liệu được lưu với khóa chỉ định không
 * @param key Khóa lưu trữ
 * @returns true nếu tồn tại dữ liệu
 */
export const existsInStorage = (key: string): boolean => {
  return localStorage.getItem(key) !== null;
};

/**
 * Xóa tất cả dữ liệu trong localStorage
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Các khóa lưu trữ được sử dụng trong ứng dụng
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  LAST_MENSTRUAL_DATE: 'lastMenstrualDate',
  CYCLE_LENGTH: 'cycleLength',
  MEDICATION_REMINDERS: 'medicationReminders',
}; 