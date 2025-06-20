import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Spin, Tag, Typography, message, Empty, Breadcrumb } from 'antd';
import { motion } from 'framer-motion';
import { ArrowLeftOutlined, ShoppingOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import packagePurchaseApi from '../../api/endpoints/packagePurchaseApi';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { CalendarOutlined, UserOutlined, CreditCardOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface PackagePurchase {
  _id: string;
  userId: string;
  profileId: {
    _id: string;
    fullName: string;
    phone?: string;
    year?: string;
    gender: string;
  } | null;
  packageId: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    serviceIds?: Array<{
      _id: string;
      serviceName: string;
      price?: number;
      description?: string;
      serviceType?: string;
    }>;
    durationInDays?: number;
    maxUsages?: number;
  } | null;
  billId: {
    _id: string;
    subtotal: number;
    discountAmount?: number;
    totalAmount: number;
    status: string;
    createdAt: string;
  } | null;
  activatedAt?: string;
  expiredAt?: string;
  remainingUsages?: number;
  totalAllowedUses?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

const PurchasedPackagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackagePurchase[]>([]);
  const [debugTesting, setDebugTesting] = useState(false);
  const [debugResponse, setDebugResponse] = useState<any>(null);

  useEffect(() => {
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
    fetchPurchasedPackages();
  }, [isAuthenticated, user?._id, navigate]);

  const fetchPurchasedPackages = async () => {
    try {
      console.log('🔍 [Frontend] fetchPurchasedPackages called');
      console.log('🔍 [Frontend] User authenticated:', isAuthenticated);
      console.log('🔍 [Frontend] User ID:', user?._id);
      
      setLoading(true);

      // Ensure user is authenticated before making API call
      if (!isAuthenticated || !user?._id) {
        console.warn('⚠️ [Frontend] User not authenticated, skipping API call');
        setPackages([]);
        return;
      }

      const response = await packagePurchaseApi.getUserPurchasedPackages();
      
      console.log('✅ [Frontend] API Response received');
      console.log('✅ [Frontend] Response success:', response.success);
      console.log('✅ [Frontend] Package count:', response.data?.packagePurchases?.length || 0);
      
      if (response.success && response.data?.packagePurchases) {
        const packages = response.data.packagePurchases;
        console.log('✅ [Frontend] Setting packages to state:', packages.length);
        setPackages(packages);
      } else {
        console.log('⚠️ [Frontend] No packages found or API error:', response.message || 'Unknown error');
        setPackages([]);
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
      
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const testAPIDirectly = async () => {
    try {
      setDebugTesting(true);
      console.log('🔍 [Debug] Manual API test triggered');
      console.log('🔍 [Debug] Current user from auth:', user);
      console.log('🔍 [Debug] User ID:', user?._id);
      console.log('🔍 [Debug] Expected DB user ID: 6856dc397fe2ef6b7bb18ce3');
      
      const response = await packagePurchaseApi.getUserPurchasedPackages();
      console.log('🔍 [Debug] Manual test response:', response);
      
      setDebugResponse(response);
      message.success('Check console for detailed response!');
    } catch (error: any) {
      console.error('❌ [Debug] Manual test error:', error);
      setDebugResponse({ error: error.message, details: error.response?.data });
      message.error('API test failed - check console');
    } finally {
      setDebugTesting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusTag = (packagePurchase: PackagePurchase) => {
    if (!packagePurchase.expiredAt || !packagePurchase.remainingUsages) {
      return <Tag color="blue">Đang xử lý</Tag>;
    }

    const now = new Date();
    const expiredAt = new Date(packagePurchase.expiredAt);
    const isExpired = expiredAt < now;
    const hasUsagesLeft = packagePurchase.remainingUsages > 0;

    if (packagePurchase.isActive === false) {
      return <Tag color="red">Đã huỷ</Tag>;
    }
    
    if (isExpired) {
      return <Tag color="red">Đã hết hạn</Tag>;
    }
    
    if (!hasUsagesLeft) {
      return <Tag color="orange">Đã hết lượt</Tag>;
    }
    
    return <Tag color="green">Đang hoạt động</Tag>;
  };

  const getUsageProgress = (packagePurchase: PackagePurchase) => {
    const totalAllowedUses = packagePurchase.totalAllowedUses || 1;
    const remainingUsages = packagePurchase.remainingUsages || 0;
    const usedCount = totalAllowedUses - remainingUsages;
    const percentage = (usedCount / totalAllowedUses) * 100;
    
    return {
      used: usedCount,
      total: totalAllowedUses,
      remaining: remainingUsages,
      percentage: Math.round(percentage)
    };
  };

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
                    title: <a href="/#/user-profiles">Hồ sơ bệnh án</a>
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
                    <span>Tổng: {packages.length} gói</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-300 rounded-full"></span>
                    <span>Đang hoạt động: {packages.filter(p => p.isActive && new Date(p.expiredAt) > new Date() && p.remainingUsages > 0).length}</span>
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

          {/* 🆕 DEBUG RESPONSE DISPLAY */}
          {debugResponse && (
            <Card style={{ marginBottom: '20px', background: '#f6f8fa' }}>
              <Text strong>🔍 Debug Response:</Text>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(debugResponse, null, 2)}
              </pre>
            </Card>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
              <span className="ml-3 text-gray-600">Đang tải danh sách gói đã mua...</span>
            </div>
          ) : packages.length === 0 ? (
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
            <Row gutter={[16, 16]}>
              {packages.map((packagePurchase) => {
                const usage = getUsageProgress(packagePurchase);
                const pkg = packagePurchase.packageId;
                const profile = packagePurchase.profileId;
                const bill = packagePurchase.billId;
                
                return (
                  <Col key={packagePurchase._id} xs={24} lg={12} xl={8}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className="h-full shadow-md hover:shadow-lg transition-shadow duration-200"
                        title={
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold">{pkg.name}</span>
                            {getStatusTag(packagePurchase)}
                          </div>
                        }
                        extra={
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Cho</div>
                            <div className="font-medium">{profile.fullName}</div>
                          </div>
                        }
                      >
                        <div className="space-y-4">
                          {/* Package Description */}
                          <p className="text-gray-600 text-sm">{pkg.description}</p>

                          {/* Usage Progress */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Lượt sử dụng</span>
                              <span className="text-sm text-gray-600">
                                {usage.used}/{usage.total}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${usage.percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Còn lại: {usage.remaining} lượt
                            </div>
                          </div>

                          {/* Package Details */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Giá trị gói:</span>
                              <span className="font-semibold">{formatPrice(pkg.price)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Đã thanh toán:</span>
                              <span className="font-semibold text-green-600">{formatPrice(bill.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Ngày mua:</span>
                              <span className="text-sm">{new Date(packagePurchase.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Hết hạn:</span>
                              <span className="text-sm">{new Date(packagePurchase.expiredAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>

                          {/* Services in Package */}
                          <div>
                            <div className="text-sm font-medium mb-2">Dịch vụ bao gồm:</div>
                            <div className="space-y-1">
                              {pkg.serviceIds.map((service) => (
                                <div key={service._id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                  <span className="text-sm">{service.serviceName}</span>
                                  <span className="text-xs text-gray-500">{formatPrice(service.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t">
                            {packagePurchase.isActive && new Date(packagePurchase.expiredAt) > new Date() && packagePurchase.remainingUsages > 0 ? (
                              <Button
                                type="primary"
                                block
                                onClick={() => navigate(`/booking?package=${packagePurchase._id}`)}
                                className="bg-[#0C3C54] hover:bg-[#0C3C54]/90"
                              >
                                <CheckCircleOutlined /> Sử dụng gói này
                              </Button>
                            ) : (
                              <Button
                                block
                                disabled
                                className="text-gray-400"
                              >
                                <ClockCircleOutlined /> Không thể sử dụng
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </Col>
                );
              })}
            </Row>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PurchasedPackagesPage; 