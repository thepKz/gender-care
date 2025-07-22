import React from 'react';
import { Card, Typography, Space } from 'antd';
import { CommentOutlined, StarOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import FeedbackManagement from '../../pages/dashboard/management/FeedbackManagement';

const { Title, Text } = Typography;

const FeedbackManagementDemo: React.FC = () => {
  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ display: 'flex', alignItems: 'center' }}>
          <CommentOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          Demo Trang Quản Lý Feedback
        </Title>
        <Text type="secondary">
          Đây là demo trang quản lý feedback cho role Manager. Trang này cho phép:
        </Text>
        <div style={{ marginTop: '16px' }}>
          <Space direction="vertical" size="small">
            <Text>• <StarOutlined /> Xem tổng quan thống kê feedback (tổng số, rating trung bình, top doctor)</Text>
            <Text>• <UserOutlined /> Hiển thị danh sách feedback với tên khách hàng được ẩn danh (ví dụ: T.M.Trung)</Text>
            <Text>• <CommentOutlined /> Filter theo bác sĩ, rating, ngày tạo, trạng thái hiển thị</Text>
            <Text>• <TrophyOutlined /> Tìm kiếm theo nội dung feedback</Text>
            <Text>• 👁️ Xem chi tiết feedback và quản lý trạng thái hiển thị</Text>
            <Text>• 🗑️ Ẩn hoặc xóa feedback không phù hợp</Text>
          </Space>
        </div>
        <div style={{ marginTop: '16px' }}>
          <Text strong>Lưu ý: </Text>
          <Text type="warning">
            Demo này sẽ load feedback từ tất cả bác sĩ trong hệ thống. 
            Trong thực tế nên có API riêng để tối ưu performance.
          </Text>
        </div>
      </Card>

      {/* Main FeedbackManagement Component */}
      <FeedbackManagement />
    </div>
  );
};

export default FeedbackManagementDemo; 