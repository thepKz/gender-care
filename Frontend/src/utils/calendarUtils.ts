import dayjs from 'dayjs';
import type { CalendarEvent, DoctorScheduleEvent } from '../types/calendar';
import type { IDoctorSchedule, ITimeSlot } from '../api/endpoints/doctorSchedule';

/**
 * Convert doctor schedule data từ API thành calendar events
 * Mỗi time slot sẽ thành một event riêng biệt
 */
export const convertSchedulesToCalendarEvents = (schedules: IDoctorSchedule[]): DoctorScheduleEvent[] => {
  const events: DoctorScheduleEvent[] = [];

  console.log('🔄 Converting schedules to calendar events:', schedules);

  schedules.forEach(schedule => {
    schedule.weekSchedule.forEach(weekSchedule => {
      console.log('📅 Processing weekSchedule:', {
        dayOfWeek: weekSchedule.dayOfWeek,
        slotsCount: weekSchedule.slots.length
      });
      
      const dayDate = dayjs(weekSchedule.dayOfWeek);
      
      weekSchedule.slots.forEach(slot => {
        // Parse time slot (e.g., "07:00-08:00")
        const [startTime, endTime] = slot.slotTime.split('-');
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

        // Tạo title cho event dựa vào status
        let title = '';
        switch (slot.status) {
          case 'Free':
            title = `${schedule.doctorId.userId.fullName} - Có thể đặt`;
            break;
          case 'Booked':
            title = `${schedule.doctorId.userId.fullName} - Đã đặt lịch`;
            break;
          case 'Absent':
            title = `${schedule.doctorId.userId.fullName} - Không có mặt`;
            break;
          default:
            title = `${schedule.doctorId.userId.fullName} - ${slot.status}`;
        }

                 const event: DoctorScheduleEvent = {
           id: `${schedule._id}-${weekSchedule._id}-${slot._id}`,
           title,
           start: startDate,
           end: endDate,
           resource: {
             doctorId: schedule.doctorId._id,
             doctorName: schedule.doctorId.userId.fullName,
             specialization: schedule.doctorId.specialization || 'Chưa xác định',
             status: slot.status,
             slotTime: slot.slotTime,
             appointmentId: undefined, // Will be updated when backend supports it
             patientName: undefined, // Will be updated when backend supports it
             scheduleId: schedule._id,
             weekScheduleId: weekSchedule._id
           },
           allDay: false
         };

        events.push(event);
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