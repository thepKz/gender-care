import {
    BellOutlined,
    BookOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    PhoneOutlined,
    MessageOutlined,
    VideoCameraOutlined,
    EditOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import {
    Alert,
    Avatar,
    Button,
    Card,
    Col,
    DatePicker,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Timeline,
    Tabs,
    Modal,
    Input,
    notification,
    Tooltip,
    Badge,
    Typography
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import { appointmentApi, consultationApi } from '../../../api';
import { useAuth } from '../../../hooks/useAuth';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Text } = Typography;

// Define types locally since we removed doctorDashboard.ts
interface DoctorAppointment {
  _id: string;
  profileId: {
    _id: string;
    fullName: string;
    gender: string;
    phone: string;
    year: number;
  };
  serviceId?: {
    _id: string;
    serviceName: string;
    price: number;
    serviceType: string;
  };
  packageId?: {
    _id: string;
    name: string;
    price: number;
  };
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test' | 'other';
  typeLocation: 'clinic' | 'home' | 'online';
  status: 'pending' | 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
  description?: string;
  notes?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

interface DoctorQA {
  _id: string;
  fullName: string;
  phone: string;
  question: string;
  notes?: string;
  status: 'pending_payment' | 'paid' | 'doctor_confirmed' | 'scheduled' | 'consulting' | 'completed' | 'cancelled';
  doctorId?: string;
  scheduledSlotId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  doctorResponse?: string;
  doctorNotes?: string;
  meetingInfo?: {
    meetingId: string;
    meetingUrl: string;
    password?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  consultations: {
    total: number;
    pending: number;
    assigned: number;
    confirmed: number;
    inProgress: number;
    completed: number;
  };
  totalRevenue: number;
}

const DoctorMySchedulePage: React.FC = () => {
  // Sử dụng useAuth để lấy thông tin user hiện tại
  const { user, isAuthenticated } = useAuth();
  
  // States
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [consultations, setConsultations] = useState<DoctorQA[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'confirm' | 'reject' | 'complete' | 'start'>('confirm');
  const [selectedItem, setSelectedItem] = useState<DoctorAppointment | DoctorQA | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  // Load data
  const loadData = async () => {
    // Kiểm tra authentication
    if (!isAuthenticated || !user) {
      notification.error({
        message: 'Lỗi xác thực',
        description: 'Bạn cần đăng nhập để xem lịch làm việc.'
      });
      return;
    }

    // Kiểm tra role doctor
    if (user.role !== 'doctor') {
      notification.error({
        message: 'Không có quyền truy cập',
        description: 'Chỉ bác sĩ mới có thể xem trang này.'
      });
      return;
    }

    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: 1000, // Lấy nhiều hơn để hiển thị tất cả
        ...(statusFilter !== 'all' && { status: statusFilter })
        // Bỏ startDate và endDate để lấy tất cả data
      };

      // Call both APIs using new methods that don't require doctorId
      const [appointmentsRes, consultationsRes] = await Promise.all([
        appointmentApi.getMyAppointments(params),
        consultationApi.getMyConsultations(params)
      ]);

      // Parse response data - cả 2 APIs đều có format: { success: true, data: { appointments/consultations, pagination } }
      let appointments: DoctorAppointment[] = appointmentsRes?.data?.appointments || [];
      let consultations: DoctorQA[] = consultationsRes?.data?.consultations || [];

      console.log('📊 Raw appointmentsRes:', appointmentsRes);
      console.log('📊 Raw consultationsRes:', consultationsRes);
      console.log('📊 Parsed appointments:', appointments.length, appointments);
      console.log('📊 Parsed consultations:', consultations.length, consultations);

      // Filter theo ngày được chọn ở frontend (nếu có)
      const selectedDateStr = selectedDate.format('YYYY-MM-DD');
      
      // Chỉ filter nếu user đã chọn ngày cụ thể (không phải hôm nay)
      if (selectedDate && !selectedDate.isSame(dayjs(), 'day')) {
        appointments = appointments.filter(a => 
          dayjs(a.appointmentDate).format('YYYY-MM-DD') === selectedDateStr
        );
        
        consultations = consultations.filter(c => {
          // Filter theo scheduledDate nếu có, nếu không thì theo createdAt
          const dateToCheck = c.scheduledDate || c.createdAt;
          return dayjs(dateToCheck).format('YYYY-MM-DD') === selectedDateStr;
        });
      }

      setAppointments(appointments);
      setConsultations(consultations);

      // Calculate stats từ data đã được filter
      const stats: DashboardStats = {
        appointments: {
          total: appointments.length,
          pending: appointments.filter(a => a.status === 'pending').length,
          confirmed: appointments.filter(a => a.status === 'confirmed').length,
          completed: appointments.filter(a => a.status === 'completed').length,
          cancelled: appointments.filter(a => a.status === 'cancelled').length,
        },
        consultations: {
          total: consultations.length,
          pending: consultations.filter(c => c.status === 'pending').length,
          assigned: consultations.filter(c => c.status === 'assigned').length,
          confirmed: consultations.filter(c => c.status === 'confirmed').length,
          inProgress: consultations.filter(c => c.status === 'in_progress').length,
          completed: consultations.filter(c => c.status === 'completed').length,
        },
        totalRevenue: [...appointments, ...consultations].reduce((sum, item) => {
          const price = 'serviceId' in item && item.serviceId?.price || 
                       'packageId' in item && item.packageId?.price || 0;
          return sum + price;
        }, 0)
      };
      setStats(stats);
    } catch (error: any) {
      console.error('Error loading data:', error);
      
      // Xử lý lỗi cụ thể
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu lịch làm việc';
      
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, statusFilter]);

  // Action handlers
  const handleAction = (item: DoctorAppointment | DoctorQA, action: typeof actionType) => {
    setSelectedItem(item);
    setActionType(action);
    setIsActionModalVisible(true);
    setActionNotes('');
  };

  const executeAction = async () => {
    if (!selectedItem) return;

    setLoading(true);
    try {
      let result;
      const isAppointment = 'appointmentType' in selectedItem;

      switch (actionType) {
        case 'confirm':
          if (isAppointment) {
            result = await appointmentApi.updateAppointmentStatus(selectedItem._id, 'confirmed');
          } else {
            result = await consultationApi.doctorConfirmConsultation(selectedItem._id, 'confirm');
          }
          break;
        
        case 'reject':
          if (isAppointment) {
            result = await appointmentApi.updateAppointmentStatus(selectedItem._id, 'cancelled');
          } else {
            result = await consultationApi.doctorConfirmConsultation(selectedItem._id, 'reject');
          }
          break;
        
        case 'complete':
          if (isAppointment) {
            result = await appointmentApi.updateAppointmentStatus(selectedItem._id, 'completed');
          } else {
            result = await consultationApi.completeConsultationMeeting(selectedItem._id, {
              doctorNotes: actionNotes
            });
          }
          break;
        
        case 'start':
          if (!isAppointment) {
            result = await consultationApi.joinConsultationMeeting(selectedItem._id, {
              participantType: 'doctor'
            });
          }
          break;
      }

      notification.success({
        message: 'Thành công',
        description: 'Cập nhật trạng thái thành công!'
      });

      setIsActionModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Error executing action:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể thực hiện hành động. Vui lòng thử lại.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Status helpers
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending_payment: 'gold',
      paid: 'blue',
      doctor_confirmed: 'cyan',
      scheduled: 'purple',
      consulting: 'lime',
      completed: 'green',
      cancelled: 'red'
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      pending_payment: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      doctor_confirmed: 'Bác sĩ đã xác nhận',
      scheduled: 'Đã xếp lịch',
      consulting: 'Đang tư vấn',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return textMap[status] || status;
  };

  // Action buttons based on status
  const getActionButtons = (item: DoctorAppointment | DoctorQA) => {
    const isAppointment = 'appointmentType' in item;
    const buttons = [];

    if (item.status === 'pending' || item.status === 'assigned') {
      buttons.push(
        <Button
          key="confirm"
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleAction(item, 'confirm')}
        >
          Xác nhận
        </Button>
      );
      buttons.push(
        <Button
          key="reject"
          danger
          size="small"
          icon={<CloseCircleOutlined />}
          onClick={() => handleAction(item, 'reject')}
        >
          Từ chối
        </Button>
      );
    }

    if (item.status === 'confirmed' && !isAppointment) {
      buttons.push(
        <Button
          key="start"
          type="primary"
          size="small"
          icon={<VideoCameraOutlined />}
          onClick={() => handleAction(item, 'start')}
        >
          Bắt đầu tư vấn
        </Button>
      );
    }

    if (item.status === 'confirmed' || item.status === 'in_progress') {
      buttons.push(
        <Button
          key="complete"
          type="default"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleAction(item, 'complete')}
        >
          Hoàn thành
        </Button>
      );
    }

    return buttons;
  };

  // Table columns for appointments
  const appointmentColumns = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (record: DoctorAppointment) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.profileId.fullName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <PhoneOutlined /> {record.profileId.phone}
          </div>
        </div>
      ),
    },
    {
      title: 'Dịch vụ',
      key: 'service',
      render: (record: DoctorAppointment) => (
        <div>
          <div>{record.serviceId?.serviceName || record.packageId?.name}</div>
          <Tag color="blue">{record.appointmentType}</Tag>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (record: DoctorAppointment) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {dayjs(record.appointmentDate).format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: '12px' }}>{record.appointmentTime}</div>
        </div>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'typeLocation',
      key: 'location',
      render: (location: string) => (
        <Tag color={location === 'online' ? 'purple' : location === 'home' ? 'orange' : 'blue'}>
          {location === 'online' ? 'Trực tuyến' : location === 'home' ? 'Tại nhà' : 'Phòng khám'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (record: DoctorAppointment) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (record: DoctorAppointment) => (
        <Space size="small">
          {getActionButtons(record)}
        </Space>
      ),
    },
  ];

  // Table columns for consultations
  const consultationColumns = [
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (record: DoctorQA) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.fullName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <PhoneOutlined /> {record.phone}
          </div>
        </div>
      ),
    },
    {
      title: 'Câu hỏi',
      key: 'question',
      render: (record: DoctorQA) => (
        <Tooltip title={record.question}>
          <div style={{ maxWidth: '200px' }}>
            <Text ellipsis>{record.question}</Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (record: DoctorQA) => (
        <div>
          {record.scheduledDate ? (
            <>
              <div style={{ fontWeight: 'bold' }}>
                {dayjs(record.scheduledDate).format('DD/MM/YYYY')}
              </div>
              <div style={{ fontSize: '12px' }}>{record.scheduledTime}</div>
              <div style={{ fontSize: '10px', color: '#999' }}>Đã lên lịch</div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 'bold' }}>
                {dayjs(record.createdAt).format('DD/MM/YYYY')}
              </div>
              <div style={{ fontSize: '12px' }}>
                {dayjs(record.createdAt).format('HH:mm')}
              </div>
              <div style={{ fontSize: '10px', color: '#999' }}>Ngày tạo</div>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (record: DoctorQA) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (record: DoctorQA) => (
        <Space size="small">
          {getActionButtons(record)}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Doctor Info */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <Avatar 
                size={48} 
                src={user?.avatar} 
                icon={<UserOutlined />} 
              />
              <div>
                <h2 style={{ margin: 0 }}>{user?.fullName || 'Bác sĩ'}</h2>
                <p style={{ margin: 0, color: '#666' }}>
                  Bác sĩ • Role: {user?.role}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                  Email: {user?.email}
                </p>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                placeholder="Lọc trạng thái"
              >
                <Option value="all">Tất cả</Option>
                <Option value="pending">Chờ xác nhận</Option>
                <Option value="confirmed">Đã xác nhận</Option>
                <Option value="completed">Hoàn thành</Option>
                <Option value="cancelled">Đã hủy</Option>
              </Select>
              <Button 
                onClick={() => setSelectedDate(dayjs())}
                type={selectedDate.isSame(dayjs(), 'day') ? 'primary' : 'default'}
              >
                Tất cả lịch hẹn
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Tổng lịch hẹn" 
                value={stats.appointments.total}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Tư vấn trực tuyến" 
                value={stats.consultations.total}
                valueStyle={{ color: '#1890ff' }}
                prefix={<MessageOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Chờ xác nhận" 
                value={stats.appointments.pending + stats.consultations.pending}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Đã hoàn thành" 
                value={stats.appointments.completed + stats.consultations.completed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            <Badge 
              count={
                activeTab === 'appointments' 
                  ? stats?.appointments.pending || 0
                  : stats?.consultations.pending || 0
              }
              showZero={false}
            >
              <Button 
                icon={<BellOutlined />} 
                size="small"
              >
                Cần xử lý
              </Button>
            </Badge>
          }
        >
          <TabPane 
            tab={`Lịch hẹn dịch vụ (${appointments.length})`} 
            key="appointments"
          >
            <Table
              columns={appointmentColumns}
              dataSource={appointments}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Tổng ${total} lịch hẹn`
              }}
              scroll={{ x: 800 }}
            />
          </TabPane>
          
          <TabPane 
            tab={`Tư vấn trực tuyến (${consultations.length})`} 
            key="consultations"
          >
            <Table
              columns={consultationColumns}
              dataSource={consultations}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Tổng ${total} tư vấn`
              }}
              scroll={{ x: 800 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Action Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            {actionType === 'confirm' && 'Xác nhận'}
            {actionType === 'reject' && 'Từ chối'}
            {actionType === 'complete' && 'Hoàn thành'}
            {actionType === 'start' && 'Bắt đầu tư vấn'}
          </Space>
        }
        open={isActionModalVisible}
        onOk={executeAction}
        onCancel={() => setIsActionModalVisible(false)}
        confirmLoading={loading}
        okText="Xác nhận"
        cancelText="Hủy"
        width={500}
      >
        {selectedItem && (
          <div style={{ marginBottom: '16px' }}>
            <p><strong>Khách hàng:</strong> {
              'profileId' in selectedItem 
                ? selectedItem.profileId.fullName 
                : selectedItem.fullName
            }</p>
            {actionType === 'reject' && (
              <p style={{ color: '#ff4d4f' }}>
                Bạn có chắc chắn muốn từ chối yêu cầu này?
              </p>
            )}
          </div>
        )}
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            {actionType === 'complete' ? 'Kết quả/Ghi chú:' : 'Ghi chú (tùy chọn):'}
          </label>
          <TextArea
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder={
              actionType === 'complete' 
                ? 'Nhập kết quả tư vấn hoặc ghi chú...'
                : 'Nhập ghi chú...'
            }
            rows={4}
            maxLength={500}
            showCount
          />
        </div>
      </Modal>
    </div>
  );
};

export default DoctorMySchedulePage; 