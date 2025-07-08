import dayjs from 'dayjs';

/**
 * Safely combine appointment date and time, handling both Date objects and strings
 * @param appointmentDate - Date object hoặc date string (YYYY-MM-DD format)
 * @param appointmentTime - Time string (e.g., "07:00-08:00" or "07:00")
 * @returns Date object hoặc null nếu invalid
 */
export const safeCombineDateTime = (
  appointmentDate: string | Date, 
  appointmentTime: string
): Date | null => {
  try {
    console.log('🔄 [DateTime Utils] Input:', {
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      dateType: typeof appointmentDate
    });

    // Validate input
    if (!appointmentDate || !appointmentTime) {
      console.warn('⚠️ [DateTime Utils] Missing date or time:', { appointmentDate, appointmentTime });
      return null;
    }

    // Extract start time from range if needed (e.g., "07:00-08:00" -> "07:00")
    const startTime = appointmentTime.split('-')[0]?.trim() || 
                     appointmentTime.split(' - ')[0]?.trim() || 
                     appointmentTime.trim();

    // Handle Date object input
    if (appointmentDate instanceof Date) {
      const dateStr = dayjs(appointmentDate).format('YYYY-MM-DD');
      const combinedStr = `${dateStr} ${startTime}`;
      const result = dayjs(combinedStr).toDate();
      
      console.log('✅ [DateTime Utils] Date object processed:', {
        input: appointmentDate,
        dateStr,
        combinedStr,
        result: result,
        isValid: !isNaN(result.getTime())
      });
      
      return !isNaN(result.getTime()) ? result : null;
    }

    // Handle string input
    const combinedStr = `${appointmentDate} ${startTime}`;
    const result = dayjs(combinedStr).toDate();
    
    console.log('✅ [DateTime Utils] String processed:', {
      input: appointmentDate,
      combinedStr,
      result: result,
      isValid: !isNaN(result.getTime())
    });
    
    return !isNaN(result.getTime()) ? result : null;

  } catch (error) {
    console.error('❌ [DateTime Utils] Error combining date/time:', error, {
      appointmentDate,
      appointmentTime
    });
    return null;
  }
};

/**
 * Format date safely với fallback
 * @param dateInput - Date object hoặc string
 * @param format - Format string (default: 'DD/MM/YYYY')
 * @returns Formatted string hoặc fallback text
 */
export const safeFormatDate = (
  dateInput: string | Date | null | undefined,
  format: string = 'DD/MM/YYYY'
): string => {
  try {
    if (!dateInput) return 'Chưa có thông tin';
    
    const date = dayjs(dateInput);
    if (!date.isValid()) {
      console.warn('⚠️ [DateTime Utils] Invalid date for formatting:', dateInput);
      return String(dateInput); // Fallback to original string
    }
    
    return date.format(format);
  } catch (error) {
    console.error('❌ [DateTime Utils] Error formatting date:', error, { dateInput });
    return String(dateInput) || 'Lỗi định dạng';
  }
};

/**
 * Check if appointment datetime is within cancellation window (24 hours)
 * @param appointmentDate - Date object hoặc string
 * @param appointmentTime - Time string
 * @returns boolean - true nếu có thể cancel với refund
 */
export const canCancelWithRefund = (
  appointmentDate: string | Date,
  appointmentTime: string
): boolean => {
  try {
    const appointmentDateTime = safeCombineDateTime(appointmentDate, appointmentTime);
    if (!appointmentDateTime) return false;
    
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    console.log('⏰ [DateTime Utils] Refund check:', {
      appointmentDateTime: appointmentDateTime.toISOString(),
      now: now.toISOString(),
      hoursUntilAppointment,
      canRefund: hoursUntilAppointment > 24
    });
    
    return hoursUntilAppointment > 24;
  } catch (error) {
    console.error('❌ [DateTime Utils] Error checking refund eligibility:', error);
    return false;
  }
}; 