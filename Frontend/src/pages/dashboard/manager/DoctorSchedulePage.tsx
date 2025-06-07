import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Select, 
  DatePicker, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Modal, 
  message,
  Typography,
  Row,
  Col,
  Form,
  Empty,
  Spin,
  Tooltip,
  Popconfirm,
  Radio,
  Calendar,
  Badge,
  Statistic,
  Switch
} from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ReloadOutlined,
  TableOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import doctorApi, { type IDoctor } from '../../../api/endpoints/doctor';
import doctorScheduleApi, { 
  type IDoctorSchedule, 
  type IWeekScheduleObject,
  type ITimeSlot,
  type CreateScheduleByDatesRequest,
  type CreateScheduleByMonthRequest
} from '../../../api/endpoints/doctorSchedule';
import AdvancedCalendar from '../../../components/ui/AdvancedCalendar';
import AdvancedSearchFilter from '../../../components/ui/AdvancedSearchFilter';
import { useAdvancedSearch } from '../../../hooks/useAdvancedSearch';
import { useVirtualizedCalendar } from '../../../hooks/useVirtualizedCalendar';
import type { CalendarEvent, CalendarView, DoctorScheduleEvent } from '../../../types/calendar';
import type { SearchFilterOptions } from '../../../components/ui/AdvancedSearchFilter';
import { 
  convertSchedulesToCalendarEvents, 
  getScheduleStats,
  formatEventTime 
} from '../../../utils/calendarUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

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

type CreateMode = 'dates' | 'month';

interface ScheduleViewData {
  key: string;
  doctorName: string;
  doctorId: string;
  specialization: string;
  workDate: string; // Ngày làm việc cụ thể
  dayOfWeek: string; // Thứ trong tuần
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  unavailableSlots: number;
  scheduleId: string;
  timeSlots: string[]; // Danh sách các slot thời gian
}

