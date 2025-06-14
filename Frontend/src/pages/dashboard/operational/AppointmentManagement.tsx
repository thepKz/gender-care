import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Typography,
  Tooltip,
  Popconfirm,
  DatePicker,
  TimePicker,
  message,
  Avatar,
  Descriptions
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

// NOTE: MOCKDATA - Dữ liệu giả dựa trên ERD
interface Appointment {
  key: string;
  _id: string;
  profileId: string;
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceName: string;
  doctorId?: string;
  doctorName?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test' | 'other';
  typeLocation: 'clinic' | 'home' | 'Online';
  address?: string;
  description: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const mockAppointments: Appointment[] = [
  {
    key: '1',
    _id: 'APT001',
    profileId: 'PROF001',
    patientName: 'Nguyễn Thị Lan',
    patientPhone: '0901234567',
    serviceId: 'SRV001',
    serviceName: 'Tư vấn sức khỏe sinh sản',
    doctorId: 'DOC001',
    doctorName: 'Dr. Nguyễn Thị Hương',
    appointmentDate: '2024-01-28',
    appointmentTime: '09:00',
    appointmentType: 'consultation',
    typeLocation: 'Online',
    description: 'Tư vấn về kế hoạch hóa gia đình',
    notes: 'Bệnh nhân lần đầu tư vấn',
    status: 'confirmed',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-26'
  },
  {
    key: '2',
    _id: 'APT002',
    profileId: 'PROF002',
    patientName: 'Trần Văn Nam',
    patientPhone: '0901234568',
    serviceId: 'SRV002',
    serviceName: 'Xét nghiệm STI cơ bản',
    appointmentDate: '2024-01-28',
    appointmentTime: '10:30',
    appointmentType: 'test',
    typeLocation: 'clinic',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    description: 'Xét nghiệm định kỳ',
    notes: 'Cần nhịn ăn 8 tiếng trước khi xét nghiệm',
    status: 'pending',
    createdAt: '2024-01-26',
    updatedAt: '2024-01-26'
  },
  {
    key: '3',
    _id: 'APT003',
    profileId: 'PROF003',
    patientName: 'Lê Thị Mai',
    patientPhone: '0901234569',
    serviceId: 'SRV003',
    serviceName: 'Tư vấn tâm lý tình dục',
    doctorId: 'DOC003',
    doctorName: 'Dr. Lê Thị Mai',
    appointmentDate: '2024-01-29',
    appointmentTime: '14:00',
    appointmentType: 'consultation',
    typeLocation: 'Online',
    description: 'Tư vấn về vấn đề tâm lý trong mối quan hệ',
    status: 'confirmed',
    createdAt: '2024-01-24',
    updatedAt: '2024-01-25'
  },
  {
    key: '4',
    _id: 'APT004',
    profileId: 'PROF004',
    patientName: 'Phạm Văn Hùng',
    patientPhone: '0901234570',
    serviceId: 'SRV004',
    serviceName: 'Khám sức khỏe tổng quát',
    doctorId: 'DOC002',
    doctorName: 'Dr. Trần Minh Đức',
    appointmentDate: '2024-01-30',
    appointmentTime: '08:30',
    appointmentType: 'other',
    typeLocation: 'clinic',
    address: '456 Đường XYZ, Quận 3, TP.HCM',
    description: 'Khám sức khỏe định kỳ',
    notes: 'Bệnh nhân có tiền sử bệnh tim',
    status: 'completed',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-30'
  },
  {
    key: '5',
    _id: 'APT005',
    profileId: 'PROF005',
    patientName: 'Hoàng Thị Nga',
    patientPhone: '0901234571',
    serviceId: 'SRV005',
    serviceName: 'Tư vấn dinh dưỡng thai kỳ',
    appointmentDate: '2024-01-31',
    appointmentTime: '16:00',
    appointmentType: 'consultation',
    typeLocation: 'home',
    address: '789 Đường DEF, Quận 7, TP.HCM',
    description: 'Tư vấn dinh dưỡng cho thai phụ',
    notes: 'Thai kỳ 20 tuần',
    status: 'cancelled',
    createdAt: '2024-01-22',
    updatedAt: '2024-01-27'
  }
];

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [form] = Form.useForm();

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

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    form.setFieldsValue({
      ...appointment,
      appointmentDate: dayjs(appointment.appointmentDate),
      appointmentTime: dayjs(appointment.appointmentTime, 'HH:mm')
    });
    setIsModalVisible(true);
  };

  const handleDelete = (appointmentId: string) => {
    setAppointments(appointments.filter(appointment => appointment._id !== appointmentId));
    message.success('Xóa lịch hẹn thành công!');
  };

  const handleStatusChange = (appointmentId: string, newStatus: Appointment['status']) => {
    setAppointments(appointments.map(appointment => 
      appointment._id === appointmentId 
        ? { ...appointment, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
        : appointment
    ));
    message.success('Cập nhật trạng thái thành công!');
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const formattedValues = {
        ...values,
        appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
        appointmentTime: values.appointmentTime.format('HH:mm')
      };

      if (editingAppointment) {
        // Update existing appointment
        setAppointments(appointments.map(appointment => 
          appointment._id === editingAppointment._id 
            ? { ...appointment, ...formattedValues, updatedAt: new Date().toISOString().split('T')[0] }
            : appointment
        ));
        message.success('Cập nhật lịch hẹn thành công!');
      } else {
        // Add new appointment
        const newAppointment: Appointment = {
          key: Date.now().toString(),
          _id: `APT${Date.now()}`,
          ...formattedValues,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        };
        setAppointments([...appointments, newAppointment]);
        message.success('Thêm lịch hẹn mới thành công!');
      }
      setIsModalVisible(false);
      setEditingAppointment(null);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingAppointment(null);
    form.resetFields();
  };

  const showAppointmentDetails = (appointment: Appointment) => {
    Modal.info({
      title: 'Chi tiết lịch hẹn',
      width: 700,
      content: (
        <div style={{ marginTop: '16px' }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Mã lịch hẹn" span={2}>
              <Text code>{appointment._id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Bệnh nhân">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar icon={<UserOutlined />} size="small" />
                {appointment.patientName}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {appointment.patientPhone}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ" span={2}>
              <Tag color={getTypeColor(appointment.appointmentType)}>
                {appointment.serviceName}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Bác sĩ" span={2}>
              {appointment.doctorName || 'Chưa phân công'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hẹn">
              <CalendarOutlined style={{ marginRight: '4px' }} />
              {appointment.appointmentDate}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ hẹn">
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              {appointment.appointmentTime}
            </Descriptions.Item>
            <Descriptions.Item label="Địa điểm" span={2}>
              <Tag color={getLocationColor(appointment.typeLocation)}>
                <EnvironmentOutlined style={{ marginRight: '4px' }} />
                {getLocationText(appointment.typeLocation)}
              </Tag>
              {appointment.address && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                  {appointment.address}
                </div>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái" span={2}>
              <Tag color={getStatusColor(appointment.status)}>
                {getStatusText(appointment.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              {appointment.description}
            </Descriptions.Item>
            {appointment.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {appointment.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
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
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            {record.patientName}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {record.patientPhone}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            ID: {record._id}
          </div>
        </div>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 200,
      render: (serviceName: string, record: Appointment) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
            {serviceName}
          </div>
          <Tag color={getTypeColor(record.appointmentType)} size="small">
            {getTypeText(record.appointmentType)}
          </Tag>
        </div>
      )
    },
    {
      title: 'Bác sĩ',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 150,
      render: (doctorName?: string) => (
        doctorName ? (
          <Text style={{ fontSize: '13px' }}>{doctorName}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Chưa phân công
          </Text>
        )
      )
    },
    {
      title: 'Thời gian',
      key: 'datetime',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <CalendarOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
            <Text style={{ fontSize: '13px' }}>{record.appointmentDate}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ClockCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
            <Text style={{ fontSize: '13px' }}>{record.appointmentTime}</Text>
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.appointmentDate + ' ' + a.appointmentTime).getTime() - 
                        new Date(b.appointmentDate + ' ' + b.appointmentTime).getTime()
    },
    {
      title: 'Địa điểm',
      dataIndex: 'typeLocation',
      key: 'typeLocation',
      width: 120,
      render: (location: Appointment['typeLocation']) => (
        <Tag color={getLocationColor(location)}>
          {getLocationText(location)}
        </Tag>
      )
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
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEdit(record)}
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
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Thêm lịch hẹn
          </Button>
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
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingAppointment ? 'Chỉnh sửa lịch hẹn' : 'Thêm lịch hẹn mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText={editingAppointment ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'pending' }}
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="patientName"
              label="Tên bệnh nhân"
              rules={[{ required: true, message: 'Vui lòng nhập tên bệnh nhân!' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Nhập tên bệnh nhân" />
            </Form.Item>
            
            <Form.Item
              name="patientPhone"
              label="Số điện thoại"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </div>
          
          <Form.Item
            name="serviceName"
            label="Dịch vụ"
            rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ!' }]}
          >
            <Input placeholder="Nhập tên dịch vụ" />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="appointmentType"
              label="Loại dịch vụ"
              rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ!' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Chọn loại dịch vụ">
                <Option value="consultation">Tư vấn</Option>
                <Option value="test">Xét nghiệm</Option>
                <Option value="other">Khác</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="typeLocation"
              label="Địa điểm"
              rules={[{ required: true, message: 'Vui lòng chọn địa điểm!' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Chọn địa điểm">
                <Option value="clinic">Phòng khám</Option>
                <Option value="home">Tại nhà</Option>
                <Option value="Online">Trực tuyến</Option>
              </Select>
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="appointmentDate"
              label="Ngày hẹn"
              rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="appointmentTime"
              label="Giờ hẹn"
              rules={[{ required: true, message: 'Vui lòng chọn giờ!' }]}
              style={{ flex: 1 }}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          
          <Form.Item
            name="doctorName"
            label="Bác sĩ phụ trách"
          >
            <Input placeholder="Nhập tên bác sĩ (tùy chọn)" />
          </Form.Item>
          
          <Form.Item
            name="address"
            label="Địa chỉ cụ thể"
          >
            <Input placeholder="Nhập địa chỉ (nếu cần)" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <TextArea rows={2} placeholder="Nhập mô tả lịch hẹn" />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <TextArea rows={2} placeholder="Nhập ghi chú (tùy chọn)" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentManagement;