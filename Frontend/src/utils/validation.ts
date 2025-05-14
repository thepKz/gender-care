/**
 * Kiểm tra email hợp lệ
 * @param email Email cần kiểm tra
 * @returns true nếu email hợp lệ
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Kiểm tra số điện thoại hợp lệ (Việt Nam)
 * @param phone Số điện thoại cần kiểm tra
 * @returns true nếu số điện thoại hợp lệ
 */
export const isValidPhone = (phone: string): boolean => {
  // Kiểm tra số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
  const phoneRegex = /^(0[3-9][0-9]{8})$/;
  return phoneRegex.test(phone);
};

/**
 * Kiểm tra mật khẩu có đủ mạnh không
 * Yêu cầu ít nhất 8 ký tự, chứa chữ hoa, chữ thường, số và ký tự đặc biệt
 * @param password Mật khẩu cần kiểm tra
 * @returns true nếu mật khẩu đủ mạnh
 */
export const isStrongPassword = (password: string): boolean => {
  if (password.length < 8) {
    return false;
  }
  
  // Kiểm tra có chữ hoa
  const hasUpperCase = /[A-Z]/.test(password);
  // Kiểm tra có chữ thường
  const hasLowerCase = /[a-z]/.test(password);
  // Kiểm tra có số
  const hasNumber = /[0-9]/.test(password);
  // Kiểm tra có ký tự đặc biệt
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

/**
 * Kiểm tra họ tên hợp lệ
 * @param name Họ tên cần kiểm tra
 * @returns true nếu họ tên hợp lệ
 */
export const isValidName = (name: string): boolean => {
  // Kiểm tra họ tên có ít nhất 2 từ và không chứa ký tự đặc biệt
  const nameRegex = /^[A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s]{1,}$/;
  return nameRegex.test(name) && name.trim().split(/\s+/).length >= 2;
};

/**
 * Kiểm tra URL hợp lệ
 * @param url URL cần kiểm tra
 * @returns true nếu URL hợp lệ
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Kiểm tra thời gian định dạng HH:mm
 * @param time Thời gian cần kiểm tra
 * @returns true nếu thời gian hợp lệ
 */
export const isValidTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Kiểm tra ngày định dạng DD/MM/YYYY
 * @param date Ngày cần kiểm tra
 * @returns true nếu ngày hợp lệ
 */
export const isValidDate = (date: string): boolean => {
  const dateRegex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/;
  
  if (!dateRegex.test(date)) {
    return false;
  }
  
  // Kiểm tra ngày tháng có hợp lệ không
  const [day, month, year] = date.split('/').map(Number);
  const d = new Date(year, month - 1, day);
  
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}; 