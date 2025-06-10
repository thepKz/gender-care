import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Typography,
  message,
  Modal,
  Pagination,
  Empty,
  Spin,
  Space,
  Tooltip,
  Tag,
  Switch
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  GiftOutlined,
  ReloadOutlined
} from '@ant-design/icons';

// API imports
import {
  getServicePackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
  recoverServicePackage,
  GetServicePackagesParams
} from '../../../api/endpoints/servicePackageApi';

// Component imports
import ServicePackageCard from '../../../components/cards/ServicePackageCard';
import ServicePackageModal from '../../../components/forms/ServicePackageModal';
import DeleteConfirmModal from '../../../components/modals/DeleteConfirmModal';

// Type imports
import {
  ServicePackage,
  CreateServicePackageRequest,
  UpdateServicePackageRequest
} from '../../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ServicePackagesPage: React.FC = () => {
  // State management
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingServicePackage, setEditingServicePackage] = useState<ServicePackage | null>(null);
  
  // Delete modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingServicePackage, setDeletingServicePackage] = useState<ServicePackage | null>(null);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} của ${total} gói dịch vụ`,
  });

  // Fetch service packages
  const fetchServicePackages = async () => {
    setLoading(true);
    try {
      const params: GetServicePackagesParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy,
        sortOrder,
        ...(searchText && { search: searchText }),
        ...(isActiveFilter !== undefined && { isActive: isActiveFilter }),
        ...(includeDeleted && { includeDeleted: true })
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
      message.error(error.message || 'Lỗi khi tải danh sách gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    fetchServicePackages();
  }, [pagination.current, pagination.pageSize, sortBy, sortOrder, includeDeleted]);

  // Handle create service package
  const handleCreateServicePackage = async (data: CreateServicePackageRequest) => {
    setModalLoading(true);
    try {
      console.log('Creating service package with data:', data);
      
      // Debug token
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      console.log('Current token:', token ? 'exists' : 'not found');
      
      const response = await createServicePackage(data);
      
      if (response.success) {
        message.success('Tạo gói dịch vụ thành công!');
        setModalVisible(false);
        fetchServicePackages(); // Reload data
      }
    } catch (error: any) {
      console.error('Error creating service package:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      message.error(error.message || 'Lỗi khi tạo gói dịch vụ');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle update service package
  const handleUpdateServicePackage = async (data: UpdateServicePackageRequest) => {
    if (!editingServicePackage) return;
    
    setModalLoading(true);
    try {
      const response = await updateServicePackage(editingServicePackage._id, data);
      
      if (response.success) {
        message.success('Cập nhật gói dịch vụ thành công!');
        setModalVisible(false);
        setEditingServicePackage(null);
        fetchServicePackages(); // Reload data
      }
    } catch (error: any) {
      console.error('Error updating service package:', error);
      message.error(error.message || 'Lỗi khi cập nhật gói dịch vụ');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle delete service package với deleteNote
  const handleDeleteServicePackage = (servicePackage: ServicePackage) => {
    setDeletingServicePackage(servicePackage);
    setDeleteModalVisible(true);
  };

  // Handle xác nhận xóa service package với deleteNote
  const handleConfirmDeletePackage = async (deleteNote: string) => {
    if (!deletingServicePackage) return;
    
        try {
      const response = await deleteServicePackage(deletingServicePackage._id, deleteNote);
          
          if (response.success) {
            message.success('Xóa gói dịch vụ thành công!');
        setDeleteModalVisible(false);
        setDeletingServicePackage(null);
            fetchServicePackages(); // Reload data
          }
        } catch (error: any) {
          console.error('Error deleting service package:', error);
          message.error(error.message || 'Lỗi khi xóa gói dịch vụ');
      throw error; // Để modal vẫn mở nếu có lỗi
        }
  };

  // Handle khôi phục service package
  const handleRecoverServicePackage = async (servicePackage: ServicePackage) => {
    try {
      const response = await recoverServicePackage(servicePackage._id);
      
      if (response.success) {
        message.success('Khôi phục gói dịch vụ thành công!');
        fetchServicePackages(); // Reload data
      }
    } catch (error: any) {
      console.error('Error recovering service package:', error);
      message.error(error.message || 'Lỗi khi khôi phục gói dịch vụ');
    }
  };

  // Handle edit service package
  const handleEditServicePackage = (servicePackage: ServicePackage) => {
    setEditingServicePackage(servicePackage);
    setModalVisible(true);
  };

  // Handle view service package details
  const handleViewServicePackage = (servicePackage: ServicePackage) => {
    // TODO: Implement view details modal or navigate to detail page
    console.log('View service package:', servicePackage);
    message.info('Chức năng xem chi tiết sẽ được triển khai sau');
  };

  // Handle duplicate service package - Lấy thông tin hiện có giống như edit
  const handleDuplicateServicePackage = (servicePackage: ServicePackage) => {
    // Tạo một bản sao service package với tên mới
    const duplicatedServicePackage = {
      ...servicePackage,
      name: `${servicePackage.name} (Bản sao)`,
      _id: '' // Xóa ID để tạo service package mới
    };
    
    setEditingServicePackage(duplicatedServicePackage);
    setModalVisible(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setEditingServicePackage(null);
  };

  // Handle modal submit
  const handleModalSubmit = async (data: CreateServicePackageRequest | UpdateServicePackageRequest) => {
    if (editingServicePackage) {
      await handleUpdateServicePackage(data);
    } else {
      await handleCreateServicePackage(data as CreateServicePackageRequest);
    }
  };

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchServicePackages();
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchText('');
    setIsActiveFilter(undefined);
    setIncludeDeleted(false);
    setSortBy('createdAt');
    setSortOrder('desc');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  return (
    <div className="service-packages-page bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Hero Section với Medical Imagery */}
      <div className="relative bg-gradient-to-r from-green-primary via-blue-primary to-green-secondary overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Content */}
            <div className="text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <GiftOutlined className="text-3xl text-white" />
                </div>
                <div>
                  <Title level={1} className="mb-0 text-white text-3xl lg:text-4xl">
                    Quản lý gói dịch vụ
                  </Title>
                  <Text className="text-blue-100 text-lg">
                    Tạo và quản lý các gói dịch vụ combo chăm sóc sức khỏe toàn diện
                  </Text>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">{pagination.total}</div>
                  <div className="text-blue-100 text-sm">Tổng gói dịch vụ</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">
                    {servicePackages.filter(pkg => pkg.isActive).length}
                  </div>
                  <div className="text-blue-100 text-sm">Đang hoạt động</div>
                </div>
              </div>

              {/* CTA Button - Removed as requested */}
            </div>

            {/* Right Column - Medical Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Medical Package Illustration */}
                <div className="w-full max-w-md mx-auto">
                  <div className="relative">
                    {/* Main Package */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 border border-white/30">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Service Icons */}
                        <div className="bg-white/30 rounded-2xl p-4 text-center">
                          <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">🩺</span>
                          </div>
                          <div className="text-white text-xs">Tư vấn</div>
                        </div>
                        <div className="bg-white/30 rounded-2xl p-4 text-center">
                          <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">🧪</span>
                          </div>
                          <div className="text-white text-xs">Xét nghiệm</div>
                        </div>
                        <div className="bg-white/30 rounded-2xl p-4 text-center">
                          <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">💊</span>
                          </div>
                          <div className="text-white text-xs">Điều trị</div>
                        </div>
                        <div className="bg-white/30 rounded-2xl p-4 text-center">
                          <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">📱</span>
                          </div>
                          <div className="text-white text-xs">Theo dõi</div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400/30 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-pink-400/30 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-xl">❤️</span>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-10 left-0 w-20 h-20 bg-white/10 rounded-full animate-pulse" />
                <div className="absolute bottom-10 right-0 w-16 h-16 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Wave Border */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="rgb(249, 250, 251)"/>
          </svg>
        </div>
      </div>

      {/* Advanced Filters & Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 -mt-8 relative z-10">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm rounded-2xl">
          <div className="p-6">
            {/* Filter Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-primary/10 rounded-lg">
                  <FilterOutlined className="text-blue-primary text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-0">Bộ lọc & tìm kiếm</h3>
                  <p className="text-sm text-gray-600 mb-0">Tìm kiếm và lọc gói dịch vụ theo tiêu chí</p>
                </div>
              </div>

            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Enhanced Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm gói dịch vụ
                </label>
                <Input
                  placeholder="Nhập tên gói dịch vụ..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onPressEnter={handleSearch}
                  prefix={<SearchOutlined className="text-blue-primary" />}
                  className="rounded-xl border-gray-300 focus:border-blue-primary hover:border-blue-primary h-12"
                  suffix={
                    searchText && (
                      <Button
                        type="text"
                        size="small"
                        onClick={() => setSearchText('')}
                        className="text-gray-400 hover:text-gray-600 p-0 h-auto"
                      >
                        ✕
                      </Button>
                    )
                  }
                />
              </div>

              {/* Status Filter with Icons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái hoạt động
                </label>
                <Select
                  placeholder="Chọn trạng thái"
                  value={isActiveFilter}
                  onChange={setIsActiveFilter}
                  allowClear
                  className="w-full"
                  size="large"
                >
                  <Option value={true}>
                    <Space>
                      <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                      Đang hoạt động
                    </Space>
                  </Option>
                  <Option value={false}>
                    <Space>
                      <span className="w-2 h-2 bg-gray-400 rounded-full inline-block"></span>
                      Tạm dừng
                    </Space>
                  </Option>
                </Select>
              </div>

              {/* Enhanced Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sắp xếp theo
                </label>
                <Select
                  placeholder="Chọn cách sắp xếp"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="w-full"
                  size="large"
                >
                  <Option value="createdAt-desc">🕒 Mới nhất</Option>
                  <Option value="createdAt-asc">🕐 Cũ nhất</Option>
                  <Option value="name-asc">🔤 Tên A-Z</Option>
                  <Option value="name-desc">🔤 Tên Z-A</Option>
                  <Option value="price-asc">💰 Giá thấp - cao</Option>
                  <Option value="price-desc">💰 Giá cao - thấp</Option>
                </Select>
              </div>

              {/* Include Deleted Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hiển thị đã xóa
                </label>
                <div className="h-12 flex items-center">
                  <Switch
                    checked={includeDeleted}
                    onChange={setIncludeDeleted}
                    checkedChildren="🗂️ Bao gồm"
                    unCheckedChildren="📦 Chỉ active"
                    className="bg-gray-300"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {includeDeleted ? 'Hiển thị cả gói đã xóa' : 'Chỉ hiển thị gói hoạt động'}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="flex gap-3">
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  className="bg-blue-primary hover:bg-blue-secondary border-blue-primary rounded-xl h-10 px-6"
                >
                  Tìm kiếm
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchServicePackages}
                  className="border-gray-300 hover:border-blue-primary rounded-xl h-10 px-6"
                >
                  Làm mới
                </Button>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-600">Tổng: <strong>{pagination.total}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-600">Hoạt động: <strong>{servicePackages.filter(pkg => pkg.isActive).length}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <Spin size="large" className="text-blue-primary" />
              <div className="absolute -inset-4 bg-blue-primary/5 rounded-full animate-ping" />
            </div>
            <Text className="mt-4 text-gray-600">Đang tải dữ liệu gói dịch vụ...</Text>
          </div>
        ) : servicePackages.length > 0 ? (
          <>
            {/* Results Summary */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-primary/10 rounded-lg">
                  <GiftOutlined className="text-blue-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-0">
                    Danh sách gói dịch vụ
                  </h3>
                  <p className="text-sm text-gray-600 mb-0">
                    Hiển thị {servicePackages.length} trên tổng {pagination.total} gói dịch vụ
                  </p>
                </div>
              </div>
              
              {/* Quick Add Button */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
                className="bg-green-primary hover:bg-green-secondary border-green-primary rounded-xl px-6 h-12 font-medium shadow-lg"
              >
                Thêm gói mới
              </Button>
            </div>

            {/* Enhanced Service Package Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {servicePackages.map((servicePackage, index) => (
                <div 
                  key={servicePackage._id}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ServicePackageCard
                    servicePackage={servicePackage}
                    onEdit={handleEditServicePackage}
                    onDelete={handleDeleteServicePackage}
                    onView={handleViewServicePackage}
                    onRecover={handleRecoverServicePackage}
                    onDuplicate={handleDuplicateServicePackage}
                  />
                </div>
              ))}
            </div>

            {/* Enhanced Pagination */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-lg border-0 p-4">
                <Pagination
                  {...pagination}
                  onChange={handlePaginationChange}
                  onShowSizeChange={handlePaginationChange}
                  className="custom-pagination"
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>📄</span>
                      <span>{range[0]}-{range[1]} của {total} gói dịch vụ</span>
                    </div>
                  )}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              {/* Enhanced Empty State */}
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl flex items-center justify-center">
                  <div className="relative">
                    <GiftOutlined className="text-5xl text-gray-300" />
                    <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🎁</div>
                  </div>
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-primary/10 to-green-primary/10 rounded-full blur-xl" />
              </div>
              
              <Title level={3} className="text-gray-800 mb-2">
                {searchText || isActiveFilter !== undefined
                  ? 'Không tìm thấy gói dịch vụ phù hợp'
                  : 'Chưa có gói dịch vụ nào'
                }
              </Title>
              
              <Text className="text-gray-600 mb-6 block leading-relaxed">
                {searchText || isActiveFilter !== undefined
                  ? 'Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để tìm thấy gói dịch vụ phù hợp.'
                  : 'Tạo gói dịch vụ đầu tiên để bắt đầu quản lý các combo dịch vụ chăm sóc sức khỏe.'
                }
              </Text>
              
              {!searchText && isActiveFilter === undefined && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                  className="bg-green-primary hover:bg-green-secondary border-green-primary rounded-xl px-8 h-12 text-base font-medium shadow-lg"
                >
                  Tạo gói dịch vụ đầu tiên
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Service Package Modal */}
      <ServicePackageModal
        visible={modalVisible}
        onCancel={handleModalClose}
        onSubmit={handleModalSubmit}
        servicePackage={editingServicePackage}
        loading={modalLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onConfirm={handleConfirmDeletePackage}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeletingServicePackage(null);
        }}
        title="Xác nhận xóa gói dịch vụ"
        itemName={deletingServicePackage?.name || ''}
        description="Gói dịch vụ sẽ bị ẩn khỏi hệ thống nhưng vẫn có thể khôi phục lại sau này."
      />
    </div>
  );
};

export default ServicePackagesPage; 