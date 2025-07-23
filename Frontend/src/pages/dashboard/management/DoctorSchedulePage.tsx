import {
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    MinusCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    TableOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Button,
    Calendar,
    Card,
    Col,
    Empty,
    Form,
    message,
    Modal,
    Popconfirm,
    Radio,
    Row,
    Select,
    Space,
    Spin,
    Statistic,
    Switch,
    Table,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import SimpleMonthPicker from '../../../components/ui/SimpleMonthPicker';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/vi';
import weekday from 'dayjs/plugin/weekday';
import React, { useEffect, useMemo, useState } from 'react';

// Setup dayjs for Vietnam timezone
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekday);
dayjs.locale('vi');
dayjs.tz.setDefault('Asia/Ho_Chi_Minh');
import doctorScheduleApi, {
    type CreateScheduleByDatesRequest,
    type CreateScheduleByMonthRequest,
    type IDoctorSchedule
} from '../../../api/endpoints/doctorSchedule';
import AdvancedCalendar from '../../../components/ui/AdvancedCalendar';
import AdvancedSearchFilter from '../../../components/ui/AdvancedSearchFilter';
import { useAdvancedSearch } from '../../../hooks/useAdvancedSearch';
import { useVirtualizedCalendar } from '../../../hooks/useVirtualizedCalendar';
import type { CalendarEvent, CalendarView, DoctorScheduleEvent } from '../../../types/calendar';
import {
    convertSchedulesToCalendarEvents,
    formatEventTime,
    getScheduleStats
} from '../../../utils/calendarUtils';

const { Title, Text } = Typography;
const { Option } = Select;

// Define proper interfaces for form values
interface FormValues {
  doctorId: string;
  timeSlots?: string[];
  month?: number;
  year?: number;
  excludeWeekends?: boolean;
}

// 8 time slots mặc định theo yêu cầu
const DEFAULT_TIME_SLOTS = [
  '07:00-08:00',
  '08:00-09:00', 
  '09:00-10:00',
  '10:00-11:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00'
];

// Status Badge Component với Medical Design System
const StatusBadge: React.FC<{ 
  status: 'Free' | 'Booked' | 'Absent';
  count: number;
  size?: 'small' | 'default';
}> = ({ status, count, size = 'default' }) => {
  const statusConfig = {
    Free: {
      color: '#52c41a', // Success green
      bgColor: '#f6ffed',
      borderColor: '#b7eb8f',
      icon: <CheckCircleOutlined />,
      label: 'Trống'
    },
    Booked: {
      color: '#1890ff', // Primary blue
      bgColor: '#e6f7ff',
      borderColor: '#91d5ff',
      icon: <UserOutlined />,
      label: 'Đã đặt'
    },
    Absent: {
      color: '#fa8c16', // Warning orange
      bgColor: '#fff7e6',
      borderColor: '#ffd591',
      icon: <MinusCircleOutlined />,
      label: 'Vắng mặt'
    }
  };

  const config = statusConfig[status];
  const isSmall = size === 'small';

  return (
    <Tooltip title={`${config.label}: ${count} khung giờ`}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: isSmall ? '4px' : '6px',
          padding: isSmall ? '2px 8px' : '4px 12px',
          backgroundColor: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          borderRadius: '6px',
          fontSize: isSmall ? '12px' : '14px',
          fontWeight: 500,
          color: config.color,
          cursor: 'default',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: isSmall ? '12px' : '14px' }}>
          {config.icon}
        </span>
        <span>{count}</span>
      </div>
    </Tooltip>
  );
};

type CreateMode = 'dates' | 'month';

interface ScheduleViewData {
  key: string;
  doctorName: string;
  doctorId: string;
  specialization: string;
  workDate: string; // Ngày làm việc cụ thể
  dayOfWeek: string; // Thứ trong tuần
  totalSlots: number;
  freeSlots: number; // Trạng thái "Free"
  bookedSlots: number; // Trạng thái "Booked"
  absentSlots: number; // Trạng thái "Absent"
  scheduleId: string;
  timeSlots: string[]; // Danh sách các slot thời gian
}

const DoctorSchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<IDoctorSchedule[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM'));
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('dates');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [form] = Form.useForm();

  // Custom Calendar Component for Date Selection
  // Calendar handlers for Ant Design Calendar
  const onCalendarSelect = (date: Dayjs) => {
    // Đảm bảo sử dụng timezone VN
    const vnDate = date.tz('Asia/Ho_Chi_Minh');
    const vnNow = dayjs().tz('Asia/Ho_Chi_Minh');
    
    if (vnDate.isBefore(vnNow, 'day')) {
      message.warning('Không thể chọn ngày trong quá khứ');
      return;
    }
    
    const dateStr = vnDate.format('YYYY-MM-DD');
    if (selectedDates.includes(dateStr)) {
      // Unselect date
      setSelectedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      // Select date - CHO PHÉP TẤT CẢ CÁC NGÀY TRONG TUẦN (kể cả T7, CN)
      setSelectedDates(prev => [...prev, dateStr].sort());
    }
  };

  const dateRender = (date: Dayjs) => {
    const vnDate = date.tz('Asia/Ho_Chi_Minh');
    const vnNow = dayjs().tz('Asia/Ho_Chi_Minh');
    const isSelected = selectedDates.includes(vnDate.format('YYYY-MM-DD'));
    const isPast = vnDate.isBefore(vnNow, 'day');
    const isToday = vnDate.isSame(vnNow, 'day');
    
    let backgroundColor = '';
    let textColor = '';
    let borderColor = '';
    
    if (isSelected) {
      backgroundColor = '#1890ff';
      textColor = 'white';
      borderColor = '#1890ff';
    } else if (isToday) {
      backgroundColor = '#e6f7ff';
      textColor = '#1890ff';
      borderColor = '#1890ff';
    } else if (isPast) {
      backgroundColor = '#f5f5f5';
      textColor = '#bfbfbf';
    } else {
      backgroundColor = 'white';
      textColor = '#262626';
    }
    
    return (
      <div
        style={{
          backgroundColor,
          color: textColor,
          border: borderColor ? `1px solid ${borderColor}` : '1px solid transparent',
          borderRadius: '4px',
          width: '100%',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isPast ? 'not-allowed' : 'pointer',
          fontWeight: isToday ? 'bold' : 'normal',
          transition: 'all 0.2s ease'
        }}
      >
        {date.date()}
      </div>
    );
  };

  const CustomCalendar = () => {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Dayjs>(dayjs().tz('Asia/Ho_Chi_Minh'));
    
    const startOfMonth = currentCalendarMonth.startOf('month');
    const endOfMonth = currentCalendarMonth.endOf('month');
    
    // Calculate calendar grid - start from Sunday of the week containing first day
    const firstDay = startOfMonth;
    const firstDayOfWeek = firstDay.day(); // 0=Sunday, 1=Monday, etc.
    
    const startOfWeek = firstDay.subtract(firstDayOfWeek, 'day');
    const endOfWeek = endOfMonth.add(6 - endOfMonth.day(), 'day');
    
    const days = [];
    let day = startOfWeek;
    
    while (day.isBefore(endOfWeek) || day.isSame(endOfWeek, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }

    const goToPrevMonth = () => setCurrentCalendarMonth(prev => prev.subtract(1, 'month'));
    const goToNextMonth = () => setCurrentCalendarMonth(prev => prev.add(1, 'month'));

    const isToday = (date: Dayjs) => date.isSame(dayjs().tz('Asia/Ho_Chi_Minh'), 'day');
    const isSelected = (date: Dayjs) => selectedDates.includes(date.format('YYYY-MM-DD'));
    const isCurrentMonth = (date: Dayjs) => date.isSame(currentCalendarMonth, 'month');
    const isPast = (date: Dayjs) => date.isBefore(dayjs().tz('Asia/Ho_Chi_Minh'), 'day');

    const handleDateClick = (date: Dayjs) => {
      // Sử dụng timezone VN
      const vnDate = date.tz('Asia/Ho_Chi_Minh');
      const vnNow = dayjs().tz('Asia/Ho_Chi_Minh');
      
      if (vnDate.isBefore(vnNow, 'day')) {
        message.warning('Không thể chọn ngày trong quá khứ');
        return;
      }
      
      const dateStr = vnDate.format('YYYY-MM-DD');
      if (selectedDates.includes(dateStr)) {
        // Unselect date
        setSelectedDates(prev => prev.filter(d => d !== dateStr));
      } else {
        // Select date - CHO PHÉP TẤT CẢ CÁC NGÀY (kể cả thứ 7, chủ nhật)
        setSelectedDates(prev => [...prev, dateStr].sort());
      }
    };

    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] text-white p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <h3 className="text-xl font-bold">
                {monthNames[currentCalendarMonth.month()]} {currentCalendarMonth.year()}
              </h3>
              <p className="text-white/80 text-sm mt-1">Chọn ngày để tạo lịch làm việc</p>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map(dayName => (
              <div
                key={dayName}
                className="text-center text-sm font-semibold text-gray-600 py-2"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const isDisabled = isPast(day);
              const isCurrentMonthDay = isCurrentMonth(day);
              const isTodayDay = isToday(day);
              const isSelectedDay = isSelected(day);

              return (
                <button
                  key={day.format('YYYY-MM-DD')}
                  onClick={() => !isDisabled && handleDateClick(day)}
                  disabled={isDisabled}
                  className={`
                    aspect-square rounded-xl text-sm font-medium transition-all duration-200 relative
                    ${isSelectedDay 
                      ? 'bg-[#0C3C54] text-white shadow-lg scale-105' 
                      : isDisabled
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                        : isTodayDay
                        ? 'bg-blue-100 text-[#0C3C54] font-bold border-2 border-[#0C3C54]'
                        : isCurrentMonthDay
                        ? 'text-gray-700 hover:bg-[#0C3C54]/10 hover:text-[#0C3C54] hover:scale-105'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {day.date()}
                  {isTodayDay && !isSelectedDay && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Dates Display */}
          {selectedDates.length > 0 && (
            <div className="mt-6 p-4 bg-[#0C3C54]/5 rounded-xl border border-[#0C3C54]/20">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Đã chọn {selectedDates.length} ngày</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedDates.slice(0, 5).map(date => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#0C3C54] text-white text-xs rounded-md"
                    >
                      {dayjs(date).format('DD/MM')}
                      <button
                        onClick={() => setSelectedDates(prev => prev.filter(d => d !== date))}
                        className="hover:bg-white/20 rounded-full p-0.5"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {selectedDates.length > 5 && (
                    <span className="text-xs text-gray-500">+{selectedDates.length - 5} ngày khác</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Calendar view state
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('table');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');

  // Load schedules for selected month
  useEffect(() => {
    loadSchedules();
  }, [selectedMonth]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      
      // Sử dụng timezone VN để đảm bảo tính đúng tháng
      const vnMonth = dayjs(selectedMonth).tz('Asia/Ho_Chi_Minh');
      
      // Debug logs
      console.log('🔍 [Debug] Loading schedules for (VN timezone):', {
        month: vnMonth.month() + 1,
        year: vnMonth.year(),
        timezone: 'Asia/Ho_Chi_Minh'
      });
      
      // Lấy lịch theo tháng được chọn
      const data = await doctorScheduleApi.getSchedulesByMonth(
        vnMonth.month() + 1,
        vnMonth.year()
      );
      
      console.log('✅ [Debug] Schedules loaded successfully:', data);
      setSchedules(data);
      
      // Show success message nếu có data
      if (data.length > 0) {
        console.log(`✅ [Success] Loaded ${data.length} schedules for ${vnMonth.format('MM/YYYY')} (VN timezone)`);
      } else {
        console.log(`ℹ️ [Info] No schedules found for ${vnMonth.format('MM/YYYY')} (VN timezone)`);
        // Không hiển thị message để tránh spam user
      }
      
    } catch (error: unknown) {
      console.error('❌ [Debug] Lỗi tải lịch:', error);
      
      // Set empty schedules to prevent old data display
      setSchedules([]);
      
      // User-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('timeout')) {
          message.error({
            content: 'Mất kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.',
            duration: 5
          });
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          message.error({
            content: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            duration: 5
          });
        } else {
          message.error({
            content: error.message || 'Không thể tải dữ liệu lịch làm việc. Vui lòng thử lại.',
            duration: 5
          });
        }
      } else {
        message.error({
          content: 'Có lỗi không xác định xảy ra. Vui lòng thử lại sau.',
          duration: 5
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorsForCreate = () => {
    // Sử dụng allDoctors đã được load từ hook
    console.log('✅ [Debug] Using doctors from hook:', allDoctors.length);
    if (allDoctors.length === 0) {
      message.warning('Danh sách bác sĩ chưa được tải. Vui lòng đợi giây lát...');
      return;
    }
    setIsCreateModalVisible(true);
  };

  // Convert schedules to calendar events
  const calendarEvents = useMemo((): DoctorScheduleEvent[] => {
    const events = convertSchedulesToCalendarEvents(schedules);
    console.log('📊 Calendar events for UI:', events.length, events);
    return events;
  }, [schedules]);

  // Advanced search hook
  const {
    filteredSchedules,
    filteredEvents,
    searchDoctors,
    applyFilters,
    loading: searchLoading,
    totalResults,
    availableSpecializations,
    availableTimeSlots,
    allDoctors
  } = useAdvancedSearch({
    schedules,
    events: calendarEvents
  });

  // Virtualized calendar for performance optimization
  const {
    visibleEvents,
    updateViewRange,
    stats: virtualStats
  } = useVirtualizedCalendar({
    events: filteredEvents,
    maxEventsPerDay: 100, // Limit to 100 events per day for performance
    enableVirtualization: filteredEvents.length > 500 // Auto-enable for large datasets
  });

  // Debug calendar display condition
  React.useEffect(() => {
    console.log('🔍 [Debug] Calendar display check:', {
      'schedules.length': schedules.length,
      'visibleEvents.length': visibleEvents.length,
      'filteredEvents.length': filteredEvents.length,
      'calendarEvents.length': calendarEvents.length,
      'shouldShowCalendar': schedules.length > 0 || visibleEvents.length > 0
    });
  }, [schedules.length, visibleEvents.length, filteredEvents.length, calendarEvents.length]);

  // Calculate statistics from filtered data
  const scheduleStats = useMemo(() => {
    return getScheduleStats(filteredEvents);
  }, [filteredEvents]);

  const getTableData = (): ScheduleViewData[] => {
    const data: ScheduleViewData[] = [];
    
    filteredSchedules.forEach(schedule => {
      schedule.weekSchedule.forEach(weekSchedule => {
        const workDate = dayjs(weekSchedule.dayOfWeek);
        const freeSlots = weekSchedule.slots.filter(slot => slot.status === 'Free').length;
        const bookedSlots = weekSchedule.slots.filter(slot => slot.status === 'Booked').length;
        const absentSlots = weekSchedule.slots.filter(slot => slot.status === 'Absent').length;
        
        data.push({
          key: `${schedule._id}-${weekSchedule._id}`,
          doctorName: schedule.doctorId.userId.fullName,
          doctorId: schedule.doctorId._id,
          specialization: schedule.doctorId.specialization || 'Chưa xác định',
          workDate: workDate.format('DD/MM/YYYY'),
          dayOfWeek: workDate.format('dddd, DD/MM/YYYY'),
          totalSlots: weekSchedule.slots.length,
          freeSlots: freeSlots,
          bookedSlots: bookedSlots,
          absentSlots: absentSlots,
          scheduleId: schedule._id,
          timeSlots: weekSchedule.slots.map(slot => slot.slotTime)
        });
      });
    });

    return data.sort((a, b) => dayjs(a.workDate, 'DD/MM/YYYY').valueOf() - dayjs(b.workDate, 'DD/MM/YYYY').valueOf());
  };

  const handleCreateSchedule = async (values: FormValues) => {
    try {
      setLoading(true);
      
      const { doctorId } = values;

      if (createMode === 'dates') {
        // Tạo lịch theo ngày cụ thể - CHO PHÉP TẤT CẢ NGÀY TRONG TUẦN
        if (selectedDates.length === 0) {
          message.warning('⚠️ Vui lòng chọn ít nhất một ngày để tạo lịch làm việc!');
          setLoading(false);
          return;
        }

        // Đảm bảo tất cả ngày được chọn sử dụng timezone VN
        const vnDates = selectedDates.map(date => {
          return dayjs(date).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
        });

        const createData: CreateScheduleByDatesRequest = {
          doctorId,
          dates: vnDates,
          timeSlots: DEFAULT_TIME_SLOTS // Sử dụng 8 slot mặc định
        };

        await doctorScheduleApi.createScheduleByDates(createData);
        message.success(`🎉 Tạo lịch thành công cho ${selectedDates.length} ngày được chọn (bao gồm cả cuối tuần) với 8 khung giờ!`);
        
      } else {
        // Tạo lịch theo tháng - TẠO HẾT TẤT CẢ NGÀY TRONG THÁNG
        const { month, year } = values;
        
        // Sử dụng timezone VN để tính toán
        const vnNow = dayjs().tz('Asia/Ho_Chi_Minh');
        const selectedMonthVN = dayjs().tz('Asia/Ho_Chi_Minh').year(year!).month(month! - 1);
        
        const createData: CreateScheduleByMonthRequest = {
          doctorId,
          month: month!,
          year: year!,
          timeSlots: DEFAULT_TIME_SLOTS, // Sử dụng 8 slot mặc định
          excludeWeekends: false // KHÔNG loại bỏ cuối tuần - làm việc cả 7 ngày/tuần
        };

        await doctorScheduleApi.createScheduleByMonth(createData);
        
        const totalDays = selectedMonthVN.daysInMonth();
        message.success(`📅 Tạo lịch thành công cho toàn bộ tháng ${month}/${year} (${totalDays} ngày bao gồm cả cuối tuần) với 8 khung giờ mỗi ngày!`);
      }

      setIsCreateModalVisible(false);
      form.resetFields();
      setSelectedDates([]);
      await loadSchedules(); // Reload data
      
    } catch (error: unknown) {
      console.error('Lỗi tạo lịch:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo lịch làm việc';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calendar event handlers
  const handleSelectEvent = (event: CalendarEvent) => {
    const resource = event.resource;
    if (resource) {
      Modal.info({
        title: 'Chi tiết lịch hẹn',
        content: (
          <div style={{ marginTop: 16 }}>
            <p><strong>Bác sĩ:</strong> {resource.doctorName}</p>
            <p><strong>Chuyên khoa:</strong> {resource.specialization}</p>
            <p><strong>Thời gian:</strong> {formatEventTime(event)}</p>
            <p><strong>Ngày:</strong> {dayjs(event.start).format('dddd, DD/MM/YYYY')}</p>
            <p><strong>Trạng thái:</strong> 
              <Tag color={
                resource.status === 'Free' ? 'green' :
                resource.status === 'Booked' ? 'blue' : 'red'
              }>
                {resource.status === 'Free' ? 'Có thể đặt' : 
                 resource.status === 'Booked' ? 'Đã đặt lịch' : 'Không có mặt'}
              </Tag>
            </p>
            {resource.patientName && (
              <p><strong>Bệnh nhân:</strong> {resource.patientName}</p>
            )}
            {resource.appointmentId && (
              <p><strong>Mã lịch hẹn:</strong> {resource.appointmentId}</p>
            )}
          </div>
        ),
        width: 500
      });
    }
  };

  const handleCalendarNavigate = (date: Date, view: CalendarView) => {
    const newMonth = dayjs(date);
    if (!newMonth.isSame(dayjs(selectedMonth), 'month')) {
      setSelectedMonth(newMonth.format('YYYY-MM'));
    }
    setCalendarView(view);
    
    // Update virtualized calendar view range
    let start: Date, end: Date;
    if (view === 'month') {
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    } else if (view === 'week') {
      start = new Date(date);
      start.setDate(date.getDate() - date.getDay()); // Start of week
      end = new Date(start);
      end.setDate(start.getDate() + 6); // End of week
    } else if (view === 'day') {
      start = new Date(date);
      end = new Date(date);
    } else {
      // agenda view - show wider range
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
    
    updateViewRange(start, end);
  };

  const handleCalendarViewChange = (view: CalendarView) => {
    setCalendarView(view);
  };

  const handleDeleteSchedule = async (scheduleId: string, doctorId: string) => {
    try {
      await doctorScheduleApi.deleteDoctorScheduleWithDoctorId(doctorId, scheduleId);
      message.success('Xóa lịch làm việc thành công!');
      await loadSchedules(); // Reload data
    } catch (error: unknown) {
      console.error('Lỗi xóa lịch:', error);
      message.error('Không thể xóa lịch làm việc');
    }
  };



  const columns: ColumnsType<ScheduleViewData> = [
    {
      title: 'Bác sĩ',
      key: 'doctor',
      width: 200,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.doctorName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.specialization}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Ngày làm việc',
      key: 'workDate',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <div style={{ fontWeight: 'bold' }}>
            <CalendarOutlined /> {record.workDate}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(record.workDate, 'DD/MM/YYYY').format('dddd')}
          </div>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.workDate, 'DD/MM/YYYY').valueOf() - dayjs(b.workDate, 'DD/MM/YYYY').valueOf(),
    },
    {
      title: 'Khung giờ',
      key: 'timeSlots',
      width: 200,
      render: (_, record) => (
        <div>
          <ClockCircleOutlined /> {record.totalSlots} khung giờ
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
            {record.timeSlots.slice(0, 2).join(', ')}
            {record.timeSlots.length > 2 && '...'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái khung giờ',
      key: 'slotStatus',
      width: 280,
      align: 'center',
      render: (_, record) => (
        <Space size="small" wrap>
          <StatusBadge status="Free" count={record.freeSlots} size="small" />
          <StatusBadge status="Booked" count={record.bookedSlots} size="small" />
          <StatusBadge status="Absent" count={record.absentSlots} size="small" />
        </Space>
      ),
    },
    {
      title: 'Tổng quan',
      key: 'overview',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const { freeSlots, totalSlots } = record;
        if (freeSlots === totalSlots) {
          return (
            <Tooltip title="Tất cả khung giờ đều trống">
              <Tag color="success" icon={<CheckCircleOutlined />} title="Tất cả khung giờ đều trống">
                Hoàn toàn trống
              </Tag>
            </Tooltip>
          );
        } else if (freeSlots === 0) {
          return (
            <Tooltip title="Không còn khung giờ trống">
              <Tag color="error" icon={<ExclamationCircleOutlined />} title="Không còn khung giờ trống">
                Đã kín
              </Tag>
            </Tooltip>
          );
        } else {
          return (
            <Tooltip title={`${freeSlots}/${totalSlots} khung giờ còn trống`}>
              <Tag color="warning" icon={<MinusCircleOutlined />} title={`${freeSlots}/${totalSlots} khung giờ còn trống`}>
                Một phần
              </Tag>
            </Tooltip>
          );
        }
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              title="Chỉnh sửa"
              onClick={() => {
                // TODO: Implement edit functionality
                message.info('Chức năng chỉnh sửa sẽ được cập nhật');
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa lịch làm việc này?"
            onConfirm={() => handleDeleteSchedule(record.scheduleId, record.doctorId)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              title="Xóa"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tableData = getTableData();

  return (
    <div style={{ padding: '24px' }}>
      {/* Advanced Search & Filter */}
      <AdvancedSearchFilter
        onFilterChange={applyFilters}
        onDoctorSearch={async (searchTerm: string) => {
          const result = searchDoctors(searchTerm);
          return result instanceof Promise ? await result : [];
        }}
        availableTimeSlots={availableTimeSlots}
        availableSpecializations={availableSpecializations}
        allDoctors={allDoctors}
        loading={searchLoading}
        totalResults={totalResults}
        className="mb-4"
      />

      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý lịch làm việc bác sĩ
        </Title>
        <Text type="secondary">
          Xem và quản lý lịch làm việc của bác sĩ
        </Text>
      </div>

      {/* Performance Alert for Large Datasets */}
      {calendarEvents.length > 1000 && (
        <Card style={{ marginBottom: 16, borderColor: '#faad14' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}>⚡</div>
            <div>
              <div style={{ fontWeight: 600, color: '#faad14' }}>
                Dataset lớn được phát hiện ({calendarEvents.length.toLocaleString()} events)
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                Hệ thống đã tự động kích hoạt chế độ tối ưu performance. 
                Sử dụng <strong>bộ lọc</strong> để thu hẹp kết quả và tăng tốc độ xử lý.
              </div>
            </div>
          </div>
        </Card>
      )}



      {/* Controls */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Chọn tháng:</Text>
          </Col>
          <Col>
            <SimpleMonthPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              format="YYYY-MM"
              placeholder="Chọn tháng"
            />
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadSchedules}
              loading={loading}
            >
              Tải lại
            </Button>
          </Col>
          <Col flex={1}>
            <Space style={{ float: 'right' }}>
              <Text strong>Chế độ xem:</Text>
              <Switch
                unCheckedChildren={<CalendarOutlined />}
                checkedChildren={<TableOutlined />}
                checked={viewMode === 'table'}
                onChange={(checked) => setViewMode(checked ? 'table' : 'calendar')}
              />
              <Text>{viewMode === 'calendar' ? 'Lịch' : 'Bảng'}</Text>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedDates([]); // Clear any previous selections
                loadDoctorsForCreate();
              }}
              loading={loading}
            >
              Tạo lịch bác sĩ
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <div className="main-schedule-calendar" style={{ height: '700px' }}>
          {/* Performance Stats for Large Datasets */}
          {virtualStats.isVirtualized && (
            <div style={{ 
              marginBottom: '12px', 
              padding: '8px 12px', 
              background: '#f0f7ff', 
              borderRadius: '6px',
              fontSize: '12px',
              color: '#1890ff'
            }}>
              🚀 <strong>Performance Mode:</strong> Hiển thị {virtualStats.visibleEvents}/{virtualStats.totalEvents} events 
              (Tối ưu {virtualStats.performanceGain}%)
            </div>
          )}
          
          {/* Error State với Retry */}
          {schedules.length === 0 && !loading && (
            <Card style={{ height: '700px' }}>
              <div style={{ 
                height: '100%',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>
                        Không có dữ liệu lịch làm việc
                      </div>
                      <div style={{ fontSize: '14px', color: '#999', marginBottom: '16px' }}>
                        Tháng {dayjs(selectedMonth).format('MM/YYYY')} chưa có lịch làm việc nào được tạo.
                      </div>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={loadSchedules}
                          loading={loading}
                        >
                          Thử lại
                        </Button>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={loadDoctorsForCreate}
                        >
                          Tạo lịch mới
                        </Button>
                      </div>
                    </div>
                  }
                />
              </div>
            </Card>
          )}
          
          {/* Calendar Component */}
          {(schedules.length > 0 || visibleEvents.length > 0) && (
            <AdvancedCalendar
              key="doctor-schedule-main-calendar"
              events={visibleEvents}
              onSelectEvent={handleSelectEvent}
              onNavigate={(date, view) => {
                setSelectedMonth(dayjs(date).format('YYYY-MM'));
                handleCalendarNavigate(date, view);
              }}
              onView={handleCalendarViewChange}
              defaultView={calendarView}
              views={['month', 'week', 'day', 'agenda'] as CalendarView[]}
              loading={loading || searchLoading}
              height={700}
              currentDate={dayjs(selectedMonth).toDate()}
            />
          )}
        </div>
      ) : (
        /* Schedule Table */
        <Card title={`Lịch làm việc tháng ${dayjs(selectedMonth).format('MM/YYYY')} (${tableData.length} lịch)`}>
        {loading && !isCreateModalVisible ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Đang tải dữ liệu...</div>
          </div>
        ) : tableData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <div>Không có dữ liệu lịch làm việc</div>
                <div style={{ marginTop: '8px' }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={loadDoctorsForCreate}
                  >
                    Tạo lịch đầu tiên
                  </Button>
                </div>
              </div>
            }
          />
        ) : (
                      <Table
            columns={columns}
            dataSource={tableData}
            rowKey="key"
            loading={loading || searchLoading}
            pagination={{
              pageSize: tableData.length > 1000 ? 50 : 20, // Tăng page size cho dataset lớn
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} của ${total} lịch làm việc`,
              pageSizeOptions: ['20', '50', '100', '200'],
              size: 'small'
            }}
            scroll={{ x: 1200, y: 600 }} // Add vertical scroll for large datasets
            size={tableData.length > 500 ? 'small' : 'middle'} // Compact view for large data
          />
        )}
      </Card>
      )}

      {/* Create Schedule Modal */}
      <Modal
        title="Tạo lịch làm việc bác sĩ"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          form.resetFields();
          setSelectedDates([]);
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSchedule}
        >
          <Form.Item
            label="Chọn bác sĩ"
            name="doctorId"
            rules={[{ required: true, message: 'Vui lòng chọn bác sĩ!' }]}
          >
            <Select 
              placeholder="Chọn bác sĩ"
              showSearch
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
            >
              {allDoctors.map(doctor => (
                <Option key={doctor._id} value={doctor._id}>
                  BS. {doctor.userId.fullName} - {doctor.specialization || 'Chưa xác định'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Chế độ tạo lịch">
            <Radio.Group 
              value={createMode} 
              onChange={(e) => {
                setCreateMode(e.target.value);
                setSelectedDates([]);
              }}
            >
              <Radio value="dates">
                <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '8px' }}>
                  <span>Tạo theo ngày cụ thể</span>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Chọn từng ngày muốn tạo lịch</Text>
                </div>
              </Radio>
              <Radio value="month">
                <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '8px' }}>
                  <span>Tạo theo tháng</span>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Tự động tạo lịch cho toàn bộ tháng (bao gồm cả cuối tuần)</Text>
                </div>
              </Radio>
            </Radio.Group>
          </Form.Item>

          {createMode === 'dates' && (
            <Form.Item label="Chọn ngày làm việc">
              <div style={{ marginBottom: '12px' }}>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  💡 <strong>Hướng dẫn:</strong> Chọn những ngày bạn muốn tạo lịch làm việc. 
                  Có thể chọn <strong>tất cả các ngày trong tuần</strong>, bao gồm cả thứ 7 và chủ nhật. 
                  Hệ thống sử dụng múi giờ Việt Nam (GMT+7).
                </Text>
              </div>
              <CustomCalendar />
            </Form.Item>
          )}

          {createMode === 'month' && (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  📅 <strong>Thông tin:</strong> Sẽ tự động tạo lịch cho toàn bộ ngày trong tháng được chọn, 
                  bao gồm cả thứ 7 và chủ nhật với 8 khung giờ mặc định.
                </Text>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Tháng"
                    name="month"
                    rules={[{ required: true, message: 'Vui lòng chọn tháng!' }]}
                  >
                    <Select placeholder="Chọn tháng">
                      {Array.from({ length: 12 }, (_, i) => {
                        const currentVN = dayjs().tz('Asia/Ho_Chi_Minh');
                        const monthValue = i + 1;
                        const isCurrentYear = currentVN.year() === currentVN.year();
                        const isPastMonth = isCurrentYear && monthValue < currentVN.month() + 1;
                        
                        return (
                          <Option 
                            key={monthValue} 
                            value={monthValue}
                            disabled={isPastMonth}
                          >
                            Tháng {monthValue}
                            {isPastMonth && ' (Đã qua)'}
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Năm"
                    name="year"
                    rules={[{ required: true, message: 'Vui lòng chọn năm!' }]}
                  >
                    <Select placeholder="Chọn năm">
                      {Array.from({ length: 5 }, (_, i) => {
                        const currentVN = dayjs().tz('Asia/Ho_Chi_Minh');
                        const year = currentVN.year() + i;
                        return (
                          <Option key={year} value={year}>
                            {year}
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginBottom: '16px',
            backgroundColor: '#f6f8fa',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #d0d7de'
          }}>
            💡 <strong>Thông tin:</strong> Hệ thống sẽ tự động tạo 8 khung giờ mặc định (07:00-17:00) cho mỗi ngày. 
            Có thể tạo lịch cho tất cả các ngày trong tuần, bao gồm cả thứ 7 và chủ nhật.
            Múi giờ: Việt Nam (GMT+7).
          </div>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button 
                onClick={() => {
                  setIsCreateModalVisible(false);
                  setSelectedDates([]);
                  form.resetFields();
                }}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                disabled={createMode === 'dates' && selectedDates.length === 0}
              >
                {loading ? 'Đang tạo...' : 'Tạo lịch'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorSchedulePage; 