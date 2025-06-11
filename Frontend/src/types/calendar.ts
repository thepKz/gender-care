
// Calendar Event Types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    doctorId: string;
    doctorName: string;
    specialization: string;
    status: 'Free' | 'Booked' | 'Absent';
    slotTime: string;
    appointmentId?: string;
    patientName?: string;
  };
  allDay?: boolean;
  className?: string;
}

// Calendar View Types - Changed 'list' to 'agenda' to match react-big-calendar
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

// Doctor Schedule Event
export interface DoctorScheduleEvent extends CalendarEvent {
  resource: {
    doctorId: string;
    doctorName: string;
    specialization: string;
    status: 'Free' | 'Booked' | 'Absent';
    slotTime: string;
    appointmentId?: string;
    patientName?: string;
    scheduleId: string;
    weekScheduleId: string;
  };
}

// Calendar Props
export interface AdvancedCalendarProps {
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[] }) => void;
  onNavigate?: (date: Date, view: CalendarView) => void;
  onView?: (view: CalendarView) => void;
  defaultView?: CalendarView;
  views?: CalendarView[];
  className?: string;
  height?: number | string;
  loading?: boolean;
}

// Calendar Toolbar Props
export interface CalendarToolbarProps {
  onNavigate: (action: 'prev' | 'next' | 'today') => void;
  onView: (view: CalendarView) => void;
  onToday: () => void;
  label: string;
  view: CalendarView;
  views: CalendarView[];
  date?: Date;
}

// Event Style Getter
export interface EventStyleGetter {
  (event: CalendarEvent): {
    style?: React.CSSProperties;
    className?: string;
  };
} 