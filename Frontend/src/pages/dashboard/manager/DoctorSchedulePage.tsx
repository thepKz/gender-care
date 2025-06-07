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
  Popconfirm
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
  type ITimeSlot 
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

interface ScheduleViewData {
  key: string;
  doctorName: string;
  doctorId: string;
  specialization: string;
  dayOfWeek: string;
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  scheduleId: string;
}

const DoctorSchedulePage: React.FC = () => {
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [schedules, setSchedules] = useState<IDoctorSchedule[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<IDoctor[]>([]);
  const [form] = Form.useForm();

  // Load schedules for selected month
  useEffect(() => {
    loadSchedules();
  }, [selectedMonth]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await doctorScheduleApi.getAll();
      setSchedules(data);
    } catch (error: any) {
      console.error('Lỗi tải lịch làm việc:', error);
      message.error('Không thể tải lịch làm việc');
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

  // Transform schedules data for table display
  const getTableData = (): ScheduleViewData[] => {
    const tableData: ScheduleViewData[] = [];

    schedules.forEach(schedule => {
      const doctor = schedule.doctorId;
      
      schedule.weekSchedule.forEach(weekDay => {
        // Filter by selected month
        const dayDate = dayjs(weekDay.dayOfWeek);
        if (!dayDate.isSame(selectedMonth, 'month')) {
          return;
        }

        const availableSlots = weekDay.slots.filter(slot => !slot.isBooked).length;
        const bookedSlots = weekDay.slots.filter(slot => slot.isBooked).length;

        tableData.push({
          key: `${schedule._id}_${weekDay._id}`,
          doctorName: doctor.userId.fullName,
          doctorId: doctor._id,
          specialization: doctor.specialization || 'Chưa xác định',
          dayOfWeek: dayDate.format('DD/MM/YYYY - dddd'),
          totalSlots: weekDay.slots.length,
          availableSlots,
          bookedSlots,
          scheduleId: schedule._id
        });
      });
    });

    return tableData.sort((a, b) => {
      // Sort by doctor name, then by date
      if (a.doctorName !== b.doctorName) {
        return a.doctorName.localeCompare(b.doctorName);
      }
      return a.dayOfWeek.localeCompare(b.dayOfWeek);
    });
  };

  const handleCreateSchedule = async (values: any) => {
    try {
      setLoading(true);
      
      const { doctorId, dateRange, timeSlots } = values;
      
      // Tạo lịch hàng loạt cho khoảng ngày được chọn
      const bulkData = {
        doctorId,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        timeSlots: timeSlots || DEFAULT_TIME_SLOTS,
        excludeWeekends: true // Loại bỏ cuối tuần
      };

      await doctorScheduleApi.createBulkSchedule(bulkData);
      
      message.success('Tạo lịch làm việc thành công!');
      setIsCreateModalVisible(false);
      form.resetFields();
      await loadSchedules(); // Reload data
      
    } catch (error: any) {
      console.error('Lỗi tạo lịch:', error);
      message.error(error.message || 'Không thể tạo lịch làm việc');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await doctorScheduleApi.deleteDoctorSchedule(scheduleId);
      message.success('Xóa lịch làm việc thành công!');
      await loadSchedules(); // Reload data
    } catch (error: any) {
      console.error('Lỗi xóa lịch:', error);
      message.error('Không thể xóa lịch làm việc');
    }
  };

  const columns: ColumnsType<ScheduleViewData> = [
    {
      title: 'Bác sĩ',
      key: 'doctor',
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
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      render: (dayOfWeek) => (
        <Space>
          <CalendarOutlined />
          <Text>{dayOfWeek}</Text>
        </Space>
      ),
    },
    {
      title: 'Tổng slot',
      dataIndex: 'totalSlots',
      key: 'totalSlots',
      align: 'center',
      render: (total) => <Tag color="blue">{total}</Tag>,
    },
    {
      title: 'Slot trống',
      dataIndex: 'availableSlots',
      key: 'availableSlots',
      align: 'center',
      render: (available) => <Tag color="green">{available}</Tag>,
    },
    {
      title: 'Đã đặt',
      dataIndex: 'bookedSlots',
      key: 'bookedSlots',
      align: 'center',
      render: (booked) => <Tag color="red">{booked}</Tag>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
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
            onConfirm={() => handleDeleteSchedule(record.scheduleId)}
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
          Quản lý lịch làm việc bác sĩ
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
      <Card title={`Lịch làm việc tháng ${selectedMonth.format('MM/YYYY')}`}>
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
                <Text type="secondary">Không có dữ liệu lịch làm việc</Text>
                <br />
                <Text type="secondary">Hãy tạo lịch mới cho bác sĩ</Text>
              </div>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={loadDoctorsForCreate}
            >
              Tạo lịch đầu tiên
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            loading={loading && !isCreateModalVisible}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Tổng cộng ${total} lịch làm việc`,
            }}
            scroll={{ x: 'max-content' }}
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
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSchedule}
          initialValues={{
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
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{doctor.userId.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {doctor.specialization || 'Chưa xác định'}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Khoảng thời gian"
            name="dateRange"
            rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian!' }]}
          >
            <RangePicker 
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
            />
          </Form.Item>

          <Form.Item
            label="Khung giờ làm việc (8 slot mặc định)"
            name="timeSlots"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Chọn hoặc nhập khung giờ"
              tokenSeparators={[',']}
            >
              {DEFAULT_TIME_SLOTS.map(slot => (
                <Option key={slot} value={slot}>
                  {slot}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
            <ClockCircleOutlined /> Mỗi ngày sẽ được tạo 8 slot thời gian. 
            Cuối tuần sẽ được loại bỏ tự động.
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