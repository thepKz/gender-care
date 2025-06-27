import { Card, Empty, message, Spin } from 'antd';
import moment from 'moment';
import 'moment/locale/vi'; // Vietnamese locale
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/calendar.css';
import type {
    CalendarEvent,
    CalendarView,
    EventStyleGetter
} from '../../types/calendar';
import CalendarToolbar from './CalendarToolbar';

// Setup localizer with Vietnamese
moment.locale('vi');
const localizer = momentLocalizer(moment);

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
  noEventsInRange: 'Không có lịch hẹn nào trong khoảng thời gian này.',
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

interface AdvancedCalendarProps {
  events?: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[] }) => void;
  onNavigate?: (date: Date, view: CalendarView) => void;
  onView?: (view: CalendarView) => void;
  defaultView?: CalendarView;
  views?: CalendarView[];
  className?: string;
  height?: number;
  loading?: boolean;
  currentDate?: Date;
}

const AdvancedCalendar: React.FC<AdvancedCalendarProps> = ({
  events = [],
  onSelectEvent,
  onSelectSlot,
  onNavigate,
  onView,
  defaultView = 'month',
  views = ['month', 'week', 'day', 'agenda'],
  className = '',
  height = 600,
  loading = false,
  currentDate: propCurrentDate
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(propCurrentDate || new Date());
  const [currentView, setCurrentView] = useState<CalendarView>(defaultView);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Debug events received
  useEffect(() => {
    console.log('📅 [AdvancedCalendar] Events received:', {
      eventsLength: events.length,
      eventsType: typeof events,
      isArray: Array.isArray(events),
      firstFewEvents: events.slice(0, 3),
      loading,
      className
    });
  }, [events, loading, className]);

  useEffect(() => {
    if (propCurrentDate && propCurrentDate.getTime() !== currentDate.getTime()) {
      setCurrentDate(propCurrentDate);
    }
  }, [propCurrentDate]);

  // Tự động theme dark/light
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mq.matches ? 'dark' : 'light');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Custom toolbar handlers - MOVED UP to avoid initialization errors
  const handleToolbarNavigate = useCallback((action: 'prev' | 'next' | 'today') => {
    let newDate = new Date(currentDate);
    
    switch (action) {
      case 'prev':
        if (currentView === 'month') {
          newDate = moment(currentDate).subtract(1, 'month').toDate();
        } else if (currentView === 'week') {
          newDate = moment(currentDate).subtract(1, 'week').toDate();
        } else if (currentView === 'day') {
          newDate = moment(currentDate).subtract(1, 'day').toDate();
        } else {
          newDate = moment(currentDate).subtract(1, 'month').toDate();
        }
        break;
      case 'next':
        if (currentView === 'month') {
          newDate = moment(currentDate).add(1, 'month').toDate();
        } else if (currentView === 'week') {
          newDate = moment(currentDate).add(1, 'week').toDate();
        } else if (currentView === 'day') {
          newDate = moment(currentDate).add(1, 'day').toDate();
        } else {
          newDate = moment(currentDate).add(1, 'month').toDate();
        }
        break;
      case 'today':
        newDate = new Date();
        break;
    }
    
    setCurrentDate(newDate);
    if (onNavigate) {
      onNavigate(newDate, currentView);
    }
  }, [currentDate, currentView, onNavigate]);

  // Handle view change
  const handleViewChange = useCallback((view: View) => {
    const newView = view as CalendarView;
    setCurrentView(newView);
    if (onView) {
      onView(newView);
    }
  }, [onView]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    if (onNavigate) {
      onNavigate(today, currentView);
    }
  }, [currentView, onNavigate]);

  // Handle slot selection (for creating new events)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    if (onSelectSlot) {
      onSelectSlot(slotInfo);
    }
  }, [onSelectSlot]);

  // Handle navigation for React Big Calendar (different signature)
  const handleNavigate = useCallback((date: Date, view: View) => {
    setCurrentDate(date);
    if (onNavigate) {
      onNavigate(date, view as CalendarView);
    }
  }, [onNavigate]);

  // Event style getter for color coding
  const eventStyleGetter: EventStyleGetter = useCallback((event: CalendarEvent) => {
    // Nếu event có nhiều bác sĩ, đổi màu hoặc icon
    const doctors = (event.resource as any)?.doctors || [];
    let className = 'rbc-event ' + (theme === 'dark' ? 'event-dark' : 'event-light');
    if (doctors.length > 1) className += ' event-multi-doctor';
    return {
      className,
      style: {
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: theme === 'dark' ? '#222' : '#fff',
        color: theme === 'dark' ? '#fff' : '#222',
        boxShadow: theme === 'dark' ? '0 1px 4px #0004' : '0 1px 4px #0001'
      }
    };
  }, [theme]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    } else {
      const doctors = (event.resource as any)?.doctors || [];
      message.info({
        content: (
          <div>
            <div><strong>Khung giờ:</strong> {event.title}</div>
            <div><strong>Bác sĩ:</strong> {doctors.map(d => d.name).join(', ')}</div>
            {doctors.map(d => (
              <div key={d.id} style={{fontSize:'12px',color:'#888'}}>{d.name} - {d.specialization}</div>
            ))}
          </div>
        ),
        duration: 5
      });
    }
  }, [onSelectEvent]);

  // Custom date cell wrapper for month view
  const DateCellWrapper = useCallback(({ children, value }: { children: React.ReactNode; value: Date }) => {
    // Find events for this date
    const dayEvents = events.filter(event => {
      const eventDate = moment(event.start).format('YYYY-MM-DD');
      const cellDate = moment(value).format('YYYY-MM-DD');
      return eventDate === cellDate;
    });

    // Count different types of slots
    const freeSlots = dayEvents.filter(e => e.resource?.status === 'Free').length;
    const bookedSlots = dayEvents.filter(e => e.resource?.status === 'Booked').length;
    const absentSlots = dayEvents.filter(e => e.resource?.status === 'Absent').length;
    const totalSlots = dayEvents.length;

    if (totalSlots === 0) {
      return <div className="rbc-date-cell">{children}</div>;
    }

    return (
      <div className="rbc-date-cell" style={{ position: 'relative' }}>
        {children}
        <div style={{ 
          position: 'absolute', 
          bottom: '2px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '2px',
          alignItems: 'center'
        }}>
          {/* Chấm màu cho từng loại lịch */}
          {freeSlots > 0 && (
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#52c41a', // Green for free
              border: '1px solid white'
            }} title={`${freeSlots} slot trống`} />
          )}
          {bookedSlots > 0 && (
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#1890ff', // Blue for booked
              border: '1px solid white'
            }} title={`${bookedSlots} slot đã đặt`} />
          )}
          {absentSlots > 0 && (
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#ff4d4f', // Red for absent
              border: '1px solid white'
            }} title={`${absentSlots} slot vắng mặt`} />
          )}
        </div>
        
        {/* Số lượng slot ở góc phải */}
        {totalSlots > 0 && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: '#f0f0f0',
            color: '#666',
            fontSize: '10px',
            padding: '1px 3px',
            borderRadius: '2px',
            lineHeight: '1'
          }}>
            {totalSlots}
          </div>
        )}
      </div>
    );
  }, [events]);

  // Generate toolbar label
  const toolbarLabel = useMemo(() => {
    switch (currentView) {
      case 'month':
        return moment(currentDate).format('MMMM YYYY');
      case 'week':
        return `${moment(currentDate).format('DD/MM')} - ${moment(currentDate).format('DD/MM/YYYY')}`;
      case 'day':
        return moment(currentDate).format('dddd, DD/MM/YYYY');
      case 'agenda':
        return moment(currentDate).format('MMMM YYYY');
      default:
        return moment(currentDate).format('MMMM YYYY');
    }
  }, [currentDate, currentView]);

  // Loading state
  if (loading) {
    return (
      <Card className={`advanced-calendar ${className} theme-${theme}`} style={{ height }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          flexDirection: 'column',
          gap: '16px' 
        }}>
          <Spin size="large" />
          <div style={{ color: '#666', fontSize: '14px' }}>Đang tải lịch làm việc...</div>
        </div>
      </Card>
    );
  }

  // Empty state when no events
  if (!events || events.length === 0) {
    return (
      <Card className={`advanced-calendar ${className} theme-${theme}`} style={{ height }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CalendarToolbar
            currentDate={currentDate}
            currentView={currentView}
            views={views}
            onNavigate={handleToolbarNavigate}
            onViewChange={handleViewChange}
            onToday={handleToday}
          />
          <div style={{ 
            flex: 1,
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#fafafa',
            border: '1px solid #e5e7eb',
            borderRadius: '0 0 12px 12px'
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 500, color: '#666', marginBottom: '8px' }}>
                    Không có lịch làm việc
                  </div>
                  <div style={{ fontSize: '14px', color: '#999' }}>
                    Tháng này chưa có lịch làm việc nào được tạo
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </Card>
    );
  }

  // Main calendar render với error boundary
  try {
    return (
      <Card className={`advanced-calendar ${className} theme-${theme}`} style={{ height }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CalendarToolbar
            currentDate={currentDate}
            currentView={currentView}
            views={views}
            onNavigate={handleToolbarNavigate}
            onViewChange={handleViewChange}
            onToday={handleToday}
          />
          
          <div style={{ flex: 1, minHeight: 0 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              view={currentView}
              date={currentDate}
              views={views}
              eventPropGetter={eventStyleGetter}
              messages={messages}
              formats={formats}
              components={{
                dateCellWrapper: DateCellWrapper,
                toolbar: () => null, // Hide default toolbar since we use custom one
              }}
              min={new Date(1970, 1, 1, 7, 0, 0)}
              max={new Date(1970, 1, 1, 20, 0, 0)}
              style={{ 
                height: '100%',
                backgroundColor: '#ffffff'
              }}
              dayPropGetter={(date: Date) => ({
                style: {
                  backgroundColor: moment(date).isSame(moment(), 'day') ? '#e3f2fd' : '#ffffff'
                }
              })}
            />
          </div>
        </div>
      </Card>
    );
  } catch (error) {
    console.error('❌ [Calendar] Error rendering calendar:', error);
    
    // Fallback UI khi calendar crash
    return (
      <Card className={`advanced-calendar ${className} theme-${theme}`} style={{ height }}>
        <div style={{ 
          height: '100%',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flexDirection: 'column',
          gap: '16px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>
            Lỗi hiển thị lịch
          </div>
          <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
            Có lỗi xảy ra khi hiển thị lịch làm việc. Vui lòng thử lại hoặc liên hệ hỗ trợ kỹ thuật.
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </Card>
    );
  }
};

export default AdvancedCalendar;
