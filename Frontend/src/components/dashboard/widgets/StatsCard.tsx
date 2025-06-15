import React from 'react';
import { Card, Statistic, Button } from 'antd';
import { 
  RiseOutlined, 
  FallOutlined, 
  MoreOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HeartOutlined
} from '@ant-design/icons';
import type { DashboardStat } from '../../../data/mockdata/dashboardStats';

interface StatsCardProps {
  stat: DashboardStat;
  loading?: boolean;
}

// Icon mapping để convert string thành React component
const iconMap = {
  UserOutlined: UserOutlined,
  DollarOutlined: DollarOutlined,
  CalendarOutlined: CalendarOutlined,
  StarOutlined: StarOutlined,
  CheckCircleOutlined: CheckCircleOutlined,
  ClockCircleOutlined: ClockCircleOutlined,
  HeartOutlined: HeartOutlined
};

const StatsCard: React.FC<StatsCardProps> = ({ stat, loading = false }) => {
  // Get icon component từ string
  const IconComponent = iconMap[stat.icon as keyof typeof iconMap] || UserOutlined;

  return (
    <Card
      loading={loading}
      style={{ 
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid #e5e7eb',
        height: '100%'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      {/* Header với icon và menu */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '12px' 
      }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '12px',
          background: `${stat.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: stat.color
        }}>
          <IconComponent />
        </div>
        <Button type="text" icon={<MoreOutlined />} size="small" />
      </div>
      
      {/* Title */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{ 
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: 500
        }}>
          {stat.title}
        </span>
      </div>
      
      {/* Main Value */}
      <div style={{ marginBottom: '12px' }}>
        <Statistic 
          value={stat.value}
          suffix={stat.suffix}
          prefix={stat.prefix}
          valueStyle={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            color: '#1f2937',
            lineHeight: 1
          }}
        />
      </div>

      {/* Trend và Change */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {stat.trend === 'up' && (
          <RiseOutlined style={{ color: '#10b981', fontSize: '12px' }} />
        )}
        {stat.trend === 'down' && (
          <FallOutlined style={{ color: '#ef4444', fontSize: '12px' }} />
        )}
        <span style={{ 
          color: stat.trend === 'up' ? '#10b981' : 
                 stat.trend === 'down' ? '#ef4444' : '#6b7280',
          fontSize: '12px',
          fontWeight: 500
        }}>
          {stat.change}
        </span>
      </div>

      {/* Description (optional) */}
      {stat.description && (
        <div style={{ 
          marginTop: '8px',
          fontSize: '11px',
          color: '#9ca3af',
          lineHeight: 1.4
        }}>
          {stat.description}
        </div>
      )}
    </Card>
  );
};

export default StatsCard;