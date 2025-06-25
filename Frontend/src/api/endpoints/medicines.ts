import axiosConfig from '../axiosConfig';

export interface IMedicine {
  _id: string;
  name: string;
  type: "contraceptive" | "vitamin" | "other" | "antibiotic" | "painkiller";
  description?: string;
  defaultDosage?: string;
  defaultTimingInstructions?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMedicineRequest {
  name: string;
  type: "contraceptive" | "vitamin" | "other" | "antibiotic" | "painkiller";
  description?: string;
  defaultDosage?: string;
  defaultTimingInstructions?: string;
}

export interface UpdateMedicineRequest {
  name?: string;
  type?: "contraceptive" | "vitamin" | "other" | "antibiotic" | "painkiller";
  description?: string;
  defaultDosage?: string;
  defaultTimingInstructions?: string;
  isActive?: boolean;
}

export interface MedicineFilters {
  type?: string;
  isActive?: boolean;
  search?: string;
}

// Helper function to safely extract error message
const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || 'Có lỗi xảy ra';
  }
  return 'Có lỗi xảy ra';
};

const medicinesApi = {
  // Lấy danh sách thuốc với filter
  getAllMedicines: async (filters?: MedicineFilters): Promise<IMedicine[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.search) params.append('search', filters.search);

      const response = await axiosConfig.get(`/medicines?${params.toString()}`);
      
      if (response.data.success || response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [MedicinesAPI] Error fetching medicines:', error);
      throw new Error(getErrorMessage(error) || 'Không thể tải danh sách thuốc');
    }
  },

  // Lấy chi tiết thuốc theo ID
  getMedicineById: async (medicineId: string): Promise<IMedicine> => {
    try {
      const response = await axiosConfig.get(`/medicines/${medicineId}`);
      
      if (response.data.success || response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [MedicinesAPI] Error fetching medicine:', error);
      throw new Error(getErrorMessage(error) || 'Không thể tải thông tin thuốc');
    }
  },

  // Tạo thuốc mới (Manager/Admin only)
  createMedicine: async (medicineData: CreateMedicineRequest): Promise<IMedicine> => {
    try {
      const response = await axiosConfig.post('/medicines', medicineData);
      
      if (response.data.success || response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [MedicinesAPI] Error creating medicine:', error);
      throw new Error(getErrorMessage(error) || 'Không thể tạo thuốc mới');
    }
  },

  // Cập nhật thuốc (Manager/Admin only)
  updateMedicine: async (medicineId: string, medicineData: UpdateMedicineRequest): Promise<IMedicine> => {
    try {
      const response = await axiosConfig.put(`/medicines/${medicineId}`, medicineData);
      
      if (response.data.success || response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [MedicinesAPI] Error updating medicine:', error);
      throw new Error(getErrorMessage(error) || 'Không thể cập nhật thuốc');
    }
  },

  // Kích hoạt/vô hiệu hóa thuốc (Manager/Admin only)
  toggleMedicineStatus: async (medicineId: string, isActive: boolean): Promise<IMedicine> => {
    try {
      const response = await axiosConfig.patch(`/medicines/${medicineId}/status`, { isActive });
      
      if (response.data.success || response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [MedicinesAPI] Error toggling medicine status:', error);
      throw new Error(getErrorMessage(error) || 'Không thể thay đổi trạng thái thuốc');
    }
  },

  // Lấy thống kê thuốc
  getMedicineStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: { type: string; count: number }[];
  }> => {
    try {
      const medicines = await medicinesApi.getAllMedicines();
      
      const total = medicines.length;
      const active = medicines.filter(m => m.isActive).length;
      const inactive = total - active;
      
      const typeCount: { [key: string]: number } = {};
      medicines.forEach(medicine => {
        typeCount[medicine.type] = (typeCount[medicine.type] || 0) + 1;
      });
      
      const byType = Object.entries(typeCount).map(([type, count]) => ({
        type,
        count
      }));

      return {
        total,
        active,
        inactive,
        byType
      };
    } catch (error: unknown) {
      console.error('❌ [MedicinesAPI] Error fetching medicine stats:', error);
      throw new Error('Không thể tải thống kê thuốc');
    }
  }
};

export default medicinesApi; 