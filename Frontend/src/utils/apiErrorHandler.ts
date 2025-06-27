import { notification } from 'antd';

// Utility function để xử lý API errors thống nhất
export const handleApiError = (error: any, customMessage?: string) => {
  let message = 'Lỗi';
  let description = customMessage || 'Có lỗi xảy ra, vui lòng thử lại';

  if (error?.response?.data?.message) {
    description = error.response.data.message;
  } else if (error?.message) {
    description = error.message;
  }

  notification.error({
    message,
    description
  });
};

// Utility function để hiển thị success notification thống nhất
export const showSuccessNotification = (description: string, message = 'Thành công') => {
  notification.success({
    message,
    description
  });
};

// Utility function để hiển thị warning notification
export const showWarningNotification = (description: string, message = 'Cảnh báo') => {
  notification.warning({
    message,
    description
  });
};

// Utility function để hiển thị info notification
export const showInfoNotification = (description: string, message = 'Thông tin') => {
  notification.info({
    message,
    description
  });
}; 