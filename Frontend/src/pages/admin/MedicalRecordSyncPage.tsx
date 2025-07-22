import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  message,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  Tag,
  Modal,
  Spin,
  Alert
} from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import medicalApi from '../../api/endpoints/medical';

const { Title, Text } = Typography;

interface PendingAppointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  profileName: string;
  doctorName: string;
}

interface SyncResult {
  appointmentId: string;
  medicalRecordId?: string;
  status: 'success' | 'error';
  error?: string;
}

const MedicalRecordSyncPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    errors: 0
  });

  // Load pending appointments
  const loadPendingAppointments = async () => {
    try {
      setLoading(true);
      const response = await medicalApi.getPendingSyncAppointments();
      if (response.data.success) {
        setPendingAppointments(response.data.data.appointments);
        setStats(prev => ({ ...prev, total: response.data.data.total }));
      }
    } catch (error: any) {
      message.error('Lỗi khi tải danh sách appointments cần sync');
      console.error('Error loading pending appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync single appointment
  const syncSingleAppointment = async (appointmentId: string) => {
    try {
      const response = await medicalApi.syncAppointmentToMedicalRecord(appointmentId);
      if (response.data.success) {
        message.success('Đồng bộ medical record thành công!');
        loadPendingAppointments(); // Reload list
        return true;
      }
    } catch (error: any) {
      message.error(`Lỗi sync appointment: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  // Sync all appointments
  const syncAllAppointments = async () => {
    Modal.confirm({
      title: 'Xác nhận đồng bộ tất cả',
      content: `Bạn có chắc muốn đồng bộ tất cả ${pendingAppointments.length} appointments thành medical records?`,
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          setLoading(true);
          const response = await medicalApi.syncAllCompletedAppointments();
          if (response.data.success) {
            const results = response.data.data;
            setSyncResults(results.details);
            setStats({
              total: results.total,
              success: results.success,
              errors: results.errors
            });
            message.success(`Đồng bộ hoàn tất! Thành công: ${results.success}/${results.total}`);
            loadPendingAppointments(); // Reload list
          }
        } catch (error: any) {
          message.error(`Lỗi sync bulk: ${error.response?.data?.message || error.message}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  useEffect(() => {
    loadPendingAppointments();
  }, []);

  const columns = [
    {
      title: 'Appointment ID',
      dataIndex: '_id',
      key: '_id',
      render: (id: string) => <Text code>{id.slice(-8)}</Text>
    },
    {
      title: 'Ngày hẹn',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      render: (date: string, record: PendingAppointment) => (
        <Space>
          <CalendarOutlined />
          <Text>{new Date(date).toLocaleDateString('vi-VN')}</Text>
          <Text type="secondary">{record.appointmentTime}</Text>
        </Space>
      )
    },
    {
      title: 'Bệnh nhân',
      dataIndex: 'profileName',
      key: 'profileName'
    },
    {
      title: 'Bác sĩ',
      dataIndex: 'doctorName',
      key: 'doctorName'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          'done_testResult': { color: 'green', text: 'Hoàn thành kết quả' },
          'done_testResultItem': { color: 'blue', text: 'Hoàn thành xét nghiệm' },
          'completed': { color: 'purple', text: 'Hoàn thành' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record: PendingAppointment) => (
        <Button
          type="primary"
          size="small"
          icon={<SyncOutlined />}
          onClick={() => syncSingleAppointment(record._id)}
        >
          Sync
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            Medical Record Sync Management
          </Title>
          <Text type="secondary">
            Đồng bộ appointments "Hoàn thành kết quả" thành medical records
          </Text>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Appointments cần sync"
                value={pendingAppointments.length}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã sync thành công"
                value={stats.success}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Lỗi sync"
                value={stats.errors}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng cộng"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Actions */}
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={syncAllAppointments}
            disabled={pendingAppointments.length === 0}
            loading={loading}
          >
            Sync tất cả ({pendingAppointments.length})
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={loadPendingAppointments}
            loading={loading}
          >
            Làm mới
          </Button>
        </Space>

        {/* Alert */}
        {pendingAppointments.length === 0 && !loading && (
          <Alert
            message="Không có appointments nào cần sync"
            description="Tất cả appointments 'Hoàn thành kết quả' đã được đồng bộ thành medical records."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Table */}
        <Table
          columns={columns}
          dataSource={pendingAppointments}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} appointments`
          }}
        />

        {/* Sync Results */}
        {syncResults.length > 0 && (
          <Card title="Kết quả sync gần nhất" style={{ marginTop: 16 }}>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {syncResults.map((result, index) => (
                <div key={index} style={{ marginBottom: 8 }}>
                  <Space>
                    {result.status === 'success' ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    )}
                    <Text code>{result.appointmentId.slice(-8)}</Text>
                    {result.status === 'success' ? (
                      <Text type="success">Thành công</Text>
                    ) : (
                      <Text type="danger">{result.error}</Text>
                    )}
                  </Space>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default MedicalRecordSyncPage;
