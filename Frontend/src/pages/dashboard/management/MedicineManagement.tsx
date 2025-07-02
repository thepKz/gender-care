import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import medicinesApi, { type IMedicine, type CreateMedicineRequest, type UpdateMedicineRequest } from '../../../api/endpoints/medicines';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Medicine type configuration with Vietnamese labels and colors
const MEDICINE_TYPES = {
  contraceptive: {
    label: 'Thuốc tránh thai',
    color: '#ff69b4', // Hot pink
    bgColor: '#fff0f8',
    borderColor: '#ffb3d9',
    icon: '💊'
  },
  vitamin: {
    label: 'Vitamin & bổ sung',
    color: '#52c41a', // Success green
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
    icon: '🍃'
  },
  antibiotic: {
    label: 'Kháng sinh',
    color: '#fa8c16', // Warning orange
    bgColor: '#fff7e6',
    borderColor: '#ffd591',
    icon: '🔬'
  },
  painkiller: {
    label: 'Thuốc giảm đau',
    color: '#1890ff', // Primary blue
    bgColor: '#e6f7ff',
    borderColor: '#91d5ff',
    icon: '⚡'
  },
  other: {
    label: 'Thuốc khác',
    color: '#722ed1', // Purple
    bgColor: '#f9f0ff',
    borderColor: '#d3adf7',
    icon: '💉'
  }
};

// Medicine Type Badge Component
const MedicineTypeBadge: React.FC<{ 
  type: keyof typeof MEDICINE_TYPES;
  size?: 'small' | 'default';
}> = ({ type, size = 'default' }) => {
  const config = MEDICINE_TYPES[type];
  const isSmall = size === 'small';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '4px' : '6px',
        padding: isSmall ? '2px 8px' : '4px 12px',
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: '6px',
        fontSize: isSmall ? '12px' : '14px',
        fontWeight: 500,
        color: config.color,
        cursor: 'default',
        transition: 'all 0.2s ease'
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <Tag
      color={isActive ? 'success' : 'error'}
      style={{
        borderRadius: '12px',
        fontWeight: 500,
        fontSize: '12px',
        padding: '2px 8px'
      }}
    >
      {isActive ? '✅ Đang hoạt động' : '❌ Tạm ngưng'}
    </Tag>
  );
};

interface MedicineTableData extends IMedicine {
  key: string;
}