const DoctorSchedulePage: React.FC = () => {
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [schedules, setSchedules] = useState<IDoctorSchedule[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<IDoctor[]>([]);
  const [createMode, setCreateMode] = useState<CreateMode>('dates');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [form] = Form.useForm();
  
  // Calendar view state
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');

  // Load schedules for selected month
  useEffect(() => {
    loadSchedules();
  }, [selectedMonth]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      
      // Debug logs
      console.log('🔍 [Debug] Loading schedules for:', {
        month: selectedMonth.month() + 1,
        year: selectedMonth.year()
      });
      
      // Lấy lịch theo tháng được chọn
      const data = await doctorScheduleApi.getSchedulesByMonth(
        selectedMonth.month() + 1,
        selectedMonth.year()
      );
      
      console.log('✅ [Debug] Schedules loaded successfully:', data);
      setSchedules(data);
    } catch (error: any) {
      console.error('❌ [Debug] Lỗi tải lịch:', error);
      console.error('❌ [Debug] Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      message.error('Không thể tải dữ liệu lịch làm việc');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorsForCreate = async () => {
    try {
      setLoading(true);
      
      // Debug logs
      console.log('🔍 [Debug] Loading doctors list...');
      
      const data = await doctorApi.getAll();
      
      console.log('✅ [Debug] Doctors loaded successfully:', data);
      setAvailableDoctors(data);
      setIsCreateModalVisible(true);
    } catch (error: any) {
      console.error('❌ [Debug] Lỗi tải danh sách bác sĩ:', error);
      console.error('❌ [Debug] Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      message.error('Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
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
    availableTimeSlots
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
        const unavailableSlots = weekSchedule.slots.filter(slot => slot.status === 'Absent').length;
        
        data.push({
          key: `${schedule._id}-${weekSchedule._id}`,
          doctorName: schedule.doctorId.userId.fullName,
          doctorId: schedule.doctorId._id,
          specialization: schedule.doctorId.specialization || 'Chưa xác định',
          workDate: workDate.format('DD/MM/YYYY'),
          dayOfWeek: workDate.format('dddd, DD/MM/YYYY'),
          totalSlots: weekSchedule.slots.length,
          availableSlots: freeSlots,
          bookedSlots: bookedSlots,
          unavailableSlots: unavailableSlots,
          scheduleId: schedule._id,
          timeSlots: weekSchedule.slots.map(slot => slot.slotTime)
        });
      });
    });

    return data.sort((a, b) => dayjs(a.workDate, 'DD/MM/YYYY').valueOf() - dayjs(b.workDate, 'DD/MM/YYYY').valueOf());
  };

  const handleCreateSchedule = async (values: any) => {
    try {
      setLoading(true);
      
      const { doctorId, timeSlots } = values;
      const selectedTimeSlots = timeSlots || DEFAULT_TIME_SLOTS;

      if (createMode === 'dates') {
        // Tạo lịch theo ngày cụ thể
        if (selectedDates.length === 0) {
          message.error('Vui lòng chọn ít nhất một ngày!');
          return;
        }

        const createData: CreateScheduleByDatesRequest = {
          doctorId,
          dates: selectedDates,
          timeSlots: selectedTimeSlots
        };

        await doctorScheduleApi.createScheduleByDates(createData);
        message.success(`Tạo lịch thành công cho ${selectedDates.length} ngày!`);
        
      } else {
        // Tạo lịch theo tháng
        const { month, year } = values;
        
        const createData: CreateScheduleByMonthRequest = {
          doctorId,
          month,
          year,
          timeSlots: selectedTimeSlots,
          excludeWeekends: values.excludeWeekends !== false // default true
        };

        await doctorScheduleApi.createScheduleByMonth(createData);
        message.success(`Tạo lịch thành công cho tháng ${month}/${year}!`);
      }

      setIsCreateModalVisible(false);
      form.resetFields();
      setSelectedDates([]);
      await loadSchedules(); // Reload data
      
    } catch (error: any) {
      console.error('Lỗi tạo lịch:', error);
      message.error(error.message || 'Không thể tạo lịch làm việc');
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
    if (!newMonth.isSame(selectedMonth, 'month')) {
      setSelectedMonth(newMonth);
    }
  };

  const handleCalendarViewChange = (view: CalendarView) => {
    setCalendarView(view);
  };

  const handleDeleteSchedule = async (scheduleId: string, doctorId: string) => {
    try {
      await doctorScheduleApi.deleteDoctorScheduleWithDoctorId(doctorId, scheduleId);
      message.success('Xóa lịch làm việc thành công!');
      await loadSchedules(); // Reload data
    } catch (error: any) {
      console.error('Lỗi xóa lịch:', error);
      message.error('Không thể xóa lịch làm việc');
    }
  };

  // Calendar date cell render for date selection
  const dateRender = (current: Dayjs) => {
    const dateStr = current.format('YYYY-MM-DD');
    const isSelected = selectedDates.includes(dateStr);
    const isToday = current.isSame(dayjs(), 'day');
    const isPast = current.isBefore(dayjs(), 'day');
    const dayOfWeek = current.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Thứ 7 hoặc Chủ nhật
    
    if (isSelected) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: '#1890ff', color: 'white', borderRadius: '4px' }}>
          {current.date()}
        </div>
      );
    }
    
    if (isPast) {
      return (
        <div className="ant-picker-cell-inner" style={{ color: '#d9d9d9' }}>
          {current.date()}
        </div>
      );
    }
    
    if (isWeekend) {
      return (
        <div className="ant-picker-cell-inner" style={{ 
          color: '#ff4d4f', 
          backgroundColor: '#fff2f0',
          borderRadius: '4px',
          cursor: 'not-allowed'
        }}>
          {current.date()}
        </div>
      );
    }
    
    return (
      <div className="ant-picker-cell-inner" style={{ cursor: 'pointer' }}>
        {current.date()}
      </div>
    );
  };

  const onCalendarSelect = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const isPast = date.isBefore(dayjs(), 'day');
    const dayOfWeek = date.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isPast) {
      message.warning('Không thể chọn ngày trong quá khứ');
      return;
    }
    
    if (isWeekend) {
      const dayName = dayOfWeek === 0 ? 'Chủ nhật' : 'Thứ 7';
      message.warning(`Không thể tạo lịch vào ${dayName}. Chỉ cho phép tạo lịch từ thứ 2 đến thứ 6.`);
      return;
    }
    
    if (selectedDates.includes(dateStr)) {
      // Unselect date
      setSelectedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      // Select date
      setSelectedDates(prev => [...prev, dateStr].sort());
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
      title: 'Trống',
      dataIndex: 'availableSlots',
      key: 'availableSlots',
      width: 80,
      align: 'center',
      render: (available) => <Tag color="green">{available}</Tag>,
      sorter: (a, b) => a.availableSlots - b.availableSlots,
    },
    {
      title: 'Đã đặt',
      dataIndex: 'bookedSlots',
      key: 'bookedSlots',
      width: 80,
      align: 'center',
      render: (booked) => <Tag color="red">{booked}</Tag>,
      sorter: (a, b) => a.bookedSlots - b.bookedSlots,
    },
    {
      title: 'Không khả dụng',
      dataIndex: 'unavailableSlots',
      key: 'unavailableSlots',
      width: 100,
      align: 'center',
      render: (unavailable) => <Tag color="orange">{unavailable}</Tag>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const { availableSlots, totalSlots } = record;
        if (availableSlots === totalSlots) {
          return <Tag color="green">Sẵn sàng</Tag>;
        } else if (availableSlots === 0) {
          return <Tag color="red">Hết slot</Tag>;
        } else {
          return <Tag color="orange">Một phần</Tag>;
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
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
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
        onDoctorSearch={searchDoctors}
        availableTimeSlots={availableTimeSlots}
        availableSpecializations={availableSpecializations}
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

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng khung giờ"
              value={scheduleStats.total}
              prefix={<ClockCircleOutlined />}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Có thể đặt"
              value={scheduleStats.free}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CalendarOutlined />}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Đã đặt"
              value={scheduleStats.booked}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tỷ lệ sử dụng"
              value={scheduleStats.utilization}
              suffix="%"
              valueStyle={{ color: scheduleStats.utilization > 75 ? '#52c41a' : '#faad14' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Chọn tháng:</Text>
          </Col>
          <Col>
            <DatePicker.MonthPicker
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date || dayjs())}
              format="MM/YYYY"
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
                checkedChildren={<CalendarOutlined />}
                unCheckedChildren={<TableOutlined />}
                checked={viewMode === 'calendar'}
                onChange={(checked) => setViewMode(checked ? 'calendar' : 'table')}
              />
              <Text>{viewMode === 'calendar' ? 'Lịch' : 'Bảng'}</Text>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={loadDoctorsForCreate}
              loading={loading}
            >
              Tạo lịch bác sĩ
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <div style={{ height: '700px' }}>
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
          
          <AdvancedCalendar
            events={visibleEvents}
            onSelectEvent={handleSelectEvent}
            onNavigate={(date, view) => {
              handleCalendarNavigate(date, view);
              // Update virtualization range based on view
              const start = new Date(date);
              const end = new Date(date);
              
              if (view === 'month') {
                start.setDate(1);
                end.setMonth(end.getMonth() + 1, 0);
              } else if (view === 'week') {
                start.setDate(start.getDate() - start.getDay());
                end.setDate(end.getDate() + (6 - end.getDay()));
              } else {
                end.setDate(end.getDate() + 1);
              }
              
              updateViewRange(start, end);
            }}
            onView={handleCalendarViewChange}
            defaultView="month"
            views={['month', 'week', 'day', 'agenda']}
            loading={loading || searchLoading}
            height={700}
          />
        </div>
      ) : (
        /* Schedule Table */
        <Card title={`Lịch làm việc tháng ${selectedMonth.format('MM/YYYY')} (${tableData.length} lịch)`}>
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
          initialValues={{
            excludeWeekends: true,
            timeSlots: DEFAULT_TIME_SLOTS
          }}
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
              {availableDoctors.map(doctor => (
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
              <Radio value="dates">Tạo theo ngày cụ thể</Radio>
              <Radio value="month">Tạo theo tháng</Radio>
            </Radio.Group>
          </Form.Item>

          {createMode === 'dates' && (
            <Form.Item label="Chọn ngày làm việc">
              <div style={{ marginBottom: '12px' }}>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  💡 <strong>Lưu ý:</strong> Chỉ có thể tạo lịch từ <strong>thứ 2 đến thứ 6</strong>. 
                  Các ngày cuối tuần (thứ 7, chủ nhật) sẽ được đánh dấu màu đỏ và không thể chọn.
                </Text>
              </div>
              <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '8px' }}>
                <div style={{ 
                  maxHeight: '220px', 
                  overflowY: 'auto'
                }}>
                  <Calendar
                    fullscreen={false}
                    onSelect={onCalendarSelect}
                    dateCellRender={dateRender}
                  />
                </div>
                {selectedDates.length > 0 && (
                  <div style={{ 
                    marginTop: '8px', 
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: '8px',
                    maxHeight: '50px',
                    overflowY: 'auto'
                  }}>
                    <Text strong style={{ fontSize: '12px' }}>Đã chọn {selectedDates.length} ngày:</Text>
                    <div style={{ marginTop: '4px' }}>
                      {selectedDates.map(date => (
                        <Tag 
                          key={date} 
                          closable 
                          onClose={() => setSelectedDates(prev => prev.filter(d => d !== date))}
                          style={{ marginBottom: '2px', marginRight: '4px', fontSize: '11px' }}
                          color="blue"
                        >
                          {dayjs(date).format('DD/MM')}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Calendar Legend */}
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px', 
                  backgroundColor: '#fafafa', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <Text strong style={{ fontSize: '12px' }}>Chú thích:</Text>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#1890ff', 
                        borderRadius: '2px' 
                      }}></div>
                      <Text style={{ fontSize: '12px' }}>Đã chọn</Text>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#fff2f0',
                        border: '1px solid #ff4d4f', 
                        borderRadius: '2px' 
                      }}></div>
                      <Text style={{ fontSize: '12px', color: '#ff4d4f' }}>Cuối tuần (không thể chọn)</Text>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #d9d9d9', 
                        borderRadius: '2px' 
                      }}></div>
                      <Text style={{ fontSize: '12px', color: '#999' }}>Quá khứ (không thể chọn)</Text>
                    </span>
                  </div>
                </div>
              </div>
            </Form.Item>
          )}

          {createMode === 'month' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Tháng"
                  name="month"
                  rules={[{ required: true, message: 'Vui lòng chọn tháng!' }]}
                >
                  <Select placeholder="Chọn tháng">
                    {Array.from({ length: 12 }, (_, i) => (
                      <Option key={i + 1} value={i + 1}>
                        Tháng {i + 1}
                      </Option>
                    ))}
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
                      const year = dayjs().year() + i;
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
          )}

          <Form.Item label="Khung giờ làm việc" name="timeSlots">
            <Select
              mode="tags"
              placeholder="Sử dụng 8 slot mặc định hoặc chỉnh sửa"
              style={{ width: '100%' }}
            >
              {DEFAULT_TIME_SLOTS.map(slot => (
                <Option key={slot} value={slot}>{slot}</Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginBottom: '16px',
            backgroundColor: '#f6f8fa',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #d0d7de'
          }}>
            💡 <strong>Lưu ý:</strong> Mỗi ngày sẽ được tạo 8 slot thời gian. Cuối tuần (T7, CN) sẽ được loại bỏ tự động.
          </div>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsCreateModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo lịch
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorSchedulePage; 