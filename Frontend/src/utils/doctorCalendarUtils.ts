  import dayjs from 'dayjs';

// Define missing interfaces based on the actual API structure
export interface ITimeSlot {
  _id: string;
  slotTime: string;
  status: 'Free' | 'Booked' | 'Absent';
}

export interface IWeekScheduleObject {
  _id: string;
  dayOfWeek: string;
  slots: ITimeSlot[];
}

export interface IDoctorSchedule {
  _id: string;
  doctorId: {
    _id: string;
    userId: {
      fullName: string;
    };
  };
  weekSchedule: IWeekScheduleObject[];
}

  // ================= TYPES =================

  export interface DoctorCalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    slotTime: string; // "07:00-08:00"
    status: 'Free' | 'Booked' | 'Absent';
    doctorId: string;
    doctorName: string;
    scheduleId: string;
    backgroundColor: string;
    borderColor: string;
  }

  export interface DoctorScheduleStats {
    totalSlots: number;
    freeSlots: number;
    bookedSlots: number;
    absentSlots: number;
    utilizationRate: number; // (bookedSlots / totalSlots) * 100
    availabilityRate: number; // (freeSlots / totalSlots) * 100
  }

  export interface GroupedEvents {
    [date: string]: DoctorCalendarEvent[];
  }

  // ================= CONSTANTS =================

  export const EVENT_COLORS = {
    Free: {
      backgroundColor: '#52c41a',
      borderColor: '#389e0d',
    },
    Booked: {
      backgroundColor: '#1890ff',
      borderColor: '#096dd9',
    },
    Absent: {
      backgroundColor: '#ff4d4f',
      borderColor: '#d9363e',
    }
  };

  export const STATUS_LABELS = {
    Free: 'Trống',
    Booked: 'Có bệnh nhân',
    Absent: 'Nghỉ'
  };

  // ================= CONVERSION FUNCTIONS =================

  /**
   * Convert doctor schedules to calendar events
   */
  export const convertDoctorSchedulesToCalendarEvents = (schedules: IDoctorSchedule[]): DoctorCalendarEvent[] => {
    const events: DoctorCalendarEvent[] = [];

    schedules.forEach(schedule => {
      const doctorName = schedule.doctorId.userId.fullName;
      const doctorId = schedule.doctorId._id;
      const scheduleId = schedule._id;

      schedule.weekSchedule.forEach(week => {
        week.slots.forEach(slot => {
          const eventDate = dayjs(week.dayOfWeek).toDate();
          const [startTime, endTime] = slot.slotTime.split('-');
          
          // Create start and end datetime
          const start = dayjs(eventDate)
            .hour(parseInt(startTime.split(':')[0]))
            .minute(parseInt(startTime.split(':')[1]))
            .toDate();
            
          const end = dayjs(eventDate)
            .hour(parseInt(endTime.split(':')[0]))
            .minute(parseInt(endTime.split(':')[1]))
            .toDate();

          const colors = EVENT_COLORS[slot.status];

          events.push({
            id: `${scheduleId}-${week._id}-${slot._id}`,
            title: `${STATUS_LABELS[slot.status]} - ${slot.slotTime}`,
            start,
            end,
            slotTime: slot.slotTime,
            status: slot.status,
            doctorId,
            doctorName,
            scheduleId,
            backgroundColor: colors.backgroundColor,
            borderColor: colors.borderColor,
          });
        });
      });
    });

    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  /**
   * Calculate statistics from doctor schedules
   */
  export const getDoctorScheduleStats = (schedules: IDoctorSchedule[]): DoctorScheduleStats => {
    let totalSlots = 0;
    let freeSlots = 0;
    let bookedSlots = 0;
    let absentSlots = 0;

    schedules.forEach(schedule => {
      schedule.weekSchedule.forEach(week => {
        week.slots.forEach(slot => {
          totalSlots++;
          switch (slot.status) {
            case 'Free':
              freeSlots++;
              break;
            case 'Booked':
              bookedSlots++;
              break;
            case 'Absent':
              absentSlots++;
              break;
          }
        });
      });
    });

    const utilizationRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
    const availabilityRate = totalSlots > 0 ? Math.round((freeSlots / totalSlots) * 100) : 0;

    return {
      totalSlots,
      freeSlots,
      bookedSlots,
      absentSlots,
      utilizationRate,
      availabilityRate
    };
  };

  /**
   * Get today's statistics
   */
  export const getTodayStats = (schedules: IDoctorSchedule[]): DoctorScheduleStats => {
    const today = dayjs().format('YYYY-MM-DD');
    
    let totalSlots = 0;
    let freeSlots = 0;
    let bookedSlots = 0;
    let absentSlots = 0;

    schedules.forEach(schedule => {
      schedule.weekSchedule.forEach(week => {
        const weekDate = dayjs(week.dayOfWeek).format('YYYY-MM-DD');
        if (weekDate === today) {
          week.slots.forEach(slot => {
            totalSlots++;
            switch (slot.status) {
              case 'Free':
                freeSlots++;
                break;
              case 'Booked':
                bookedSlots++;
                break;
              case 'Absent':
                absentSlots++;
                break;
            }
          });
        }
      });
    });

    const utilizationRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
    const availabilityRate = totalSlots > 0 ? Math.round((freeSlots / totalSlots) * 100) : 0;

    return {
      totalSlots,
      freeSlots,
      bookedSlots,
      absentSlots,
      utilizationRate,
      availabilityRate
    };
  };

  /**
   * Get events for a specific date
   */
  export const getEventsForDate = (events: DoctorCalendarEvent[], date: Date): DoctorCalendarEvent[] => {
    const targetDate = dayjs(date).format('YYYY-MM-DD');
    
    return events.filter(event => {
      const eventDate = dayjs(event.start).format('YYYY-MM-DD');
      return eventDate === targetDate;
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  /**
   * Group events by date
   */
  export const groupEventsByDate = (events: DoctorCalendarEvent[]): GroupedEvents => {
    const grouped: GroupedEvents = {};

    events.forEach(event => {
      const dateKey = dayjs(event.start).format('YYYY-MM-DD');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort events within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.start.getTime() - b.start.getTime());
    });

    return grouped;
  };

  /**
   * Get events for a specific month
   */
  export const getEventsForMonth = (events: DoctorCalendarEvent[], month: number, year: number): DoctorCalendarEvent[] => {
    return events.filter(event => {
      const eventDate = dayjs(event.start);
      return eventDate.month() === month - 1 && eventDate.year() === year;
    });
  };

  /**
   * Get upcoming events (next 7 days)
   */
  export const getUpcomingEvents = (events: DoctorCalendarEvent[], days: number = 7): DoctorCalendarEvent[] => {
    const now = dayjs();
    const endDate = now.add(days, 'day');

    return events.filter(event => {
      const eventDate = dayjs(event.start);
      return eventDate.isAfter(now) && eventDate.isBefore(endDate);
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  /**
   * Check if a date has any events
   */
  export const hasEventsOnDate = (events: DoctorCalendarEvent[], date: Date): boolean => {
    const targetDate = dayjs(date).format('YYYY-MM-DD');
    
    return events.some(event => {
      const eventDate = dayjs(event.start).format('YYYY-MM-DD');
      return eventDate === targetDate;
    });
  };

  /**
   * Get status distribution for a date range
   */
  export const getStatusDistribution = (
    events: DoctorCalendarEvent[], 
    startDate: Date, 
    endDate: Date
  ): { [status: string]: number } => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    const distribution = {
      Free: 0,
      Booked: 0,
      Absent: 0
    };

    events.forEach(event => {
      const eventDate = dayjs(event.start);
      if (eventDate.isAfter(start) && eventDate.isBefore(end)) {
        distribution[event.status]++;
      }
    });

    return distribution;
  };

  /**
   * Format time slot for display
   */
  export const formatTimeSlot = (slotTime: string): string => {
    return slotTime; // Already in format "07:00-08:00"
  };

  /**
   * Get time slots for a specific date
   */
  export const getTimeSlotsForDate = (schedules: IDoctorSchedule[], date: Date): ITimeSlot[] => {
    const targetDate = dayjs(date).format('YYYY-MM-DD');
    const slots: ITimeSlot[] = [];

    schedules.forEach(schedule => {
      schedule.weekSchedule.forEach(week => {
        const weekDate = dayjs(week.dayOfWeek).format('YYYY-MM-DD');
        if (weekDate === targetDate) {
          slots.push(...week.slots);
        }
      });
    });

    return slots.sort((a, b) => {
      const aTime = a.slotTime.split('-')[0];
      const bTime = b.slotTime.split('-')[0];
      return aTime.localeCompare(bTime);
    });
  };

  /**
   * Check if doctor is available on a specific date and time
   */
  export const isDoctorAvailable = (
    schedules: IDoctorSchedule[], 
    date: Date, 
    timeSlot: string
  ): boolean => {
    const targetDate = dayjs(date).format('YYYY-MM-DD');

    for (const schedule of schedules) {
      for (const week of schedule.weekSchedule) {
        const weekDate = dayjs(week.dayOfWeek).format('YYYY-MM-DD');
        if (weekDate === targetDate) {
          const slot = week.slots.find(s => s.slotTime === timeSlot);
          return slot ? slot.status === 'Free' : false;
        }
      }
    }

    return false;
  };

  export default {
    convertDoctorSchedulesToCalendarEvents,
    getDoctorScheduleStats,
    getTodayStats,
    getEventsForDate,
    groupEventsByDate,
    getEventsForMonth,
    getUpcomingEvents,
    hasEventsOnDate,
    getStatusDistribution,
    formatTimeSlot,
    getTimeSlotsForDate,
    isDoctorAvailable,
    EVENT_COLORS,
    STATUS_LABELS
  }; 