const MedicineManagement: React.FC = () => {
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  
  // Modal states
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<IMedicine | null>(null);
  
  // Forms
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Load medicines data
  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      
      // Call API thật để lấy dữ liệu từ backend
      const data = await medicinesApi.getAllMedicines();
      
      console.log('✅ [Debug] Medicines loaded from API:', data.length);
      setMedicines(data);
    } catch (error: unknown) {
      console.error('❌ [Debug] Error loading medicines from API:', error);
      message.error('Không thể tải danh sách thuốc từ server. Vui lòng thử lại.');
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter medicines based on search and filters
  const filteredMedicines = useMemo(() => {
    let filtered = medicines;

    // Text search
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(search) ||
        medicine.description?.toLowerCase().includes(search) ||
        MEDICINE_TYPES[medicine.type].label.toLowerCase().includes(search)
      );
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(medicine => medicine.type === selectedType);
    }

    // Status filter
    if (statusFilter !== undefined) {
      filtered = filtered.filter(medicine => medicine.isActive === statusFilter);
    }

    return filtered;
  }, [medicines, searchText, selectedType, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = medicines.length;
    const active = medicines.filter(m => m.isActive).length;
    const inactive = total - active;
    
    const filteredTotal = filteredMedicines.length;
    const filteredActive = filteredMedicines.filter(m => m.isActive).length;
    const filteredInactive = filteredTotal - filteredActive;

    return { 
      all: { total, active, inactive },
      filtered: { total: filteredTotal, active: filteredActive, inactive: filteredInactive }
    };
  }, [medicines, filteredMedicines]);

  // Handle create medicine
  const handleCreateMedicine = async (values: CreateMedicineRequest) => {
    try {
      setLoading(true);
      
      // Call API để tạo thuốc mới
      const newMedicine = await medicinesApi.createMedicine(values);
      
      // Reload danh sách sau khi tạo thành công
      await loadMedicines();
      
      message.success('Tạo thuốc mới thành công!');
      setIsCreateModalVisible(false);
      createForm.resetFields();
      
    } catch (error: unknown) {
      console.error('Error creating medicine:', error);
      message.error('Không thể tạo thuốc mới');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit medicine
  const handleEditMedicine = async (values: UpdateMedicineRequest) => {
    if (!selectedMedicine) return;

    try {
      setLoading(true);
      
      // Call API để cập nhật thuốc
      await medicinesApi.updateMedicine(selectedMedicine._id, values);
      
      // Reload danh sách sau khi cập nhật thành công
      await loadMedicines();
      
      message.success('Cập nhật thuốc thành công!');
      setIsEditModalVisible(false);
      setSelectedMedicine(null);
      editForm.resetFields();
      
    } catch (error: unknown) {
      console.error('Error updating medicine:', error);
      message.error('Không thể cập nhật thuốc');
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (medicine: IMedicine) => {
    try {
      const newStatus = !medicine.isActive;
      
      // Call API để thay đổi trạng thái
      await medicinesApi.toggleMedicineStatus(medicine._id, newStatus);
      
      // Reload danh sách sau khi thay đổi thành công
      await loadMedicines();
      
      message.success(`${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} thuốc thành công!`);
      
    } catch (error: unknown) {
      console.error('Error toggling medicine status:', error);
      message.error('Không thể thay đổi trạng thái thuốc');
    }
  };

  // Handle view medicine details
  const handleViewMedicine = (medicine: IMedicine) => {
    setSelectedMedicine(medicine);
    setIsViewModalVisible(true);
  };

  // Handle edit medicine
  const handleEditClick = (medicine: IMedicine) => {
    setSelectedMedicine(medicine);
    editForm.setFieldsValue({
      name: medicine.name,
      type: medicine.type,
      description: medicine.description,
      defaultDosage: medicine.defaultDosage,
      defaultTimingInstructions: medicine.defaultTimingInstructions,
      isActive: medicine.isActive
    });
    setIsEditModalVisible(true);
  };

  // Table columns configuration
  const columns: ColumnsType<MedicineTableData> = [
    {
      title: 'Tên thuốc',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.defaultDosage && `Liều: ${record.defaultDosage}`}
          </div>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Loại thuốc',
      dataIndex: 'type',
      key: 'type',
      width: 160,
      render: (type: keyof typeof MEDICINE_TYPES) => (
        <MedicineTypeBadge type={type} />
      ),
      filters: Object.entries(MEDICINE_TYPES).map(([key, value]) => ({
        text: value.label,
        value: key
      })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => (
        <Tooltip title={description}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {description || 'Chưa có mô tả'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Hướng dẫn sử dụng',
      dataIndex: 'defaultTimingInstructions',
      key: 'instructions',
      width: 200,
      ellipsis: true,
      render: (instructions: string) => (
        <Tooltip title={instructions}>
          <Text ellipsis style={{ maxWidth: 180 }}>
            {instructions || 'Chưa có hướng dẫn'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'status',
      width: 140,
      render: (isActive: boolean) => <StatusBadge isActive={isActive} />,
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Tạm ngưng', value: false }
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string | Date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.updatedAt).valueOf() - dayjs(b.updatedAt).valueOf(),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewMedicine(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditClick(record)}
              style={{ color: '#52c41a' }}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <Popconfirm
              title={`${record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} thuốc này?`}
              onConfirm={() => handleToggleStatus(record)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                type="text"
                icon={record.isActive ? <DeleteOutlined /> : <PlusOutlined />}
                style={{ color: record.isActive ? '#ff4d4f' : '#52c41a' }}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Prepare table data
  const tableData: MedicineTableData[] = filteredMedicines.map(medicine => ({
    ...medicine,
    key: medicine._id
  }));

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          <MedicineBoxOutlined /> Quản lý Thuốc
        </Title>
        <Text type="secondary">
          Quản lý danh sách thuốc trong hệ thống chăm sóc sức khỏe
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số thuốc"
              value={stats.all.total}
              prefix={<MedicineBoxOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.all.active}
              prefix="✅"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tạm ngưng"
              value={stats.all.inactive}
              prefix="❌"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Kết quả lọc"
              value={stats.filtered.total}
              prefix={<FilterOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm thuốc..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Lọc theo loại thuốc"
              value={selectedType}
              onChange={setSelectedType}
              allowClear
              style={{ width: '100%' }}
            >
              {Object.entries(MEDICINE_TYPES).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.icon} {value.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value={true}>✅ Hoạt động</Option>
              <Option value={false}>❌ Tạm ngưng</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                Thêm thuốc
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadMedicines}
                loading={loading}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Medicines Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={tableData}
          loading={loading}
          pagination={{
            total: filteredMedicines.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} thuốc`,
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* Create Medicine Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1890ff' }} />
            Thêm thuốc mới
          </Space>
        }
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateMedicine}
        >
          <Form.Item
            label="Tên thuốc"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên thuốc!' },
              { min: 2, message: 'Tên thuốc phải có ít nhất 2 ký tự!' }
            ]}
          >
            <Input placeholder="Ví dụ: Paracetamol 500mg" />
          </Form.Item>

          <Form.Item
            label="Loại thuốc"
            name="type"
            rules={[{ required: true, message: 'Vui lòng chọn loại thuốc!' }]}
          >
            <Select placeholder="Chọn loại thuốc">
              {Object.entries(MEDICINE_TYPES).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.icon} {value.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="Mô tả công dụng và đặc điểm của thuốc..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Liều lượng mặc định"
                name="defaultDosage"
              >
                <Input placeholder="Ví dụ: 500mg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Hướng dẫn sử dụng"
                name="defaultTimingInstructions"
              >
                <Input placeholder="Ví dụ: Uống sau ăn" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button
                onClick={() => {
                  setIsCreateModalVisible(false);
                  createForm.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo thuốc
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Medicine Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#52c41a' }} />
            Chỉnh sửa thuốc
          </Space>
        }
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedMedicine(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditMedicine}
        >
          <Form.Item
            label="Tên thuốc"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên thuốc!' },
              { min: 2, message: 'Tên thuốc phải có ít nhất 2 ký tự!' }
            ]}
          >
            <Input placeholder="Ví dụ: Paracetamol 500mg" />
          </Form.Item>

          <Form.Item
            label="Loại thuốc"
            name="type"
            rules={[{ required: true, message: 'Vui lòng chọn loại thuốc!' }]}
          >
            <Select placeholder="Chọn loại thuốc">
              {Object.entries(MEDICINE_TYPES).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.icon} {value.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="Mô tả công dụng và đặc điểm của thuốc..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Liều lượng mặc định"
                name="defaultDosage"
              >
                <Input placeholder="Ví dụ: 500mg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Hướng dẫn sử dụng"
                name="defaultTimingInstructions"
              >
                <Input placeholder="Ví dụ: Uống sau ăn" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Trạng thái"
            name="isActive"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Hoạt động"
              unCheckedChildren="Tạm ngưng"
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  setSelectedMedicine(null);
                  editForm.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Medicine Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: '#1890ff' }} />
            Chi tiết thuốc
          </Space>
        }
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setSelectedMedicine(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={600}
      >
        {selectedMedicine && (
          <div style={{ padding: '16px 0' }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={4} style={{ marginBottom: '8px' }}>
                  {selectedMedicine.name}
                </Title>
                <MedicineTypeBadge type={selectedMedicine.type} />
                <div style={{ marginTop: '8px' }}>
                  <StatusBadge isActive={selectedMedicine.isActive} />
                </div>
              </Col>
              
              <Col span={24}>
                <Title level={5}>Mô tả:</Title>
                <Text>{selectedMedicine.description || 'Chưa có mô tả'}</Text>
              </Col>
              
              <Col span={12}>
                <Title level={5}>Liều lượng mặc định:</Title>
                <Text>{selectedMedicine.defaultDosage || 'Chưa xác định'}</Text>
              </Col>
            
              
              <Col span={12}>
                <Title level={5}>Ngày tạo:</Title>
                <Text>{dayjs(selectedMedicine.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
              </Col>
              
              <Col span={12}>
                <Title level={5}>Cập nhật cuối:</Title>
                <Text>{dayjs(selectedMedicine.updatedAt).format('DD/MM/YYYY HH:mm')}</Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MedicineManagement; 