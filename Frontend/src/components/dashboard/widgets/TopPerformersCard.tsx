import { TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Card, List, Progress, Tag, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

// Interface cho Top Performer
interface TopPerformer {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  rating: number;
  performance: number;
  avatar?: string;
  metrics: {
    label: string;
    value: number | string;
  }[];
}

// Mock data cho top performers
const topPerformersData: TopPerformer[] = [
  {
    id: '1',
    name: 'Dr. Nguyễn Thị Hương',
    role: 'Bác sĩ',
    specialty: 'Sản khoa',
    rating: 4.9,
    performance: 95,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=64&h=64&fit=crop&crop=face',
    metrics: [
      { label: 'Bệnh nhân', value: 156 },
      { label: 'Tỷ lệ hài lòng', value: '98%' }
    ]
  },
  {
    id: '2',
    name: 'Trần Minh Đức',
    role: 'Quản lý',
    specialty: 'Nội tiết sinh sản',
    rating: 4.8,
    performance: 92,
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=64&h=64&fit=crop&crop=face',
    metrics: [
      { label: 'Dự án hoàn thành', value: 24 },
      { label: 'Hiệu quả', value: '94%' }
    ]
  },
  {
    id: '3',
    name: 'Lê Thị Mai',
    role: 'Nhân viên',
    specialty: 'Tâm lý học',
    rating: 4.7,
    performance: 89,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b776?w=64&h=64&fit=crop&crop=face',
    metrics: [
      { label: 'Tư vấn', value: 98 },
      { label: 'Phản hồi tích cực', value: '96%' }
    ]
  },
  {
    id: '4',
    name: 'Phạm Văn An',
    role: 'Bác sĩ',
    specialty: 'Da liễu',
    rating: 4.6,
    performance: 87,
    metrics: [
      { label: 'Khám bệnh', value: 89 },
      { label: 'Đánh giá', value: '92%' }
    ]
  }
];

interface TopPerformersCardProps {
  title?: string;
  showAll?: () => void;
  maxItems?: number;
}

const TopPerformersCard: React.FC<TopPerformersCardProps> = ({
  title = "Nhân viên xuất sắc",
  showAll,
  maxItems = 4
}) => {
  const displayData = topPerformersData.slice(0, maxItems);

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return '#ffd700'; // Gold
      case 1: return '#c0c0c0'; // Silver  
      case 2: return '#cd7f32'; // Bronze
      default: return '#1890ff'; // Blue
    }
  };

  const getRankIcon = (index: number) => {
    if (index < 3) {
      return <TrophyOutlined style={{ color: getRankColor(index) }} />;
    }
    return <span style={{ 
      background: '#f0f0f0', 
      borderRadius: '50%', 
      width: '20px', 
      height: '20px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#666'
    }}>
      {index + 1}
    </span>;
  };

  return (
    <Card 
      title={title}
      extra={showAll && <a onClick={showAll}>Xem tất cả</a>}
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <List
        itemLayout="horizontal"
        dataSource={displayData}
        renderItem={(item, index) => (
          <List.Item style={{ 
            padding: '16px 0',
            borderBottom: index === displayData.length - 1 ? 'none' : '1px solid #f0f0f0'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%', 
              gap: '12px' 
            }}>
              {/* Rank */}
              <div style={{ minWidth: '24px', textAlign: 'center' }}>
                {getRankIcon(index)}
              </div>

              {/* Avatar */}
              <Avatar 
                src={item.avatar} 
                size={48}
                style={{ backgroundColor: '#667eea' }}
              >
                {!item.avatar && <UserOutlined />}
              </Avatar>
              
              {/* Main Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name and Rating */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '4px' 
                }}>
                  <Text strong style={{ fontSize: '14px' }}>
                    {item.name}
                  </Text>
                  <Tag color="gold" style={{ margin: 0 }}>
                    ⭐ {item.rating}
                  </Tag>
                </div>

                {/* Role and Specialty */}
                <div style={{ marginBottom: '8px' }}>
                  <Text style={{ fontSize: '13px', color: '#1890ff' }}>
                    {item.role}
                  </Text>
                  {item.specialty && (
                    <>
                      <span style={{ color: '#d9d9d9', margin: '0 4px' }}>•</span>
                      <Text style={{ fontSize: '13px', color: '#666' }}>
                        {item.specialty}
                      </Text>
                    </>
                  )}
                </div>

                {/* Performance Progress */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '2px'
                  }}>
                    <Text style={{ fontSize: '12px', color: '#666' }}>
                      Hiệu suất
                    </Text>
                    <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {item.performance}%
                    </Text>
                  </div>
                  <Progress 
                    percent={item.performance} 
                    size="small" 
                    showInfo={false}
                    strokeColor={
                      item.performance >= 90 ? '#52c41a' :
                      item.performance >= 80 ? '#faad14' : '#ff4d4f'
                    }
                  />
                </div>

                {/* Metrics */}
                <div style={{ 
                  display: 'flex', 
                  gap: '16px',
                  marginTop: '4px'
                }}>
                  {item.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        color: '#1890ff'
                      }}>
                        {metric.value}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#999' 
                      }}>
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default TopPerformersCard; 