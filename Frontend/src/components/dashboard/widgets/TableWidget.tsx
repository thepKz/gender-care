import React from 'react';
import { Card, Table, Tag, Button, Space, Typography } from 'antd';
import { EyeOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AppointmentItem } from '../../../data/mockdata/dashboardStats';

const { Text } = Typography;

interface TableWidgetProps {
  data: AppointmentItem[];
  title?: string;
  loading?: boolean;
  showViewAll?: boolean;
  pagination?: boolean;
}

const TableWidget: React.FC<TableWidgetProps> = ({ 
  data, 
  title = "Lịch hẹn hôm nay",
  loading = false,
  showViewAll = true,
  pagination = false
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

  const getPriorityColor = (priority?: AppointmentItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<AppointmentItem> = [
    {
      title: 'Thời gian',
      dataIndex: 'time',
      key: 'time',
      width: 100,
      render: (time: string) => (
        <Text strong style={{ color: '#3b82f6', fontSize: '14px' }}>
          {time}
        </Text>
      )
    },
    {
      title: 'Bệnh nhân',
      dataIndex: 'patient',
      key: 'patient',
      render: (name: string, record: AppointmentItem) => (
        <div>
          <Text strong style={{ fontSize: '14px', color: '#1f2937' }}>
            {name}
          </Text>
          {record.notes && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.notes}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'service',
      key: 'service',
      ellipsis: true,
      render: (service: string) => (
        <Text style={{ fontSize: '13px' }}>{service}</Text>
      )
    },
    {
      title: 'Bác sĩ',
      dataIndex: 'doctor',
      key: 'doctor',
      render: (doctor?: string) => (
        doctor ? (
          <Text style={{ fontSize: '13px', color: '#6b7280' }}>
            {doctor}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Chưa phân công
          </Text>
        )
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AppointmentItem['status'], record: AppointmentItem) => (
        <Space direction="vertical" size={4}>
          <Tag color={getStatusColor(status)} style={{ margin: 0 }}>
            {getStatusText(status)}
          </Tag>
          {record.priority && (
            <Tag 
              color={getPriorityColor(record.priority)} 
              size="small"
              style={{ margin: 0, fontSize: '10px' }}
            >
              {record.priority.toUpperCase()}
            </Tag>
          )}
        </Space>
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
      <Table
        dataSource={data}
        columns={columns}
        pagination={pagination}
        size="small"
        scroll={{ x: 800 }}
        style={{
          '.ant-table-thead > tr > th': {
            backgroundColor: '#f8fafc',
            fontWeight: 600,
            fontSize: '13px'
          }
        }}
      />
    </Card>
  );
};

export default TableWidget;