import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  message,
  Tooltip,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Descriptions
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ExperimentOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import testCategoriesApi, {
  ITestCategory,
  CreateTestCategoryRequest,
  UpdateTestCategoryRequest
} from '../../../api/endpoints/testCategories';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TestCategoryTableData extends ITestCategory {
  key: string;
}

const TestManagement: React.FC = () => {
  const [testCategories, setTestCategories] = useState<ITestCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Modal states
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedTestCategory, setSelectedTestCategory] = useState<ITestCategory | null>(null);
  
  // Forms
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Load test categories data
  useEffect(() => {
    loadTestCategories();
  }, []);

  const loadTestCategories = async () => {
    try {
      setLoading(true);
      
      // Call API thật để lấy dữ liệu từ backend
      const data = await testCategoriesApi.getAllTestCategories();
      
      console.log('✅ [Debug] Test Categories loaded from API:', data.length);
      setTestCategories(data);
    } catch (error: unknown) {
      console.error('❌ [Debug] Error loading test categories from API:', error);
      message.error('Không thể tải danh sách loại xét nghiệm từ server. Vui lòng thử lại.');
      setTestCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter test categories based on search
  const filteredTestCategories = useMemo(() => {
    let filtered = testCategories;

    // Text search
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(search) ||
        category.description?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [testCategories, searchText]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = testCategories.length;
    const withUnit = 0;
    const withNormalRange = 0;
    const complete = 0;
    
    const filteredTotal = filteredTestCategories.length;

    return { 
      all: { total, withUnit, withNormalRange, complete },
      filtered: { total: filteredTotal }
    };
  }, [testCategories, filteredTestCategories]);

  // Handle create test category
  const handleCreateTestCategory = async (values: CreateTestCategoryRequest) => {
    try {
      setLoading(true);
      
      // Call API để tạo test category mới
      await testCategoriesApi.createTestCategory(values);
      
      // Reload danh sách sau khi tạo thành công
      await loadTestCategories();
      
      message.success('Tạo loại xét nghiệm mới thành công!');
      setIsCreateModalVisible(false);
      createForm.resetFields();
      
    } catch (error: unknown) {
      console.error('Error creating test category:', error);
      message.error('Không thể tạo loại xét nghiệm mới');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit test category
  const handleEditTestCategory = async (values: UpdateTestCategoryRequest) => {
    if (!selectedTestCategory) return;

    try {
      setLoading(true);
      
      // Call API để cập nhật test category
      await testCategoriesApi.updateTestCategory(selectedTestCategory._id, values);
      
      // Reload danh sách sau khi cập nhật thành công
      await loadTestCategories();
      
      message.success('Cập nhật loại xét nghiệm thành công!');
      setIsEditModalVisible(false);
      setSelectedTestCategory(null);
      editForm.resetFields();
      
    } catch (error: unknown) {
      console.error('Error updating test category:', error);
      message.error('Không thể cập nhật loại xét nghiệm');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete test category
  const handleDeleteTestCategory = async (category: ITestCategory) => {
    try {
      setLoading(true);
      
      // Call API để xóa test category
      await testCategoriesApi.deleteTestCategory(category._id);
      
      // Reload danh sách sau khi xóa thành công
      await loadTestCategories();
      
      message.success('Xóa loại xét nghiệm thành công!');
      
    } catch (error: unknown) {
      console.error('Error deleting test category:', error);
      message.error('Không thể xóa loại xét nghiệm');
    } finally {
      setLoading(false);
    }
  };

  // Handle view test category details
  const handleViewTestCategory = (category: ITestCategory) => {
    setSelectedTestCategory(category);
    setIsViewModalVisible(true);
  };

  // Handle edit test category
  const handleEditClick = (category: ITestCategory) => {
    setSelectedTestCategory(category);
    editForm.setFieldsValue({
      name: category.name,
      description: category.description,
    });
    setIsEditModalVisible(true);
  };

  // Table columns configuration
  const columns: ColumnsType<TestCategoryTableData> = [
    {
      title: 'Tên loại xét nghiệm',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.description && record.description.length > 50
              ? `${record.description.substring(0, 50)}...`
              : record.description || 'Chưa có mô tả'
            }
          </div>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Thông tin đầy đủ',
      key: 'complete',
      width: 120,
      render: (_, record) => {
        const isComplete = true;
        
        return (
          <div style={{ textAlign: 'center' }}>
            <Tag color={isComplete ? 'success' : 'warning'} style={{ borderRadius: '12px' }}>
              {isComplete ? '✅ Đầy đủ' : '⚠️ Thiếu thông tin'}
            </Tag>
          </div>
        );
      },
      filters: [
        { text: 'Đầy đủ thông tin', value: 'complete' },
        { text: 'Thiếu thông tin', value: 'incomplete' }
      ],
      onFilter: (value, record) => {
        const isComplete = true;
        
        return value === 'complete' ? isComplete : !isComplete;
      },
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
              onClick={() => handleViewTestCategory(record)}
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
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa loại xét nghiệm này?"
              description="Hành động này không thể hoàn tác"
              onConfirm={() => handleDeleteTestCategory(record)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: '#ff4d4f' }}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Prepare table data
  const tableData: TestCategoryTableData[] = filteredTestCategories.map(category => ({
    ...category,
    key: category._id
  }));

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          <ExperimentOutlined /> Quản lý Loại Xét nghiệm
        </Title>
        <Text type="secondary">
          Quản lý danh mục các loại xét nghiệm trong hệ thống
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số loại"
              value={stats.all.total}
              prefix={<ExperimentOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Có đơn vị đo"
              value={stats.all.withUnit}
              prefix="📏"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Có giá trị chuẩn"
              value={stats.all.withNormalRange}
              prefix="📊"
              valueStyle={{ color: '#13c2c2' }}
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
          <Col xs={24} sm={16} md={18}>
            <Input
              placeholder="Tìm kiếm loại xét nghiệm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                Thêm loại xét nghiệm
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadTestCategories}
                loading={loading}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Test Categories Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={tableData}
          loading={loading}
          pagination={{
            total: filteredTestCategories.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} loại xét nghiệm`,
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* Create Test Category Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1890ff' }} />
            Thêm loại xét nghiệm mới
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
          onFinish={handleCreateTestCategory}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            name="name"
            label="Tên loại xét nghiệm"
            rules={[
              { required: true, message: 'Vui lòng nhập tên loại xét nghiệm!' },
              { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input placeholder="Ví dụ: Glucose máu, Cholesterol, HbA1c..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[
              { max: 500, message: 'Mô tả không được vượt quá 500 ký tự' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Mô tả về loại xét nghiệm này..."
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setIsCreateModalVisible(false);
                  createForm.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo mới
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Test Category Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#52c41a' }} />
            Chỉnh sửa loại xét nghiệm
          </Space>
        }
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedTestCategory(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditTestCategory}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            name="name"
            label="Tên loại xét nghiệm"
            rules={[
              { required: true, message: 'Vui lòng nhập tên loại xét nghiệm!' },
              { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input placeholder="Ví dụ: Glucose máu, Cholesterol, HbA1c..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[
              { max: 500, message: 'Mô tả không được vượt quá 500 ký tự' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Mô tả về loại xét nghiệm này..."
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  setSelectedTestCategory(null);
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

      {/* View Test Category Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: '#1890ff' }} />
            Chi tiết loại xét nghiệm
          </Space>
        }
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setSelectedTestCategory(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={600}
      >
        {selectedTestCategory && (
          <Descriptions
            bordered
            column={1}
            style={{ marginTop: '16px' }}
          >
            <Descriptions.Item label="Tên loại xét nghiệm">
              <Text strong>{selectedTestCategory.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {selectedTestCategory.description || (
                <Text type="secondary">Chưa có mô tả</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedTestCategory.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              {dayjs(selectedTestCategory.updatedAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TestManagement;
