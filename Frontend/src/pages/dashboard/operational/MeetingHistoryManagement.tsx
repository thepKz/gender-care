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
  Result,
  Descriptions,
  Divider
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
  FileTextOutlined,
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

// ✅ Interface cho Meeting data từ API
interface MeetingHistoryData {
  _id: string;
  qaId: {
    _id: string;
    fullName: string;
    phone: string;
    question: string;
    status: string;
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
      console.log('✅ [MEETING-HISTORY] Meetings loaded:', response.data?.length || 0);
      
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
    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = 
        meeting.qaId?.fullName?.toLowerCase().includes(searchLower) ||
        meeting.qaId?.phone?.includes(searchText) ||
        meeting.qaId?.question?.toLowerCase().includes(searchLower) ||
        meeting.userId?.fullName?.toLowerCase().includes(searchLower);
      
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

  // ✅ Table columns definition
  const columns: ColumnsType<MeetingHistoryData> = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 180,
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 500, fontSize: '13px' }}>
              {record.qaId?.fullName || record.userId?.fullName || 'N/A'}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              <PhoneOutlined style={{ marginRight: '4px' }} />
              {record.qaId?.phone || 'N/A'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 140,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>
            {dayjs(record.scheduledTime).format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {dayjs(record.scheduledTime).format('HH:mm')}
          </div>
          {record.actualStartTime && (
            <div style={{ fontSize: '10px', color: '#52c41a' }}>
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
      width: 110,
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)} style={{ fontSize: '11px' }}>
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
      title: 'Nền tảng',
      key: 'provider',
      width: 90,
      render: (_, record) => (
        <Tag color={getProviderColor(record.provider)} style={{ fontSize: '11px' }}>
          {record.provider === 'google' ? 'Meet' : 'Jitsi'}
        </Tag>
      ),
    },
    {
      title: 'Vấn đề tư vấn',
      key: 'question',
      render: (_, record) => (
        <div style={{ maxWidth: '250px' }}>
          <Text ellipsis={{ tooltip: record.qaId?.question }} style={{ fontSize: '13px' }}>
            {record.qaId?.question || 'Không có mô tả'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showMeetingDetails(record)}
          style={{ fontSize: '12px' }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ✅ Header - Compact */}
      <div style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0c3c54' }}>
              <HistoryOutlined />
              Lịch sử Meeting
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
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
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Tổng số"
              value={stats.total}
              prefix={<VideoCameraOutlined style={{ color: '#0c3c54' }} />}
              valueStyle={{ color: '#0c3c54', fontSize: '18px' }}
              style={{ padding: '8px 0' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Hoàn thành"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '18px' }}
              style={{ padding: '8px 0' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Đã lên lịch"
              value={stats.scheduled}
              prefix={<CalendarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontSize: '18px' }}
              style={{ padding: '8px 0' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Đang diễn ra"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: '18px' }}
              style={{ padding: '8px 0' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ✅ Filters Section - Compact */}
      <Card size="small" style={{ marginBottom: '16px' }}>
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
      <Card size="small">
        <Table
          columns={columns}
          dataSource={filteredMeetings}
          rowKey="_id"
          loading={loading}
          size="small"
          pagination={{
            total: filteredMeetings.length,
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng: ${total} meeting`,
            size: 'small'
          }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>
                <HistoryOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
                <div style={{ fontSize: '14px' }}>Chưa có lịch sử meeting</div>
              </div>
            )
          }}
          scroll={{ x: 700 }}
        />
      </Card>

      {/* ✅ Meeting Detail Modal - Compact */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#0c3c54' }} />
            <span style={{ color: '#0c3c54' }}>Chi tiết Meeting</span>
          </Space>
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
      >
        {selectedMeeting && (
          <Descriptions column={1} bordered size="small" style={{ fontSize: '13px' }}>
            <Descriptions.Item label="Bệnh nhân">
              <Space>
                <Avatar icon={<UserOutlined />} size="small" />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>
                    {selectedMeeting.qaId?.fullName || selectedMeeting.userId?.fullName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {selectedMeeting.userId?.email}
                  </div>
                </div>
              </Space>
            </Descriptions.Item>
            
            <Descriptions.Item label="Số điện thoại">
              <Text style={{ fontSize: '13px' }}>{selectedMeeting.qaId?.phone || 'N/A'}</Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Thời gian lên lịch">
              <Text style={{ fontSize: '13px' }}>
                {dayjs(selectedMeeting.scheduledTime).format('DD/MM/YYYY HH:mm')}
              </Text>
            </Descriptions.Item>
            
            {selectedMeeting.actualStartTime && (
              <Descriptions.Item label="Thời gian bắt đầu thực tế">
                <Text style={{ fontSize: '13px' }}>
                  {dayjs(selectedMeeting.actualStartTime).format('DD/MM/YYYY HH:mm')}
                </Text>
              </Descriptions.Item>
            )}
            
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusColor(selectedMeeting.status)} style={{ fontSize: '11px' }}>
                {getStatusText(selectedMeeting.status)}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Nền tảng">
              <Tag color={getProviderColor(selectedMeeting.provider)} style={{ fontSize: '11px' }}>
                {selectedMeeting.provider === 'google' ? 'Google Meet' : 'Jitsi'}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Meeting Link">
              <Space>
                <LinkOutlined style={{ fontSize: '12px' }} />
                <a 
                  href={selectedMeeting.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px' }}
                >
                  {selectedMeeting.meetingLink}
                </a>
              </Space>
            </Descriptions.Item>
            
            <Descriptions.Item label="Meeting Password">
              <Text code style={{ fontSize: '14px', fontWeight: 'bold', color: '#f5222d' }}>
                {selectedMeeting.meetingPassword}
              </Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Số người tham gia">
              <Text style={{ fontSize: '13px' }}>
                {selectedMeeting.participantCount} / {selectedMeeting.maxParticipants}
              </Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="ID Meeting">
              <Text code style={{ fontSize: '11px' }}>{selectedMeeting._id}</Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Vấn đề tư vấn">
              <div style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px',
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                {selectedMeeting.qaId?.question || 'Không có mô tả'}
              </div>
            </Descriptions.Item>
            
            {selectedMeeting.notes && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Descriptions.Item label="Ghi chú của bác sĩ">
                  <div style={{ 
                    background: '#e6f7ff', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {selectedMeeting.notes}
                  </div>
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default MeetingHistoryManagement; 