import { ExportOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Select, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';

const { Option } = Select;

// Interface cho Role Permission
interface RolePermission {
  key: string;
  module: string;
  feature: string;
  admin: boolean;
  manager: boolean;
  staff: boolean;
  doctor: boolean;
  description: string;
  category: string;
}

// Mock data cho permissions
const permissionsData: RolePermission[] = [
  {
    key: '1',
    module: 'Quản lý người dùng',
    feature: 'Tạo tài khoản',
    admin: true,
    manager: true,
    staff: false,
    doctor: false,
    description: 'Có thể tạo tài khoản người dùng mới',
    category: 'Quản lý hệ thống'
  },
  {
    key: '2',
    module: 'Quản lý người dùng',
    feature: 'Xóa tài khoản',
    admin: true,
    manager: false,
    staff: false,
    doctor: false,
    description: 'Có thể xóa tài khoản người dùng',
    category: 'Quản lý hệ thống'
  },
  {
    key: '3',
    module: 'Quản lý bác sĩ',
    feature: 'Xem hồ sơ bác sĩ',
    admin: true,
    manager: true,
    staff: true,
    doctor: true,
    description: 'Có thể xem thông tin hồ sơ bác sĩ',
    category: 'Quản lý nhân sự'
  },
  {
    key: '4',
    module: 'Quản lý bác sĩ',
    feature: 'Chỉnh sửa hồ sơ bác sĩ',
    admin: true,
    manager: true,
    staff: false,
    doctor: true,
    description: 'Có thể chỉnh sửa thông tin bác sĩ',
    category: 'Quản lý nhân sự'
  },
  {
    key: '5',
    module: 'Quản lý lịch hẹn',
    feature: 'Tạo lịch hẹn',
    admin: true,
    manager: true,
    staff: true,
    doctor: true,
    description: 'Có thể tạo lịch hẹn mới',
    category: 'Vận hành'
  },
  {
    key: '6',
    module: 'Quản lý lịch hẹn',
    feature: 'Hủy lịch hẹn',
    admin: true,
    manager: true,
    staff: true,
    doctor: false,
    description: 'Có thể hủy lịch hẹn',
    category: 'Vận hành'
  },
  {
    key: '7',
    module: 'Hồ sơ bệnh án',
    feature: 'Tạo hồ sơ',
    admin: true,
    manager: false,
    staff: true,
    doctor: true,
    description: 'Có thể tạo hồ sơ bệnh án mới',
    category: 'Y tế'
  },
  {
    key: '8',
    module: 'Hồ sơ bệnh án',
    feature: 'Xem hồ sơ',
    admin: true,
    manager: true,
    staff: true,
    doctor: true,
    description: 'Có thể xem hồ sơ bệnh án',
    category: 'Y tế'
  },
  {
    key: '9',
    module: 'Báo cáo hệ thống',
    feature: 'Xem báo cáo',
    admin: true,
    manager: true,
    staff: false,
    doctor: false,
    description: 'Có thể xem báo cáo hệ thống',
    category: 'Phân tích'
  },
  {
    key: '10',
    module: 'Cấu hình hệ thống',
    feature: 'Thay đổi cấu hình',
    admin: true,
    manager: false,
    staff: false,
    doctor: false,
    description: 'Có thể thay đổi cấu hình hệ thống',
    category: 'Quản lý hệ thống'
  }
];

const RolePermissionTable: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredData, setFilteredData] = useState<RolePermission[]>(permissionsData);

  // Filter categories
  const categories = ['all', ...Array.from(new Set(permissionsData.map(item => item.category)))];

  // Handle search and filter
  const handleSearch = (value: string) => {
    setSearchText(value);
    filterData(value, selectedCategory);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    filterData(searchText, value);
  };

  const filterData = (search: string, category: string) => {
    let filtered = permissionsData;

    if (category !== 'all') {
      filtered = filtered.filter(item => item.category === category);
    }

    if (search) {
      filtered = filtered.filter(item =>
        item.module.toLowerCase().includes(search.toLowerCase()) ||
        item.feature.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  // Render permission status
  const renderPermissionStatus = (hasPermission: boolean) => (
    <Tag color={hasPermission ? 'success' : 'error'}>
      {hasPermission ? 'Có' : 'Không'}
    </Tag>
  );

  // Table columns
  const columns: ColumnsType<RolePermission> = [
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      width: 150,
      sorter: (a, b) => a.module.localeCompare(b.module),
    },
    {
      title: 'Tính năng',
      dataIndex: 'feature',
      key: 'feature',
      width: 150,
      sorter: (a, b) => a.feature.localeCompare(b.feature),
    },
    {
      title: (
        <Tooltip title="Quản trị viên - Toàn quyền hệ thống">
          <span>Admin <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'admin',
      key: 'admin',
      width: 80,
      align: 'center',
      render: renderPermissionStatus,
      filters: [
        { text: 'Có quyền', value: true },
        { text: 'Không có quyền', value: false },
      ],
      onFilter: (value, record) => record.admin === value,
    },
    {
      title: (
        <Tooltip title="Quản lý - Quản lý vận hành">
          <span>Manager <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'manager',
      key: 'manager',
      width: 80,
      align: 'center',
      render: renderPermissionStatus,
      filters: [
        { text: 'Có quyền', value: true },
        { text: 'Không có quyền', value: false },
      ],
      onFilter: (value, record) => record.manager === value,
    },
    {
      title: (
        <Tooltip title="Nhân viên - Vận hành hàng ngày">
          <span>Staff <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'staff',
      key: 'staff',
      width: 80,
      align: 'center',
      render: renderPermissionStatus,
      filters: [
        { text: 'Có quyền', value: true },
        { text: 'Không có quyền', value: false },
      ],
      onFilter: (value, record) => record.staff === value,
    },
    {
      title: (
        <Tooltip title="Bác sĩ - Chăm sóc bệnh nhân">
          <span>Doctor <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'doctor',
      key: 'doctor',
      width: 80,
      align: 'center',
      render: renderPermissionStatus,
      filters: [
        { text: 'Có quyền', value: true },
        { text: 'Không có quyền', value: false },
      ],
      onFilter: (value, record) => record.doctor === value,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ color: '#666' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
  ];

  return (
    <Card
      title="Bảng phân quyền hệ thống"
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<ExportOutlined />}
            onClick={() => {
              // TODO: Implement export functionality
              console.log('Export permissions table');
            }}
          >
            Xuất Excel
          </Button>
        </Space>
      }
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Filters */}
      <div style={{ marginBottom: 16 }}>
        <Space size="middle">
          <Input
            placeholder="Tìm kiếm module, tính năng..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            style={{ width: 200 }}
            placeholder="Lọc theo danh mục"
          >
            <Option value="all">Tất cả danh mục</Option>
            {categories.slice(1).map(category => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      {/* Permission Summary */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '12px 16px', 
        borderRadius: '8px', 
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>Tổng quan phân quyền:</strong>
          <span style={{ marginLeft: '8px', color: '#666' }}>
            {filteredData.length} tính năng được hiển thị
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span><Tag color="success">Có quyền</Tag></span>
          <span><Tag color="error">Không có quyền</Tag></span>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} tính năng`,
        }}
        scroll={{ x: 800 }}
        size="middle"
      />
    </Card>
  );
};

export default RolePermissionTable; 