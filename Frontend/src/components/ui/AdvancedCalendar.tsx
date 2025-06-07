import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/vi'; // Vietnamese locale
import { Card, Spin, Empty, message } from 'antd';
import CalendarToolbar from './CalendarToolbar';
import type { 
  AdvancedCalendarProps, 
  CalendarEvent, 
  CalendarView,
  EventStyleGetter 
} from '../../types/calendar';
import '../../styles/calendar.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
  loading = false
}) => {
  const [currentView, setCurrentView] = useState<CalendarView>(defaultView);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Event style getter for color coding
  const eventStyleGetter: EventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource?.status || 'Free';
    
    let className = 'rbc-event ';
    switch (status) {
      case 'Free':
        className += 'event-free';
        break;
      case 'Booked':
        className += 'event-booked';
        break;
      case 'Absent':
        className += 'event-absent';
        break;
      default:
        className += 'event-pending';
    }

    return {
      className,
      style: {
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500'
      }
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    } else {
      // Default behavior - show event details
      const resource = event.resource;
      if (resource) {
        message.info({
          content: (
            <div>
              <div><strong>Bác sĩ:</strong> {resource.doctorName}</div>
              <div><strong>Chuyên khoa:</strong> {resource.specialization}</div>
              <div><strong>Thời gian:</strong> {resource.slotTime}</div>
              <div><strong>Trạng thái:</strong> {resource.status === 'Free' ? 'Có thể đặt' : 
                resource.status === 'Booked' ? 'Đã đặt' : 'Không có mặt'}</div>
              {resource.patientName && (
                <div><strong>Bệnh nhân:</strong> {resource.patientName}</div>
              )}
            </div>
          ),
          duration: 5
        });
      }
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

  // Custom toolbar handlers
  const handleToolbarNavigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(currentDate);
    
    switch (action) {
      case 'PREV':
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
      case 'NEXT':
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
      case 'TODAY':
        newDate = new Date();
        break;
    }
    
    setCurrentDate(newDate);
    if (onNavigate) {
      onNavigate(newDate, currentView);
    }
  }, [currentDate, currentView, onNavigate]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    if (onNavigate) {
      onNavigate(today, currentView);
    }
  }, [currentView, onNavigate]);

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
        const weekStart = moment(currentDate).startOf('week');
        const weekEnd = moment(currentDate).endOf('week');
        return `${weekStart.format('DD/MM')} - ${weekEnd.format('DD/MM/YYYY')}`;
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
      <Card className={`advanced-calendar ${className}`}>
        <div className="calendar-loading">
          <Spin size="large" tip="Đang tải lịch làm việc..." />
        </div>
      </Card>
    );
  }

  // Empty state
  if (!events || events.length === 0) {
    return (
      <Card className={`advanced-calendar ${className}`}>
        <CalendarToolbar
          onNavigate={handleToolbarNavigate}
          onView={handleViewChange}
          onToday={handleToday}
          label={toolbarLabel}
          view={currentView}
          views={views}
          date={currentDate}
        />
        <div style={{ height: typeof height === 'number' ? height - 120 : 'calc(100% - 120px)' }}>
          <Empty
            description="Không có lịch làm việc nào"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%'
            }}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`advanced-calendar ${className}`} bodyStyle={{ padding: 0 }}>
      {/* Custom Toolbar */}
      <CalendarToolbar
        onNavigate={handleToolbarNavigate}
        onView={handleViewChange}
        onToday={handleToday}
        label={toolbarLabel}
        view={currentView}
        views={views}
        date={currentDate}
      />

      {/* Main Calendar */}
      <div style={{ height: typeof height === 'number' ? height - 80 : 'calc(100% - 80px)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          resourceAccessor="resource"
          view={currentView}
          views={views}
          date={currentDate}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          popup
          eventPropGetter={eventStyleGetter}
          messages={messages}
          formats={formats}
          components={{
            toolbar: () => null, // Hide default toolbar since we use custom one
            dateCellWrapper: DateCellWrapper // Custom date cell with indicators
          }}
          step={30}
          timeslots={2}
          min={new Date(2024, 0, 1, 7, 0)} // 7:00 AM
          max={new Date(2024, 0, 1, 18, 0)} // 6:00 PM
          scrollToTime={new Date(2024, 0, 1, 8, 0)} // Scroll to 8:00 AM
          style={{ height: '100%' }}
        />
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>Trạng thái slot:</span>
            <div className="calendar-legend-item">
              <div className="calendar-legend-color legend-free"></div>
              <span>Có thể đặt lịch</span>
            </div>
            <div className="calendar-legend-item">
              <div className="calendar-legend-color legend-booked"></div>
              <span>Đã có lịch hẹn</span>
            </div>
            <div className="calendar-legend-item">
              <div className="calendar-legend-color legend-absent"></div>
              <span>Bác sĩ không có mặt</span>
            </div>
            <div className="calendar-legend-item">
              <div className="calendar-legend-color legend-pending"></div>
              <span>Chờ xác nhận</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>Chú thích tháng:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#52c41a', border: '1px solid white' }}></div>
              <span>Chấm xanh = Có slot trống</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1890ff', border: '1px solid white' }}></div>
              <span>Chấm xanh dương = Có slot đã đặt</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
              <div style={{ 
                backgroundColor: '#f0f0f0',
                color: '#666',
                fontSize: '10px',
                padding: '1px 3px',
                borderRadius: '2px',
                lineHeight: '1'
              }}>8</div>
              <span>Số = Tổng slot trong ngày</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AdvancedCalendar;
