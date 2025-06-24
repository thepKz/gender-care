import axiosInstance from '../axiosConfig';

// Types for ServiceTestCategories
export interface ServiceTestCategory {
  _id: string;
  serviceId: string;
  testCategoryId: string;
  isRequired: boolean;
  customNormalRange?: string;
  customUnit?: string;
  targetValue?: string;
  notes?: string;
  minValue?: number;
  maxValue?: number;
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
  customNormalRange?: string;
  customUnit?: string;
  targetValue?: string;
  notes?: string;
  minValue?: number;
  maxValue?: number;
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
  testResultId: string;
  testCategoryId: string;
  value: string;
  unit?: string;
  isHigh?: boolean;
  isLow?: boolean;
  isNormal?: boolean;
  notes?: string;
}

export interface AutoEvaluateData {
  testResultId: string;
  serviceId: string;
  testItems: {
    testCategoryId: string;
    value: string;
    unit?: string;
    notes?: string;
  }[];
}

export interface EvaluateValueData {
  serviceId: string;
  testCategoryId: string;
  value: string;
}

export interface EvaluationResult {
  isHigh: boolean;
  isLow: boolean;
  isNormal: boolean;
  evaluation: string;
  effectiveRange: string;
  effectiveUnit: string;
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
  bulkCreate: async (data: BulkCreateServiceTestCategoryData): Promise<ServiceTestCategory[]> => {
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

  // Create with auto evaluation
  createWithAutoEvaluation: async (data: TestResultItemData): Promise<any> => {
    const response = await axiosInstance.post(`/test-result-items/auto-evaluate`, data);
    return response.data.data;
  },

  // Bulk create with auto evaluation
  bulkCreateWithAutoEvaluation: async (data: AutoEvaluateData): Promise<any> => {
    const response = await axiosInstance.post(`/test-result-items/bulk-auto-evaluate`, data);
    return response.data.data;
  },

  // Evaluate value
  evaluateValue: async (data: EvaluateValueData): Promise<EvaluationResult> => {
    const response = await axiosInstance.post(`/test-result-items/evaluate-value`, data);
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
  }
}; 