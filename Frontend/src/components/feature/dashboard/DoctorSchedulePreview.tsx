import React, { useState, useEffect } from 'react';
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
import appointmentManagementService from '../../../api/services/appointmentManagementService';
import { UnifiedAppointment } from '../../../types/appointment';

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
  const [selectedItem, setSelectedItem] = useState<UnifiedAppointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);

  // ✅ Load real appointments từ API
  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log('📋 [API] Loading doctor appointments for preview...');
      
      // Lấy appointments của doctor hiện tại
      const realAppointments = await appointmentManagementService.getAllDoctorAppointments({
        page: 1,
        limit: maxItems * 2, // Load extra to filter today's data
      });
      
      // Lọc appointments cho hôm nay và sắp xếp theo thời gian
      const todayAppointments = realAppointments
        .filter(apt => dayjs(apt.appointmentDate).isSame(dayjs(), 'day'))
        .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
        .slice(0, maxItems);
      
      setAppointments(todayAppointments);
      console.log('✅ [API] Loaded today\'s appointments:', todayAppointments.length);
      
    } catch (error) {
      console.error('❌ [API] Failed to load appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxItems]);

  const displayData = appointments;

  // ✅ Helper functions for status and type formatting
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: 'gold',
      pending: 'orange',
      scheduled: 'purple',
      confirmed: 'blue',
      consulting: 'lime',
      completed: 'green',
      cancelled: 'red',
      paid: 'cyan'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending_payment: 'Chờ thanh toán',
      pending: 'Chờ xác nhận',
      scheduled: 'Đã lên lịch',
      confirmed: 'Đã xác nhận',
      consulting: 'Đang tư vấn',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      paid: 'Đã thanh toán'
    };
    return texts[status] || status;
  };

  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      consultation: 'Tư vấn',
      test: 'Xét nghiệm',
      'online-consultation': 'Tư vấn online',
      other: 'Khác'
    };
    return texts[type] || 'Khác';
  };

  const getLocationColor = (location: string) => {
    const colors: Record<string, string> = {
      clinic: 'volcano',
      home: 'cyan',
      Online: 'geekblue'
    };
    return colors[location] || 'default';
  };

  const getLocationText = (location: string) => {
    const texts: Record<string, string> = {
      clinic: 'Phòng khám',
      Online: 'Trực tuyến',
      home: 'Tại nhà'
    };
    return texts[location] || location;
  };

  // Show detail modal
  const showDetailModal = (record: UnifiedAppointment) => {
    setSelectedItem(record);
    setModalVisible(true);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleConfirmAppointment = async (record: UnifiedAppointment) => {
    try {
      console.log('✅ [API] Confirming appointment:', record._id);
      // TODO: Call real API to confirm appointment
      // await appointmentManagementService.confirmAppointment(record._id);
      
      // Refresh data after confirmation
      loadAppointments();
    } catch (error) {
      console.error('❌ [API] Failed to confirm appointment:', error);
    }
  };

  const columns = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (record: UnifiedAppointment) => (
        <Space>
          <Avatar 
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
      render: (record: UnifiedAppointment) => (
        <div>
          <Tag color={getLocationColor(record.typeLocation)}>
            {getTypeText(record.appointmentType)}
          </Tag>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            {record.serviceName}
          </div>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (record: UnifiedAppointment) => (
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
      render: (record: UnifiedAppointment) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: UnifiedAppointment) => (
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
        loading={loading}
        style={{ marginTop: 16 }}
             />

      {/* Modal chi tiết - ✅ SỬ DỤNG REAL APPOINTMENT DATA */}
      <Modal
        title={
          <Space>
            <Avatar icon={<UserOutlined />} />
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
                  <Avatar icon={<UserOutlined />} size="small" />
                  <strong>{selectedItem.patientName}</strong>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại" span={1}>
                <Space>
                  <PhoneOutlined />
                  <Text copyable>{selectedItem.patientPhone}</Text>
                </Space>
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
              <Descriptions.Item label="Trạng thái" span={2}>
                <Tag color={getStatusColor(selectedItem.status)}>
                  {getStatusText(selectedItem.status)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Thông tin dịch vụ</Divider>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Tên dịch vụ">
                {selectedItem.serviceName}
              </Descriptions.Item>
              <Descriptions.Item label="Loại dịch vụ">
                {selectedItem.serviceType}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                {selectedItem.description || 'Không có mô tả'}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">
                {selectedItem.notes || 'Không có ghi chú'}
              </Descriptions.Item>
            </Descriptions>

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