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