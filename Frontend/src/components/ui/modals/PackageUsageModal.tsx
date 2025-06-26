import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Typography,
  Space,
  Avatar,
  Tooltip,
  Spin,
  Alert,
  Empty,
  Divider
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { PackageAnalytics, UserPackageUsage, ServiceUsage } from '../../../types';
import packagePurchaseApi from '../../../api/endpoints/packagePurchaseApi';

const { Title, Text } = Typography;

interface PackageUsageModalProps {
  visible: boolean;
  onClose: () => void;
  packageId: string;
  packageName: string;
}

const PackageUsageModal: React.FC<PackageUsageModalProps> = ({
  visible,
  onClose,
  packageId,
  packageName
}) => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<PackageAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!packageId || !visible) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching analytics for package:', packageId);
      
      const response = await packagePurchaseApi.getPackageUsageAnalytics(packageId);
      
      if (response.success && response.data?.analytics) {
        setAnalytics(response.data.analytics);
        console.log('✅ Analytics loaded:', response.data.analytics);
      } else {
        throw new Error('Không thể tải dữ liệu analytics');
      }
    } catch (error: any) {
      console.error('❌ Error fetching analytics:', error);
      setError(error.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && packageId) {
      fetchAnalytics();
    }
  }, [visible, packageId]);

  // Helper functions
  const getStatusColor = (status: UserPackageUsage['status']) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'expired':
        return 'orange';
      case 'used_up':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: UserPackageUsage['status']) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'expired':
        return 'Đã hết hạn';
      case 'used_up':
        return 'Đã sử dụng hết';
      default:
        return 'Không xác định';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Table columns for user usages
  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      width: 200,
      render: (_, record: UserPackageUsage) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 500 }}>{record.userInfo.fullName}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.userInfo.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: UserPackageUsage['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Tiến độ sử dụng',
      key: 'progress',
      width: 150,
      render: (_, record: UserPackageUsage) => (
        <div>
          <Progress
            percent={record.totalUsagePercentage}
            size="small"
            strokeColor={
              record.totalUsagePercentage >= 80 ? '#ff4d4f' :
              record.totalUsagePercentage >= 50 ? '#faad14' : '#52c41a'
            }
          />
          <Text style={{ fontSize: '11px', color: '#666' }}>
            {record.totalUsagePercentage}% đã sử dụng
          </Text>
        </div>
      ),
    },
    {
      title: 'Ngày mua',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 100,
      render: (date: string) => (
        <Tooltip title={new Date(date).toLocaleString('vi-VN')}>
          <Text>{formatDate(date)}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Ngày hết hạn',
      key: 'expiry',
      width: 120,
      render: (_, record: UserPackageUsage) => (
        <div>
          <Text>{formatDate(record.expiryDate)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.daysRemaining > 0 ? `Còn ${record.daysRemaining} ngày` : 'Đã hết hạn'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      width: 120,
      render: (price: number) => (
        <Text strong>{formatCurrency(price)}</Text>
      ),
    }
  ];

  // Expandable row render - show service details
  const expandedRowRender = (record: UserPackageUsage) => {
    const serviceColumns = [
      {
        title: 'Dịch vụ',
        dataIndex: 'serviceName',
        key: 'serviceName',
      },
      {
        title: 'Đã sử dụng',
        dataIndex: 'usedQuantity',
        key: 'usedQuantity',
        width: 100,
        render: (used: number, record: ServiceUsage) => (
          <Text>{used}/{record.maxQuantity}</Text>
        ),
      },
      {
        title: 'Còn lại',
        dataIndex: 'remainingQuantity',
        key: 'remainingQuantity',
        width: 100,
        render: (remaining: number) => (
          <Text type={remaining > 0 ? 'success' : 'danger'}>
            {remaining}
          </Text>
        ),
      },
      {
        title: 'Tiến độ',
        key: 'progress',
        width: 150,
        render: (_, serviceRecord: ServiceUsage) => (
          <Progress
            percent={serviceRecord.usagePercentage}
            size="small"
            strokeColor={
              serviceRecord.usagePercentage >= 80 ? '#ff4d4f' :
              serviceRecord.usagePercentage >= 50 ? '#faad14' : '#52c41a'
            }
          />
        ),
      }
    ];

    return (
      <Table
        columns={serviceColumns}
        dataSource={record.serviceUsages}
        pagination={false}
        size="small"
        rowKey="serviceId"
        style={{ margin: '0 48px' }}
      />
    );
  };

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ color: '#1890ff' }} />
          <span>Usage Analytics - {packageName}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Đang tải dữ liệu analytics...</div>
        </div>
      ) : error ? (
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          action={
            <button 
              onClick={fetchAnalytics}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#1890ff', 
                cursor: 'pointer' 
              }}
            >
              Thử lại
            </button>
          }
        />
      ) : !analytics ? (
        <Empty description="Không có dữ liệu" />
      ) : (
        <div>
          {/* Summary Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Tổng lượt mua"
                  value={analytics.totalPurchases}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Đang hoạt động"
                  value={analytics.activePurchases}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Tổng doanh thu"
                  value={analytics.totalRevenue}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Mức độ sử dụng TB"
                  value={analytics.averageUsagePercentage}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ 
                    color: analytics.averageUsagePercentage >= 70 ? '#52c41a' : 
                           analytics.averageUsagePercentage >= 40 ? '#faad14' : '#ff4d4f'
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* Detailed User Table */}
          <Title level={4}>Chi tiết sử dụng của từng người dùng</Title>
          
          {analytics.userUsages.length > 0 ? (
            <Table
              columns={columns}
              dataSource={analytics.userUsages}
              rowKey="purchaseId"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `Hiển thị ${range[0]}-${range[1]} trong ${total} mục`
              }}
              scroll={{ x: 800 }}
              expandable={{
                expandedRowRender,
                expandRowByClick: true,
                expandIcon: ({ expanded, onExpand, record }) => (
                  <Tooltip title={expanded ? "Ẩn chi tiết dịch vụ" : "Xem chi tiết dịch vụ"}>
                    <span 
                      onClick={e => onExpand(record, e)}
                      style={{ cursor: 'pointer', marginRight: 8 }}
                    >
                      {expanded ? '📊' : '📋'}
                    </span>
                  </Tooltip>
                )
              }}
            />
          ) : (
            <Empty 
              description="Chưa có người dùng nào mua gói này"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default PackageUsageModal; 