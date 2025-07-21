import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Statistic,
  Button,
  Modal,
  Input,
  Select,
  DatePicker,
  message,
  Avatar,
  Result
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  PhoneOutlined,
  LinkOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../../../hooks/useAuth';
import { meetingAPI } from '../../../api/endpoints/meeting';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// ✅ Interface cho Meeting data từ API - Chỉ lấy từ DoctorQA
interface MeetingHistoryData {
  _id: string;
  qaId: {
    _id: string;
    fullName: string;
    phone: string;
    question: string;
    status: string;
    age?: number;
    gender?: string;
    consultationFee?: number;
    appointmentDate?: string;
    appointmentSlot?: string;
  };
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  meetingLink: string;
  meetingPassword: string;
  provider: 'google' | 'jitsi';
  scheduledTime: string;
  actualStartTime?: string;
  status: 'scheduled' | 'waiting_customer' | 'invite_sent' | 'in_progress' | 'completed' | 'cancelled';
  participantCount: number;
  maxParticipants: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const MeetingHistoryManagement: React.FC = () => {
  const { user } = useAuth();

  // ✅ State management - MOVED BEFORE ROLE GUARD
  const [meetings, setMeetings] = useState<MeetingHistoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  // ✅ Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingHistoryData | null>(null);

  // ✅ Load meeting history data
  const loadMeetingHistory = async () => {
    try {
      setLoading(true);
      console.log('📊 [MEETING-HISTORY] Loading meeting history for doctor...');
      
      // ✅ Get doctor's meetings với security tự động từ token
      const response = await meetingAPI.getMyMeetings();
      console.log('✅ [MEETING-HISTORY] API Response:', response);
      console.log('✅ [MEETING-HISTORY] Meetings loaded:', response.data?.length || 0);
      
      // ✅ DEBUG: Log first meeting để kiểm tra cấu trúc dữ liệu
      if (response.data && response.data.length > 0) {
        console.log('🔍 [DEBUG] First meeting structure:', JSON.stringify(response.data[0], null, 2));
        console.log('🔍 [DEBUG] qaId structure:', response.data[0].qaId);
        console.log('🔍 [DEBUG] qaId.fullName:', response.data[0].qaId?.fullName);
        console.log('🔍 [DEBUG] qaId.phone:', response.data[0].qaId?.phone);
        console.log('🔍 [DEBUG] qaId.question:', response.data[0].qaId?.question);
        console.log('🔍 [DEBUG] userId structure:', response.data[0].userId);
      } else {
        console.log('⚠️ [DEBUG] No meetings found in response');
      }
      
      setMeetings(response.data || []);
      
      if (!response.data || response.data.length === 0) {
        message.info('Chưa có lịch sử meeting nào');
      } else {
        message.success(`Đã tải ${response.data.length} meeting thành công`);
      }
      
    } catch (error: unknown) {
      console.error('❌ [ERROR] Loading meeting history failed:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Không thể tải lịch sử meeting';
      message.error(errorMessage || 'Không thể tải lịch sử meeting');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load data on component mount
  useEffect(() => {
    loadMeetingHistory();
  }, []);

  // ✅ Role Guard - MOVED AFTER ALL HOOKS
  if (user?.role !== 'doctor') {
    return (
      <Result
        status="403"
        title="403 - Không có quyền truy cập"
        subTitle="Trang này chỉ dành cho bác sĩ. Chỉ bác sĩ mới có thể xem lịch sử meeting của mình."
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        }
      />
    );
  }

  // ✅ Filter meetings based on search and filters
  const filteredMeetings = meetings.filter(meeting => {
    // Search filter - Chỉ tìm theo thông tin từ DoctorQA
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const phoneNumber = getPhoneNumber(meeting);
      const patientName = getPatientName(meeting);
      const consultationIssue = getConsultationIssue(meeting);
      
      const matchesSearch = 
        patientName.toLowerCase().includes(searchLower) ||
        phoneNumber.includes(searchText) ||
        consultationIssue.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (selectedStatus !== 'all' && meeting.status !== selectedStatus) {
      return false;
    }
    
    // Provider filter
    if (selectedProvider !== 'all' && meeting.provider !== selectedProvider) {
      return false;
    }
    
    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const meetingDate = dayjs(meeting.scheduledTime);
      if (!meetingDate.isBetween(dateRange[0], dateRange[1], 'day', '[]')) {
        return false;
      }
    }
    
    return true;
  });

  // ✅ Calculate statistics
  const stats = {
    total: meetings.length,
    completed: meetings.filter(m => m.status === 'completed').length,
    scheduled: meetings.filter(m => m.status === 'scheduled').length,
    inProgress: meetings.filter(m => m.status === 'in_progress').length,
    cancelled: meetings.filter(m => m.status === 'cancelled').length
  };

  // ✅ Status color mapping
  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'blue',
      waiting_customer: 'orange', 
      invite_sent: 'purple',
      in_progress: 'lime',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  // ✅ Status text mapping
  const getStatusText = (status: string) => {
    const texts = {
      scheduled: 'Đã lên lịch',
      waiting_customer: 'Chờ khách hàng',
      invite_sent: 'Đã gửi thư mời',
      in_progress: 'Đang diễn ra',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status as keyof typeof texts] || status;
  };

  // ✅ Provider color mapping
  const getProviderColor = (provider: string) => {
    return provider === 'google' ? 'geekblue' : 'volcano';
  };

  // ✅ Show meeting details modal
  const showMeetingDetails = (meeting: MeetingHistoryData) => {
    setSelectedMeeting(meeting);
    setDetailModalVisible(true);
  };

  // ✅ Helper functions để lấy thông tin từ DoctorQA hoặc User
  const getPhoneNumber = (meeting: MeetingHistoryData): string => {
    console.log('🔍 [DEBUG] getPhoneNumber called with meeting:', meeting);
    
    // ✅ Thử lấy từ qaId trước
    if (meeting.qaId && typeof meeting.qaId === 'object' && 'phone' in meeting.qaId) {
      const phone = (meeting.qaId as Record<string, unknown>).phone;
      console.log('🔍 [DEBUG] Found phone in qaId:', phone);
      return (phone as string) || 'N/A';
    }
    
    // ✅ Thử lấy từ userId nếu có (User model có phone field)
    if (meeting.userId && typeof meeting.userId === 'object' && 'phone' in meeting.userId) {
      const phone = (meeting.userId as Record<string, unknown>).phone;
      console.log('🔍 [DEBUG] Found phone in userId:', phone);
      return (phone as string) || 'N/A';
    }
    
    // ✅ Thử lấy từ root level (fallback)
    if ('phone' in meeting) {
      const phone = (meeting as Record<string, unknown>).phone;
      console.log('🔍 [DEBUG] Found phone in root level:', phone);
      return (phone as string) || 'N/A';
    }
    
    console.log('🔍 [DEBUG] No phone found, returning N/A');
    return 'N/A';
  };

  const getPatientName = (meeting: MeetingHistoryData): string => {
    console.log('🔍 [DEBUG] getPatientName called with meeting:', meeting);
    
    // ✅ Thử lấy từ qaId trước
    if (meeting.qaId && typeof meeting.qaId === 'object' && 'fullName' in meeting.qaId) {
      const fullName = (meeting.qaId as Record<string, unknown>).fullName;
      console.log('🔍 [DEBUG] Found fullName in qaId:', fullName);
      return (fullName as string) || 'N/A';
    }
    
    // ✅ Thử lấy từ userId nếu có (User model có fullName field)
    if (meeting.userId && typeof meeting.userId === 'object' && 'fullName' in meeting.userId) {
      const fullName = (meeting.userId as Record<string, unknown>).fullName;
      console.log('🔍 [DEBUG] Found fullName in userId:', fullName);
      return (fullName as string) || 'N/A';
    }
    
    // ✅ Thử lấy từ root level (fallback)
    if ('fullName' in meeting) {
      const fullName = (meeting as Record<string, unknown>).fullName;
      console.log('🔍 [DEBUG] Found fullName in root level:', fullName);
      return (fullName as string) || 'N/A';
    }
    
    console.log('🔍 [DEBUG] No fullName found, returning N/A');
    return 'N/A';
  };

  const getConsultationIssue = (meeting: MeetingHistoryData): string => {
    console.log('🔍 [DEBUG] getConsultationIssue called with meeting:', meeting);
    
    // ✅ Thử lấy từ qaId trước
    if (meeting.qaId && typeof meeting.qaId === 'object' && 'question' in meeting.qaId) {
      const question = (meeting.qaId as Record<string, unknown>).question;
      console.log('🔍 [DEBUG] Found question in qaId:', question);
      return (question as string) || 'Không có mô tả';
    }
    
    // ✅ Thử lấy từ userId nếu có (User model không có question field)
    if (meeting.userId && typeof meeting.userId === 'object' && 'question' in meeting.userId) {
      const question = (meeting.userId as Record<string, unknown>).question;
      console.log('🔍 [DEBUG] Found question in userId:', question);
      return (question as string) || 'Không có mô tả';
    }
    
    // ✅ Thử lấy từ root level (fallback)
    if ('question' in meeting) {
      const question = (meeting as Record<string, unknown>).question;
      console.log('🔍 [DEBUG] Found question in root level:', question);
      return (question as string) || 'Không có mô tả';
    }
    
    // ✅ Nếu không có question, thử lấy từ notes
    if (meeting.notes && meeting.notes.trim() !== '') {
      console.log('🔍 [DEBUG] Using notes as consultation issue:', meeting.notes);
      return meeting.notes;
    }
    
    console.log('🔍 [DEBUG] No question found, returning default');
    return 'Không có mô tả';
  };

  const getAppointmentTime = (meeting: MeetingHistoryData): string => {
    console.log('🔍 [DEBUG] getAppointmentTime called with meeting:', meeting);
    
    // ✅ Thử lấy từ qaId trước
    if (meeting.qaId && typeof meeting.qaId === 'object') {
      const qaId = meeting.qaId as Record<string, unknown>;
      if (qaId.appointmentDate && qaId.appointmentSlot) {
        console.log('🔍 [DEBUG] Found appointment in qaId:', qaId.appointmentDate, qaId.appointmentSlot);
        return `${dayjs(qaId.appointmentDate as string).format('DD/MM/YYYY')} ${qaId.appointmentSlot as string}`;
      }
    }
    
    // ✅ Thử lấy từ root level (fallback)
    if ('appointmentDate' in meeting && 'appointmentSlot' in meeting) {
      const appointmentDate = (meeting as Record<string, unknown>).appointmentDate;
      const appointmentSlot = (meeting as Record<string, unknown>).appointmentSlot;
      console.log('🔍 [DEBUG] Found appointment in root level:', appointmentDate, appointmentSlot);
      return `${dayjs(appointmentDate as string).format('DD/MM/YYYY')} ${appointmentSlot as string}`;
    }
    
    // ✅ Fallback to scheduledTime
    console.log('🔍 [DEBUG] Using scheduledTime as fallback:', meeting.scheduledTime);
    return dayjs(meeting.scheduledTime).format('DD/MM/YYYY HH:mm');
  };

  // ✅ Table columns definition - Compact
  const columns: ColumnsType<MeetingHistoryData> = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 500, fontSize: '12px' }}>
              {getPatientName(record)}
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>
              <PhoneOutlined style={{ marginRight: '2px' }} />
              {getPhoneNumber(record)}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Thời gian khám',
      key: 'appointmentTime',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '12px' }}>
            {getAppointmentTime(record)}
          </div>
          {record.actualStartTime && (
            <div style={{ fontSize: '9px', color: '#52c41a' }}>
              Bắt đầu: {dayjs(record.actualStartTime).format('HH:mm')}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => dayjs(a.scheduledTime).unix() - dayjs(b.scheduledTime).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)} style={{ fontSize: '10px' }}>
          {getStatusText(record.status)}
        </Tag>
      ),
      filters: [
        { text: 'Đã lên lịch', value: 'scheduled' },
        { text: 'Chờ khách hàng', value: 'waiting_customer' },
        { text: 'Đã gửi thư mời', value: 'invite_sent' },
        { text: 'Đang diễn ra', value: 'in_progress' },
        { text: 'Hoàn thành', value: 'completed' },
        { text: 'Đã hủy', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showMeetingDetails(record)}
          style={{ fontSize: '10px' }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* ✅ Header - Compact */}
      <div style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0, color: '#333', fontSize: '20px' }}>
              Lịch sử Meeting
            </Title>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              Quản lý các cuộc meeting tư vấn đã thực hiện
            </Text>
          </Col>
          <Col>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadMeetingHistory}
              loading={loading}
              size="small"
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </div>

      {/* ✅ Statistics Cards - Compact */}
      <Row gutter={12} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: '6px' }}>
            <Statistic
              title="Tổng số"
              value={stats.total}
              prefix={<VideoCameraOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: '6px' }}>
            <Statistic
              title="Hoàn thành"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: '6px' }}>
            <Statistic
              title="Đã lên lịch"
              value={stats.scheduled}
              prefix={<CalendarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: '6px' }}>
            <Statistic
              title="Đang diễn ra"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: '18px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ✅ Filters Section - Compact */}
      <Card size="small" style={{ marginBottom: '16px', borderRadius: '6px' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Tìm theo tên, SĐT..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              size="small"
            />
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="Trạng thái"
              value={selectedStatus}
              onChange={setSelectedStatus}
              size="small"
            >
              <Option value="all">Tất cả</Option>
              <Option value="scheduled">Đã lên lịch</Option>
              <Option value="waiting_customer">Chờ khách hàng</Option>
              <Option value="invite_sent">Đã gửi thư mời</Option>
              <Option value="in_progress">Đang diễn ra</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="Nền tảng"
              value={selectedProvider}
              onChange={setSelectedProvider}
              size="small"
            >
              <Option value="all">Tất cả</Option>
              <Option value="google">Google Meet</Option>
              <Option value="jitsi">Jitsi</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Từ ngày', 'Đến ngày']}
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              size="small"
            />
          </Col>
          <Col xs={24} sm={4} md={3}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText('');
                setSelectedStatus('all');
                setSelectedProvider('all');
                setDateRange(null);
              }}
              size="small"
            >
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ✅ Main Table - Compact */}
      <Card size="small" style={{ borderRadius: '6px' }}>
        <Table
          columns={columns}
          dataSource={filteredMeetings}
          rowKey="_id"
          loading={loading}
          size="small"
          pagination={{
            total: filteredMeetings.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng: ${total} meeting`,
            size: 'small'
          }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#999' }}>
                <HistoryOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
                <div style={{ fontSize: '14px' }}>Chưa có lịch sử meeting</div>
              </div>
            )
          }}
          scroll={{ x: 500 }}
        />
      </Card>

      {/* ✅ Meeting Detail Modal - Compact */}
      <Modal
        title={
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
            Chi tiết Meeting
          </div>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedMeeting(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)} size="small">
            Đóng
          </Button>
        ]}
        width={550}
        style={{ top: 20 }}
      >
        {selectedMeeting && (
          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
            <Row gutter={[16, 12]}>
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                    Bệnh nhân
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar icon={<UserOutlined />} size="small" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>
                        {getPatientName(selectedMeeting)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {selectedMeeting.userId?.email}
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                    Số điện thoại
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    {getPhoneNumber(selectedMeeting)}
                  </div>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                    Thời gian lên lịch
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    {getAppointmentTime(selectedMeeting)}
                  </div>
                </div>
              </Col>
            
            {selectedMeeting.actualStartTime && (
                <Col span={12}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                      Thời gian bắt đầu thực tế
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>
                  {dayjs(selectedMeeting.actualStartTime).format('DD/MM/YYYY HH:mm')}
                    </div>
                  </div>
                </Col>
              )}
              
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                    Trạng thái
                  </div>
                  <Tag color={getStatusColor(selectedMeeting.status)} style={{ fontSize: '11px', padding: '2px 8px' }}>
                {getStatusText(selectedMeeting.status)}
              </Tag>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                    Nền tảng
                  </div>
                  <Tag color={getProviderColor(selectedMeeting.provider)} style={{ fontSize: '11px', padding: '2px 8px' }}>
                {selectedMeeting.provider === 'google' ? 'Google Meet' : 'Jitsi'}
              </Tag>
                </div>
              </Col>
              
              <Col span={24}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                    Meeting Link
                  </div>
                  <div style={{ fontSize: '11px', wordBreak: 'break-all', background: '#f5f5f5', padding: '6px', borderRadius: '3px' }}>
                    <LinkOutlined style={{ marginRight: '4px' }} />
                <a 
                  href={selectedMeeting.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {selectedMeeting.meetingLink}
                </a>
                  </div>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                    Meeting Password
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    color: '#f5222d',
                    fontFamily: 'monospace',
                    background: '#fff2f0',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    border: '1px solid #ffccc7'
                  }}>
                {selectedMeeting.meetingPassword}
                  </div>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                    Số người tham gia
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                {selectedMeeting.participantCount} / {selectedMeeting.maxParticipants}
                  </div>
                </div>
              </Col>
              
              <Col span={24}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                    ID Meeting
                  </div>
              <div style={{ 
                    fontSize: '10px', 
                    fontFamily: 'monospace',
                    color: '#666',
                    wordBreak: 'break-all',
                background: '#f5f5f5', 
                    padding: '4px',
                    borderRadius: '3px'
                  }}>
                    {selectedMeeting._id}
                  </div>
              </div>
              </Col>
              
              <Col span={24}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                    Vấn đề tư vấn
                  </div>
                  <div style={{ 
                    background: '#f6ffed', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    border: '1px solid #b7eb8f'
                  }}>
                    {getConsultationIssue(selectedMeeting)}
                  </div>
                </div>
              </Col>
              
              {selectedMeeting.notes && (
                <Col span={24}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px', fontSize: '12px' }}>
                      Ghi chú của bác sĩ
                    </div>
                    <div style={{ 
                      background: '#e6f7ff', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      border: '1px solid #91d5ff'
                  }}>
                    {selectedMeeting.notes}
                    </div>
                  </div>
                </Col>
            )}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MeetingHistoryManagement; 