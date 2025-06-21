import { ConfigProvider, notification, App as AntApp } from 'antd';
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

// Helper function để handle SPA redirect từ 404 fallback
const handleSpaRedirect = (navigate: (to: string, options?: any) => void, location: any) => {
  // Kiểm tra query parameter từ 404.html redirect
  const urlParams = new URLSearchParams(location.search);
  const redirectPath = urlParams.get('redirect');
  
  if (redirectPath) {
    // Redirect tới path được store từ 404.html
    console.log('🔄 SPA Redirect from 404 fallback:', redirectPath);
    navigate(redirectPath, { replace: true });
    return true;
  }
  
  // Kiểm tra sessionStorage từ 404.html
  try {
    const storedPath = sessionStorage.getItem('spa_redirect_path');
    if (storedPath && storedPath !== location.pathname + location.search + location.hash) {
      console.log('🔄 SPA Redirect from sessionStorage:', storedPath);
      sessionStorage.removeItem('spa_redirect_path');
      navigate(storedPath, { replace: true });
      return true;
    }
  } catch (e) {
    // Ignore storage errors
  }
  
  return false;
};

const App: React.FC = () => {
  const { fetchProfile } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Cleanup tokens không hợp lệ trước khi làm gì khác
    cleanupInvalidTokens();
    
    // Handle SPA redirect từ 404 fallback ngay khi app load
    const wasRedirected = handleSpaRedirect(navigate, location);
    
    // Nếu có cookie user_info thì cập nhật redux ngay
    const userInfo = getUserInfoFromCookie();
    if (userInfo) {
      dispatch(updateUser(userInfo));
    }
    
    // Sau đó vẫn gọi fetchProfile để xác thực lại (chỉ khi không redirect)
    if (hasAccessToken() && !wasRedirected) {
      fetchProfile().catch(() => {
        // Bắt lỗi nếu có để ngăn app crash
        console.error('Không thể lấy thông tin người dùng');
      });
    }
  }, [dispatch, fetchProfile, navigate, location]);

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
      <AntApp>
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  );
};

export default App; 