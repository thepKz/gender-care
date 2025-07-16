import axiosInstance from '../axiosConfig';

export interface CreatePaymentLinkRequest {
  appointmentId: string;
  amount?: number;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreatePaymentLinkResponse {
  success: boolean;
  data: {
    paymentUrl: string;
    orderCode: string;
    amount: number;
    expiredAt: string;
  };
  message?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    orderCode: string;
    status: 'pending' | 'success' | 'failed' | 'cancelled' | 'expired';
    amount: number;
    paymentUrl?: string; // ✅ FIX: Thêm paymentUrl để có thể reuse
    appointmentStatus: string;
    paymentStatus?: string;
    paidAt?: string;
    createdAt: string;
    webhookReceived?: boolean;
  };
  message?: string;
}

/**
 * Tạo payment link cho appointment
 */
export const createPaymentLink = async (data: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResponse> => {
  const { appointmentId, returnUrl, cancelUrl } = data;
  const response = await axiosInstance.post(`/payments/appointments/${appointmentId}/create`, {
    returnUrl,
    cancelUrl
  });
  return response.data;
};


/**
 * Kiểm tra trạng thái thanh toán
 */
export const checkPaymentStatus = async (appointmentId: string): Promise<PaymentStatusResponse> => {
  const response = await axiosInstance.get(`/payments/appointments/${appointmentId}/status`);
  return response.data;
};

/**
 * Hủy thanh toán
 */
export const cancelPayment = async (appointmentId: string): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.post(`/payments/appointments/${appointmentId}/cancel`);
  return response.data;
};

/**
 * Fast confirm appointment payment (for PayOS return URLs)
 */
export const fastConfirmPayment = async (data: {
  appointmentId: string;
  orderCode: string;
  status: string;
}): Promise<{success: boolean; message: string; data?: unknown}> => {
  // ✅ FIX: Đúng pattern với appointmentId trong URL path
  const response = await axiosInstance.post(`/payments/appointments/${data.appointmentId}/fast-confirm`, {
    orderCode: data.orderCode,
    status: data.status
  });
  return response.data;
};

/**
 * ✅ NEW: Force check payment status and assign doctor
 */
export const forceCheckPaymentAndAssignDoctor = async (appointmentId: string): Promise<{
  success: boolean;
  message: string;
  data?: {
    appointmentId: string;
    status: string;
    paymentStatus: string;
    paidAt?: string;
    doctorId?: string;
    doctorName?: string;
    paymentUpdated: boolean;
    doctorAssigned: boolean;
    orderCode: number;
    paymentTrackingStatus: string;
  };
}> => {
  const response = await axiosInstance.post(`/payments/appointments/${appointmentId}/force-check`);
  return response.data;
};

const paymentApi = {
  createPaymentLink,
  checkPaymentStatus,
  cancelPayment,
  fastConfirmPayment,
  forceCheckPaymentAndAssignDoctor,
};

export default paymentApi; 