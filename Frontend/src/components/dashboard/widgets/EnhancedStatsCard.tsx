import {
    FallOutlined,
    MoreOutlined,
    RiseOutlined
} from '@ant-design/icons';
import { Button, Card, Statistic } from 'antd';
import React from 'react';

// Interface cho Enhanced Stats Card
interface EnhancedStatsCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  onClick?: () => void;
}

const EnhancedStatsCard: React.FC<EnhancedStatsCardProps> = ({
  title,
  value,
  suffix,
  prefix,
  icon,
  color,
  change,
  trend,
  onClick
}) => {
  return (
    <Card
      style={{ 
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid #e5e7eb',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease'
      }}
      styles={{ body: { padding: '24px' } }}
      hoverable={!!onClick}
      onClick={onClick}
    >
      {/* Header với icon và more button */}
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
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: color
        }}>
          {icon}
        </div>
        <Button 
          type="text" 
          icon={<MoreOutlined />} 
          size="small" 
          style={{ color: '#9ca3af' }}
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement dropdown menu
            console.log('More options for:', title);
          }}
        />
      </div>
      
      {/* Title */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{ 
          fontSize: '14px', 
          color: '#6b7280',
          fontWeight: 500
        }}>
          {title}
        </span>
      </div>
      
      {/* Main Value */}
      <div style={{ marginBottom: '12px' }}>
        <Statistic 
          value={value}
          suffix={suffix}
          prefix={prefix}
          valueStyle={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            color: '#1f2937',
            lineHeight: 1
          }}
        />
      </div>

      {/* Trend Indicator */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px' 
      }}>
        {trend === 'up' ? (
          <RiseOutlined style={{ 
            color: '#10b981', 
            fontSize: '12px' 
          }} />
        ) : (
          <FallOutlined style={{ 
            color: '#ef4444', 
            fontSize: '12px' 
          }} />
        )}
        <span style={{ 
          color: trend === 'up' ? '#10b981' : '#ef4444',
          fontSize: '12px',
          fontWeight: 500
        }}>
          {change}
        </span>
      </div>
    </Card>
  );
};

export default EnhancedStatsCard; 