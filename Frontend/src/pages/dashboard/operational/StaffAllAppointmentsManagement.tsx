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
  message,
  Descriptions,
  Popconfirm,
  Row,
  Col,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { appointmentApi } from '../../../api/endpoints';
import { useAuth } from '../../../hooks/useAuth';
import { TestResultsForm } from '../../../components/feature/medical/TestResultsForm';
import MedicalRecordModal from '../../../components/ui/forms/MedicalRecordModal';
import ViewMedicalRecordModal from '../../../components/ui/forms/ViewMedicalRecordModal';
import SimpleDatePicker from '../../../components/ui/SimpleDatePicker';
import medicalApi from '../../../api/endpoints/medical';
import { doctorApi } from '../../../api/endpoints/doctorApi';
import { getServicePackageById } from '../../../api/endpoints/servicePackageApi';
import { getServiceById } from '../../../api/endpoints/serviceApi';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
// Removed TabPane import as it's deprecated

dayjs.extend(isSameOrAfter);

interface DoctorAppointment {
  _id: string;
  profileId: {
    _id: string;
    fullName: string;
    phoneNumber: string;
    dateOfBirth?: string;
    gender?: string;
  };
  serviceId: {
    _id: string;
    serviceName: string;
    serviceType: string;
  };
  doctorId: {
    _id: string;
    userId: {
      fullName: string;
    };
  };
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test' | 'other';
  typeLocation: 'clinic' | 'home' | 'Online';
  address?: string;
  description: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'consulting' | 'done_testResultItem' | 'done_testResult' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Đổi tên component và chỉ cho phép staff truy cập
const StaffAllAppointmentsManagement: React.FC = () => {
  const { user } = useAuth();
  // Nếu không phải staff thì không cho truy cập
  if (user?.role !== 'staff') {
    return (
      <div style={{ padding: '24px' }}>
        <Typography.Title level={3}>403 - Bạn không có quyền truy cập chức năng này</Typography.Title>
      </div>
    );
  }
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [medicalRecordModalVisible, setMedicalRecordModalVisible] = useState(false);
  const [viewMedicalRecordModalVisible, setViewMedicalRecordModalVisible] = useState(false);
  const [hasMedicalRecord, setHasMedicalRecord] = useState<boolean | null>(null);
  const [medicalRecordId, setMedicalRecordId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');

  useEffect(() => {
    loadStaffAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchText, selectedStatus, activeTab, selectedDoctor, selectedDate]);

  useEffect(() => {
    const checkMedicalRecord = async () => {
      if (isDetailModalVisible && selectedAppointment) {
        try {
          const res = await medicalApi.checkMedicalRecordByAppointment(selectedAppointment._id);
          if (res.data?.exists && res.data?.medicalRecordId) {
            setHasMedicalRecord(true);
            setMedicalRecordId(res.data.medicalRecordId);
          } else {
            setHasMedicalRecord(false);
            setMedicalRecordId(null);
          }
        } catch (e) {
          setHasMedicalRecord(false);
          setMedicalRecordId(null);
        }
      }
    };
    checkMedicalRecord();
  }, [isDetailModalVisible, selectedAppointment]);

  // Lấy tất cả lịch hẹn cho staff (đơn giản hóa logic)
  const loadStaffAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.getAllAppointments({ limit: 200 });
      const appointmentsRaw = response.data.appointments;
      const filteredAppointments: DoctorAppointment[] = [];

      for (const appointment of appointmentsRaw || []) {
        let match = true;

        if (match) {
          let serviceName = appointment.serviceId?.serviceName || 'N/A';
          let serviceType = appointment.serviceId?.serviceType || 'consultation';

          if (appointment.packageId) {
            serviceName = appointment.packageId?.name || 'Gói dịch vụ';
            serviceType = 'package';
          }

          filteredAppointments.push({
            _id: appointment._id,
            profileId: {
              _id: appointment.profileId?._id || appointment.profileId || '',
              fullName: appointment.profileId?.fullName || 'N/A',
              phoneNumber: appointment.profileId?.phone || appointment.profileId?.phoneNumber || 'N/A',
              dateOfBirth: appointment.profileId?.dateOfBirth,
              gender: appointment.profileId?.gender
            },
            serviceId: {
              _id: appointment.serviceId?._id || appointment.serviceId || '',
              serviceName,
              serviceType
            },
            doctorId: appointment.doctorId ? {
              _id: appointment.doctorId._id || appointment.doctorId || '',
              userId: {
                fullName: appointment.doctorId?.userId?.fullName || 'Chưa phân công'
              }
            } : {
              _id: '',
              userId: { fullName: 'Chưa phân công' }
            },
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            appointmentType: appointment.appointmentType || 'consultation',
            typeLocation: appointment.typeLocation || 'clinic',
            address: appointment.address || '',
            description: appointment.description || '',
            notes: appointment.notes || '',
            status: appointment.status,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt
          });
        }
      }
      setAppointments(filteredAppointments);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      message.error('Không thể tải danh sách lịch hẹn của bạn');
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách bác sĩ duy nhất từ appointments
  const doctorOptions = Array.from(new Set(appointments.map(a => a.doctorId?.userId?.fullName).filter(Boolean)));

  const filterAppointments = () => {
    let filtered = appointments;
    const today = dayjs().format('YYYY-MM-DD');

    switch (activeTab) {
      case 'today':
        filtered = filtered.filter(apt =>
          dayjs(apt.appointmentDate).format('YYYY-MM-DD') === today
        );
        break;
      case 'upcoming':
        filtered = filtered.filter(apt =>
          dayjs(apt.appointmentDate).isSameOrAfter(dayjs(), 'day') &&
          !['cancelled', 'expired', 'doctor_cancel'].includes(apt.status)
        );
        break;
      case 'completed':
        filtered = filtered.filter(apt =>
          ['completed', 'done_testResult', 'done_testResultItem'].includes(apt.status)
        );
        break;
      case 'selected-date':
        if (selectedDate) {
          filtered = filtered.filter(apt => dayjs(apt.appointmentDate).format('YYYY-MM-DD') === selectedDate);
        }
        break;
    }
    if (searchText) {
      filtered = filtered.filter(apt =>
        apt.profileId.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        apt.profileId.phoneNumber.includes(searchText) ||
        apt.serviceId.serviceName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }
    if (selectedDoctor !== 'all') {
      filtered = filtered.filter(apt => apt.doctorId?.userId?.fullName === selectedDoctor);
    }

    setFilteredAppointments(filtered);
  };

  const getStatusColor = (status: DoctorAppointment['status']) => {
    const colors = {
      pending: 'orange',
      confirmed: 'blue',
      consulting: 'lime',
      done_testResultItem: 'blue',
      done_testResult: 'cyan',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: DoctorAppointment['status']) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      consulting: 'Đang khám',
      done_testResultItem: 'Hoàn thành kết quả',
      done_testResult: 'Hoàn thành hồ sơ',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await appointmentApi.updateAppointmentStatus(appointmentId, 'completed');
      message.success('Đã cập nhật trạng thái cuộc hẹn thành công');
      loadStaffAppointments();
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái cuộc hẹn');
    }
  };

  const handleStartExamination = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setShowTestForm(true);
  };

  const handleTestSuccess = () => {
    message.success('Đã lưu kết quả xét nghiệm thành công!');
    setShowTestForm(false);
    setSelectedAppointment(null);
    loadStaffAppointments();
  };

  const showAppointmentDetails = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setIsDetailModalVisible(true);
  };

