import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Modal, 
  Form, 
  message, 
  Avatar, 
  Tag, 
  Rate,
  Switch,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  List,
  Typography,
  Popover
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  StarOutlined,
  CommentOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import doctorApi, { type Doctor } from '../../../api/endpoints/doctorApi';
import userApi from '../../../api/endpoints/userApi';

const { Option } = Select;
const { Search } = Input;
const { Text, Paragraph } = Typography;

// Extend Doctor interface for enhanced features
interface DoctorWithDetails extends Doctor {
  feedback?: {
    totalCount: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    feedbacks: Array<{
      rating: number;
      comment: string;
      customerName: string;
      createdAt: string;
    }>;
    message: string;
  };
  status?: {
    isActive: boolean;
    statusText: string;
    message: string;
  };
}

const ManagerDoctorProfilesPage: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorWithDetails[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorWithDetails[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorWithDetails | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [form] = Form.useForm();

  // New states for feedback modal
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedDoctorFeedback, setSelectedDoctorFeedback] = useState<any>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Load enhanced data from API với feedback và status
  useEffect(() => {
    loadDoctorsWithDetails();
    loadAvailableUsers();
  }, []);

  // Load doctors with enhanced data structure
  const loadDoctorsWithDetails = async () => {
    try {
      setLoading(true);
      
      // Use basic API and enhance data
      const basicData = await doctorApi.getAllDoctors();
      // Transform basic data to match enhanced format
      const enhancedBasicData: DoctorWithDetails[] = basicData.map(doctor => ({
        ...doctor,
        feedback: {
          totalCount: 0,
          averageRating: doctor.rating || 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          feedbacks: [],
          message: 'Chưa có đánh giá nào'
        },
        status: {
          isActive: true, // Default to active for now
          statusText: 'Hoạt động',
          message: 'Bác sĩ đang hoạt động'
        }
      }));
      
      setDoctors(enhancedBasicData);
      setFilteredDoctors(enhancedBasicData);
      message.success('Tải danh sách bác sĩ thành công');
      
    } catch (error: any) {
      console.error('API failed:', error);
      message.error('Không thể tải dữ liệu bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      // TODO: Implement user listing API
      // const users = await userApi.getAll();
      // setAvailableUsers(users);
      setAvailableUsers([]); // Temporarily empty
    } catch (error: any) {
      console.error('Không thể tải danh sách users:', error);
    }
  };

  // Filter doctors based on search and specialty
  useEffect(() => {
    let filtered = doctors;

    if (searchText) {
      filtered = filtered.filter(doctor => 
        doctor.userId.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.userId.email.toLowerCase().includes(searchText.toLowerCase()) ||
        (doctor.specialization || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedSpecialty) {
      filtered = filtered.filter(doctor => doctor.specialization === selectedSpecialty);
    }

    setFilteredDoctors(filtered);
  }, [doctors, searchText, selectedSpecialty]);

  const handleEdit = (doctor: DoctorWithDetails) => {
    setEditingDoctor(doctor);
    form.setFieldsValue({
      userId: doctor.userId._id,
      bio: doctor.bio,
      experience: doctor.experience,
      specialization: doctor.specialization,
      education: doctor.education,
      certificate: doctor.certificate
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (doctorId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa bác sĩ',
      content: 'Bạn có chắc chắn muốn xóa bác sĩ này không?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await doctorApi.deleteDoctor(doctorId);
          await loadDoctorsWithDetails(); // Reload enhanced data
          message.success('Xóa bác sĩ thành công!');
        } catch (error: any) {
          message.error(error.message || 'Không thể xóa bác sĩ');
        }
      }
    });
  };

  // Handle status toggle - simplified for basic API
  const handleStatusToggle = async (doctorId: string, newIsActive: boolean) => {
    try {
      // For now, just update local state since we don't have the status update API
      const updatedDoctors = doctors.map(doctor => 
        doctor._id === doctorId 
          ? {
              ...doctor,
              status: {
                isActive: newIsActive,
                statusText: newIsActive ? 'Hoạt động' : 'Tạm dừng',
                message: newIsActive ? 'Bác sĩ đang hoạt động' : 'Bác sĩ tạm ngưng hoạt động'
              }
            }
          : doctor
      );
      setDoctors(updatedDoctors);
      message.success('Cập nhật trạng thái thành công');
    } catch (error: any) {
      message.error(error.message || 'Không thể cập nhật trạng thái');
    }
  };

  // Show feedback details - simplified for basic API
  const showFeedbackDetails = async (doctorId: string) => {
    try {
      setFeedbackLoading(true);
      setFeedbackModalVisible(true);
      
      // Create mock feedback data for now
      const mockFeedback = {
        totalCount: 0,
        averageRating: 0,
        message: 'Chưa có đánh giá nào',
        feedbacks: []
      };
      setSelectedDoctorFeedback(mockFeedback);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải đánh giá');
      setFeedbackModalVisible(false);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      if (editingDoctor) {
        // Update existing doctor
        const updateData = {
          bio: values.bio,
          experience: values.experience,
          specialization: values.specialization,
          education: values.education,
          certificate: values.certificate
        };
        await doctorApi.updateDoctor(editingDoctor._id, updateData);
        message.success('Cập nhật thông tin bác sĩ thành công!');
      } else {
        // Add new doctor
        const createData = {
          userId: values.userId,
          bio: values.bio,
          experience: values.experience,
          specialization: values.specialization,
          education: values.education,
          certificate: values.certificate
        };
        await doctorApi.createDoctor(createData);
        message.success('Thêm bác sĩ mới thành công!');
      }

      setIsModalVisible(false);
      setEditingDoctor(null);
      form.resetFields();
      await loadDoctorsWithDetails(); // Reload enhanced data
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const specialties = Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)));

  const columns = [
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (record: DoctorWithDetails) => (
        <Space>
          <Avatar size={40} src={record.userId.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.userId.fullName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.specialization}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (record: DoctorWithDetails) => (
        <div>
          <div><MailOutlined /> {record.userId.email}</div>
          <div><PhoneOutlined /> {record.userId.phone || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Kinh nghiệm',
      dataIndex: 'experience',
      key: 'experience',
      render: (experience: number) => experience ? `${experience} năm` : 'N/A',
      sorter: (a: DoctorWithDetails, b: DoctorWithDetails) => (a.experience || 0) - (b.experience || 0),
    },
    {
      title: 'Đánh giá',
      key: 'feedback',
      render: (record: DoctorWithDetails) => {
        // Use enhanced feedback data if available
        const feedbackData = record.feedback;
        
        if (feedbackData && feedbackData.totalCount > 0) {
          return (
            <Space direction="vertical" size={2}>
              <Space>
                <Rate disabled value={feedbackData.averageRating} style={{ fontSize: '14px' }} />
                <span>({feedbackData.averageRating.toFixed(1)})</span>
              </Space>
              <Button 
                type="link" 
                size="small" 
                icon={<CommentOutlined />}
                onClick={() => showFeedbackDetails(record._id)}
              >
                {feedbackData.totalCount} đánh giá
              </Button>
            </Space>
          );
        } else {
          return (
            <Space direction="vertical" size={2}>
              <Rate disabled value={record.rating || 0} style={{ fontSize: '14px' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {feedbackData?.message || 'Chưa có đánh giá'}
              </Text>
            </Space>
          );
        }
      },
      sorter: (a: DoctorWithDetails, b: DoctorWithDetails) => {
        const aRating = a.feedback?.averageRating || a.rating || 0;
        const bRating = b.feedback?.averageRating || b.rating || 0;
        return aRating - bRating;
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (record: DoctorWithDetails) => {
        const statusData = record.status;
        const isActive = statusData?.isActive ?? true;
        const statusText = statusData?.statusText || (isActive ? 'Hoạt động' : 'Tạm dừng');
        
        return (
          <Space direction="vertical" size={4}>
            <Tag 
              color={isActive ? 'green' : 'red'} 
              icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
            >
              {statusText}
            </Tag>
            <Switch
              size="small"
              checked={isActive}
              onChange={(checked) => handleStatusToggle(record._id, checked)}
              loading={loading}
            />
          </Space>
        );
      },
    },
    {
      title: 'Thống kê',
      key: 'stats',
      render: (record: DoctorWithDetails) => (
        <div>
          <div>📅 {new Date(record.createdAt).toLocaleDateString()}</div>
          <div>⭐ {record.feedback?.averageRating?.toFixed(1) || record.rating || 0}/5</div>
          {record.feedback && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              💬 {record.feedback.totalCount} feedback
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: DoctorWithDetails) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showFeedbackDetails(record._id)}
            disabled={!record.feedback || record.feedback.totalCount === 0}
          >
            Xem đánh giá
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Tổng số bác sĩ" 
              value={doctors.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Đang hoạt động" 
              value={doctors.filter(d => {
                const isActive = d.status?.isActive ?? true;
                return isActive;
              }).length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Tạm dừng" 
              value={doctors.filter(d => {
                const isActive = d.status?.isActive ?? true;
                return !isActive;
              }).length}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Đánh giá TB" 
              value={(() => {
                const totalRating = doctors.reduce((acc, d) => {
                  const rating = d.feedback?.averageRating || d.rating || 0;
                  return acc + rating;
                }, 0);
                return doctors.length > 0 ? totalRating / doctors.length : 0;
              })()}
              precision={1}
              suffix="⭐"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex={1}>
            <Search
              placeholder="Tìm kiếm theo tên, email, chuyên khoa..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Chọn chuyên khoa"
              style={{ width: '200px' }}
              value={selectedSpecialty}
              onChange={setSelectedSpecialty}
              allowClear
            >
              {specialties.map(specialty => (
                <Option key={specialty} value={specialty}>{specialty}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingDoctor(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              Thêm bác sĩ
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Doctor Table */}
      <Card title={`Danh sách bác sĩ (${filteredDoctors.length} bác sĩ)`}>
        <Table
          columns={columns}
          dataSource={filteredDoctors}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng cộng ${total} bác sĩ`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingDoctor ? 'Chỉnh sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingDoctor(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!editingDoctor && (
            <Form.Item
              label="Chọn User"
              name="userId"
              rules={[{ required: true, message: 'Vui lòng chọn user!' }]}
            >
              <Select 
                placeholder="Chọn user để tạo hồ sơ bác sĩ"
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                }
              >
                {availableUsers.map(user => (
                  <Option key={user._id} value={user._id}>
                    {user.fullName} - {user.email}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Chuyên khoa"
                name="specialization"
                rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa!' }]}
              >
                <Select placeholder="Chọn hoặc nhập chuyên khoa" mode="tags" maxTagCount={1}>
                  {specialties.map(specialty => (
                    <Option key={specialty} value={specialty}>{specialty}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Kinh nghiệm (năm)"
                name="experience"
                rules={[{ required: true, message: 'Vui lòng nhập kinh nghiệm!' }]}
              >
                <Input type="number" placeholder="Số năm kinh nghiệm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Chứng chỉ"
            name="certificate"
          >
            <Input placeholder="Chứng chỉ hành nghề" />
          </Form.Item>

          <Form.Item
            label="Học vấn"
            name="education"
          >
            <Input.TextArea rows={2} placeholder="Mô tả học vấn và bằng cấp" />
          </Form.Item>

          <Form.Item
            label="Giới thiệu"
            name="bio"
          >
            <Input.TextArea rows={3} placeholder="Mô tả kinh nghiệm và chuyên môn" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingDoctor ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Feedback Details Modal */}
      <Modal
        title={
          <Space>
            <CommentOutlined />
            <span>Chi tiết đánh giá</span>
          </Space>
        }
        open={feedbackModalVisible}
        onCancel={() => {
          setFeedbackModalVisible(false);
          setSelectedDoctorFeedback(null);
        }}
        footer={null}
        width={800}
      >
        {feedbackLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Đang tải dữ liệu đánh giá...</p>
          </div>
        ) : selectedDoctorFeedback ? (
          <div>
            {/* Feedback Summary */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Tổng đánh giá"
                    value={selectedDoctorFeedback.totalCount}
                    prefix={<CommentOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Điểm trung bình"
                    value={selectedDoctorFeedback.averageRating}
                    precision={1}
                    suffix="/ 5⭐"
                  />
                </Col>
                <Col span={8}>
                  <div>
                    <Text type="secondary">Trạng thái:</Text>
                    <br />
                    <Text>{selectedDoctorFeedback.message}</Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Feedback List */}
            {selectedDoctorFeedback.feedbacks.length > 0 ? (
              <List
                header={<div><strong>Danh sách đánh giá ({selectedDoctorFeedback.feedbacks.length})</strong></div>}
                dataSource={selectedDoctorFeedback.feedbacks}
                renderItem={(feedback: any, index: number) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar>{index + 1}</Avatar>}
                      title={
                        <Space>
                          <Rate disabled value={feedback.rating} style={{ fontSize: '14px' }} />
                          <Text type="secondary">
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </Text>
                        </Space>
                      }
                      description={
                        <div>
                          <Paragraph>
                            <strong>Nhận xét:</strong> {feedback.comment}
                          </Paragraph>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Khách hàng: {feedback.customerName}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                pagination={{
                  pageSize: 5,
                  size: 'small',
                  showTotal: (total) => `Tổng ${total} đánh giá`
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <CommentOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                <p style={{ marginTop: '16px', color: '#999' }}>
                  {selectedDoctorFeedback.message}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Không có dữ liệu đánh giá</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerDoctorProfilesPage; 