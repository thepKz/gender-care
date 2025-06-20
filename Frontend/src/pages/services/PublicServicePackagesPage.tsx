import {
    DollarOutlined,
    FilterOutlined,
    GiftOutlined,
    HeartOutlined,
    SearchOutlined,
    TeamOutlined
} from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
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
import ServicePackageDisplayCard from '../../components/feature/medical/ServicePackageDisplayCard';
import { GetServicePackagesParams, ServicePackage } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

const PublicServicePackagesPage: React.FC = () => {
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} của ${total} gói dịch vụ`,
  });

  const fetchServicePackages = useCallback(async () => {
    setLoading(true);
    try {
      const params: GetServicePackagesParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy,
        sortOrder,
        isActive: true,
        ...(searchText && { search: searchText })
      };

      const response = await getServicePackages(params);

      if (response.success) {
        setServicePackages(response.data.packages);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
    } catch (error: any) {
      console.error('Error fetching service packages:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, sortBy, sortOrder, searchText]);

  useEffect(() => {
    fetchServicePackages();
  }, [fetchServicePackages]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchServicePackages();
  };

  const handlePaginationChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      ...(pageSize && { pageSize })
    }));
  };



  return (
    <div className="public-service-packages-page bg-gradient-to-br from-gray-50 to-green-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-primary via-blue-primary to-green-secondary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zM60 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                <GiftOutlined className="text-5xl text-white" />
              </div>
            </div>
            
            <Title level={1} className="mb-6 text-white text-5xl lg:text-6xl font-bold">
              Gói dịch vụ chăm sóc sức khỏe
            </Title>
            <Text className="text-green-100 text-xl max-w-4xl mx-auto block leading-relaxed">
              Tiết kiệm chi phí với các gói dịch vụ được thiết kế đặc biệt, kết hợp nhiều dịch vụ chăm sóc sức khỏe toàn diện
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <DollarOutlined className="text-4xl text-white mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Tiết kiệm chi phí</h3>
                <p className="text-green-100">Giá ưu đãi khi mua gói dịch vụ combo</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <HeartOutlined className="text-4xl text-white mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Chăm sóc toàn diện</h3>
                <p className="text-green-100">Kết hợp nhiều dịch vụ trong một gói</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <TeamOutlined className="text-4xl text-white mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Hỗ trợ chuyên nghiệp</h3>
                <p className="text-green-100">Đội ngũ y bác sĩ giàu kinh nghiệm</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="rgb(249, 250, 251)"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-10">
        {/* Search and Filters */}
        <Card className="mb-8 shadow-lg border-0 rounded-2xl bg-white/95 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-primary/10 rounded-lg">
                <FilterOutlined className="text-green-primary text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-0">Tìm kiếm gói dịch vụ</h3>
                <p className="text-sm text-gray-600 mb-0">Khám phá các gói dịch vụ phù hợp với nhu cầu</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Tìm kiếm gói dịch vụ..."
                prefix={<SearchOutlined className="text-green-primary" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                className="rounded-xl border-gray-300 focus:border-green-primary hover:border-green-primary h-12"
                size="large"
              />

              <Select
                placeholder="Sắp xếp theo"
                value={`${sortBy}-${sortOrder}`}
                onChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="rounded-xl"
                size="large"
              >
                <Option value="createdAt-desc">🕒 Mới nhất</Option>
                <Option value="createdAt-asc">🕐 Cũ nhất</Option>
                <Option value="name-asc">🔤 Tên A-Z</Option>
                <Option value="name-desc">🔤 Tên Z-A</Option>
                <Option value="price-asc">💰 Giá thấp - cao</Option>
                <Option value="price-desc">💰 Giá cao - thấp</Option>
              </Select>

              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                className="bg-green-primary hover:bg-green-secondary border-green-primary rounded-xl h-12 px-8 font-semibold"
                size="large"
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        </Card>

        {/* Service Packages Grid */}
        <Spin spinning={loading}>
          {servicePackages.length > 0 ? (
            <>
              <Row gutter={[24, 24]} className="mb-8">
                {servicePackages.map((servicePackage) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={servicePackage._id}>
                    <ServicePackageDisplayCard
                      servicePackage={servicePackage}
                      className="h-full"
                      showBookingButton={true}
                    />
                  </Col>
                ))}
              </Row>

              <div className="flex justify-center">
                <Pagination
                  {...pagination}
                  onChange={handlePaginationChange}
                  className="mt-8"
                  showSizeChanger
                  pageSizeOptions={['12', '24', '36', '48']}
                />
              </div>
            </>
          ) : (
            <div className="py-20">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="text-center">
                    <Text className="text-gray-500 text-lg">
                      {searchText ? 'Không tìm thấy gói dịch vụ phù hợp' : 'Hiện tại chưa có gói dịch vụ nào'}
                    </Text>
                    {searchText && (
                      <div className="mt-4">
                        <Button
                          type="primary"
                          onClick={() => {
                            setSearchText('');
                            handleSearch();
                          }}
                          className="bg-green-primary border-green-primary"
                        >
                          Xóa bộ lọc
                        </Button>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          )}
        </Spin>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-green-primary to-blue-primary py-16 mt-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Title level={2} className="text-white mb-4">
            Cần tư vấn về gói dịch vụ phù hợp?
          </Title>
          <Text className="text-green-100 text-lg mb-8 block">
            Đội ngũ chuyên gia của chúng tôi sẵn sàng hỗ trợ bạn lựa chọn gói dịch vụ tốt nhất
          </Text>
          <Space size="large">
            <Button
              type="primary"
              size="large"
              className="bg-white text-green-primary hover:bg-gray-100 border-white rounded-xl px-8 py-6 h-auto font-semibold"
            >
              Liên hệ tư vấn
            </Button>
            <Button
              ghost
              size="large"
              className="border-white text-white hover:bg-white hover:text-green-primary rounded-xl px-8 py-6 h-auto font-semibold"
            >
              Xem tất cả dịch vụ
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default PublicServicePackagesPage; 