  const handleCreateMedicalRecord = async (medicalRecordData) => {
    try {
      await medicalApi.createMedicalRecord(medicalRecordData);
      setMedicalRecordModalVisible(false);
      setHasMedicalRecord(true);
      message.success('Tạo hồ sơ bệnh án thành công!');
      return true;
    } catch (e) {
      message.error('Tạo hồ sơ bệnh án thất bại!');
      return false;
    }
  };

  const columns: ColumnsType<DoctorAppointment> = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.profileId.fullName}</div>
          <div className="text-sm text-gray-500">{record.profileId.phoneNumber}</div>
        </div>
      ),
    },
    {
      title: 'Bác sĩ',
      key: 'doctor',
      dataIndex: ['doctorId', 'userId', 'fullName'],
      sorter: (a, b) => {
        const nameA = a.doctorId?.userId?.fullName || '';
        const nameB = b.doctorId?.userId?.fullName || '';
        return nameA.localeCompare(nameB, 'vi');
      },
      sortDirections: ['ascend', 'descend'],
      render: (_, record) => (
        <span>
          {record.doctorId?.userId?.fullName || 'Chưa phân công'}
        </span>
      ),
    },
    {
      title: 'Dịch vụ',
      dataIndex: ['serviceId', 'serviceName'],
      key: 'service',
    },
    {
      title: 'Thời gian',
      key: 'datetime',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.appointmentDate).format('DD/MM/YYYY')}</div>
          <div className="text-sm text-gray-500">{record.appointmentTime}</div>
        </div>
      ),
    },
    {
      title: 'Loại',
      key: 'type',
      render: (_, record) => {
        // Ưu tiên lấy serviceType nếu có, fallback về appointmentType
        const type = record.serviceId?.serviceType || record.appointmentType;
        const typeColors = {
          consultation: 'blue',
          test: 'green',
          treatment: 'orange',
          other: 'purple'
        };
        const typeTexts = {
          consultation: 'Tư vấn',
          test: 'Xét nghiệm',
          treatment: 'Điều trị',
          other: 'Khác'
        };
        return <Tag color={typeColors[type] || 'default'}>{typeTexts[type] || 'Khác'}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showAppointmentDetails(record)}
            />
          </Tooltip>

          {record.status === 'confirmed' && (
            <Popconfirm
              title="Xác nhận bắt đầu khám?"
              onConfirm={async () => {
                try {
                  await appointmentApi.updateAppointmentStatus(record._id, 'consulting');
                  message.success('Đã chuyển trạng thái sang Đang khám');
                  loadStaffAppointments();
                } catch (error) {
                  message.error('Lỗi khi cập nhật trạng thái cuộc hẹn');
                }
              }}
              okText="Có"
              cancelText="Không"
            >
              <Tooltip title="Bắt đầu khám">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />}
                  style={{ backgroundColor: '#e6ffed', border: 'none', borderRadius: '50%' }}
                />
              </Tooltip>
            </Popconfirm>
          )}

          {/* Nút chuyển trạng thái từ consulting về confirmed */}
          {record.status === 'consulting' && (
            <Popconfirm
              title="Chuyển về trạng thái Đã xác nhận?"
              onConfirm={async () => {
                try {
                  await appointmentApi.updateAppointmentStatus(record._id, 'confirmed');
                  message.success('Đã chuyển trạng thái về Đã xác nhận');
                  loadStaffAppointments();
                } catch (error) {
                  message.error('Lỗi khi cập nhật trạng thái cuộc hẹn');
                }
              }}
              okText="Có"
              cancelText="Không"
            >
              <Tooltip title="Chuyển về Đã xác nhận">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
                  style={{ backgroundColor: '#e6f7ff', border: 'none', borderRadius: '50%' }}
                />
              </Tooltip>
            </Popconfirm>
          )}

          {(record.status === 'completed' && record.serviceId.serviceType === 'test' && false) && (
            <Tooltip title="Nhập kết quả xét nghiệm">
              <Button
                type="text"
                icon={<ExperimentOutlined />}
                onClick={() => handleStartExamination(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (showTestForm && selectedAppointment) {
    return (
      <div className="doctorAppointmentSchedule p-6">
        <TestResultsForm
          serviceId={selectedAppointment.serviceId._id}
          testResultId={selectedAppointment._id}
          patientName={selectedAppointment.profileId.fullName}
          onSuccess={handleTestSuccess}
          onCancel={() => setShowTestForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="doctorAppointmentSchedule p-6">
      <div className="doctorAppointmentSchedule__header mb-6">
        <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
          Quản lý tất cả lịch hẹn
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Quản lý tất cả lịch hẹn được phân công cho bạn
        </Text>
      </div>

      <Card className="mb-6">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: "today",
              label: (
                <span>
                  <ClockCircleOutlined />
                  Hôm nay
                </span>
              ),
            },
            {
              key: "upcoming",
              label: (
                <span>
                  <CalendarOutlined />
                  Sắp tới
                </span>
              ),
            },
            {
              key: "completed",
              label: (
                <span>
                  <CheckCircleOutlined />
                  Đã hoàn thành
                </span>
              ),
            },
            {
              key: "selected-date",
              label: (
                <span>
                  <SearchOutlined />
                  Theo ngày
                </span>
              ),
            },
          ]}
        />

        <div className="mt-4">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Tìm kiếm bệnh nhân, dịch vụ..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: '100%' }}
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="confirmed">Đã xác nhận</Option>
                <Option value="consulting">Đang khám</Option>
                <Option value="done_testResultItem">Hoàn thành kết quả</Option>
                <Option value="done_testResult">Hoàn thành hồ sơ</Option>
                <Option value="completed">Hoàn thành</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                value={selectedDoctor}
                onChange={setSelectedDoctor}
                style={{ width: '100%' }}
              >
                <Option value="all">Tất cả bác sĩ</Option>
                {doctorOptions.map(name => (
                  <Option key={name} value={name}>{name}</Option>
                ))}
              </Select>
            </Col>
            {activeTab === 'selected-date' && (
              <Col xs={24} sm={12} md={8}>
                <SimpleDatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  placeholder="Chọn ngày"
                />
              </Col>
            )}
          </Row>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredAppointments}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: filteredAppointments.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} cuộc hẹn`,
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết cuộc hẹn"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={(() => {
          if (!selectedAppointment) return [<Button key="close" onClick={() => setIsDetailModalVisible(false)}>Đóng</Button>];
          const isTest = selectedAppointment.serviceId?.serviceType === 'test';
          // Nếu là xét nghiệm
          if (isTest) {
            return [
              <Button key="close" onClick={() => setIsDetailModalVisible(false)}>Đóng</Button>,
              // TODO: kiểm tra đã có testResult chưa, nếu chưa thì cho nhập, nếu có thì cho xem
              false && <Button key="test" type="primary" onClick={() => { setShowTestForm(true); setIsDetailModalVisible(false); }}>
                Nhập kết quả xét nghiệm
              </Button>
            ];
          }
          // Nếu là tư vấn/điều trị
          return [
            <Button key="close" onClick={() => setIsDetailModalVisible(false)}>Đóng</Button>,
            hasMedicalRecord === false && (
              <Button key="create" type="primary" onClick={() => setMedicalRecordModalVisible(true)}>
                Tạo hồ sơ bệnh án
              </Button>
            ),
            hasMedicalRecord === true && medicalRecordId && (
              <Button key="view" onClick={() => setViewMedicalRecordModalVisible(true)}>
                Xem hồ sơ bệnh án
              </Button>
            )
          ].filter(Boolean);
        })()}
        width={600}
      >
        {selectedAppointment && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Bệnh nhân">
              {selectedAppointment.profileId.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {selectedAppointment.profileId.phoneNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              {selectedAppointment.serviceId.serviceName}
            </Descriptions.Item>
            <Descriptions.Item label="Loại dịch vụ">
              {selectedAppointment.serviceId.serviceType}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hẹn">
              {dayjs(selectedAppointment.appointmentDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {selectedAppointment.appointmentTime}
            </Descriptions.Item>
            <Descriptions.Item label="Địa điểm">
              {selectedAppointment.typeLocation === 'clinic' ? 'Phòng khám' : 
               selectedAppointment.typeLocation === 'Online' ? 'Trực tuyến' : 'Tại nhà'}
            </Descriptions.Item>
            {selectedAppointment.address && (
              <Descriptions.Item label="Địa chỉ">
                {selectedAppointment.address}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Mô tả">
              {selectedAppointment.description || 'Không có mô tả'}
            </Descriptions.Item>
            {selectedAppointment.notes && (
              <Descriptions.Item label="Ghi chú">
                {selectedAppointment.notes}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusColor(selectedAppointment.status)}>
                {getStatusText(selectedAppointment.status)}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal tạo hồ sơ bệnh án */}
      <MedicalRecordModal
        visible={medicalRecordModalVisible}
        onCancel={() => setMedicalRecordModalVisible(false)}
        appointment={selectedAppointment && {
          key: selectedAppointment._id,
          _id: selectedAppointment._id,
          patientName: selectedAppointment.profileId?.fullName || '',
          patientPhone: selectedAppointment.profileId?.phoneNumber || '',
          serviceName: selectedAppointment.serviceId?.serviceName || '',
          serviceType: selectedAppointment.serviceId?.serviceType || '',
          doctorName: selectedAppointment.doctorId?.userId?.fullName || '',
          doctorSpecialization: '',
          appointmentDate: selectedAppointment.appointmentDate,
          appointmentTime: selectedAppointment.appointmentTime,
          appointmentType: selectedAppointment.appointmentType,
          typeLocation: selectedAppointment.typeLocation,
          address: selectedAppointment.address,
          description: selectedAppointment.description,
          notes: selectedAppointment.notes,
          status: selectedAppointment.status as any,
          totalAmount: undefined,
          paymentStatus: undefined,
          bookingType: undefined,
          createdAt: selectedAppointment.createdAt,
          updatedAt: selectedAppointment.updatedAt,
          type: 'appointment',
          originalData: selectedAppointment as any
        }}
        onSubmit={handleCreateMedicalRecord}
      />
      {/* Modal xem hồ sơ bệnh án */}
      <ViewMedicalRecordModal
        visible={viewMedicalRecordModalVisible}
        appointment={selectedAppointment ? {
          _id: selectedAppointment._id,
          patientName: selectedAppointment.profileId?.fullName || '',
          patientPhone: selectedAppointment.profileId?.phoneNumber || '',
          serviceName: selectedAppointment.serviceId?.serviceName || '',
          appointmentDate: selectedAppointment.appointmentDate,
          appointmentTime: selectedAppointment.appointmentTime,
          appointmentType: selectedAppointment.appointmentType,
        } : null}
        onCancel={() => setViewMedicalRecordModalVisible(false)}
      />
    </div>
  );
};

export default StaffAllAppointmentsManagement;