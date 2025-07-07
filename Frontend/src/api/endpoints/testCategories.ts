import axiosConfig from '../axiosConfig';

export interface ITestCategory {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestCategoryRequest {
  name: string;
  description?: string;
  unit?: string;
  normalRange?: string;
}

export interface UpdateTestCategoryRequest {
  name?: string;
  description?: string;
  unit?: string;
  normalRange?: string;
}

export interface TestCategoryFilters {
  search?: string;
  page?: number;
  limit?: number;
}

// Helper function to safely extract error message
const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || 'Có lỗi xảy ra';
  }
  return 'Có lỗi xảy ra';
};

const testCategoriesApi = {
  // Lấy danh sách test categories với filter
  getAllTestCategories: async (filters?: TestCategoryFilters): Promise<ITestCategory[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);

      // Sử dụng endpoint /all để lấy tất cả mà không bị limit
      const response = await axiosConfig.get(`/test-categories/all?${params.toString()}`);
      
      if (response.data.success || response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [TestCategoriesAPI] Error fetching test categories:', error);
      throw new Error(getErrorMessage(error) || 'Không thể tải danh sách loại xét nghiệm');
    }
  },

  // Lấy chi tiết test category theo ID
  getTestCategoryById: async (categoryId: string): Promise<ITestCategory> => {
    try {
      const response = await axiosConfig.get(`/test-categories/${categoryId}`);
      
      if (response.data.success || response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [TestCategoriesAPI] Error fetching test category:', error);
      throw new Error(getErrorMessage(error) || 'Không thể tải thông tin loại xét nghiệm');
    }
  },

  // Tạo test category mới (Manager/Admin only)
  createTestCategory: async (categoryData: CreateTestCategoryRequest): Promise<ITestCategory> => {
    try {
      const response = await axiosConfig.post('/test-categories', categoryData);
      
      if (response.data.success || response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [TestCategoriesAPI] Error creating test category:', error);
      throw new Error(getErrorMessage(error) || 'Không thể tạo loại xét nghiệm mới');
    }
  },

  // Cập nhật test category (Manager/Admin only)
  updateTestCategory: async (categoryId: string, categoryData: UpdateTestCategoryRequest): Promise<ITestCategory> => {
    try {
      const response = await axiosConfig.put(`/test-categories/${categoryId}`, categoryData);
      
      if (response.data.success || response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [TestCategoriesAPI] Error updating test category:', error);
      throw new Error(getErrorMessage(error) || 'Không thể cập nhật loại xét nghiệm');
    }
  },

  // Xóa test category (Manager/Admin only)
  deleteTestCategory: async (categoryId: string): Promise<void> => {
    try {
      await axiosConfig.delete(`/test-categories/${categoryId}`);
    } catch (error: unknown) {
      console.error('❌ [TestCategoriesAPI] Error deleting test category:', error);
      throw new Error(getErrorMessage(error) || 'Không thể xóa loại xét nghiệm');
    }
  },

  // Lấy test categories cho dropdown
  getTestCategoriesForDropdown: async (): Promise<Array<{
    id: string;
    name: string;
    unit?: string;
    normalRange?: string;
  }>> => {
    try {
      const response = await axiosConfig.get('/test-categories/dropdown');
      
      if (response.data.success || response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [TestCategoriesAPI] Error fetching dropdown data:', error);
      throw new Error('Không thể tải danh sách loại xét nghiệm');
    }
  },

  // Lấy thống kê test categories
  getTestCategoryStats: async (): Promise<{
    total: number;
    withUnit: number;
    withNormalRange: number;
  }> => {
    try {
      const categories = await testCategoriesApi.getAllTestCategories();
      
      const total = categories.length;
      const withUnit = 0; // Không còn trường unit
      const withNormalRange = 0; // Không còn trường normalRange

      return {
        total,
        withUnit,
        withNormalRange
      };
    } catch (error: unknown) {
      console.error('❌ [TestCategoriesAPI] Error fetching stats:', error);
      throw new Error('Không thể tải thống kê loại xét nghiệm');
    }
  }
};

export default testCategoriesApi; 