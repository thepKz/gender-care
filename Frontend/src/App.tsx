import { ConfigProvider, notification } from 'antd';
import React, { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAppDispatch } from './redux/hooks';
import { updateUser } from './redux/slices/authSlice';
import AppRoutes from './routes';
import { cleanupInvalidTokens } from './utils/helpers';

// Import debug utilities trong development
if (process.env.NODE_ENV === 'development') {
  import('./utils/debugToken');
}

// Custom notification config
notification.config({
  placement: 'topRight',
  top: 80,
  duration: 4,
  maxCount: 3,
  rtl: false,
});

// Helper function để kiểm tra cookie access_token
const hasAccessToken = () => {
  return document.cookie.split(';').some(c => c.trim().startsWith('access_token='));
};

// Helper function để lấy user_info từ cookie
const getUserInfoFromCookie = () => {
  const match = document.cookie.match(/user_info=([^;]+)/);
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[1]));
    } catch {
      return null;
    }
  }
  return null;
};

const App: React.FC = () => {
  const { fetchProfile } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Cleanup tokens không hợp lệ trước khi làm gì khác
    cleanupInvalidTokens();
    
    // Nếu có cookie user_info thì cập nhật redux ngay
    const userInfo = getUserInfoFromCookie();
    if (userInfo) {
      dispatch(updateUser(userInfo));
    }
    // Sau đó vẫn gọi fetchProfile để xác thực lại
    if (hasAccessToken()) {
      fetchProfile().catch(() => {
        // Bắt lỗi nếu có để ngăn app crash
        console.error('Không thể lấy thông tin người dùng');
      });
    }
  }, [dispatch, fetchProfile]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Notification: {
            width: 380,
            zIndexPopup: 9999,
          },
          Message: {
            contentBg: '#ffffff',
            contentPadding: '12px 16px',
            borderRadiusLG: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            fontSize: 14,
            lineHeight: 1.5,
          },
        },
        token: {
          colorSuccess: '#52c41a',
          colorError: '#ff4d4f',
          colorWarning: '#faad14',
          colorInfo: '#1890ff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <AppRoutes />
    </ConfigProvider>
  );
};

export default App; 