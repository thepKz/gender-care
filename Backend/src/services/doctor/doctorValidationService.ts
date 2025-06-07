import mongoose from 'mongoose';

/**
 * Shared validation utilities for Doctor services
 * Extracted from doctorService.ts for better modularity
 */

// Validate ObjectId format
export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate doctor data fields
export const validateDoctorFields = (doctorFields: any) => {
  if (doctorFields.experience !== undefined && (doctorFields.experience < 0 || doctorFields.experience > 50)) {
    throw new Error('Số năm kinh nghiệm phải từ 0-50 năm');
  }
  
  if (doctorFields.rating !== undefined && (doctorFields.rating < 0 || doctorFields.rating > 5)) {
    throw new Error('Rating phải từ 0-5');
  }
};

// Validate gender field
export const validateGender = (gender: string) => {
  if (gender !== undefined && !['male', 'female', 'other'].includes(gender)) {
    throw new Error('Giới tính phải là male, female hoặc other');
  }
};

// Validate date format for schedules
export const validateDateFormat = (dateStr: string): Date => {
  const workDate = new Date(dateStr);
  if (isNaN(workDate.getTime()) || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error(`Ngày không hợp lệ: ${dateStr}. Vui lòng sử dụng format YYYY-MM-DD`);
  }
  return workDate;
};

// Validate schedule status
export const validateScheduleStatus = (status: string) => {
  const validStatuses = ["Free", "Booked", "Absent"];
  if (!validStatuses.includes(status)) {
    throw new Error('Status không hợp lệ. Chỉ chấp nhận: Free, Booked, Absent');
  }
};

// Generate doctor email from fullName
export const generateDoctorEmail = (fullName: string): string => {
  const normalizedName = fullName
    .toLowerCase()
    .replace(/bs\./g, '') // Bỏ tiền tố BS.
    .replace(/[^\w\s]/g, '') // Bỏ ký tự đặc biệt
    .trim()
    .split(' ')
    .join(''); // Nối các từ lại

  return `bs.${normalizedName}@genderhealthcare.com`;
};

// Timezone utilities for Vietnam
export const getVietnamDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // Local time (UTC+7)
};

export const isWeekend = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  const dayName = date.toLocaleDateString('vi-VN', { 
    weekday: 'long',
    timeZone: 'Asia/Ho_Chi_Minh' 
  });
  
  return (dayOfWeek === 0) || (dayOfWeek === 6) || 
         (dayName.includes('Chủ nhật')) || (dayName.includes('Thứ Bảy'));
};

export const getDayInfo = (dateStr: string) => {
  const workDate = getVietnamDate(dateStr);
  const dayOfWeek = workDate.getDay();
  const dayName = workDate.toLocaleDateString('vi-VN', { 
    weekday: 'long',
    timeZone: 'Asia/Ho_Chi_Minh' 
  });
  
  return {
    date: workDate,
    dayOfWeek,
    dayName,
    isWeekend: isWeekend(workDate)
  };
}; 