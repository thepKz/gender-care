import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Typography,
  Space,
  Button,
  Badge,
  Divider,
  Tooltip,
  Empty,
  Tabs,
  Timeline,
  Progress,
  Statistic,
  Table,
  Modal,
  Descriptions
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  CheckOutlined,
  LinkOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  mockDoctorScheduleData, 
  calculateDashboardStats,
  getStatusColor,
  getStatusText,
  getTypeColor,
  getTypeText,
  getLocationColor,
  getLocationText,
  MockDoctorScheduleItem,
  getDoctorScheduleData
} from '../../../shared/mockData/doctorScheduleMockData';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface DoctorSchedulePreviewProps {
  showStats?: boolean;
  showActions?: boolean;
  maxItems?: number;
}

const DoctorSchedulePreview: React.FC<DoctorSchedulePreviewProps> = ({ 
  showStats = true, 
  showActions = true,
  maxItems = 10 
}) => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MockDoctorScheduleItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Lấy data từ mock data
  const allData = mockDoctorScheduleData;
  const stats = calculateDashboardStats();
  
  // Lọc data cho hôm nay
  const todayData = allData.filter(item => 
    dayjs(item.appointmentDate).isSame(dayjs(), 'day')
  ).slice(0, maxItems);

  // Tách appointment và consultation
  const todayAppointments = todayData.filter(item => item.type === 'appointment');
  const todayConsultations = todayData.filter(item => item.type === 'consultation');

  // Lấy dữ liệu lịch hẹn của bác sĩ hiện tại
  const doctorScheduleData = getDoctorScheduleData();
  const displayData = doctorScheduleData.slice(0, maxItems);

  // Show detail modal
  const showDetailModal = (record: MockDoctorScheduleItem) => {
    setSelectedItem(record);
    setModalVisible(true);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleConfirmAppointment = (record: MockDoctorScheduleItem) => {
    console.log('Xác nhận lịch hẹn:', record._id);
    // TODO: Gọi API xác nhận lịch hẹn
  };

  const columns = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (record: MockDoctorScheduleItem) => (
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
      ),
    },
    {
      title: 'Loại dịch vụ',
      key: 'serviceType',
      render: (record: MockDoctorScheduleItem) => (
        <div>
          <Tag color={getLocationColor(record.typeLocation)}>
            {getTypeText(record.appointmentType)}
          </Tag>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            {record.type === 'appointment' 
              ? `${(record.servicePrice || record.packagePrice || 0).toLocaleString()}đ`
              : `${(record.consultationFee || 0).toLocaleString()}đ`
            }
          </div>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (record: MockDoctorScheduleItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.appointmentTime}</div>
          <Tag 
            color={getLocationColor(record.typeLocation)}
            style={{ marginTop: '4px', fontSize: '11px' }}
          >
            {getLocationText(record.typeLocation)}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (record: MockDoctorScheduleItem) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: MockDoctorScheduleItem) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(record)}
            size="small"
          >
            Chi tiết
          </Button>
          {record.status === 'pending' && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleConfirmAppointment(record)}
              size="small"
            >
              Xác nhận
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={displayData}
        pagination={false}
        size="small"
        rowKey="_id"
        style={{ marginTop: 16 }}
             />

      {/* Modal chi tiết */}
      <Modal
        title={
          <Space>
            <Avatar src={selectedItem?.patientAvatar} icon={<UserOutlined />} />
            <span>Chi tiết lịch hẹn - {selectedItem?.patientName}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={closeDetailModal}
        footer={[
          <Button key="close" onClick={closeDetailModal}>
            Đóng
          </Button>,
          selectedItem?.status === 'pending' && (
            <Button 
              key="confirm" 
              type="primary" 
              icon={<CheckOutlined />}
              onClick={() => handleConfirmAppointment(selectedItem)}
            >
              Xác nhận lịch hẹn
            </Button>
          ),
        ]}
        width={800}
      >
        {selectedItem && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Tên bệnh nhân" span={1}>
                <Space>
                  <Avatar src={selectedItem.patientAvatar} icon={<UserOutlined />} size="small" />
                  <strong>{selectedItem.patientName}</strong>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại" span={1}>
                <Space>
                  <PhoneOutlined />
                  <Text copyable>{selectedItem.patientPhone}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Tuổi" span={1}>
                {selectedItem.patientAge || 'Không rõ'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày hẹn" span={1}>
                <strong>{selectedItem.appointmentDate}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian" span={1}>
                <strong>{selectedItem.appointmentTime}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Hình thức" span={1}>
                <Tag color={getLocationColor(selectedItem.typeLocation)}>
                  {getLocationText(selectedItem.typeLocation)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Loại dịch vụ" span={1}>
                <Tag color={getLocationColor(selectedItem.typeLocation)}>
                  {getTypeText(selectedItem.appointmentType)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={1}>
                <Tag color={getStatusColor(selectedItem.status)}>
                  {getStatusText(selectedItem.status)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Thông tin dịch vụ</Divider>
            <Descriptions column={1} bordered size="small">
              {selectedItem.type === 'appointment' ? (
                <>
                  <Descriptions.Item label="Tên dịch vụ">
                    {selectedItem.serviceName || selectedItem.packageName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giá">
                    <strong>{(selectedItem.servicePrice || selectedItem.packagePrice || 0).toLocaleString()}đ</strong>
                  </Descriptions.Item>
                </>
              ) : (
                <>
                  <Descriptions.Item label="Danh mục tư vấn">
                    {selectedItem.category}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phí tư vấn">
                    <strong>{(selectedItem.consultationFee || 0).toLocaleString()}đ</strong>
                  </Descriptions.Item>
                </>
              )}
              
              <Descriptions.Item label="Mô tả">
                {selectedItem.description}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">
                {selectedItem.notes}
              </Descriptions.Item>
              {selectedItem.doctorNotes && (
                <Descriptions.Item label="Ghi chú của bác sĩ">
                  <Text mark>{selectedItem.doctorNotes}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedItem.type === 'consultation' && selectedItem.question && (
              <>
                <Divider orientation="left">Câu hỏi từ bệnh nhân</Divider>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '6px',
                  fontStyle: 'italic'
                }}>
                  "{selectedItem.question}"
                </div>
              </>
            )}

            {selectedItem.typeLocation === 'online' && selectedItem.meetingInfo && (
              <>
                <Divider orientation="left">Thông tin cuộc họp</Divider>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Meeting ID">
                    <Text copyable>{selectedItem.meetingInfo.meetingId}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Link tham gia">
                    <Space>
                      <LinkOutlined />
                      <a href={selectedItem.meetingInfo.meetingUrl} target="_blank" rel="noopener noreferrer">
                        {selectedItem.meetingInfo.meetingUrl}
                      </a>
                    </Space>
                  </Descriptions.Item>
                  {selectedItem.meetingInfo.password && (
                    <Descriptions.Item label="Mật khẩu">
                      <Text copyable>{selectedItem.meetingInfo.password}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}

            {selectedItem.address && (
              <>
                <Divider orientation="left">Địa chỉ</Divider>
                <Text>{selectedItem.address}</Text>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default DoctorSchedulePreview; 