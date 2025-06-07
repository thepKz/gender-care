import React from 'react';
import { Card, Statistic, Space, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatsCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: React.ReactNode;
  precision?: number;
  valueStyle?: React.CSSProperties;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: {
    percent: number;
    strokeColor?: string;
  };
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  suffix,
  prefix,
  precision,
  valueStyle,
  trend,
  progress,
  icon,
  loading = false,
  className,
  style,
}) => {
  const getTrendColor = (isPositive: boolean) => {
    return isPositive ? '#52c41a' : '#ff4d4f';
  };

  const getTrendIcon = (isPositive: boolean) => {
    return isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
  };

  return (
    <Card
      loading={loading}
      className={className}
      bodyStyle={{ 
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #f0f0f0',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        transition: 'all 0.3s ease',
        ...style,
      }}
      hoverable
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* Header với icon */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '8px' 
          }}>
            <span style={{ 
              color: '#666', 
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '20px' 
            }}>
              {title}
            </span>
            {icon && (
              <div style={{ 
                color: '#667eea',
                fontSize: '24px',
                opacity: 0.8 
              }}>
                {icon}
              </div>
            )}
          </div>

          {/* Giá trị chính */}
          <Statistic
            value={value}
            suffix={suffix}
            prefix={prefix}
            precision={precision}
            valueStyle={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#333',
              lineHeight: '36px',
              ...valueStyle,
            }}
          />

          {/* Trend và Progress */}
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {trend && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                fontSize: '12px' 
              }}>
                <span style={{ 
                  color: getTrendColor(trend.isPositive),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: 500
                }}>
                  {getTrendIcon(trend.isPositive)}
                  {Math.abs(trend.value)}%
                </span>
                <span style={{ color: '#999' }}>
                  so với tháng trước
                </span>
              </div>
            )}

            {progress && (
              <Progress
                percent={progress.percent}
                strokeColor={progress.strokeColor || '#667eea'}
                trailColor="#f0f0f0"
                strokeWidth={6}
                showInfo={false}
                style={{ margin: 0 }}
              />
            )}
          </Space>
        </Space>
      </div>

      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        background: 'linear-gradient(135deg, #667eea20, #764ba220)',
        borderRadius: '50%',
        zIndex: 0,
      }} />
    </Card>
  );
};

export default StatsCard; 