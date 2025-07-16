import dayjs from 'dayjs';
import type { IDoctorSchedule } from '../api/endpoints/doctorSchedule';
import type { CalendarEvent, DoctorScheduleEvent } from '../types/calendar';

/**
 * Convert doctor schedule data từ API thành calendar events
 * Mỗi time slot sẽ thành một event riêng biệt
 */
export const convertSchedulesToCalendarEvents = (schedules: IDoctorSchedule[]): DoctorScheduleEvent[] => {
  const events: DoctorScheduleEvent[] = [];

  console.log('🔄 Converting schedules to calendar events:', schedules);

  if (!schedules || schedules.length === 0) {
    console.log('❌ [CalendarUtils] No schedules provided');
    return events;
  }

  schedules.forEach(schedule => {
    console.log('📋 [CalendarUtils] Processing schedule:', {
      scheduleId: schedule._id,
      doctorName: schedule.doctorId?.userId?.fullName,
      weekScheduleCount: schedule.weekSchedule?.length
    });

    // Kiểm tra xem doctor có tồn tại không
    if (!schedule.doctorId || !schedule.doctorId.userId) {
      console.warn('⚠️ [CalendarUtils] Schedule has deleted doctor, will show as "Bác sĩ đã bị xóa":', {
        scheduleId: schedule._id,
        doctorId: schedule.doctorId?._id || 'null'
      });
      // Vẫn tiếp tục xử lý để hiển thị lịch với thông tin "đã bị xóa"
    }

    if (!schedule.weekSchedule || schedule.weekSchedule.length === 0) {
      console.log('❌ [CalendarUtils] No weekSchedule found for schedule:', schedule._id);
      return;
    }

    schedule.weekSchedule.forEach(weekSchedule => {
      console.log('📅 Processing weekSchedule:', {
        dayOfWeek: weekSchedule.dayOfWeek,
        slotsCount: weekSchedule.slots.length
      });
      
      if (!weekSchedule.slots || weekSchedule.slots.length === 0) {
        console.log('❌ [CalendarUtils] No slots found for weekSchedule:', weekSchedule._id);
        return;
      }

      const dayDate = dayjs(weekSchedule.dayOfWeek);
      console.log('📅 [CalendarUtils] DayDate parsed:', {
        original: weekSchedule.dayOfWeek,
        parsed: dayDate.format('YYYY-MM-DD'),
        isValid: dayDate.isValid()
      });
      
      weekSchedule.slots.forEach(slot => {
        console.log('⏰ [CalendarUtils] Processing slot:', {
          slotTime: slot.slotTime,
          status: slot.status,
          slotId: slot._id
        });

        // Parse time slot (e.g., "07:00-08:00")
        const [startTime, endTime] = slot.slotTime.split('-');
        if (!startTime || !endTime) {
          console.log('❌ [CalendarUtils] Invalid slot time format:', slot.slotTime);
          return;
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Tạo start và end date cho event
        const startDate = dayDate
          .hour(startHour)
          .minute(startMinute)
          .second(0)
          .millisecond(0)
          .toDate();
          
        const endDate = dayDate
          .hour(endHour)
          .minute(endMinute)
          .second(0)
          .millisecond(0)
          .toDate();

        // Kiểm tra xem doctor có tồn tại không (có thể đã bị xóa)
        const doctorName = schedule.doctorId?.userId?.fullName || 'Bác sĩ đã bị xóa';
        
        // Tạo title cho event dựa vào status
        let title = '';
        switch (slot.status) {
          case 'Free':
            title = `${doctorName} - Có thể đặt`;
            break;
          case 'Booked':
            title = `${doctorName} - Đã đặt lịch`;
            break;
          case 'Absent':
            title = `${doctorName} - Không có mặt`;
            break;
          default:
            title = `${doctorName} - ${slot.status}`;
        }

        const event: DoctorScheduleEvent = {
          id: `${schedule._id}-${weekSchedule._id}-${slot._id}`,
          title,
          start: startDate,
          end: endDate,
          resource: {
            doctorId: schedule.doctorId?._id || 'deleted-doctor',
            doctorName: doctorName,
            specialization: schedule.doctorId?.specialization || 'Chưa xác định',
            status: slot.status,
            slotTime: slot.slotTime,
            appointmentId: undefined, // Will be updated when backend supports it
            patientName: undefined, // Will be updated when backend supports it
            scheduleId: schedule._id,
            weekScheduleId: weekSchedule._id
          },
          allDay: false
        };

        console.log('✅ [CalendarUtils] Created event:', {
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          status: event.resource.status
        });

        const existing = events.find(e => e.start.getTime() === startDate.getTime() && e.end.getTime() === endDate.getTime());
        if (existing) {
          console.log('📊 [CalendarUtils] Found existing event, skipping duplicate');
        } else {
          events.push(event);
        }
        console.log('📊 [CalendarUtils] Total events so far:', events.length);
      });
    });
  });

  console.log('✅ Generated calendar events:', events.length, events);
  return events;
};

/**
 * Group events by date for agenda view
 */
export const groupEventsByDate = (events: CalendarEvent[]) => {
  const grouped: Record<string, CalendarEvent[]> = {};
  
  events.forEach(event => {
    const dateKey = dayjs(event.start).format('YYYY-MM-DD');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });
  
  return grouped;
};

/**
 * Get events for specific date
 */
export const getEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const targetDate = dayjs(date);
  
  return events.filter(event => {
    const eventDate = dayjs(event.start);
    return eventDate.isSame(targetDate, 'day');
  });
};

