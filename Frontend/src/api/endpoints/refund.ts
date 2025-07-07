import axiosConfig from '../axiosConfig';

export interface RefundRequest {
  id: string;
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  refundAmount: number;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  phoneNumber: string;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export interface RefundRequestsResponse {
  success: boolean;
  data: {
    refundRequests: RefundRequest[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface RefundDetailResponse {
  success: boolean;
  data: RefundRequest;
}

export interface UpdateRefundStatusResponse {
  success: boolean;
  message: string;
  data: {
    paymentId: string;
    status: string;
    processedBy: string;
    processedAt: string;
  };
}

export interface RefundFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'completed' | 'rejected';
  startDate?: string;
  endDate?: string;
}

/**
 * Lấy danh sách tất cả yêu cầu hoàn tiền (Manager only)
 */
export const getAllRefundRequests = async (filters: RefundFilters = {}): Promise<RefundRequestsResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await axiosConfig.get(`/refunds?${params.toString()}`);
    
    console.log('✅ [RefundAPI] Fetched refund requests:', {
      total: response.data.data.pagination.total,
      page: response.data.data.pagination.page
    });

    return response.data;
  } catch (error) {
    console.error('❌ [RefundAPI] Error fetching refund requests:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết một yêu cầu hoàn tiền (Manager only)
 */
export const getRefundRequestDetail = async (paymentId: string): Promise<RefundDetailResponse> => {
  try {
    const response = await axiosConfig.get(`/refunds/${paymentId}`);
    
    console.log('✅ [RefundAPI] Fetched refund detail:', paymentId);
    
    return response.data;
  } catch (error) {
    console.error('❌ [RefundAPI] Error fetching refund detail:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái xử lý yêu cầu hoàn tiền (Manager only)
 */
export const updateRefundStatus = async (
  paymentId: string, 
  status: 'pending' | 'processing' | 'completed' | 'rejected',
  notes?: string
): Promise<UpdateRefundStatusResponse> => {
  try {
    const payload: { status: string; notes?: string } = { status };
    if (notes) payload.notes = notes;

    const response = await axiosConfig.put(`/refunds/${paymentId}/status`, payload);
    
    console.log('✅ [RefundAPI] Updated refund status:', {
      paymentId,
      newStatus: status,
      processedBy: response.data.data.processedBy
    });

    return response.data;
  } catch (error) {
    console.error('❌ [RefundAPI] Error updating refund status:', error);
    throw error;
  }
};

// Export default object với tất cả functions
const refundAPI = {
  getAllRefundRequests,
  getRefundRequestDetail,
  updateRefundStatus
};

export default refundAPI; 