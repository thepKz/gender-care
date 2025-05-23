export interface PasswordStrength {
  score: number;
  feedback: string;
  color: string;
}

/**
 * Kiểm tra độ mạnh của mật khẩu
 * @param password - mật khẩu cần kiểm tra
 * @returns object chứa điểm số, feedback và màu sắc
 */
export const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  let feedback = '';
  
  // Kiểm tra độ dài
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 10;
  
  // Kiểm tra ký tự thường
  if (/[a-z]/.test(password)) score += 15;
  
  // Kiểm tra ký tự hoa
  if (/[A-Z]/.test(password)) score += 15;
  
  // Kiểm tra số
  if (/[0-9]/.test(password)) score += 15;
  
  // Kiểm tra ký tự đặc biệt
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  
  // Đánh giá feedback dựa trên điểm số
  if (score < 40) {
    feedback = 'Mật khẩu yếu';
    return { score, feedback, color: '#ff4d4f' };
  } else if (score < 70) {
    feedback = 'Mật khẩu trung bình';
    return { score, feedback, color: '#faad14' };
  } else if (score < 90) {
    feedback = 'Mật khẩu mạnh';
    return { score, feedback, color: '#52c41a' };
  } else {
    feedback = 'Mật khẩu rất mạnh';
    return { score, feedback, color: '#13c2c2' };
  }
};

/**
 * Kiểm tra mật khẩu có đáp ứng yêu cầu tối thiểu không
 * @param password - mật khẩu cần kiểm tra
 * @returns true nếu mật khẩu đáp ứng yêu cầu tối thiểu
 */
export const isPasswordValid = (password: string): boolean => {
  const strength = checkPasswordStrength(password);
  return password.length >= 8 && strength.score >= 40;
};

/**
 * Lấy danh sách yêu cầu mật khẩu và trạng thái đáp ứng
 * @param password - mật khẩu cần kiểm tra
 * @returns mảng các yêu cầu và trạng thái
 */
export const getPasswordRequirements = (password: string) => {
  return [
    {
      requirement: 'Ít nhất 8 ký tự',
      met: password.length >= 8
    },
    {
      requirement: 'Có chữ thường',
      met: /[a-z]/.test(password)
    },
    {
      requirement: 'Có chữ hoa',
      met: /[A-Z]/.test(password)
    },
    {
      requirement: 'Có số',
      met: /[0-9]/.test(password)
    },
    {
      requirement: 'Có ký tự đặc biệt',
      met: /[^A-Za-z0-9]/.test(password)
    }
  ];
};

/**
 * Validate email format
 * @param email - email cần kiểm tra
 * @returns true nếu email hợp lệ
 */
export const isEmailValid = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}; 