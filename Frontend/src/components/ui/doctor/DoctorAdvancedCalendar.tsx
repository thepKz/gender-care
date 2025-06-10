import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/vi'; // Vietnamese locale
import { Card, Spin, Empty, message } from 'antd';
import type { DoctorCalendarEvent } from '../../../utils/doctorCalendarUtils';
import '../../../styles/calendar.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup localizer with Vietnamese
moment.locale('vi');
const localizer = momentLocalizer(moment);

// Calendar view types
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

// Props interface
interface DoctorAdvancedCalendarProps {
  events: DoctorCalendarEvent[];
  onSelectEvent?: (event: DoctorCalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[] }) => void;
  onNavigate?: (date: Date, view: CalendarView) => void;
  onView?: (view: CalendarView) => void;
  defaultView?: CalendarView;
  views?: CalendarView[];
  className?: string;
  height?: number;
  loading?: boolean;
}

// Vietnamese messages for calendar
const messages = {
  allDay: 'Cả ngày',
  previous: 'Trước',
  next: 'Sau',
  today: 'Hôm nay',
  month: 'Tháng',
  week: 'Tuần',
  day: 'Ngày',
  agenda: 'Lịch trình',
  date: 'Ngày',
  time: 'Thời gian',
  event: 'Sự kiện',
  noEventsInRange: 'Bạn không có lịch làm việc nào trong khoảng thời gian này.',
  showMore: (total: number) => `+ Xem thêm ${total} lịch hẹn`
};

// Vietnamese formats
const formats = {
  monthHeaderFormat: 'MMMM YYYY',
  dayHeaderFormat: 'dddd, DD/MM/YYYY',
  weekdayFormat: 'dddd',
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => {
    return `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM/YYYY')}`;
  },
  agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) => {
    return `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM/YYYY')}`;
  },
  agendaDateFormat: 'DD/MM/YYYY',
  agendaTimeFormat: 'HH:mm',
  agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
    return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
  }
};

const DoctorAdvancedCalendar: React.FC<DoctorAdvancedCalendarProps> = ({
  events = [],
  onSelectEvent,
  onSelectSlot,
  onNavigate,
  onView,
  defaultView = 'month',
  views = ['month', 'week', 'day', 'agenda'],
  className = '',
  height = 600,
  loading = false
}) => {
  const [currentView, setCurrentView] = useState<CalendarView>(defaultView);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Event style getter for color coding
  const eventStyleGetter = useCallback((event: DoctorCalendarEvent) => {
    return {
      style: {
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        color: event.textColor,
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        padding: '2px 6px'
      }
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: DoctorCalendarEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    } else {
      // Default behavior - show event details
      const statusText = event.status === 'Free' ? 'Trống' : 
                        event.status === 'Booked' ? 'Có bệnh nhân' : 'Nghỉ';
      
      message.info({
        content: (
          <div>
            <div><strong>Thời gian:</strong> {event.slotTime}</div>
            <div><strong>Trạng thái:</strong> {statusText}</div>
            <div><strong>Ngày:</strong> {moment(event.start).format('DD/MM/YYYY, dddd')}</div>
          </div>
        ),
        duration: 4
      });
    }
  }, [onSelectEvent]);

  // Handle slot selection (for creating new events)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    if (onSelectSlot) {
      onSelectSlot(slotInfo);
    }
  }, [onSelectSlot]);

  // Handle navigation
  const handleNavigate = useCallback((date: Date, view: View) => {
    setCurrentDate(date);
    if (onNavigate) {
      onNavigate(date, view as CalendarView);
    }
  }, [onNavigate]);

  // Handle view change
  const handleViewChange = useCallback((view: View) => {
    const newView = view as CalendarView;
    setCurrentView(newView);
    if (onView) {
      onView(newView);
    }
  }, [onView]);

  // Custom date cell wrapper for month view - show event count
  const DateCellWrapper = useCallback(({ children, value }: { children: React.ReactNode; value: Date }) => {
    const dayEvents = events.filter(event => {
      return moment(event.start).isSame(moment(value), 'day');
    });

    const freeCount = dayEvents.filter(e => e.status === 'Free').length;
    const bookedCount = dayEvents.filter(e => e.status === 'Booked').length;
    const absentCount = dayEvents.filter(e => e.status === 'Absent').length;

    const isToday = moment(value).isSame(moment(), 'day');
    const hasEvents = dayEvents.length > 0;

    return (
      <div 
        className={`doctor-calendar-date-cell ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`}
        style={{ 
          minHeight: '100px',
          position: 'relative',
          background: isToday ? '#f0f8ff' : undefined
        }}
      >
        {children}
        {hasEvents && (
          <div className="event-count-badges" style={{ 
            position: 'absolute', 
            bottom: '2px', 
            right: '2px',
            display: 'flex',
            gap: '2px'
          }}>
            {freeCount > 0 && (
              <span style={{ 
                backgroundColor: '#52c41a', 
                color: 'white', 
                fontSize: '10px', 
                padding: '1px 4px', 
                borderRadius: '8px',
                minWidth: '16px',
                textAlign: 'center'
              }}>
                {freeCount}
              </span>
            )}
            {bookedCount > 0 && (
              <span style={{ 
                backgroundColor: '#1890ff', 
                color: 'white', 
                fontSize: '10px', 
                padding: '1px 4px', 
                borderRadius: '8px',
                minWidth: '16px',
                textAlign: 'center'
              }}>
                {bookedCount}
              </span>
            )}
            {absentCount > 0 && (
              <span style={{ 
                backgroundColor: '#ff4d4f', 
                color: 'white', 
                fontSize: '10px', 
                padding: '1px 4px', 
                borderRadius: '8px',
                minWidth: '16px',
                textAlign: 'center'
              }}>
                {absentCount}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }, [events]);

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Đang tải lịch làm việc...</div>
        </div>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <Empty 
          description="Chưa có lịch làm việc nào"
          style={{ padding: '60px 0' }}
        />
      </Card>
    );
  }

  return (
    <Card className={`doctor-advanced-calendar ${className}`}>
      <div style={{ height }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          views={views}
          view={currentView}
          date={currentDate}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          messages={messages}
          formats={formats}
          style={{ height: '100%' }}
          components={{
            dateCellWrapper: DateCellWrapper,
          }}
          dayLayoutAlgorithm="no-overlap"
          showMultiDayTimes
          min={new Date(0, 0, 0, 7, 0, 0)} // Start at 7:00 AM
          max={new Date(0, 0, 0, 18, 0, 0)} // End at 6:00 PM
          step={60} // 1 hour steps
          timeslots={1}
          popup
          popupOffset={{ x: 30, y: 20 }}
        />
      </div>
    </Card>
  );
};

export default DoctorAdvancedCalendar; 