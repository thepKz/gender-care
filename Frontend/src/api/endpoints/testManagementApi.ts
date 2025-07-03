import axiosInstance from '../axiosConfig';

// Types for ServiceTestCategories
export interface ServiceTestCategory {
  _id: string;
  serviceId: string;
  testCategoryId: string;
  isRequired: boolean;
  unit?: string;
  targetValue?: string;
  minValue?: number;
  maxValue?: number;
  thresholdRules?: Array<{
    from: number | null;
    to: number | null;
    flag: 'very_low' | 'low' | 'normal' | 'mild_high' | 'high' | 'critical';
    message: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  testCategory?: {
    _id: string;
    name: string;
    description?: string;
    normalRange?: string;
    unit?: string;
  };
}

export interface CreateServiceTestCategoryData {
  serviceId: string;
  testCategoryId: string;
  isRequired: boolean;
  unit?: string;
  targetValue?: string;
  minValue?: number;
  maxValue?: number;
  thresholdRules?: Array<{
    from: number | null;
    to: number | null;
    flag: 'very_low' | 'low' | 'normal' | 'mild_high' | 'high' | 'critical';
    message: string;
  }>;
}

export interface BulkCreateServiceTestCategoryData {
  serviceId: string;
  testCategories: {
    testCategoryId: string;
    isRequired: boolean;
    customNormalRange?: string;
    customUnit?: string;
    targetValue?: string;
    notes?: string;
  }[];
}

// Types for TestResultItems
export interface TestResultTemplate {
  serviceId: string;
  serviceName: string;
  testCategories: {
    _id: string;
    name: string;
    normalRange: string;
    unit: string;
    isRequired: boolean;
    customNormalRange?: string;
    customUnit?: string;
    targetValue?: string;
    notes?: string;
  }[];
}

export interface TestResultItemData {
  appointmentId: string;
  testCategoryId?: string;
  itemNameId?: string;
  value: string;
  unit?: string;
  isHigh?: boolean;
  isLow?: boolean;
  isNormal?: boolean;
  flag?: string;
}

// ServiceTestCategories API
export const serviceTestCategoriesApi = {
  // Get test categories for a service
  getByService: async (serviceId: string): Promise<ServiceTestCategory[]> => {
    const response = await axiosInstance.get(`/service-test-categories/service/${serviceId}`);
    return response.data.data;
  },

  // Create single service test category
  create: async (data: CreateServiceTestCategoryData): Promise<ServiceTestCategory> => {
    const response = await axiosInstance.post(`/service-test-categories`, data);
    return response.data.data;
  },

  // Bulk create service test categories
  bulkCreate: async (data: { serviceId: string; testCategories: CreateServiceTestCategoryData[] }): Promise<ServiceTestCategory[]> => {
    const response = await axiosInstance.post(`/service-test-categories/bulk`, data);
    return response.data.data;
  },

  // Update service test category
  update: async (id: string, data: Partial<CreateServiceTestCategoryData>): Promise<ServiceTestCategory> => {
    const response = await axiosInstance.put(`/service-test-categories/${id}`, data);
    return response.data.data;
  },

  // Delete service test category
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/service-test-categories/${id}`);
  }
};

// TestResultItems API
export const testResultItemsApi = {
  // Get template for service
  getTemplate: async (serviceId: string): Promise<TestResultTemplate> => {
    const response = await axiosInstance.get(`/test-result-items/template/${serviceId}`);
    return response.data.data;
  },

  // Create testResultItem thủ công
  create: async (data: TestResultItemData): Promise<any> => {
    const response = await axiosInstance.post(`/test-result-items`, data);
    return response.data.data;
  },

  // Bulk create test result items
  bulkCreate: async (data: {
    appointmentId: string;
    items: Array<{
      itemNameId: string;
      value: string;
      unit?: string;
      flag?: string;
    }>;
  }): Promise<any> => {
    const response = await axiosInstance.post(`/test-result-items/bulk`, data);
    return response.data.data;
  },

  // Get test result items by appointment ID
  getByAppointment: async (appointmentId: string): Promise<any[]> => {
    const response = await axiosInstance.get(`/test-result-items/appointment/${appointmentId}`);
    return response.data.data;
  },

  // Get test result item by ID
  getById: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`/test-result-items/${id}`);
    return response.data.data;
  },

  // Update test result item
  update: async (id: string, data: {
    value?: string;
    unit?: string;
    flag?: string;
  }): Promise<any> => {
    const response = await axiosInstance.put(`/test-result-items/${id}`, data);
    return response.data.data;
  },

  // Delete test result item
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/test-result-items/${id}`);
  },

  // Get summary by appointment ID
  getSummary: async (appointmentId: string): Promise<any> => {
    const response = await axiosInstance.get(`/test-result-items/summary/${appointmentId}`);
    return response.data.data;
  }
};

// TestCategories API
export const testCategoriesApi = {
  // Get all test categories
  getAll: async (): Promise<any[]> => {
    const response = await axiosInstance.get(`/test-categories`);
    return response.data.data;
  },

  // Get by id
  getById: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`/test-categories/${id}`);
    return response.data.data;
  },

  // Create test category
  create: async (data: {
    name: string;
    description?: string;
    unit?: string;
    normalRange?: string;
  }): Promise<any> => {
    const response = await axiosInstance.post(`/test-categories`, data);
    return response.data; // Return full response để có {success, message, data}
  },

  // Update test category
  update: async (id: string, data: {
    name?: string;
    description?: string;
    unit?: string;
    normalRange?: string;
  }): Promise<any> => {
    const response = await axiosInstance.put(`/test-categories/${id}`, data);
    return response.data;
  }
};