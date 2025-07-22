import React from 'react';
import { Card, Table, Tag, Button, Space, Typography } from 'antd';
import { EyeOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AppointmentItem } from '../../../types/dashboard';

const { Text } = Typography;

interface TableWidgetProps {
  data: AppointmentItem[];
  title?: string;
  loading?: boolean;
  showViewAll?: boolean;
  pagination?: boolean | object;
  showAvatar?: boolean;
  showPhone?: boolean;
  compact?: boolean;
}

const TableWidget: React.FC<TableWidgetProps> = ({ 
  data, 
  title = "Lịch hẹn hôm nay",
  loading = false,
  showViewAll = true,
  pagination = false,
  showAvatar = false,
  showPhone = false,
  compact = false
}) => {
  const getStatusColor = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'confirmed':
        return 'green';
      case 'in-progress':
        return 'blue';
      case 'waiting':
        return 'orange';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'in-progress':
        return 'Đang thực hiện';
      case 'waiting':
        return 'Đang chờ';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const columns: ColumnsType<AppointmentItem> = [
    {
      title: 'Thời gian',
      dataIndex: 'time',
      key: 'time',
      width: 100,
      render: (time: string) => (
        <Text strong style={{ color: '#3b82f6', fontSize: compact ? '13px' : '14px' }}>
          {time}
        </Text>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'service',
      key: 'service',
      ellipsis: true,
      render: (service: string) => (
        <Text style={{ fontSize: compact ? '12px' : '13px' }}>{service}</Text>
      )
    },
    {
      title: 'Bệnh nhân',
      dataIndex: 'patientName',
      key: 'patientName',
      render: (name: string, record: AppointmentItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showAvatar && (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: compact ? 28 : 32, height: compact ? 28 : 32, background: '#f0f2f5', borderRadius: '50%' }}>
              <svg width={compact ? 18 : 20} height={compact ? 18 : 20} fill="#bdbdbd" viewBox="0 0 24 24"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>
            </span>
          )}
          <div>
            <Text strong style={{ fontSize: compact ? '13px' : '14px', color: '#1f2937' }}>{name}</Text>
            {/* Nếu AppointmentItem không có phone, fallback sang notes hoặc để trống */}
            {showPhone && (typeof (record as { phone?: string }).phone === 'string' ? (record as { phone?: string }).phone : record.notes) && (
              <div style={{ fontSize: compact ? '11px' : '12px', color: '#666' }}>{typeof (record as { phone?: string }).phone === 'string' ? (record as { phone?: string }).phone : record.notes || ''}</div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AppointmentItem['status']) => (
        <Tag color={getStatusColor(status)} style={{ margin: 0, fontSize: compact ? '11px' : '12px', padding: compact ? '2px 8px' : undefined }}>
          {getStatusText(status)}
        </Tag>
      )
    }
  ];

  return (
    <Card 
      title={title}
      style={{ 
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid #e5e7eb',
        height: '100%',
        padding: compact ? 8 : 16
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
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={pagination === false ? false : {
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
          ...(typeof pagination === 'object' ? pagination : {})
        }}
        scroll={{ x: 800 }}
        size={compact ? 'small' : 'middle'}
        style={{ fontSize: compact ? 13 : 14 }}
      />
    </Card>
  );
};

export default TableWidget;