import React from 'react';
import { Card, List, Avatar, Badge, Button, Space, Typography } from 'antd';
import { EyeOutlined, MoreOutlined } from '@ant-design/icons';
import type { ActivityItem } from '../../../types/dashboard';

const { Text } = Typography;

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  loading?: boolean;
  showViewAll?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities, 
  title = "Hoạt động gần đây",
  loading = false,
  showViewAll = true
}) => {
  const getBadgeStatus = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'processing';
    }
  };

  return (
    <Card 
      title={title}
      style={{ 
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid #e5e7eb',
        height: '100%'
      }}
      extra={
        showViewAll && (
          <Space>
            <Button type="text" icon={<EyeOutlined />} size="small" />
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Space>
        )
      }
      loading={loading}
    >
      <List
        dataSource={activities}
        renderItem={(item) => (
          <List.Item style={{ padding: '16px 0', border: 'none' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%', 
              gap: '12px' 
            }}>
              {/* Avatar */}
              <Avatar 
                src={item.avatar} 
                size={40}
                style={{ 
                  backgroundColor: '#667eea',
                  flexShrink: 0
                }}
              >
                {!item.avatar && item.user.charAt(0)}
              </Avatar>
              
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '4px' 
                }}>
                  <Text 
                    strong 
                    style={{ 
                      fontSize: '14px',
                      color: '#1f2937'
                    }}
                    ellipsis
                  >
                    {item.user}
                  </Text>
                  <Badge status={getBadgeStatus(item.status)} />
                </div>
                <Text 
                  style={{ 
                    fontSize: '13px', 
                    color: '#6b7280',
                    display: 'block',
                    lineHeight: 1.4
                  }}
                  ellipsis={{ tooltip: item.action }}
                >
                  {item.action}
                </Text>
              </div>
              
              {/* Time */}
              <Text 
                type="secondary" 
                style={{ 
                  fontSize: '12px',
                  flexShrink: 0,
                  color: '#9ca3af'
                }}
              >
                {item.time}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default ActivityFeed;