import React, { useEffect, useState, useCallback } from 'react';
import { Button, Card, Col, Row, Spin, Tag, Typography, message, Empty, Breadcrumb, Table, Badge, Tooltip, Space, Modal, Descriptions } from 'antd';
import { motion } from 'framer-motion';
import { ArrowLeftOutlined, ShoppingOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, EyeOutlined, ScheduleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import packagePurchaseApi from '../../api/endpoints/packagePurchaseApi';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { CalendarOutlined, UserOutlined, CreditCardOutlined } from '@ant-design/icons';
import { PackagePurchase, ServiceItem } from '../../types';

const { Title, Text } = Typography;

const PurchasedPackagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PackagePurchase[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PackagePurchase | null>(null);

  const fetchPurchases = useCallback(async () => {
    try {
      console.log('🔄 [PurchasedPackages] Component mounted/auth changed:', {
        isAuthenticated,
        userId: user?._id,
        hasUser: !!user
      });
      
      if (!isAuthenticated) {
        console.log('⚠️ [PurchasedPackages] User not authenticated, redirecting to login');
        navigate('/login');
        return;
      }
      
      if (!user?._id) {
        console.log('⚠️ [PurchasedPackages] User ID not available, waiting...');
        return;
      }
      
      console.log('✅ [PurchasedPackages] User authenticated, fetching packages');
      setLoading(true);

      const response = await packagePurchaseApi.getUserPurchasedPackages();
      
      console.log('✅ [Frontend] API Response received');
      console.log('✅ [Frontend] Response success:', response.success);
      console.log('✅ [Frontend] Package count:', response.data?.packagePurchases?.length || 0);
      
      if (response.success && response.data?.packagePurchases) {
        const packages = response.data.packagePurchases;
        console.log('✅ [Frontend] Setting packages to state:', packages.length);
        setPurchases(packages);
      } else {
        console.log('⚠️ [Frontend] No packages found or API error:', response.message || 'Unknown error');
        setPurchases([]);
      }
    } catch (error: any) {
      console.error('❌ [Frontend] Error fetching packages:', error);
      
      if (error.response?.status === 401) {
        console.error('❌ [Frontend] Unauthorized - redirecting to login');
        navigate('/login');
      } else {
        console.error('❌ [Frontend] Error details:', error.response?.data);
        message.error('Không thể tải danh sách gói đã mua: ' + (error.response?.data?.message || error.message));
      }
      
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id, navigate]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const renderStatusBadge = (status: PackagePurchase['status']) => {
    const statusConfig = {
      active: { 
        color: 'success', 
        icon: <CheckCircleOutlined />, 
        text: 'Đang hoạt động' 
      },
      expired: { 
        color: 'error', 
        icon: <ExclamationCircleOutlined />, 
        text: 'Đã hết hạn' 
      },
      used_up: { 
        color: 'warning', 
        icon: <ClockCircleOutlined />, 
        text: 'Đã sử dụng hết' 
      }
    };

    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <Badge 
        status={config.color as any} 
        text={
          <Space>
            {config.icon}
            {config.text}
          </Space>
        } 
      />
    );
  };

  const calculateRemainingServices = (purchase: PackagePurchase) => {
    if (!purchase.servicePackage?.services || !purchase.usedServices) return 0;
    
    const totalServices = purchase.servicePackage.services.reduce(
      (sum, service) => sum + service.quantity, 
      0
    );
    
    const usedCount = purchase.usedServices.reduce(
      (sum, used) => sum + used.usedCount, 
      0
    );
    
    return Math.max(0, totalServices - usedCount);
  };

  const calculateDaysRemaining = (purchase: PackagePurchase) => {
    if (!purchase.expiresAt) return 0;
    
    const today = new Date();
    const expiry = new Date(purchase.expiresAt);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const showPurchaseDetails = (purchase: PackagePurchase) => {
    setSelectedPurchase(purchase);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'Gói dịch vụ',
      key: 'package',
      render: (_, record: PackagePurchase) => (
        <div>
          <Text strong>{record.servicePackage?.name || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.servicePackage?.description || 'Không có mô tả'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <Text strong className="text-green-600">
          {new Intl.NumberFormat('vi-VN').format(amount)} VNĐ
        </Text>
      ),
    },
    {
      title: 'Dịch vụ',
      key: 'services',
      render: (_, record: PackagePurchase) => {
        const services = record.servicePackage?.services || [];
        const totalQuantity = services.reduce((sum, service) => sum + service.quantity, 0);
        const remainingServices = calculateRemainingServices(record);
        
        return (
          <div>
            <Tag color="blue">{services.length} loại</Tag>
            <Tag color={remainingServices > 0 ? 'green' : 'red'}>
              {remainingServices}/{totalQuantity} còn lại
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Thời hạn',
      key: 'validity',
      render: (_, record: PackagePurchase) => {
        const daysRemaining = calculateDaysRemaining(record);
        const purchaseDate = new Date(record.purchaseDate).toLocaleDateString('vi-VN');
        const expiryDate = record.expiresAt ? 
          new Date(record.expiresAt).toLocaleDateString('vi-VN') : 'N/A';
        
        return (
          <div>
            <div>
              <CalendarOutlined style={{ marginRight: 4, color: '#1890ff' }} />
              <Text>{purchaseDate}</Text>
            </div>
            <div>
              <ScheduleOutlined style={{ marginRight: 4, color: daysRemaining > 7 ? '#52c41a' : '#ff4d4f' }} />
              <Text style={{ color: daysRemaining > 7 ? '#52c41a' : '#ff4d4f' }}>
                {daysRemaining > 0 ? `${daysRemaining} ngày` : 'Đã hết hạn'}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: PackagePurchase['status']) => renderStatusBadge(status),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record: PackagePurchase) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => showPurchaseDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Breadcrumb 
                className="mb-4"
                items={[
                  {
                    title: <a href="/">Trang chủ</a>
                  },
                  {
                    title: <a href="/user-profiles">Hồ sơ bệnh án</a>
                  },
                  {
                    title: "Gói dịch vụ đã mua"
                  }
                ]}
              />

              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#0C3C54]/10 rounded-full">
                  <ShoppingOutlined style={{ fontSize: 32, color: "#0C3C54" }} />
                </div>
                <div>
                  <Title level={2} className="mb-1 !text-[#0C3C54]">
                    Gói dịch vụ đã mua
                  </Title>
                  <Text type="secondary" className="text-base text-[#0C3C54]/70">
                    Quản lý và theo dõi các gói dịch vụ bạn đã mua
                  </Text>
                </div>
              </div>
            </div>

            <Button
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={() => navigate('/user-profiles')}
              className="hidden md:flex bg-[#0C3C54] text-white border-0 hover:bg-[#0C3C54]/90"
            >
              Quay lại
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 py-8 md:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Welcome Card */}
          <div className="mt-5 mb-10 bg-[#0C3C54] border-0 text-white rounded-2xl p-6 md:p-10 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-semibold mb-2 flex items-center">
                  Xin chào, {user?.fullName || 'Người dùng'}
                  <span className="ml-2 text-lg align-middle" style={{fontSize: '1.5rem', paddingLeft: '0.25rem'}}>👋</span>
                </h3>
                <p className="text-white/80 text-base mb-3">
                  Dưới đây là danh sách các gói dịch vụ bạn đã mua. Bạn có thể sử dụng chúng để đặt lịch khám bệnh miễn phí.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    <span>Tổng: {purchases.length} gói</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-300 rounded-full"></span>
                    <span>Đang hoạt động: {purchases.filter(p => p.isActive && new Date(p.expiresAt || p.expiryDate) > new Date() && p.remainingUsages > 0).length}</span>
                  </span>
                </div>
              </div>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/services')}
                className="bg-white text-[#0C3C54] border-0 hover:bg-[#0C3C54]/10 font-medium px-6 py-2 rounded-lg shadow-md"
              >
                Mua gói mới
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
              <span className="ml-3 text-gray-600">Đang tải danh sách gói đã mua...</span>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-20">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có gói dịch vụ nào</h3>
                    <p className="text-gray-500 mb-4">Bạn chưa mua gói dịch vụ nào. Hãy khám phá các gói dịch vụ của chúng tôi.</p>
                  </div>
                }
              >
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate('/services')}
                  className="bg-[#0C3C54] hover:bg-[#0C3C54]/90"
                >
                  Khám phá gói dịch vụ
                </Button>
              </Empty>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={purchases}
              rowKey="_id"
              pagination={{
                total: purchases.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} gói dịch vụ`,
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết gói dịch vụ"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedPurchase && (
          <div className="space-y-6">
            {/* Package Basic Info */}
            <Card title="Thông tin gói" size="small">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Tên gói" span={2}>
                  <Text strong>{selectedPurchase.servicePackage?.name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả" span={2}>
                  {selectedPurchase.servicePackage?.description || 'Không có mô tả'}
                </Descriptions.Item>
                <Descriptions.Item label="Giá trị">
                  <Text strong className="text-green-600">
                    {new Intl.NumberFormat('vi-VN').format(selectedPurchase.totalAmount)} VNĐ
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {renderStatusBadge(selectedPurchase.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày mua">
                  {new Date(selectedPurchase.purchaseDate).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày hết hạn">
                  {selectedPurchase.expiresAt ? 
                    new Date(selectedPurchase.expiresAt).toLocaleDateString('vi-VN') : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Services in Package */}
            <Card title="Dịch vụ trong gói" size="small">
              {selectedPurchase.servicePackage?.services?.map((service, index) => {
                const usedService = selectedPurchase.usedServices?.find(
                  used => used.serviceId === (
                    typeof service.serviceId === 'object' ? 
                    service.serviceId._id : 
                    service.serviceId
                  )
                );
                
                const usedCount = usedService?.usedCount || 0;
                const remainingCount = service.quantity - usedCount;
                
                return (
                  <div key={index} className="flex justify-between items-center p-3 border-b last:border-b-0">
                    <div>
                      <Text strong>
                        {typeof service.serviceId === 'object' ? 
                          service.serviceId.serviceName : 
                          'Dịch vụ không xác định'}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {typeof service.serviceId === 'object' ? 
                          service.serviceId.description || 'Không có mô tả' : ''}
                      </Text>
                    </div>
                    <div className="text-right">
                      <div>
                        <Tag color={remainingCount > 0 ? 'green' : 'red'}>
                          {remainingCount}/{service.quantity} còn lại
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Đã sử dụng: {usedCount}
                      </Text>
                    </div>
                  </div>
                );
              })}
            </Card>

            {/* Usage History */}
            {selectedPurchase.usedServices && selectedPurchase.usedServices.length > 0 && (
              <Card title="Lịch sử sử dụng" size="small">
                {selectedPurchase.usedServices.map((usage, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border-b last:border-b-0">
                    <div>
                      <Text>Dịch vụ: {
                        typeof usage.serviceId === 'object' ? 
                          usage.serviceId.serviceName : 
                          usage.serviceId
                      }</Text>
                      {usage.usedDate && (
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Ngày sử dụng: {new Date(usage.usedDate).toLocaleDateString('vi-VN')}
                          </Text>
                        </div>
                      )}
                    </div>
                    <Tag color="blue">{usage.usedCount} lần</Tag>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchasedPackagesPage; 