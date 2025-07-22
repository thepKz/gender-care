import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Rate,
  DatePicker,
  message,
  Popconfirm,
  Badge,
  Avatar,
  Divider
} from 'antd';
import {
  CommentOutlined,
  StarOutlined,
  UserOutlined,
  EyeOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  FilterOutlined,
  ReloadOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { feedbackApi, type FeedbackResponse } from '../../../api/endpoints/feedback';
import { doctorApi, type Doctor } from '../../../api/endpoints/doctorApi';
import { formatCustomerName } from '../../../utils/nameUtils';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Interfaces
interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: { [key: string]: number };
  topRatedDoctors: Array<{ doctorName: string; averageRating: number; totalFeedbacks: number }>;
  recentFeedbacks: number;
}

interface DisplayFeedback extends FeedbackResponse {
  key: string;
  doctorName: string;
  customerName: string;
  serviceName: string;
  isHidden: boolean;
  createdAtFormatted: string;
}

const FeedbackManagement: React.FC = () => {
  // State
  const [feedbacks, setFeedbacks] = useState<DisplayFeedback[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all, visible, hidden
  
  // Modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<DisplayFeedback | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  
  // const userRole = getCurrentUserRole(); // Reserved for future permission checks

  // Load doctors
  const loadDoctors = async () => {
    try {
      const response = await doctorApi.getAllDoctors();
      setDoctors(Array.isArray(response) ? response : []);
    } catch {
      console.error('Error loading doctors');
      setDoctors([]);
    }
  };

  // Load all feedbacks for manager
  const loadFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      
      // For now, we'll aggregate feedback from all doctors
      // In a real implementation, you'd have a dedicated API for this
      const allFeedbacks: DisplayFeedback[] = [];
      
      for (const doctor of doctors) {
        try {
          const response = await feedbackApi.getDoctorFeedbacks(
            doctor._id, 
            1, 
            50, // Load more per doctor
            selectedRating
          );
          
          if (response.success && response.data.feedbacks) {
            const doctorFeedbacks = response.data.feedbacks.map((feedback) => ({
              ...feedback,
              key: feedback._id,
              doctorName: doctor.userId?.fullName || 'Unknown Doctor',
              customerName: feedback.appointmentId?.profileId?.fullName 
                ? formatCustomerName(feedback.appointmentId.profileId.fullName)
                : 'Khách hàng',
              serviceName: feedback.serviceId?.serviceName || feedback.packageId?.name || 'Dịch vụ không xác định',
              isHidden: false, // TODO: Implement hidden status
              createdAtFormatted: dayjs(feedback.createdAt).format('DD/MM/YYYY HH:mm')
            }));
            allFeedbacks.push(...doctorFeedbacks);
          }
        } catch (error) {
          console.error(`Error loading feedback for doctor ${doctor._id}:`, error);
        }
      }

      // Apply filters
      let filteredFeedbacks = allFeedbacks;

      // Search filter
      if (searchText) {
        filteredFeedbacks = filteredFeedbacks.filter(feedback => 
          feedback.feedback.toLowerCase().includes(searchText.toLowerCase()) ||
          feedback.comment?.toLowerCase().includes(searchText.toLowerCase()) ||
          feedback.doctorName.toLowerCase().includes(searchText.toLowerCase()) ||
          feedback.customerName.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      // Doctor filter
      if (selectedDoctor && selectedDoctor !== 'all') {
        filteredFeedbacks = filteredFeedbacks.filter(feedback => 
          feedback.doctorId?._id === selectedDoctor
        );
      }

      // Date range filter
      if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
        filteredFeedbacks = filteredFeedbacks.filter(feedback => {
          const feedbackDate = dayjs(feedback.createdAt);
          return feedbackDate.isAfter(selectedDateRange[0]) && feedbackDate.isBefore(selectedDateRange[1]);
        });
      }

      // Status filter
      if (selectedStatus === 'visible') {
        filteredFeedbacks = filteredFeedbacks.filter(feedback => !feedback.isHidden);
      } else if (selectedStatus === 'hidden') {
        filteredFeedbacks = filteredFeedbacks.filter(feedback => feedback.isHidden);
      }

      // Sort by creation date
      filteredFeedbacks.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

      setFeedbacks(filteredFeedbacks);
      setTotalCount(filteredFeedbacks.length);

      // Calculate stats
      calculateStats(allFeedbacks);

    } catch (error) {
      console.error('Error loading feedbacks:', error);
      message.error('Có lỗi khi tải danh sách feedback');
    } finally {
      setLoading(false);
    }
  }, [doctors, searchText, selectedDoctor, selectedRating, selectedDateRange, selectedStatus]);

  // Calculate statistics
  const calculateStats = (allFeedbacks: DisplayFeedback[]) => {
    const totalFeedbacks = allFeedbacks.length;
    const totalRating = allFeedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = totalFeedbacks > 0 ? totalRating / totalFeedbacks : 0;

    // Rating distribution
    const ratingDistribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    allFeedbacks.forEach(feedback => {
      ratingDistribution[feedback.rating.toString()] = (ratingDistribution[feedback.rating.toString()] || 0) + 1;
    });

    // Top rated doctors (calculate from aggregated data)
    const doctorRatings: { [doctorId: string]: { name: string; ratings: number[]; total: number } } = {};
    
    allFeedbacks.forEach(feedback => {
      const doctorId = feedback.doctorId?._id || 'unknown';
      if (!doctorRatings[doctorId]) {
        doctorRatings[doctorId] = {
          name: feedback.doctorName,
          ratings: [],
          total: 0
        };
      }
      doctorRatings[doctorId].ratings.push(feedback.rating);
      doctorRatings[doctorId].total++;
    });

    const topRatedDoctors = Object.values(doctorRatings)
      .map(doctor => ({
        doctorName: doctor.name,
        averageRating: doctor.ratings.reduce((sum, rating) => sum + rating, 0) / doctor.ratings.length,
        totalFeedbacks: doctor.total
      }))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    // Recent feedbacks (last 7 days)
    const lastWeek = dayjs().subtract(7, 'day');
    const recentFeedbacks = allFeedbacks.filter(feedback => 
      dayjs(feedback.createdAt).isAfter(lastWeek)
    ).length;

    setStats({
      totalFeedbacks,
      averageRating,
      ratingDistribution,
      topRatedDoctors,
      recentFeedbacks
    });
  };

  // Load initial data
  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (doctors.length > 0) {
      loadFeedbacks();
    }
  }, [doctors, loadFeedbacks]);

  // Handle actions
  const handleToggleVisibility = async (feedback: DisplayFeedback) => {
    try {
      const response = await feedbackApi.hideFeedback(feedback._id, !feedback.isHidden);
      if (response.success) {
        message.success(response.message || (feedback.isHidden ? 'Hiển thị feedback thành công' : 'Ẩn feedback thành công'));
        setFeedbacks(prev => prev.map(f =>
          f.key === feedback.key
            ? { ...f, isHidden: !f.isHidden }
            : f
        ));
        if (selectedFeedback && selectedFeedback._id === feedback._id) {
          setSelectedFeedback({ ...selectedFeedback, isHidden: !selectedFeedback.isHidden });
        }
      } else {
        message.error(response.message || 'Không thể cập nhật trạng thái feedback');
      }
    } catch {
      message.error('Có lỗi khi cập nhật trạng thái feedback');
    }
  };

  const handleDeleteFeedback = async (feedback: DisplayFeedback) => {
    try {
      const response = await feedbackApi.deleteFeedback(feedback._id);
      if (response.success) {
        message.success(response.message || 'Xóa feedback thành công');
        setFeedbacks(prev => prev.filter(f => f.key !== feedback.key));
        setTotalCount(prev => prev - 1);
        setDetailModalVisible(false);
      } else {
        message.error(response.message || 'Không thể xóa feedback');
      }
    } catch {
      message.error('Có lỗi khi xóa feedback');
    }
  };

  const handleViewDetail = (feedback: DisplayFeedback) => {
    setSelectedFeedback(feedback);
    setDetailModalVisible(true);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedDoctor('all');
    setSelectedRating(undefined);
    setSelectedDateRange(null);
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  // Table columns
  const columns: ColumnsType<DisplayFeedback> = [
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
      render: (name: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Bác sĩ',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 150,
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 150,
      render: (name: string) => <Text type="secondary">{name}</Text>
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating: number) => (
        <span style={{ color: '#faad14', fontWeight: 600, fontSize: '15px' }}>
          {'⭐'.repeat(rating)}
        </span>
      )
    },
    {
      title: 'Nội dung',
      dataIndex: 'feedback',
      key: 'feedback',
      ellipsis: true,
      render: (feedback: string) => (
        <Text ellipsis={{ tooltip: feedback }} style={{ maxWidth: 200 }}>
          "{feedback}"
        </Text>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAtFormatted',
      key: 'createdAtFormatted',
      width: 130,
      render: (date: string) => <Text type="secondary">{date}</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isHidden',
      key: 'isHidden',
      width: 100,
      render: (isHidden: boolean) => (
        <Badge 
          status={isHidden ? 'default' : 'success'} 
          text={isHidden ? 'Ẩn' : 'Hiển thị'} 
        />
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 110,
      render: (_, record) => (
        <Button 
          type="link" 
          style={{ padding: 0 }}
          onClick={() => handleViewDetail(record)}
        >
          Xem chi tiết
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <CommentOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          Quản lý Feedback
        </Title>
        <Text type="secondary">
          Xem và quản lý tất cả feedback từ khách hàng trong hệ thống
        </Text>
      </div>

      {/* Stats Cards */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic
                title="Tổng Feedback"
                value={stats.totalFeedbacks}
                prefix={<CommentOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic
                title="Rating Trung Bình"
                value={stats.averageRating.toFixed(1)}
                suffix="⭐"
                precision={1}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic
                title="Feedback Tuần Này"
                value={stats.recentFeedbacks}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic
                title="Top Doctor"
                value={stats.topRatedDoctors[0]?.doctorName || 'N/A'}
                suffix={`(${stats.topRatedDoctors[0]?.averageRating.toFixed(1) || 0}⭐)`}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#722ed1', fontSize: '14px' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="Tìm kiếm nội dung feedback..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="Chọn bác sĩ"
              style={{ width: '100%' }}
              value={selectedDoctor}
              onChange={setSelectedDoctor}
              allowClear
            >
              <Option value="all">Tất cả bác sĩ</Option>
              {doctors.map(doctor => (
                <Option key={doctor._id} value={doctor._id}>
                  {doctor.userId?.fullName || 'Unknown'}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={3}>
            <Select
              placeholder="Rating"
              style={{ width: '100%' }}
              value={selectedRating}
              onChange={setSelectedRating}
              allowClear
            >
              {[5, 4, 3, 2, 1].map(rating => (
                <Option key={rating} value={rating}>
                  {rating}⭐
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="Trạng thái"
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              <Option value="all">Tất cả</Option>
              <Option value="visible">Hiển thị</Option>
              <Option value="hidden">Ẩn</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <RangePicker
              style={{ width: '100%' }}
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={3}>
            <Space>
              <Button 
                icon={<FilterOutlined />} 
                onClick={handleResetFilters}
              >
                Reset
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadFeedbacks}
              >
                Tải lại
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={feedbacks.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} feedback`,
            onChange: (page) => setCurrentPage(page)
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <CommentOutlined />
            <span>Chi tiết Feedback</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedFeedback(null);
        }}
        footer={null}
        width={700}
      >
        {selectedFeedback && (
          <div style={{ padding: '16px 0' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Khách hàng:</Text>
                <br />
                <Text>{selectedFeedback.customerName}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Bác sĩ:</Text>
                <br />
                <Text>{selectedFeedback.doctorName}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Dịch vụ:</Text>
                <br />
                <Text>{selectedFeedback.serviceName}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Ngày tạo:</Text>
                <br />
                <Text>{selectedFeedback.createdAtFormatted}</Text>
              </Col>
              <Col span={24}>
                <Text strong>Đánh giá:</Text>
                <br />
                <Rate disabled value={selectedFeedback.rating} />
                <Text style={{ marginLeft: '8px' }}>({selectedFeedback.rating}/5)</Text>
              </Col>
              <Col span={24}>
                <Text strong>Nội dung feedback:</Text>
                <div style={{ 
                  padding: '12px', 
                  background: '#f5f5f5', 
                  borderRadius: '6px',
                  marginTop: '8px'
                }}>
                  <Text>"{selectedFeedback.feedback}"</Text>
                </div>
              </Col>
              {selectedFeedback.comment && selectedFeedback.comment !== selectedFeedback.feedback && (
                <Col span={24}>
                  <Text strong>Bình luận bổ sung:</Text>
                  <div style={{ 
                    padding: '12px', 
                    background: '#e6f7ff', 
                    borderRadius: '6px',
                    marginTop: '8px'
                  }}>
                    <Text>{selectedFeedback.comment}</Text>
                  </div>
                </Col>
              )}
              <Col span={24}>
                <Divider />
                <Space>
                  <Button 
                    icon={selectedFeedback.isHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    onClick={() => {
                      handleToggleVisibility(selectedFeedback);
                      setDetailModalVisible(false);
                    }}
                  >
                    {selectedFeedback.isHidden ? 'Hiển thị' : 'Ẩn'}
                  </Button>
                  <Popconfirm
                    title="Bạn có chắc chắn muốn xóa feedback này?"
                    onConfirm={() => {
                      handleDeleteFeedback(selectedFeedback);
                      setDetailModalVisible(false);
                    }}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      Xóa
                    </Button>
                  </Popconfirm>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeedbackManagement; 