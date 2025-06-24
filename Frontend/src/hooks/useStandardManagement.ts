import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';

export interface UseStandardManagementOptions<T> {
  // Data fetching
  fetchData: () => Promise<T[]>;
  
  // CRUD operations
  createItem?: (item: Partial<T>) => Promise<T>;
  updateItem?: (id: string, item: Partial<T>) => Promise<T>;
  deleteItem?: (id: string) => Promise<void>;
  
  // Search & filter functions
  searchFields?: (keyof T)[];
  
  // Messages
  messages?: {
    fetchError?: string;
    createSuccess?: string;
    createError?: string;
    updateSuccess?: string;
    updateError?: string;
    deleteSuccess?: string;
    deleteError?: string;
  };
}

export interface ManagementState<T> {
  // Data
  items: T[];
  loading: boolean;
  
  // Modal state
  modalVisible: boolean;
  editingItem: T | null;
  
  // Filter state
  searchText: string;
  filteredItems: T[];
  currentFilters: Record<string, any>;
  
  // Pagination state
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  
  // Actions
  refresh: () => Promise<void>;
  refreshData: () => Promise<void>; // Alias for refresh
  handleCreate: () => void;
  handleEdit: (item: T) => void;
  handleDelete: (id: string) => Promise<void>;
  handleModalCancel: () => void;
  handleModalSubmit: (values: Partial<T>) => Promise<void>;
  handleSearch: (text: string) => void;
  setFilter: (key: string, value: any) => void;
  handleFilterChange: (key: string, value: any) => void; // Alias for setFilter
  handleTableChange: (pagination: any, filters: any, sorter: any) => void;
}

export function useStandardManagement<T extends { _id?: string; id?: string }>(
  options: UseStandardManagementOptions<T>
): ManagementState<T> {
  const {
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    searchFields = [],
    messages = {}
  } = options;

  // State
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Messages with defaults
  const defaultMessages = {
    fetchError: 'Không thể tải dữ liệu',
    createSuccess: 'Tạo mới thành công',
    createError: 'Không thể tạo mới',
    updateSuccess: 'Cập nhật thành công',
    updateError: 'Không thể cập nhật',
    deleteSuccess: 'Xóa thành công',
    deleteError: 'Không thể xóa',
    ...messages
  };

  // Refresh data
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchData();
      setItems(data);
      setPagination(prev => ({ ...prev, total: data.length }));
    } catch (error: any) {
      console.error('Error fetching data:', error);
      message.error(error?.response?.data?.message || defaultMessages.fetchError);
    } finally {
      setLoading(false);
    }
  }, [fetchData, defaultMessages.fetchError]);

  // Filtered items based on search and filters
  const filteredItems = useMemo(() => {
    let result = items;

    // Search filter
    if (searchText && searchFields.length > 0) {
      result = result.filter(item => 
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchText.toLowerCase());
          }
          if (typeof value === 'number') {
            return value.toString().includes(searchText);
          }
          return false;
        })
      );
    }

    // Additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter(item => {
          const itemValue = (item as any)[key];
          if (typeof value === 'boolean') {
            return itemValue === value;
          }
          if (value === 'all') {
            return true;
          }
          return itemValue === value;
        });
      }
    });

    return result;
  }, [items, searchText, searchFields, filters]);

  // Create new item
  const handleCreate = useCallback(() => {
    setEditingItem(null);
    setModalVisible(true);
  }, []);

  // Edit existing item
  const handleEdit = useCallback((item: T) => {
    setEditingItem(item);
    setModalVisible(true);
  }, []);

  // Delete item
  const handleDelete = useCallback(async (id: string) => {
    if (!deleteItem) {
      console.warn('Delete function not provided');
      return;
    }

    try {
      await deleteItem(id);
      message.success(defaultMessages.deleteSuccess);
      await refresh();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      message.error(error?.response?.data?.message || defaultMessages.deleteError);
    }
  }, [deleteItem, defaultMessages.deleteSuccess, defaultMessages.deleteError, refresh]);

  // Cancel modal
  const handleModalCancel = useCallback(() => {
    setModalVisible(false);
    setEditingItem(null);
  }, []);

  // Submit modal form
  const handleModalSubmit = useCallback(async (values: Partial<T>) => {
    try {
      if (editingItem) {
        // Update existing item
        if (!updateItem) {
          throw new Error('Update function not provided');
        }
        const itemId = editingItem._id || editingItem.id;
        if (!itemId) {
          throw new Error('Item ID not found');
        }
        await updateItem(itemId, values);
        message.success(defaultMessages.updateSuccess);
      } else {
        // Create new item
        if (!createItem) {
          throw new Error('Create function not provided');
        }
        await createItem(values);
        message.success(defaultMessages.createSuccess);
      }
      
      setModalVisible(false);
      setEditingItem(null);
      await refresh();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errorMessage = editingItem 
        ? defaultMessages.updateError 
        : defaultMessages.createError;
      message.error(error?.response?.data?.message || errorMessage);
    }
  }, [
    editingItem,
    createItem,
    updateItem,
    defaultMessages,
    refresh
  ]);

  // Handle search
  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // Set filter
  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Handle table change
  const handleTableChange = useCallback((pagination: any, filters: any, sorter: any) => {
    setPagination(pagination);
    setFilters(filters);
  }, []);

  return {
    // Data
    items,
    loading,
    
    // Modal state
    modalVisible,
    editingItem,
    
    // Filter state
    searchText,
    filteredItems,
    currentFilters: filters,
    
    // Pagination state
    pagination,
    
    // Actions
    refresh,
    refreshData: refresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalCancel,
    handleModalSubmit,
    handleSearch,
    setFilter,
    handleFilterChange,
    handleTableChange
  };
}

export default useStandardManagement; 