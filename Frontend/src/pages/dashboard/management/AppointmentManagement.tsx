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
  Form,
  Typography,
  Tooltip,
  Popconfirm,
  DatePicker,
  TimePicker,
  message
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { appointmentApi } from '../../../api/endpoints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Appointment {
  key: string;
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'payment_cancelled' | 'expired' | 'no-show';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await appointmentApi.getAllAppointments();
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setAppointments(list);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
                         appointment.patientEmail.toLowerCase().includes(searchText.toLowerCase()) ||
                         appointment.doctorName.toLowerCase().includes(searchText.toLowerCase()) ||
                         appointment.serviceName.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
    const matchesDate = selectedDate === 'all' || appointment.appointmentDate === selectedDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      pending: 'orange',
      confirmed: 'blue',
      completed: 'green',
      cancelled: 'red',
      payment_cancelled: 'red',
      expired: 'red',
      'no-show': 'default'
    };
    return colors[status];
  };

  const getStatusText = (status: Appointment['status']) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      payment_cancelled: 'Hủy thanh toán',
      expired: 'Hết hạn',
      'no-show': 'Không đến'
    };
    return texts[status];
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

  const handleDelete = async (appointmentId: string) => {
    try {
      await appointmentApi.deleteAppointment(appointmentId);
      message.success('Xóa lịch hẹn thành công');
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa lịch hẹn');
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await appointmentApi.updateAppointmentStatus(appointmentId, newStatus as any);
      message.success('Cập nhật trạng thái thành công');
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
        appointmentTime: values.appointmentTime.format('HH:mm')
      };
      
      if (editingAppointment) {
        await appointmentApi.updateAppointment(editingAppointment.id, formattedValues);
        message.success('Cập nhật lịch hẹn thành công');
      } else {
        await appointmentApi.createAppointment(formattedValues);
        message.success('Tạo lịch hẹn thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingAppointment(null);
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingAppointment(null);
  };

  const showAppointmentDetails = (appointment: Appointment) => {
    Modal.info({
      title: 'Chi tiết lịch hẹn',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>Mã lịch hẹn:</strong> {appointment.id}</p>
          <p><strong>Bệnh nhân:</strong> {appointment.patientName}</p>
          <p><strong>Email:</strong> {appointment.patientEmail}</p>
          <p><strong>Số điện thoại:</strong> {appointment.patientPhone}</p>
          <p><strong>Bác sĩ:</strong> {appointment.doctorName}</p>
          <p><strong>Dịch vụ:</strong> {appointment.serviceName}</p>
          <p><strong>Ngày hẹn:</strong> {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')}</p>
          <p><strong>Giờ hẹn:</strong> {appointment.appointmentTime}</p>
          <p><strong>Trạng thái:</strong> {getStatusText(appointment.status)}</p>
          <p><strong>Ghi chú:</strong> {appointment.notes || 'Không có'}</p>
          <p><strong>Ngày tạo:</strong> {new Date(appointment.createdAt).toLocaleDateString('vi-VN')}</p>
          <p><strong>Cập nhật:</strong> {new Date(appointment.updatedAt).toLocaleDateString('vi-VN')}</p>
        </div>
      ),
    });
  };

  const columns: ColumnsType<Appointment> = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.patientName}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.patientPhone}
          </Text>
        </div>
      )
    },
    {
      title: 'Dịch vụ',
      key: 'service',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>{record.serviceName}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.doctorName}
          </Text>
        </div>
      )
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {new Date(record.appointmentDate).toLocaleDateString('vi-VN')}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.appointmentTime}
          </Text>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => showAppointmentDetails(record)}
            size="small"
          >
            Chi tiết
          </Button>
          {record.status === 'pending' && (
            <Button 
              type="primary"
              size="small"
              onClick={() => handleStatusUpdate(record.id, 'confirmed')}
            >
              Xác nhận
            </Button>
          )}
          {record.status === 'confirmed' && (
            <Button 
              type="primary"
              size="small" 
              onClick={() => handleStatusUpdate(record.id, 'completed')}
            >
              Hoàn thành
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Quản lý lịch hẹn
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Thêm lịch hẹn mới
          </Button>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Search
            placeholder="Tìm kiếm theo tên bệnh nhân, bác sĩ hoặc dịch vụ..."
            allowClear
            style={{ width: 350 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="pending">Chờ xác nhận</Option>
            <Option value="confirmed">Đã xác nhận</Option>
            <Option value="completed">Hoàn thành</Option>
            <Option value="cancelled">Đã hủy</Option>
            <Option value="no-show">Không đến</Option>
          </Select>

          <DatePicker
            placeholder="Chọn ngày"
            style={{ width: 150 }}
            onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : 'all')}
          />
        </div>

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
          size="small"
        />
      </Card>

      <Modal
        title={editingAppointment ? 'Chỉnh sửa lịch hẹn' : 'Thêm lịch hẹn mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingAppointment ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="patientName"
            label="Tên bệnh nhân"
            rules={[{ required: true, message: 'Vui lòng nhập tên bệnh nhân!' }]}
          >
            <Input placeholder="Nhập tên bệnh nhân" />
          </Form.Item>

          <Form.Item
            name="patientEmail"
            label="Email bệnh nhân"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập email bệnh nhân" />
          </Form.Item>

          <Form.Item
            name="patientPhone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="doctorName"
            label="Bác sĩ"
            rules={[{ required: true, message: 'Vui lòng chọn bác sĩ!' }]}
          >
            <Select placeholder="Chọn bác sĩ">
              <Option value="Dr. Nguyễn Thị Hương">Dr. Nguyễn Thị Hương</Option>
              <Option value="Dr. Trần Minh Đức">Dr. Trần Minh Đức</Option>
              <Option value="Dr. Lê Thị Mai">Dr. Lê Thị Mai</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="serviceName"
            label="Dịch vụ"
            rules={[{ required: true, message: 'Vui lòng chọn dịch vụ!' }]}
          >
            <Select placeholder="Chọn dịch vụ">
              <Option value="Tư vấn sức khỏe sinh sản">Tư vấn sức khỏe sinh sản</Option>
              <Option value="Xét nghiệm STI cơ bản">Xét nghiệm STI cơ bản</Option>
              <Option value="Tư vấn tâm lý tình dục">Tư vấn tâm lý tình dục</Option>
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="appointmentDate"
              label="Ngày hẹn"
              rules={[{ required: true, message: 'Vui lòng chọn ngày hẹn!' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="appointmentTime"
              label="Giờ hẹn"
              rules={[{ required: true, message: 'Vui lòng chọn giờ hẹn!' }]}
              style={{ flex: 1 }}
            >
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </div>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
              <Option value="no-show">Không đến</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentManagement; 