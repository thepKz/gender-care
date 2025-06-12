import {
  CustomerServiceOutlined,
  GiftOutlined,
  HeartOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Typography
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { getServicePackages } from '../../api/endpoints/servicePackageApi';
import ServiceDisplayCard from '../../components/feature/medical/ServiceDisplayCard';
import ServicePackageDisplayCard from '../../components/feature/medical/ServicePackageDisplayCard';
import { useServicesData } from '../../hooks/useServicesData';
import { GetServicePackagesParams, ServicePackage } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

const PublicServicesPage: React.FC = () => {
  // Sử dụng custom hook cho services data - Use custom hook for services data
  const {
    services,
    loading,
    pagination,
    filters,
    actions
  } = useServicesData({
    isPublicView: true,
    defaultPageSize: 12
  });

  // State cho service packages
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packageFilters, setPackageFilters] = useState({
    searchText: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // Fetch service packages từ API
  const fetchServicePackages = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const response = await getServicePackages({
        page: 1,
        limit: 6, // Hiển thị 6 gói đầu tiên trên trang chủ
        sortBy: packageFilters.sortBy,
        sortOrder: packageFilters.sortOrder,
        isActive: true, // Chỉ hiển thị gói đang hoạt động
        ...(packageFilters.searchText && { search: packageFilters.searchText })
      } as GetServicePackagesParams);
      
      if (response.success) {
        setServicePackages(response.data.packages);
      }
    } catch (error: unknown) {
      console.error('Error fetching service packages:', error);
    } finally {
      setPackagesLoading(false);
    }
  }, [packageFilters]);

  // Load service packages khi component mount
  useEffect(() => {
    fetchServicePackages();
  }, [fetchServicePackages]);

  // Ensure page starts at top on mount – UX cải thiện
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle package search
  const handlePackageSearch = () => {
    fetchServicePackages();
  };

  // Handle booking package
  const handleBookingPackage = (servicePackage: ServicePackage) => {
    console.log('Booking package:', servicePackage);
    // TODO: Navigate to booking page
  };

  return (
    <div className="public-services-page bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Hero Section - Phần giới thiệu */}
      <div className="relative bg-gradient-to-r from-blue-primary via-green-primary to-blue-secondary overflow-hidden">
        {/* Background Pattern - Họa tiết nền */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Content - Nội dung */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                <CustomerServiceOutlined className="text-4xl text-white" />
              </div>
            </div>
            
            <Title level={1} className="mb-4 text-white text-4xl lg:text-5xl" style={{ color: '#FFFFFF' }}>
              Dịch vụ chăm sóc sức khỏe
            </Title>
            <Text className="text-blue-100 text-xl max-w-3xl mx-auto block leading-relaxed">
              Khám phá các dịch vụ chăm sóc sức khỏe toàn diện với đội ngũ chuyên gia hàng đầu
            </Text>

            {/* Feature highlights - Điểm nổi bật */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <HeartOutlined className="text-3xl text-white mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Chăm sóc tận tâm</h3>
                <p className="text-blue-100 text-sm">Đội ngũ y bác sĩ chuyên nghiệp</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <StarOutlined className="text-3xl text-white mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Chất lượng cao</h3>
                <p className="text-blue-100 text-sm">Thiết bị hiện đại, công nghệ tiên tiến</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <GiftOutlined className="text-3xl text-white mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Giá cả hợp lý</h3>
                <p className="text-blue-100 text-sm">Nhiều gói dịch vụ ưu đãi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Nội dung chính */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Service Packages Section - Phần gói dịch vụ */}
          <section className="mb-16">
            <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-green-primary/10 rounded-xl">
                <GiftOutlined className="text-2xl text-green-primary" />
              </div>
            </div>
              <Title level={2} className="text-gray-900 mb-4">
                Gói dịch vụ đặc biệt
              </Title>
            <Text className="text-gray-600 text-lg max-w-2xl mx-auto block">
              Các gói dịch vụ được thiết kế riêng với mức giá ưu đãi, kết hợp nhiều dịch vụ chăm sóc sức khỏe
              </Text>
            </div>

          {/* Package Search and Filters */}
          <Card className="mb-8 shadow-sm border-0 rounded-xl bg-gradient-to-r from-green-50 to-blue-50">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-primary/10 rounded-lg">
                  <GiftOutlined className="text-green-primary text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-0">Tìm kiếm gói dịch vụ</h3>
                  <p className="text-sm text-gray-600 mb-0">Khám phá các gói ưu đãi phù hợp với nhu cầu</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Package Search Input */}
                <Input
                  placeholder="Tìm kiếm gói dịch vụ..."
                  prefix={<SearchOutlined className="text-green-primary" />}
                  value={packageFilters.searchText}
                  onChange={(e) => setPackageFilters(prev => ({ ...prev, searchText: e.target.value }))}
                  onPressEnter={handlePackageSearch}
                  className="rounded-lg border-green-200 focus:border-green-primary hover:border-green-primary"
                  size="large"
                />

                {/* Package Sort Options */}
                <Select
                  placeholder="Sắp xếp theo"
                  value={`${packageFilters.sortBy}-${packageFilters.sortOrder}`}
                  onChange={(value) => {
                    const [field, order] = value.split('-');
                    setPackageFilters(prev => ({
                      ...prev,
                      sortBy: field,
                      sortOrder: order as 'asc' | 'desc'
                    }));
                  }}
                  className="rounded-lg"
                  size="large"
                >
                  <Option value="createdAt-desc">🕒 Mới nhất</Option>
                  <Option value="createdAt-asc">🕐 Cũ nhất</Option>
                  <Option value="name-asc">🔤 Tên A-Z</Option>
                  <Option value="name-desc">🔤 Tên Z-A</Option>
                  <Option value="price-asc">💰 Giá thấp - cao</Option>
                  <Option value="price-desc">💰 Giá cao - thấp</Option>
                </Select>

                {/* Package Search Button */}
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handlePackageSearch}
                  className="bg-green-primary hover:bg-green-secondary border-green-primary rounded-lg"
                  size="large"
                >
                  Tìm kiếm gói
                </Button>
              </div>
            </div>
          </Card>

          {/* Service Packages Grid */}
            <Spin spinning={packagesLoading}>
            {servicePackages.length > 0 ? (
              <>
                <Row gutter={[24, 24]} className="mb-8">
                {servicePackages.map((pkg) => (
                  <Col xs={24} sm={12} lg={8} key={pkg._id}>
                      <ServicePackageDisplayCard
                      servicePackage={pkg}
                      className="h-full"
                        showBookingButton={true}
                        onBookingClick={handleBookingPackage}
                    />
                  </Col>
                ))}
              </Row>

                {/* View All Packages Button */}
                <div className="text-center">
                  <Button
                    type="primary"
                    size="large"
                    className="bg-green-primary hover:bg-green-secondary border-green-primary px-8 py-6 h-auto rounded-xl font-semibold"
                    onClick={() => {
                      // TODO: Navigate to full service packages page
                      console.log('Navigate to service packages page');
                    }}
                  >
                    Xem tất cả gói dịch vụ →
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <GiftOutlined className="text-6xl text-gray-300" />
                </div>
                <Text className="text-gray-500 text-lg">
                  {packageFilters.searchText ? 'Không tìm thấy gói dịch vụ phù hợp' : 'Hiện tại chưa có gói dịch vụ nào'}
                </Text>
                {packageFilters.searchText && (
                  <div className="mt-4">
                    <Button
                      type="primary"
                      onClick={() => {
                        setPackageFilters(prev => ({ ...prev, searchText: '' }));
                        handlePackageSearch();
                      }}
                      className="bg-green-primary border-green-primary"
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                )}
              </div>
            )}
            </Spin>

            <Divider className="my-12" />
          </section>

        {/* Services Section - Phần dịch vụ */}
        <section>
          <div className="text-center mb-8">
            <Title level={2} className="text-gray-900 mb-4">
              Dịch vụ chăm sóc sức khỏe
            </Title>
            <Text className="text-gray-600 text-lg">
              Tìm kiếm và đặt lịch các dịch vụ phù hợp với nhu cầu của bạn
            </Text>
          </div>

          {/* Search and Filters - Tìm kiếm và bộ lọc */}
          <Card className="mb-8 shadow-sm border-0 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Input - Ô tìm kiếm */}
              <Input
                placeholder="Tìm kiếm dịch vụ..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={filters.searchText}
                onChange={(e) => actions.setSearchText(e.target.value)}
                onPressEnter={actions.handleSearch}
                className="rounded-lg"
                size="large"
              />

              {/* Service Type Filter - Bộ lọc loại dịch vụ */}
                             <Select
                 placeholder="Loại dịch vụ"
                 value={filters.serviceType || undefined}
                 onChange={actions.setServiceType}
                 className="rounded-lg"
                 size="large"
                 allowClear
               >
                 <Option value="">Tất cả</Option>
                 <Option value="consultation">Tư vấn</Option>
                 <Option value="test">Xét nghiệm</Option>
                 <Option value="treatment">Điều trị</Option>
               </Select>

              {/* Location Filter - Bộ lọc địa điểm */}
                             <Select
                 placeholder="Địa điểm thực hiện"
                 value={filters.availableAt || undefined}
                 onChange={actions.setAvailableAt}
                 className="rounded-lg"
                 size="large"
                 allowClear
               >
                 <Option value="">Tất cả</Option>
                 <Option value="center">Tại trung tâm</Option>
                 <Option value="athome">Tại nhà</Option>
                 <Option value="online">Trực tuyến</Option>
               </Select>

              {/* Action Buttons - Các nút hành động */}
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={actions.handleSearch}
                  size="large"
                  className="bg-blue-primary hover:bg-blue-secondary border-blue-primary hover:border-blue-secondary rounded-lg"
                >
                  Tìm kiếm
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={actions.handleResetFilters}
                  size="large"
                  className="rounded-lg"
                >
                  Làm mới
                </Button>
              </Space>
            </div>
          </Card>

          {/* Services Grid - Lưới dịch vụ */}
          <Spin spinning={loading}>
            {services.length > 0 ? (
              <>
                <Row gutter={[24, 24]}>
                  {services.map((service) => (
                    <Col xs={24} sm={12} lg={8} key={service._id}>
                      <ServiceDisplayCard
                        service={service}
                        className="h-full"
                      />
                    </Col>
                  ))}
                </Row>

                {/* Pagination - Phân trang */}
                {pagination.total > 0 && (
                  <div className="text-center mt-12">
                    <Pagination
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      onChange={actions.handlePaginationChange}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total, range) =>
                        `${range[0]}-${range[1]} của ${total} dịch vụ`
                      }
                      className="inline-flex"
                    />
                  </div>
                )}
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-gray-500">
                    {loading ? 'Đang tải dịch vụ...' : 'Không tìm thấy dịch vụ nào'}
                  </span>
                }
              />
            )}
          </Spin>
        </section>

        {/* Call to Action - Lời kêu gọi hành động */}
        <section className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-0 rounded-2xl overflow-hidden">
            <div className="py-12">
              <Title level={3} className="text-gray-900 mb-4">
                Cần hỗ trợ tư vấn?
              </Title>
              <Text className="text-gray-600 text-lg mb-6 block">
                Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn
              </Text>
              <Button
                type="primary"
                size="large"
                className="bg-blue-primary hover:bg-blue-secondary border-blue-primary hover:border-blue-secondary rounded-xl px-8 h-12 text-lg font-medium"
                onClick={() => window.location.href = '/counselors'}
              >
                Liên hệ tư vấn ngay
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default PublicServicesPage; 