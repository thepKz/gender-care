import axiosInstance from '../axiosConfig';

// Định nghĩa types cho query parameters
interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  startDate?: string;
  endDate?: string;
}

const billingApi = {
  // Lấy danh sách hóa đơn
  getBills: (params?: QueryParams) => {
    return axiosInstance.get('/bills', { params });
  },
  
  // Lấy chi tiết hóa đơn
  getBillDetail: (id: string) => {
    return axiosInstance.get(`/bills/${id}`);
  },
  
  // Tạo hóa đơn cho appointment
  createBillForAppointment: (data: {
    profileId: string;
    appointmentId: string;
    promotionId?: string;
  }) => {
    return axiosInstance.post('/bills/appointment', data);
  },
  
  // Tạo hóa đơn cho package
  createBillForPackage: (data: {
    profileId: string;
    packageId: string;
    promotionId?: string;
  }) => {
    return axiosInstance.post('/bills/package', data);
  },
  
  // Thanh toán hóa đơn
  payBill: (billId: string, data: {
    paymentMethod: 'credit_card' | 'bank_transfer' | 'mobile_payment' | 'cash';
    paymentGateway?: string;
  }) => {
    return axiosInstance.post(`/bills/${billId}/pay`, data);
  },
  
  // Lấy lịch sử thanh toán
  getPaymentHistory: (params?: QueryParams) => {
    return axiosInstance.get('/payments/user', { params });
  },
  
  // Lấy chi tiết thanh toán
  getPaymentDetail: (id: string) => {
    return axiosInstance.get(`/payments/${id}`);
  },
  
  // Kiểm tra trạng thái thanh toán
  checkPaymentStatus: (transactionId: string) => {
    return axiosInstance.get(`/payments/status/${transactionId}`);
  }
};

export default billingApi; 