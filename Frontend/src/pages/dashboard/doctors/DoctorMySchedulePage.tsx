import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Typography,
  Tooltip,
  Popconfirm,
  message,
  Avatar,
  Descriptions,
  Row,
  Col,
  Statistic,
  Badge
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  VideoCameraOutlined,
  DollarOutlined,
  MessageOutlined,
  PhoneOutlined,
  HomeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { 
  getDoctorScheduleData,
  calculateDashboardStats,
  getStatusColor,
  getStatusText,
  getTypeColor,
  getTypeText,
  getLocationColor,
  getLocationText,
  MockDoctorScheduleItem
} from '../../../shared/mockData/doctorScheduleMockData';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const DoctorMySchedulePage: React.FC = () => {
  // States
  const [scheduleData, setScheduleData] = useState<MockDoctorScheduleItem[]>(getDoctorScheduleData());
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MockDoctorScheduleItem | null>(null);

  // Calculate statistics
  const stats = calculateDashboardStats();

  // Load mock data
  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setScheduleData(getDoctorScheduleData());
      setLoading(false);
    }, 500);
  }, []);

  // Filter data based on search and filters
  const filteredData = scheduleData.filter(item => {
    const matchesSearch = item.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
                         (item.serviceName?.toLowerCase().includes(searchText.toLowerCase())) ||
                         (item.packageName?.toLowerCase().includes(searchText.toLowerCase())) ||
                         item.patientPhone.includes(searchText);
    const matchesType = selectedType === 'all' || item.appointmentType === selectedType;
    const matchesLocation = selectedLocation === 'all' || item.typeLocation === selectedLocation;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesDate = selectedDate === 'all' || item.appointmentDate === selectedDate;
    
    return matchesSearch && matchesType && matchesLocation && matchesStatus && matchesDate;
  });

  // Handle status change
  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      setScheduleData(prevData => 
        prevData.map(item => 
          item._id === itemId ? { ...item, status: newStatus as any } : item
        )
      );
      message.success(`Cập nhật trạng thái thành công`);
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  // Handle cancel appointment
  const handleCancelAppointment = async (itemId: string) => {
    try {
      setScheduleData(prevData => 
        prevData.map(item => 
          item._id === itemId ? { ...item, status: 'cancelled' } : item
        )
      );
      message.success('Hủy lịch hẹn thành công');
    } catch (error) {
      message.error('Hủy lịch hẹn thất bại');
    }
  };

  // Show detail modal
  const showItemDetails = (item: MockDoctorScheduleItem) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  // Get action buttons based on status
  const getActionButtons = (item: MockDoctorScheduleItem) => {
    const buttons = [];

    // View details button (always available)
    buttons.push(
      <Tooltip key="view" title="Xem chi tiết">
        <Button 
          type="text" 
          icon={<EyeOutlined />} 
          size="small"
          onClick={() => showItemDetails(item)}
        />
      </Tooltip>
    );

    // Status-specific buttons
    switch (item.status) {
      case 'paid':
        buttons.push(
          <Tooltip key="confirm" title="Xác nhận lịch">
            <Popconfirm
              title="Xác nhận lịch hẹn này?"
              onConfirm={() => handleStatusChange(item._id, 'confirmed')}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                icon={<CheckCircleOutlined />} 
                size="small"
                style={{ color: '#52c41a' }}
              />
            </Popconfirm>
          </Tooltip>
        );
        buttons.push(
          <Tooltip key="cancel" title="Hủy lịch">
            <Popconfirm
              title="Bạn có chắc chắn muốn hủy lịch hẹn này?"
              onConfirm={() => handleCancelAppointment(item._id)}
              okText="Hủy lịch"
              cancelText="Không"
            >
              <Button 
                type="text" 
                icon={<CloseCircleOutlined />} 
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        );
        break;
      
      case 'confirmed':
        buttons.push(
          <Tooltip key="complete" title="Hoàn thành">
            <Popconfirm
              title="Đánh dấu hoàn thành?"
              onConfirm={() => handleStatusChange(item._id, 'completed')}
              okText="Hoàn thành"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                icon={<CheckCircleOutlined />} 
                size="small"
                style={{ color: '#52c41a' }}
              />
            </Popconfirm>
          </Tooltip>
        );
        break;
      
      case 'scheduled':
        if (item.typeLocation === 'online') {
          buttons.push(
            <Tooltip key="start" title="Bắt đầu tư vấn">
              <Button 
                type="text" 
                icon={<VideoCameraOutlined />} 
                size="small"
                style={{ color: '#722ed1' }}
                onClick={() => {
                  handleStatusChange(item._id, 'consulting');
                  message.info('Đã mở cuộc họp tư vấn');
                }}
              />
            </Tooltip>
          );
        }
        break;
      
      case 'consulting':
        buttons.push(
          <Tooltip key="finish" title="Kết thúc tư vấn">
            <Popconfirm
              title="Kết thúc buổi tư vấn?"
              onConfirm={() => handleStatusChange(item._id, 'completed')}
              okText="Kết thúc"
              cancelText="Tiếp tục"
            >
              <Button 
                type="text" 
                icon={<CheckCircleOutlined />} 
                size="small"
                style={{ color: '#52c41a' }}
              />
            </Popconfirm>
          </Tooltip>
        );
        break;
    }

    return buttons;
  };

  // Table columns - CHỈ 4 CỘT CƠ BẢN
  const columns: ColumnsType<MockDoctorScheduleItem> = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.patientAvatar} 
            icon={<UserOutlined />}
            size="small"
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.patientName}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.patientPhone}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Dịch vụ',
      key: 'serviceType',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>
            {record.type === 'appointment' 
              ? (record.serviceName || record.packageName)
              : 'Tư vấn trực tuyến'
            }
          </div>
          <Space size="small" wrap>
            <Tag color={getTypeColor(record.appointmentType, record.typeLocation)}>
              {getTypeText(record.appointmentType)}
            </Tag>
            <Tag color={getLocationColor(record.typeLocation)}>
              {getLocationText(record.typeLocation)}
            </Tag>
          </Space>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            <DollarOutlined style={{ marginRight: '4px' }} />
            {record.type === 'appointment' 
              ? `${(record.servicePrice || record.packagePrice || 0).toLocaleString()}đ`
              : `${(record.consultationFee || 0).toLocaleString()}đ`
            }
          </div>
        </div>
      )
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>
            <CalendarOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
            {record.appointmentDate}
          </div>
          <div style={{ color: '#666' }}>
            <ClockCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
            {record.appointmentTime}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.appointmentDate + ' ' + a.appointmentTime).getTime() - 
                        new Date(b.appointmentDate + ' ' + b.appointmentTime).getTime()
    },
    {
      title: 'Trạng thái & Thao tác',
      key: 'actions',
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: '8px' }}>
            <Tag color={getStatusColor(record.status)}>
              {getStatusText(record.status)}
            </Tag>
          </div>
          <Space size="small">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => showItemDetails(record)}
              size="small"
            >
              Chi tiết
            </Button>
            {getActionButtons(record)}
          </Space>
        </div>
      )
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Lịch làm việc của tôi
        </Title>
        <Text type="secondary">
          Quản lý lịch hẹn và tư vấn trực tuyến
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Hôm nay"
              value={stats.todayTotal}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Online"
              value={stats.online}
              prefix={<VideoCameraOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tại trung tâm"
              value={scheduleData.filter(item => item.typeLocation === 'clinic').length}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <Space wrap>
            <Search
              placeholder="Tìm kiếm bệnh nhân, dịch vụ..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 130 }}
            >
              <Option value="all">Tất cả loại</Option>
              <Option value="consultation">Tư vấn</Option>
              <Option value="test">Xét nghiệm</Option>
              <Option value="other">Khác</Option>
            </Select>
            <Select
              value={selectedLocation}
              onChange={setSelectedLocation}
              style={{ width: 140 }}
            >
              <Option value="all">Tất cả địa điểm</Option>
              <Option value="clinic">Tại trung tâm</Option>
              <Option value="home">Tại nhà</Option>
              <Option value="online">Trực tuyến</Option>
            </Select>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 140 }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="scheduled">Đã lên lịch</Option>
              <Option value="consulting">Đang tư vấn</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            total: filteredData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} lịch hẹn`,
            pageSizeOptions: ['10', '20', '50']
          }}
          size="small"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined style={{ color: '#1890ff' }} />
            <span>Chi tiết lịch hẹn</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          ...(selectedItem ? getActionButtons(selectedItem).map((btn, idx) => 
            React.cloneElement(btn, { key: `action-${idx}` })
          ) : [])
        ]}
        width={900}
      >
        {selectedItem && (
          <div style={{ marginTop: '16px' }}>
            {/* Thông tin bệnh nhân */}
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserOutlined style={{ color: '#722ed1' }} />
                  <span>Thông tin bệnh nhân</span>
                </div>
              }
              size="small" 
              style={{ marginBottom: '16px' }}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      src={selectedItem.patientAvatar} 
                      icon={<UserOutlined />} 
                      size={64}
                      style={{ marginBottom: '8px' }}
                    />
                    <div style={{ fontWeight: 500 }}>{selectedItem.patientName}</div>
                    <Text type="secondary">{selectedItem.patientAge} tuổi</Text>
                  </div>
                </Col>
                <Col span={18}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Số điện thoại">
                      <PhoneOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                      {selectedItem.patientPhone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={getStatusColor(selectedItem.status)}>
                        {getStatusText(selectedItem.status)}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Thông tin dịch vụ */}
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                  <span>Thông tin dịch vụ & Lịch hẹn</span>
                </div>
              }
              size="small" 
              style={{ marginBottom: '16px' }}
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Dịch vụ">
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      {selectedItem.type === 'appointment' 
                        ? (selectedItem.serviceName || selectedItem.packageName)
                        : 'Tư vấn trực tuyến'
                      }
                    </div>
                    <Space>
                      <Tag color={getTypeColor(selectedItem.appointmentType, selectedItem.typeLocation)}>
                        {selectedItem.type === 'consultation' ? 'Tư vấn online' : getTypeText(selectedItem.appointmentType)}
                      </Tag>
                      {selectedItem.category && (
                        <Tag color="cyan">{selectedItem.category}</Tag>
                      )}
                    </Space>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Giá dịch vụ">
                  <div style={{ color: '#f5222d', fontWeight: 500 }}>
                    <DollarOutlined style={{ marginRight: '4px' }} />
                    {selectedItem.type === 'appointment' 
                      ? (selectedItem.servicePrice || selectedItem.packagePrice)?.toLocaleString('vi-VN') 
                      : selectedItem.consultationFee?.toLocaleString('vi-VN')
                    } VNĐ
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn">
                  <CalendarOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                  {selectedItem.appointmentDate}
                </Descriptions.Item>
                <Descriptions.Item label="Giờ hẹn">
                  <ClockCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                  {selectedItem.appointmentTime}
                </Descriptions.Item>
                <Descriptions.Item label="Địa điểm" span={2}>
                  <Tag color={getLocationColor(selectedItem.typeLocation)}>
                    <EnvironmentOutlined style={{ marginRight: '4px' }} />
                    {getLocationText(selectedItem.typeLocation)}
                  </Tag>
                  {selectedItem.address && (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                      {selectedItem.address}
                    </div>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Thông tin chi tiết */}
            {(selectedItem.description || selectedItem.question || selectedItem.notes || selectedItem.doctorNotes) && (
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageOutlined style={{ color: '#52c41a' }} />
                    <span>Thông tin chi tiết</span>
                  </div>
                }
                size="small" 
                style={{ marginBottom: '16px' }}
              >
                {selectedItem.description && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Mô tả: </Text>
                    <Text>{selectedItem.description}</Text>
                  </div>
                )}
                
                {selectedItem.question && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f0f8ff', 
                    borderRadius: '8px',
                    border: '1px solid #d6f2ff',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px', color: '#1890ff' }}>
                      <MessageOutlined style={{ marginRight: '8px' }} />
                      Câu hỏi của bệnh nhân:
                    </div>
                    <Text>{selectedItem.question}</Text>
                  </div>
                )}
                
                {selectedItem.notes && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong>Ghi chú: </Text>
                    <Text>{selectedItem.notes}</Text>
                  </div>
                )}
                
                {selectedItem.doctorNotes && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f6ffed', 
                    borderRadius: '8px',
                    border: '1px solid #b7eb8f'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px', color: '#52c41a' }}>
                      Ghi chú của bác sĩ:
                    </div>
                    <Text>{selectedItem.doctorNotes}</Text>
                  </div>
                )}
              </Card>
            )}

            {/* Thông tin cuộc họp online */}
            {selectedItem.meetingInfo && (
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <VideoCameraOutlined style={{ color: '#722ed1' }} />
                    <span>Thông tin cuộc họp</span>
                  </div>
                }
                size="small"
              >
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#faf5ff', 
                  borderRadius: '8px',
                  border: '1px solid #efdbff'
                }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Meeting ID">
                      <Text code>{selectedItem.meetingInfo.meetingId}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Meeting URL">
                      <a href={selectedItem.meetingInfo.meetingUrl} target="_blank" rel="noopener noreferrer">
                        {selectedItem.meetingInfo.meetingUrl}
                      </a>
                    </Descriptions.Item>
                    {selectedItem.meetingInfo.password && (
                      <Descriptions.Item label="Password">
                        <Text code>{selectedItem.meetingInfo.password}</Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorMySchedulePage; 