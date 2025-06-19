/**
 * TIMEZONE UTILS - Vietnam (UTC+7) Standardization
 * Fixes timezone issues in doctor schedule creation
 */

// Business rules for working days
export const WORKING_DAYS = {
  MONDAY: 1,
  TUESDAY: 2, 
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6, // Not included in working days
  SUNDAY: 0   // Not included in working days
};

// Working days range: Monday (1) to Friday (5) - EXCLUDE Saturday & Sunday
export const WORKING_DAY_RANGE = [1, 2, 3, 4, 5]; // T2, T3, T4, T5, T6

/**
 * Create a Date object in Vietnam timezone (UTC+7) from YYYY-MM-DD string
 * This ensures consistent dayOfWeek calculation regardless of server timezone
 */
export const createVietnamDate = (dateStr: string): Date => {
  // Validate format first
  if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create local date (server timezone) - this is what we want for Vietnam
  const localDate = new Date(year, month - 1, day);
  
  // Validate the date is valid
  if (isNaN(localDate.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  return localDate;
};

/**
 * Get day of week for Vietnam timezone consistently
 * Returns: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
export const getVietnamDayOfWeek = (dateStr: string): number => {
  const vnDate = createVietnamDate(dateStr);
  return vnDate.getDay();
};

/**
 * Get Vietnamese day name for a date
 */
export const getVietnamDayName = (dateStr: string): string => {
  const vnDate = createVietnamDate(dateStr);
  return vnDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    timeZone: 'Asia/Ho_Chi_Minh'
  });
};

/**
 * Check if a date is a working day (Monday-Friday)
 * Business rule: Doctor only works T2-T6 (Monday-Friday), excludes Saturday & Sunday
 */
export const isWorkingDay = (dateStr: string): boolean => {
  const dayOfWeek = getVietnamDayOfWeek(dateStr);
  return WORKING_DAY_RANGE.includes(dayOfWeek);
};

/**
 * Check if a date is weekend (Saturday or Sunday)
 */
export const isWeekend = (dateStr: string): boolean => {
  const dayOfWeek = getVietnamDayOfWeek(dateStr);
  return dayOfWeek === WORKING_DAYS.SATURDAY || dayOfWeek === WORKING_DAYS.SUNDAY;
};

/**
 * Get detailed day information for debugging
 */
export const getDayInfo = (dateStr: string) => {
  const dayOfWeek = getVietnamDayOfWeek(dateStr);
  const dayName = getVietnamDayName(dateStr);
  const isWorking = isWorkingDay(dateStr);
  const isWeekendDay = isWeekend(dateStr);
  
  return {
    date: dateStr,
    dayOfWeek,
    dayName,
    isWorkingDay: isWorking,
    isWeekend: isWeekendDay,
    reason: isWorking 
      ? `✅ Working day - ${dayName} (T2-T6)` 
      : `🚫 Non-working day - ${dayName} (${isWeekendDay ? 'Weekend' : 'Holiday'})`,
    timezone: 'Asia/Ho_Chi_Minh (UTC+7)'
  };
};

/**
 * Generate all working days in a month (exclude weekends)
 */
export const generateWorkingDaysInMonth = (month: number, year: number): string[] => {
  // Validate inputs
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1-12');
  }
  
  if (year < 2024 || year > 2030) {
    throw new Error('Year must be between 2024-2030');
  }

  const workingDays: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate(); // Get last day of month

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    if (isWorkingDay(dateStr)) {
      workingDays.push(dateStr);
    }
  }

  return workingDays;
};

/**
 * Debug function to analyze a month's working days
 */
export const debugMonthWorkingDays = (month: number, year: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const analysis = {
    month,
    year,
    totalDays: daysInMonth,
    workingDays: [] as any[],
    weekends: [] as any[],
    summary: {
      totalWorkingDays: 0,
      totalWeekends: 0,
      mondayToFriday: 0,
      saturdays: 0,
      sundays: 0
    }
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dayInfo = getDayInfo(dateStr);
    
    if (dayInfo.isWorkingDay) {
      analysis.workingDays.push(dayInfo);
      analysis.summary.totalWorkingDays++;
      analysis.summary.mondayToFriday++;
    } else if (dayInfo.isWeekend) {
      analysis.weekends.push(dayInfo);
      analysis.summary.totalWeekends++;
      
      if (dayInfo.dayOfWeek === WORKING_DAYS.SATURDAY) analysis.summary.saturdays++;
      if (dayInfo.dayOfWeek === WORKING_DAYS.SUNDAY) analysis.summary.sundays++;
    }
  }

  return analysis;
}; 