/**
 * Get available time slots for a specific doctor and date
 */
export const getAvailableSlots = (
  events: DoctorScheduleEvent[], 
  doctorId: string, 
  date: Date
): DoctorScheduleEvent[] => {
  return events.filter(event => 
    event.resource.doctorId === doctorId &&
    dayjs(event.start).isSame(dayjs(date), 'day') &&
    event.resource.status === 'Free'
  );
};

/**
 * Get busy time slots for a specific doctor and date
 */
export const getBusySlots = (
  events: DoctorScheduleEvent[], 
  doctorId: string, 
  date: Date
): DoctorScheduleEvent[] => {
  return events.filter(event => 
    event.resource.doctorId === doctorId &&
    dayjs(event.start).isSame(dayjs(date), 'day') &&
    event.resource.status === 'Booked'
  );
};

/**
 * Get statistics for schedule data
 */
export const getScheduleStats = (events: DoctorScheduleEvent[]) => {
  const total = events.length;
  const free = events.filter(e => e.resource.status === 'Free').length;
  const booked = events.filter(e => e.resource.status === 'Booked').length;
  const absent = events.filter(e => e.resource.status === 'Absent').length;
  
  return {
    total,
    free,
    booked,
    absent,
    utilization: total > 0 ? Math.round((booked / total) * 100) : 0
  };
};

/**
 * Filter events by date range
 */
export const filterEventsByDateRange = (
  events: CalendarEvent[], 
  startDate: Date, 
  endDate: Date
): CalendarEvent[] => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  return events.filter(event => {
    const eventDate = dayjs(event.start);
    return eventDate.isAfter(start.subtract(1, 'day')) && 
           eventDate.isBefore(end.add(1, 'day'));
  });
};

/**
 * Get events for current week
 */
export const getCurrentWeekEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const startOfWeek = dayjs().startOf('week');
  const endOfWeek = dayjs().endOf('week');
  
  return filterEventsByDateRange(events, startOfWeek.toDate(), endOfWeek.toDate());
};

/**
 * Get events for current month
 */
export const getCurrentMonthEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const startOfMonth = dayjs().startOf('month');
  const endOfMonth = dayjs().endOf('month');
  
  return filterEventsByDateRange(events, startOfMonth.toDate(), endOfMonth.toDate());
};

/**
 * Format event time for display
 */
export const formatEventTime = (event: CalendarEvent): string => {
  const start = dayjs(event.start);
  const end = dayjs(event.end);
  
  return `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
};

/**
 * Check if event is today
 */
export const isEventToday = (event: CalendarEvent): boolean => {
  return dayjs(event.start).isSame(dayjs(), 'day');
};

/**
 * Check if event is this week
 */
export const isEventThisWeek = (event: CalendarEvent): boolean => {
  return dayjs(event.start).isSame(dayjs(), 'week');
};

/**
 * Get next available appointment for a doctor
 */
export const getNextAvailableAppointment = (
  events: DoctorScheduleEvent[], 
  doctorId: string
): DoctorScheduleEvent | null => {
  const now = dayjs();
  
  const availableEvents = events
    .filter(event => 
      event.resource.doctorId === doctorId &&
      event.resource.status === 'Free' &&
      dayjs(event.start).isAfter(now)
    )
    .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());
    
  return availableEvents[0] || null;
}; 