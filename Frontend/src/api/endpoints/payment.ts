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
    status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
    amount: number;
    transactions: unknown[];
    createdAt: string;
    appointmentId: string;
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
  const response = await axiosInstance.post('/payments/appointments/fast-confirm', data);
  return response.data;
};

const paymentApi = {
  createPaymentLink,
  checkPaymentStatus,
  cancelPayment,
  fastConfirmPayment,
};

export default paymentApi; 