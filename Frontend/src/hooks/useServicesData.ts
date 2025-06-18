import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { Service, GetServicesParams } from '../types';
import { getServices } from '../api/endpoints/serviceApi';

interface UseServicesDataOptions {
  isPublicView?: boolean;
  autoFetch?: boolean;
  defaultPageSize?: number;
  includeDeleted?: boolean; // For manager to view deleted services
}

interface UseServicesDataReturn {
  services: Service[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    searchText: string;
    serviceType: string;
    availableAt: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    includeDeleted: boolean;
  };
  actions: {
    fetchServices: () => Promise<void>;
    setSearchText: (text: string) => void;
    setServiceType: (type: string) => void;
    setAvailableAt: (location: string) => void;
    setSortBy: (field: string) => void;
    setSortOrder: (order: 'asc' | 'desc') => void;
    handlePaginationChange: (page: number, pageSize?: number) => void;
    handleSearch: () => void;
    handleResetFilters: () => void;
    setIncludeDeleted: (include: boolean) => void;
  };
}

export const useServicesData = (options: UseServicesDataOptions = {}): UseServicesDataReturn => {
  const {
    isPublicView = false,
    autoFetch = true,
    defaultPageSize = 12,
    includeDeleted = false
  } = options;

  // State management - Quản lý state
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: defaultPageSize,
    total: 0,
    totalPages: 0
  });

  // Filter states - Trạng thái bộ lọc
  const [searchText, setSearchText] = useState('');
  const [serviceType, setServiceType] = useState<string>('');
  const [availableAt, setAvailableAt] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [includeDeletedState, setIncludeDeletedState] = useState(includeDeleted);

  // Fetch services từ API - Lấy dữ liệu dịch vụ từ API
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: GetServicesParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy,
        sortOrder
      };

      // Thêm filters - Áp dụng bộ lọc
      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      if (serviceType && serviceType !== '') {
        params.serviceType = serviceType as any;
      }
      if (availableAt && availableAt !== '') {
        params.availableAt = availableAt as any;
      }

      // Đối với public view, chỉ lấy các service active
      // Management view có thể hiển thị deleted services nếu includeDeleted = true
      if (isPublicView) {
        params.isActive = true;
      } else if (includeDeletedState) {
        // Manager muốn xem cả deleted services
        params.includeDeleted = true;
      }

      const response = await getServices(params);
      
      if (response.success) {
        setServices(response.data.services);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        }));
      } else {
        // Chỉ hiển thị error cho management view
        if (!isPublicView) {
          message.error('Không thể tải danh sách dịch vụ');
        }
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      
      // Chỉ hiển thị error cho management view
      if (!isPublicView) {
        message.error(error.message || 'Lỗi khi tải danh sách dịch vụ');
      }
    } finally {
      setLoading(false);
    }
  }, [
    pagination.current, 
    pagination.pageSize, 
    searchText, 
    serviceType, 
    availableAt, 
    sortBy, 
    sortOrder,
    isPublicView,
    includeDeletedState
  ]);

  // Load services khi dependencies thay đổi - Tự động tải dữ liệu
  useEffect(() => {
    if (autoFetch) {
      fetchServices();
    }
  }, [fetchServices, autoFetch]);

  // Handle pagination change - Xử lý thay đổi phân trang
  const handlePaginationChange = useCallback((page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  }, []);

  // Handle search - Xử lý tìm kiếm
  const handleSearch = useCallback(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
    // fetchServices sẽ được gọi tự động qua useEffect
  }, []);

  // Handle reset filters - Xử lý reset bộ lọc
  const handleResetFilters = useCallback(() => {
    setSearchText('');
    setServiceType('');
    setAvailableAt('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setIncludeDeletedState(false);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  // Handle include deleted toggle
  const handleSetIncludeDeleted = useCallback((include: boolean) => {
    setIncludeDeletedState(include);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  return {
    services,
    loading,
    pagination,
    filters: {
      searchText,
      serviceType,
      availableAt,
      sortBy,
      sortOrder,
      includeDeleted: includeDeletedState
    },
    actions: {
      fetchServices,
      setSearchText,
      setServiceType,
      setAvailableAt,
      setSortBy,
      setSortOrder,
      handlePaginationChange,
      handleSearch,
      handleResetFilters,
      setIncludeDeleted: handleSetIncludeDeleted
    }
  };
}; 