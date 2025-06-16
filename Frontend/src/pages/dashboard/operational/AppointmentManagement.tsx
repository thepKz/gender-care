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
  DatePicker,
  message,
  Avatar,
  Descriptions,
  Row,
  Col
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockAppointmentsData, MockAppointment } from '../../../shared/mockData/appointmentManagementMockData';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

// Use MockAppointment interface from mock data
type Appointment = MockAppointment;



const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');

  // Load mock data 
  const loadAppointments = async () => {
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use mock data instead of API call
      setAppointments(mockAppointmentsData);
    } catch (err: any) {
      console.error(err);
      message.error('Không thể tải danh sách cuộc hẹn');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter appointments based on search and filters
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
                         appointment.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
                         appointment.patientPhone.includes(searchText);
    const matchesType = selectedType === 'all' || appointment.appointmentType === selectedType;
    const matchesLocation = selectedLocation === 'all' || appointment.typeLocation === selectedLocation;
    const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
    const matchesDate = selectedDate === 'all' || appointment.appointmentDate === selectedDate;
    
    return matchesSearch && matchesType && matchesLocation && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      pending: 'orange',
      confirmed: 'blue',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status];
  };

  const getStatusText = (status: Appointment['status']) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status];
  };

  const getTypeColor = (type: Appointment['appointmentType']) => {
    const colors = {
      consultation: 'blue',
      test: 'green',
      other: 'purple'
    };
    return colors[type];
  };

  const getTypeText = (type: Appointment['appointmentType']) => {
    const texts = {
      consultation: 'Tư vấn',
      test: 'Xét nghiệm',
      other: 'Khác'
    };
    return texts[type];
  };

  const getLocationColor = (location: Appointment['typeLocation']) => {
    const colors = {
      clinic: 'volcano',
      home: 'cyan',
      Online: 'geekblue'
    };
    return colors[location];
  };

  const getLocationText = (location: Appointment['typeLocation']) => {
    const texts = {
      clinic: 'Phòng khám',
      home: 'Tại nhà',
      Online: 'Trực tuyến'
    };
    return texts[location];
  };

  const handleDelete = async (appointmentId: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Remove from local state (mock delete)
      setAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
      message.success('Hủy cuộc hẹn thành công');
    } catch (err: any) {
      message.error('Hủy cuộc hẹn thất bại');
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update local state (mock update)
      setAppointments(prev => 
        prev.map(apt => 
          apt._id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
      message.success('Cập nhật trạng thái thành công');
    } catch (err: any) {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const showAppointmentDetails = (appointment: Appointment) => {
    Modal.info({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <span>Chi tiết lịch hẹn</span>
        </div>
      ),
      width: 900,
      content: (
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
                  <Avatar icon={<UserOutlined />} size={64} style={{ marginBottom: '8px' }} />
                  <div style={{ fontWeight: 500 }}>{appointment.patientName}</div>
                </div>
              </Col>
              <Col span={18}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Số điện thoại">
                    <PhoneOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                    {appointment.patientPhone}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color={getStatusColor(appointment.status)}>
                      {getStatusText(appointment.status)}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>

          {/* Thông tin dịch vụ & lịch hẹn */}
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
                    {appointment.serviceName}
                  </div>
                  <Space>
                    <Tag color={getTypeColor(appointment.appointmentType)}>
                      {getTypeText(appointment.appointmentType)}
                    </Tag>
                  </Space>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Loại lịch hẹn">
                <Tag color={getLocationColor(appointment.typeLocation)}>
                  <EnvironmentOutlined style={{ marginRight: '4px' }} />
                  {getLocationText(appointment.typeLocation)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày hẹn">
                <CalendarOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                {appointment.appointmentDate}
              </Descriptions.Item>
              <Descriptions.Item label="Giờ hẹn">
                <ClockCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                {appointment.appointmentTime}
              </Descriptions.Item>
              {appointment.address && (
                <Descriptions.Item label="Địa chỉ cụ thể" span={2}>
                  <EnvironmentOutlined style={{ marginRight: '4px' }} />
                  {appointment.address}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Thông tin chi tiết */}
          {(appointment.description || appointment.notes) && (
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EnvironmentOutlined style={{ color: '#52c41a' }} />
                  <span>Thông tin chi tiết</span>
                </div>
              }
              size="small"
            >
              {appointment.description && (
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>Mô tả: </Text>
                  <Text>{appointment.description}</Text>
                </div>
              )}
              
              {appointment.notes && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f6ffed', 
                  borderRadius: '8px',
                  border: '1px solid #b7eb8f'
                }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px', color: '#52c41a' }}>
                    Ghi chú:
                  </div>
                  <Text>{appointment.notes}</Text>
                </div>
              )}
            </Card>
          )}
        </div>
      ),
    });
  };

  const columns: ColumnsType<Appointment> = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '2px' }}>
              {record.patientName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <PhoneOutlined style={{ marginRight: '4px' }} />
              {record.patientPhone}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: 'Dịch vụ',
      key: 'service',
      width: 280,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
            {record.serviceName}
          </div>
          <Space size="small" wrap>
            <Tag color={getTypeColor(record.appointmentType)}>
              {getTypeText(record.appointmentType)}
            </Tag>
            <Tag color={getLocationColor(record.typeLocation)}>
              {getLocationText(record.typeLocation)}
            </Tag>
          </Space>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {record.description.length > 50 
                ? `${record.description.substring(0, 50)}...` 
                : record.description
              }
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Lịch hẹn',
      key: 'schedule',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <CalendarOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
            <Text style={{ fontSize: '13px', fontWeight: 500 }}>{record.appointmentDate}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <ClockCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
            <Text style={{ fontSize: '13px' }}>{record.appointmentTime}</Text>
          </div>
          {record.address && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              <EnvironmentOutlined style={{ marginRight: '2px' }} />
              {record.address.length > 30 
                ? `${record.address.substring(0, 30)}...` 
                : record.address
              }
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => new Date(a.appointmentDate + ' ' + a.appointmentTime).getTime() - 
                        new Date(b.appointmentDate + ' ' + b.appointmentTime).getTime()
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Appointment['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => showAppointmentDetails(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Xác nhận">
              <Popconfirm
                title="Xác nhận lịch hẹn này?"
                onConfirm={() => handleStatusChange(record._id, 'confirmed')}
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
          )}
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa lịch hẹn này?"
              onConfirm={() => handleDelete(record._id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý lịch hẹn
        </Title>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          NOTE: MOCKDATA - Quản lý lịch hẹn khám bệnh và tư vấn
        </p>
      </div>

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
              style={{ width: 130 }}
            >
              <Option value="all">Tất cả địa điểm</Option>
              <Option value="clinic">Phòng khám</Option>
              <Option value="home">Tại nhà</Option>
              <Option value="Online">Trực tuyến</Option>
            </Select>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 130 }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
            <DatePicker
              placeholder="Chọn ngày"
              onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : 'all')}
              style={{ width: 130 }}
            />
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredAppointments}
          loading={loading}
          pagination={{
            total: filteredAppointments.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} lịch hẹn`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default AppointmentManagement;