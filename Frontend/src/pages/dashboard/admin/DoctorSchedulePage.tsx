import React, { useState, useEffect } from 'react';
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
  Badge
} from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ReloadOutlined
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

const AdminDoctorSchedulePage: React.FC = () => {
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [schedules, setSchedules] = useState<IDoctorSchedule[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<IDoctor[]>([]);
  const [createMode, setCreateMode] = useState<CreateMode>('dates');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [form] = Form.useForm();

  // Load schedules for selected month
  useEffect(() => {
    loadSchedules();
  }, [selectedMonth]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      // Lấy lịch theo tháng được chọn
      const data = await doctorScheduleApi.getSchedulesByMonth(
        selectedMonth.month() + 1,
        selectedMonth.year()
      );
      setSchedules(data);
    } catch (error: any) {
      console.error('Lỗi tải lịch:', error);
      message.error('Không thể tải dữ liệu lịch làm việc');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorsForCreate = async () => {
    try {
      setLoading(true);
      const data = await doctorApi.getAll();
      setAvailableDoctors(data);
      setIsCreateModalVisible(true);
    } catch (error: any) {
      console.error('Lỗi tải danh sách bác sĩ:', error);
      message.error('Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const getTableData = (): ScheduleViewData[] => {
    const data: ScheduleViewData[] = [];
    
    schedules.forEach(schedule => {
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
    
    return (
      <div className="ant-picker-cell-inner">
        {current.date()}
      </div>
    );
  };

  const onCalendarSelect = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const isPast = date.isBefore(dayjs(), 'day');
    
    if (isPast) {
      message.warning('Không thể chọn ngày trong quá khứ');
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
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý lịch làm việc bác sĩ (Admin)
        </Title>
        <Text type="secondary">
          Xem và quản lý lịch làm việc của bác sĩ
        </Text>
      </div>

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
          <Col flex={1} />
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

      {/* Schedule Table */}
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
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Tổng cộng ${total} lịch làm việc`,
            }}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

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
        width={800}
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
            <>
              <Form.Item label="Chọn ngày làm việc">
                <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '16px' }}>
                  <Calendar
                    fullscreen={false}
                    onSelect={onCalendarSelect}
                    dateCellRender={dateRender}
                  />
                  {selectedDates.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <Text strong>Đã chọn {selectedDates.length} ngày:</Text>
                      <div style={{ marginTop: '8px' }}>
                        {selectedDates.map(date => (
                          <Tag 
                            key={date} 
                            closable 
                            onClose={() => setSelectedDates(prev => prev.filter(d => d !== date))}
                            style={{ marginBottom: '4px' }}
                          >
                            {dayjs(date).format('DD/MM/YYYY')}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Form.Item>
            </>
          )}

          {createMode === 'month' && (
            <>
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

              <Form.Item name="excludeWeekends" valuePropName="checked">
                <Radio.Group>
                  <Radio value={true}>Loại bỏ cuối tuần</Radio>
                  <Radio value={false}>Bao gồm cuối tuần</Radio>
                </Radio.Group>
              </Form.Item>
            </>
          )}

          <Form.Item label="Khung giờ làm việc (8 slot mặc định)" name="timeSlots">
            <Select
              mode="tags"
              placeholder="Chọn hoặc nhập khung giờ"
              style={{ width: '100%' }}
            >
              {DEFAULT_TIME_SLOTS.map(slot => (
                <Option key={slot} value={slot}>{slot}</Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
            ℹ️ Mỗi ngày sẽ được tạo 8 slot thời gian. Cuối tuần sẽ được loại bỏ tự động.
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

export default AdminDoctorSchedulePage; 