import axios from 'axios';
import { getValidTokenFromStorage } from '../../utils/helpers';

interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
}

/**
 * Hàm xử lý API request
 * @param endpoint URL của API endpoint
 * @param data Dữ liệu gửi lên server (optional)
 * @param method Phương thức HTTP (GET, POST, PUT, DELETE)
 * @returns Promise với dữ liệu phản hồi từ API
 */
export const handleAPI = async <T = any>(
  endpoint: string,
  data?: any,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
): Promise<ApiResponse<T>> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || '';
    const url = `${apiUrl}${endpoint}`;
    
    // Sử dụng helper function để lấy token hợp lệ
    const token = getValidTokenFromStorage('access_token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
    
    // Debug log để kiểm tra token
    if (process.env.NODE_ENV === 'development') {
      console.log('[handleAPI] Endpoint:', endpoint);
      console.log('[handleAPI] Token exists:', !!token);
      console.log('[handleAPI] Token preview:', token ? `${token.substring(0, 20)}...` : 'none');
    }
    
    let response;
    
    switch (method) {
      case 'GET':
        response = await axios.get<ApiResponse<T>>(url, config);
        break;
      case 'POST':
        response = await axios.post<ApiResponse<T>>(url, data, config);
        break;
      case 'PUT':
        response = await axios.put<ApiResponse<T>>(url, data, config);
        break;
      case 'DELETE':
        response = await axios.delete<ApiResponse<T>>(url, config);
        break;
      default:
        response = await axios.post<ApiResponse<T>>(url, data, config);
    }
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      // Xử lý lỗi từ API
      if (error.response) {
        // Server trả về response với status code nằm ngoài range 2xx
        throw error.response.data;
      } else if (error.request) {
        // Request đã được tạo nhưng không nhận được response
        throw { message: 'Không thể kết nối đến server', success: false };
      }
    }
    
    // Lỗi khác
    throw { message: error.message || 'Có lỗi xảy ra', success: false };
  }
}; 