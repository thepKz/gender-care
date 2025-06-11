import {
    CustomerServiceOutlined,
    FilterOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined
} from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    Input,
    message,
    Modal,
    Pagination,
    Row,
    Select,
    Spin,
    Switch,
    Typography
} from 'antd';
import React, { useState } from 'react';
import {
    createService,
    deleteService,
    recoverService,
    updateService
} from '../../../api/endpoints/serviceApi';
import ServiceManagementCard from '../../../components/feature/medical/ServiceManagementCard';
import ServiceModal from '../../../components/ui/forms/ServiceModal';
import DeleteConfirmModal from '../../../components/ui/modals/DeleteConfirmModal';
import { useServicesData } from '../../../hooks/useServicesData';
import { CreateServiceRequest, Service, UpdateServiceRequest } from '../../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ServicesPage: React.FC = () => {
  // Sử dụng custom hook cho services data
  const {
    services,
    loading,
    pagination,
    filters,
    actions
  } = useServicesData({
    isPublicView: false,
    defaultPageSize: 12
  });

  // Modal states
  const [modalLoading, setModalLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Delete modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  
  // Note: showDeleted được quản lý trong useServicesData hook



  // Handle tạo service mới
  const handleCreateService = async (data: CreateServiceRequest) => {
    setModalLoading(true);
    try {
      console.log('Creating service with data:', data);
      
      // Debug token
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      console.log('Current token:', token ? 'exists' : 'not found');
      
      const response = await createService(data);
      
      if (response.success) {
        message.success('Tạo dịch vụ thành công!');
        setModalVisible(false);
        actions.fetchServices(); // Reload data
      }
    } catch (error: any) {
      console.error('Error creating service:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      message.error(error.message || 'Lỗi khi tạo dịch vụ');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle cập nhật service
  const handleUpdateService = async (data: UpdateServiceRequest) => {
    if (!editingService) return;
    
    setModalLoading(true);
    try {
      const response = await updateService(editingService._id, data);
      
      if (response.success) {
        message.success('Cập nhật dịch vụ thành công!');
        setModalVisible(false);
        setEditingService(null);
        actions.fetchServices(); // Reload data
      }
    } catch (error: any) {
      console.error('Error updating service:', error);
      message.error(error.message || 'Lỗi khi cập nhật dịch vụ');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle xóa service với deleteNote
  const handleDeleteService = (service: Service) => {
    setDeletingService(service);
    setDeleteModalVisible(true);
  };

  // Handle xác nhận xóa service với deleteNote
  const handleConfirmDelete = async (deleteNote: string) => {
    if (!deletingService) return;
    
        try {
      const response = await deleteService(deletingService._id, deleteNote);
          
          if (response.success) {
            message.success('Xóa dịch vụ thành công!');
        setDeleteModalVisible(false);
        setDeletingService(null);
            actions.fetchServices(); // Reload data
          }
        } catch (error: any) {
          console.error('Error deleting service:', error);
          message.error(error.message || 'Lỗi khi xóa dịch vụ');
      throw error; // Để modal vẫn mở nếu có lỗi
      }
  };

  // Handle khôi phục service
  const handleRecoverService = async (service: Service) => {
    try {
      const response = await recoverService(service._id);
      
      if (response.success) {
        message.success('Khôi phục dịch vụ thành công!');
        actions.fetchServices(); // Reload data
      }
    } catch (error: any) {
      console.error('Error recovering service:', error);
      message.error(error.message || 'Lỗi khi khôi phục dịch vụ');
    }
  };

  // Handle edit service
  const handleEditService = (service: Service) => {
    setEditingService(service);
    setModalVisible(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setEditingService(null);
  };

  // Handle modal submit
  const handleModalSubmit = async (data: CreateServiceRequest | UpdateServiceRequest) => {
    if (editingService) {
      await handleUpdateService(data);
    } else {
      await handleCreateService(data as CreateServiceRequest);
    }
  };

  // Handle duplicate service - Lấy thông tin hiện có giống như edit
  const handleDuplicateService = (service: Service) => {
    // Tạo một bản sao service với tên mới
    const duplicatedService = {
      ...service,
      serviceName: `${service.serviceName} (Bản sao)`,
      _id: '' // Xóa ID để tạo service mới
    };
    
    setEditingService(duplicatedService);
    setModalVisible(true);
  };

  // Handle view service details
  const handleViewService = (service: Service) => {
    // TODO: Implement view modal or navigate to detail page
    console.log('View service:', service);
  };

  return (
    <div className="services-page bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Hero Section với Medical Imagery */}
      <div className="relative bg-gradient-to-r from-blue-primary via-green-primary to-blue-secondary overflow-hidden">
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
                  <CustomerServiceOutlined className="text-3xl text-white" />
                </div>
                <div>
                  <Title level={1} className="mb-0 text-white text-3xl lg:text-4xl">
                    Quản lý dịch vụ
                  </Title>
                  <Text className="text-blue-100 text-lg">
                    Quản lý và tổ chức các dịch vụ chăm sóc sức khỏe chuyên nghiệp
                  </Text>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">{pagination.total}</div>
                  <div className="text-blue-100 text-sm">Tổng dịch vụ</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">
                    {services.length}
                  </div>
                  <div className="text-blue-100 text-sm">Đang hiển thị</div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-8">

              </div>
            </div>

            {/* Right Column - Medical Service Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Medical Services Illustration */}
                <div className="w-full max-w-md mx-auto">
                  <div className="relative">
                    {/* Main Services Grid */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 border border-white/30">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Service Type Icons */}
                        <div className="bg-white/30 rounded-2xl p-4 text-center">
                          <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">👩‍⚕️</span>
                          </div>
                          <div className="text-white text-xs">Tư vấn</div>
                        </div>
                        <div className="bg-white/30 rounded-2xl p-4 text-center">
                          <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">🔬</span>
                          </div>
                          <div className="text-white text-xs">Xét nghiệm</div>
                        </div>
                        <div className="bg-white/30 rounded-2xl p-4 text-center">
                          <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">💉</span>
                          </div>
                          <div className="text-white text-xs">Điều trị</div>
                        </div>
                        <div className="bg-white/30 rounded-2xl p-4 text-center">
                          <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">🏥</span>
                          </div>
                          <div className="text-white text-xs">Chăm sóc</div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-green-400/30 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-2xl">⭐</span>
                    </div>
                    <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-400/30 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-xl">💚</span>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-0">Bộ lọc & tìm kiếm dịch vụ</h3>
                  <p className="text-sm text-gray-600 mb-0">Tìm kiếm và lọc dịch vụ theo tiêu chí chuyên môn</p>
                </div>
              </div>

            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Enhanced Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm dịch vụ
                </label>
                <Input
                  placeholder="Nhập tên dịch vụ..."
                  value={filters.searchText}
                  onChange={(e) => actions.setSearchText(e.target.value)}
                  onPressEnter={actions.handleSearch}
                  prefix={<SearchOutlined className="text-blue-primary" />}
                  className="rounded-xl border-gray-300 focus:border-blue-primary hover:border-blue-primary h-12"
                  suffix={
                    filters.searchText && (
                      <Button
                        type="text"
                        size="small"
                        onClick={() => actions.setSearchText('')}
                        className="text-gray-400 hover:text-gray-600 p-0 h-auto"
                      >
                        ✕
                      </Button>
                    )
                  }
                />
              </div>

              {/* Service Type Filter with Icons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại dịch vụ
                </label>
                <Select
                  placeholder="Chọn loại dịch vụ"
                  value={filters.serviceType}
                  onChange={actions.setServiceType}
                  allowClear
                  className="w-full"
                  size="large"
                >
                  <Option value="">📋 Tất cả</Option>
                  <Option value="consultation">👩‍⚕️ Tư vấn</Option>
                  <Option value="test">🔬 Xét nghiệm</Option>
                  <Option value="treatment">💉 Điều trị</Option>
                  <Option value="other">🏥 Khác</Option>
                </Select>
              </div>

              {/* Available Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa điểm thực hiện
                </label>
                <Select
                  placeholder="Chọn địa điểm"
                  value={filters.availableAt}
                  onChange={actions.setAvailableAt}
                  allowClear
                  className="w-full"
                  size="large"
                >
                  <Option value="">📍 Tất cả</Option>
                  <Option value="Athome">🏠 Tại nhà</Option>
                  <Option value="Online">💻 Trực tuyến</Option>
                  <Option value="Center">🏥 Tại trung tâm</Option>
                </Select>
              </div>

              {/* Enhanced Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sắp xếp theo
                </label>
                <Select
                  placeholder="Chọn cách sắp xếp"
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(value) => {
                    const [field, order] = value.split('-');
                    actions.setSortBy(field);
                    actions.setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="w-full"
                  size="large"
                >
                  <Option value="createdAt-desc">🕒 Mới nhất</Option>
                  <Option value="createdAt-asc">🕐 Cũ nhất</Option>
                  <Option value="serviceName-asc">🔤 Tên A-Z</Option>
                  <Option value="serviceName-desc">🔤 Tên Z-A</Option>
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
                    checked={filters.includeDeleted}
                    onChange={actions.setIncludeDeleted}
                    checkedChildren="🗂️ Bao gồm"
                    unCheckedChildren="📋 Chỉ active"
                    className="bg-gray-300"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {filters.includeDeleted ? 'Hiển thị cả dịch vụ đã xóa' : 'Chỉ hiển thị dịch vụ hoạt động'}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="flex gap-3">
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={actions.handleSearch}
                  className="bg-blue-primary hover:bg-blue-secondary border-blue-primary rounded-xl h-10 px-6"
                >
                  Tìm kiếm
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    actions.handleResetFilters();
                    actions.fetchServices();
                  }}
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
                  <span className="text-gray-600">Hiển thị: <strong>{services.length}</strong></span>
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
            <Text className="mt-4 text-gray-600">Đang tải dữ liệu dịch vụ...</Text>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              {/* Enhanced Empty State */}
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl flex items-center justify-center">
                  <div className="relative">
                    <CustomerServiceOutlined className="text-5xl text-gray-300" />
                    <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🩺</div>
                  </div>
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-primary/10 to-green-primary/10 rounded-full blur-xl" />
              </div>
              
              <Title level={3} className="text-gray-800 mb-2">
                {filters.searchText || filters.serviceType || filters.availableAt
                  ? 'Không tìm thấy dịch vụ phù hợp'
                  : 'Chưa có dịch vụ nào'
                }
              </Title>
              
              <Text className="text-gray-600 mb-6 block leading-relaxed">
                {filters.searchText || filters.serviceType || filters.availableAt
                  ? 'Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để tìm thấy dịch vụ phù hợp.'
                  : 'Tạo dịch vụ đầu tiên để bắt đầu quản lý hệ thống chăm sóc sức khỏe.'
                }
              </Text>
              
              {(!filters.searchText && !filters.serviceType && !filters.availableAt) && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                  className="bg-green-primary hover:bg-green-secondary border-green-primary rounded-xl px-8 h-12 text-base font-medium shadow-lg"
                >
                  Tạo dịch vụ đầu tiên
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-primary/10 rounded-lg">
                  <CustomerServiceOutlined className="text-blue-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-0">
                    Danh sách dịch vụ
                  </h3>
                  <p className="text-sm text-gray-600 mb-0">
                    Hiển thị {services.length} trên tổng {pagination.total} dịch vụ
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
                Thêm dịch vụ mới
              </Button>
            </div>

            {/* Enhanced Services Grid */}
            <Row gutter={[32, 32]} className="mb-12">
              {services.map((service, index) => (
                <Col
                  key={service._id}
                  xs={24}
                  sm={12}
                  lg={8}
                  xl={6}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ServiceManagementCard
                    service={service}
                    onEdit={handleEditService}
                    onDelete={handleDeleteService}
                    onView={handleViewService}
                    onDuplicate={handleDuplicateService}
                    onRecover={handleRecoverService}
                  />
                </Col>
              ))}
            </Row>

            {/* Enhanced Pagination */}
            {pagination.total > pagination.pageSize && (
              <div className="flex justify-center">
                <div className="bg-white rounded-2xl shadow-lg border-0 p-4">
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={actions.handlePaginationChange}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📋</span>
                        <span>{range[0]}-{range[1]} của {total} dịch vụ</span>
                      </div>
                    )}
                    className="custom-pagination"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Service Modal */}
      <ServiceModal
        visible={modalVisible}
        onCancel={handleModalClose}
        onSubmit={handleModalSubmit}
        service={editingService}
        loading={modalLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeletingService(null);
        }}
        title="Xác nhận xóa dịch vụ"
        itemName={deletingService?.serviceName || ''}
        description="Dịch vụ sẽ bị ẩn khỏi hệ thống nhưng vẫn có thể khôi phục lại sau này."
      />
    </div>
  );
};

export default ServicesPage; 