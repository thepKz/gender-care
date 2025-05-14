import moment from 'moment';

/**
 * Format ngày tháng theo định dạng mặc định
 * @param date Ngày cần format
 * @param format Định dạng (mặc định: DD/MM/YYYY)
 * @returns Chuỗi ngày đã format
 */
export const formatDate = (date: string | Date, format = 'DD/MM/YYYY'): string => {
  return moment(date).format(format);
};

/**
 * Format giờ phút
 * @param time Thời gian cần format
 * @param format Định dạng (mặc định: HH:mm)
 * @returns Chuỗi thời gian đã format
 */
export const formatTime = (time: string, format = 'HH:mm'): string => {
  return moment(time, 'HH:mm:ss').format(format);
};

/**
 * Format ngày giờ đầy đủ
 * @param dateTime Ngày giờ cần format
 * @param format Định dạng (mặc định: DD/MM/YYYY HH:mm)
 * @returns Chuỗi ngày giờ đã format
 */
export const formatDateTime = (dateTime: string | Date, format = 'DD/MM/YYYY HH:mm'): string => {
  return moment(dateTime).format(format);
};

/**
 * Tính khoảng cách giữa 2 ngày (theo ngày)
 * @param start Ngày bắt đầu
 * @param end Ngày kết thúc
 * @returns Số ngày
 */
export const getDaysBetween = (start: string | Date, end: string | Date): number => {
  const startDate = moment(start);
  const endDate = moment(end);
  return endDate.diff(startDate, 'days');
};

/**
 * Kiểm tra ngày có phải là ngày hiện tại
 * @param date Ngày cần kiểm tra
 * @returns true nếu là ngày hiện tại
 */
export const isToday = (date: string | Date): boolean => {
  return moment(date).isSame(moment(), 'day');
};

/**
 * Kiểm tra ngày có phải là ngày trong tương lai
 * @param date Ngày cần kiểm tra
 * @returns true nếu là ngày trong tương lai
 */
export const isFutureDate = (date: string | Date): boolean => {
  return moment(date).isAfter(moment(), 'day');
};

/**
 * Tạo mảng các ngày trong tuần từ ngày được chọn
 * @param date Ngày được chọn
 * @returns Mảng 7 ngày của tuần
 */
export const getWeekDays = (date: string | Date): Date[] => {
  const selectedDate = moment(date);
  const weekStart = selectedDate.clone().startOf('week');
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(weekStart.clone().add(i, 'days').toDate());
  }
  
  return days;
};

/**
 * Tạo mảng các ngày trong tháng
 * @param month Tháng (1-12)
 * @param year Năm
 * @returns Mảng các ngày trong tháng
 */
export const getMonthDays = (month: number, year: number): Date[] => {
  const date = moment({ year, month: month - 1 });
  const daysInMonth = date.daysInMonth();
  
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(date.clone().date(i).toDate());
  }
  
  return days;
};

/**
 * Tính toán ngày rụng trứng dựa trên chu kỳ kinh nguyệt
 * @param lastPeriodStart Ngày bắt đầu kỳ kinh gần nhất
 * @param cycleLength Độ dài chu kỳ (mặc định: 28 ngày)
 * @returns Ngày rụng trứng dự kiến
 */
export const calculateOvulationDay = (lastPeriodStart: string | Date, cycleLength = 28): Date => {
  // Ngày rụng trứng thường xảy ra 14 ngày trước kỳ kinh tiếp theo
  const ovulationDay = moment(lastPeriodStart).add(cycleLength - 14, 'days');
  return ovulationDay.toDate();
};

/**
 * Tính ngày dự kiến bắt đầu kỳ kinh tiếp theo
 * @param lastPeriodStart Ngày bắt đầu kỳ kinh gần nhất
 * @param cycleLength Độ dài chu kỳ (mặc định: 28 ngày)
 * @returns Ngày dự kiến bắt đầu kỳ kinh tiếp theo
 */
export const calculateNextPeriod = (lastPeriodStart: string | Date, cycleLength = 28): Date => {
  return moment(lastPeriodStart).add(cycleLength, 'days').toDate();
}; 