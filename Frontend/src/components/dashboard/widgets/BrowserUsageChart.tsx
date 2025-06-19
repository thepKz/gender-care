import {
  ChromeOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { Card, List, Tag, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

// Interface cho Browser Usage Data
interface BrowserUsageData {
  name: string;
  percentage: number;
  color: string;
  icon: React.ReactNode;
  users: number;
}

interface BrowserUsageChartProps {
  title?: string;
  showDetails?: boolean;
  data?: BrowserUsageData[]; // ✅ Nhận data từ props
  loading?: boolean; // ✅ Thêm loading state
}

const BrowserUsageChart: React.FC<BrowserUsageChartProps> = ({
  title = "Phân tích người dùng",
  showDetails = true,
  data, // ✅ Sử dụng data từ props
  loading = false
}) => {
  // ✅ Fallback data khi không có data từ API hoặc props
  const defaultBrowserData: BrowserUsageData[] = [
    {
      name: 'Chrome',
      percentage: 40,
      color: '#3b82f6',
      icon: <ChromeOutlined />,
      users: 1248
    },
    {
      name: 'Mobile',
      percentage: 4,
      color: '#8b5cf6',
      icon: <MobileOutlined />,
      users: 124
    }
  ];

  // ✅ Sử dụng data từ props hoặc fallback data
  const browserData = data && data.length > 0 ? data : defaultBrowserData;

  // Tính total users
  const totalUsers = browserData.reduce((sum, item) => sum + item.users, 0);

  // Tạo conic gradient string
  const createConicGradient = () => {
    let currentDegree = 0;
    const gradientParts: string[] = [];

    browserData.forEach((item) => {
      const segmentDegree = (item.percentage / 100) * 360;
      const startDeg = currentDegree;
      const endDeg = currentDegree + segmentDegree;
      
      gradientParts.push(`${item.color} ${startDeg}deg ${endDeg}deg`);
      currentDegree = endDeg;
    });

    return `conic-gradient(${gradientParts.join(', ')})`;
  };

  return (
    <Card 
      title={title}
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      loading={loading} // ✅ Hiển thị loading state
    >
      {!loading && (
        <>
          {/* Chart Section */}
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '120px',
              height: '120px', 
              borderRadius: '50%',
              margin: '0 auto 16px',
              background: createConicGradient(),
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Inner white circle */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {totalUsers.toLocaleString()}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  Người dùng
                </div>
              </div>
            </div>

            <Text type="secondary" style={{ fontSize: '13px' }}>
              Phân tích theo thiết bị và trình duyệt
            </Text>
          </div>

          {/* Details List */}
          {showDetails && (
            <div style={{ marginTop: '16px' }}>
              <List
                size="small"
                dataSource={browserData}
                renderItem={(item) => (
                  <List.Item style={{ 
                    padding: '8px 0',
                    border: 'none'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      width: '100%'
                    }}>
                      {/* Browser info */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px' 
                      }}>
                        <div style={{ 
                          color: item.color,
                          fontSize: '16px'
                        }}>
                          {item.icon}
                        </div>
                        <Text style={{ fontSize: '13px', fontWeight: 500 }}>
                          {item.name}
                        </Text>
                      </div>

                      {/* Stats */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px' 
                      }}>
                        <Text style={{ fontSize: '12px', color: '#666' }}>
                          {item.users.toLocaleString()}
                        </Text>
                        <Tag 
                          color={item.color}
                          style={{ 
                            margin: 0,
                            minWidth: '48px',
                            textAlign: 'center',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.percentage}%
                        </Tag>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
              
              {/* Summary */}
              <div style={{ 
                marginTop: '16px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  Được cập nhật realtime • Chrome chiếm ưu thế với {browserData[0]?.percentage || 0}%
                </Text>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default BrowserUsageChart; 