import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { notification } from 'antd';

interface NotificationProps {
  title: string;
  description?: string;
  duration?: number;
}

// Success Notification với design đẹp
export const showSuccessNotification = ({ title, description, duration = 4 }: NotificationProps) => {
  notification.success({
    message: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
          <CheckCircleOutlined className="text-white text-lg" />
        </div>
        <div>
          <div className="font-semibold text-green-800 text-base">{title}</div>
          {description && <div className="text-green-600 text-sm mt-1">{description}</div>}
        </div>
      </div>
    ),
    description: null,
    duration,
    placement: 'topRight',
    style: {
      background: 'linear-gradient(135deg, #f0fff4 0%, #f6ffed 100%)',
      border: '1px solid #b7eb8f',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 10px 40px rgba(82, 196, 26, 0.15)',
      borderLeft: '4px solid #52c41a',
    },
    className: 'custom-notification-success',
  });
};

// Error Notification với design đẹp
export const showErrorNotification = ({ title, description, duration = 5 }: NotificationProps) => {
  notification.error({
    message: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
          <CloseCircleOutlined className="text-white text-lg" />
        </div>
        <div>
          <div className="font-semibold text-red-800 text-base">{title}</div>
          {description && <div className="text-red-600 text-sm mt-1">{description}</div>}
        </div>
      </div>
    ),
    description: null,
    duration,
    placement: 'topRight',
    style: {
      background: 'linear-gradient(135deg, #fff2f0 0%, #fff1f0 100%)',
      border: '1px solid #ffccc7',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 10px 40px rgba(255, 77, 79, 0.15)',
      borderLeft: '4px solid #ff4d4f',
    },
    className: 'custom-notification-error',
  });
};

// Warning Notification với design đẹp
export const showWarningNotification = ({ title, description, duration = 4 }: NotificationProps) => {
  notification.warning({
    message: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
          <ExclamationCircleOutlined className="text-white text-lg" />
        </div>
        <div>
          <div className="font-semibold text-orange-800 text-base">{title}</div>
          {description && <div className="text-orange-600 text-sm mt-1">{description}</div>}
        </div>
      </div>
    ),
    description: null,
    duration,
    placement: 'topRight',
    style: {
      background: 'linear-gradient(135deg, #fffbe6 0%, #fffae6 100%)',
      border: '1px solid #ffe58f',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 10px 40px rgba(250, 173, 20, 0.15)',
      borderLeft: '4px solid #faad14',
    },
    className: 'custom-notification-warning',
  });
};

// Info Notification với design đẹp
export const showInfoNotification = ({ title, description, duration = 4 }: NotificationProps) => {
  notification.info({
    message: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <InfoCircleOutlined className="text-white text-lg" />
        </div>
        <div>
          <div className="font-semibold text-blue-800 text-base">{title}</div>
          {description && <div className="text-blue-600 text-sm mt-1">{description}</div>}
        </div>
      </div>
    ),
    description: null,
    duration,
    placement: 'topRight',
    style: {
      background: 'linear-gradient(135deg, #e6f7ff 0%, #e6f4ff 100%)',
      border: '1px solid #91d5ff',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 10px 40px rgba(24, 144, 255, 0.15)',
      borderLeft: '4px solid #1890ff',
    },
    className: 'custom-notification-info',
  });
}; 