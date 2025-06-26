import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Typography,
  Avatar,
  Tooltip,
  Popconfirm,
  Rate,
  message,
  Row,
  Col,
  Statistic,
  DatePicker,
  InputNumber,
  Switch,
  Descriptions,
  Upload,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { doctorApi } from '../../../api/endpoints'; // ✅ FIX: Import từ index file 
import axiosInstance from '../../../api/axiosConfig'; // Import để lấy base URL
import { 
  canCreateDoctor, 
  canUpdateDoctor, 
  canDeleteDoctor, 
  getCurrentUserRole,
  getCurrentUser
} from '../../../utils/permissions';
import type { Doctor } from '../../../types'; // ✅ Use global type
import { validateAndFixAuthToken, cleanupInvalidTokens, getValidTokenFromStorage } from '../../../utils/helpers';
import { userApi } from '../../../api/endpoints/userApi';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// ✅ Create display-specific interface for table
interface DisplayDoctor {
  key: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender?: string;
  address?: string;
  specialization: string;
  experience: number;
  rating: number;
  education: string;
  certificate: string;
  bio: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  avatar?: string;
}

// ✅ Enhanced mapping function to convert API Doctor to DisplayDoctor
const mapApiDoctorToDisplay = (apiDoctor: any): DisplayDoctor => {
  console.log('🔄 Mapping API doctor:', apiDoctor); // Debug log
  
  // Handle both direct doctor data and populated user data
  const userData = apiDoctor.userId || apiDoctor.user || apiDoctor;
  const doctorData = apiDoctor.userId ? apiDoctor : (apiDoctor.doctor || apiDoctor);
  
  // ✅ Enhanced field extraction với fallback logic
  const mappedDoctor = {
    key: apiDoctor._id || apiDoctor.id || '',
    id: apiDoctor._id || apiDoctor.id || '',
    fullName: userData.fullName || userData.name || 'N/A',
    email: userData.email || 'N/A',
    phone: userData.phone || userData.phoneNumber || 'N/A',
    // ✅ Enhanced gender extraction
    gender: userData.gender || doctorData.gender || apiDoctor.gender || undefined,
    // ✅ Enhanced address extraction  
    address: userData.address || doctorData.address || apiDoctor.address || '',
    specialization: doctorData.specialization || apiDoctor.specialization || 'Chung',
    experience: doctorData.experience || apiDoctor.experience || 0,
    rating: doctorData.rating || apiDoctor.rating || 0,
    education: doctorData.education || apiDoctor.education || '',
    certificate: doctorData.certificate || apiDoctor.certificate || '',
    bio: doctorData.bio || apiDoctor.bio || '',
    status: (userData.isActive === false || doctorData.isDeleted) ? 'inactive' : 'active' as DisplayDoctor['status'],
    createdAt: apiDoctor.createdAt || new Date().toISOString(),
    avatar: doctorData.image || apiDoctor.image || userData.avatar || undefined
  };
  
  console.log('🖼️ [AVATAR DEBUG] Avatar sources:', {
    'doctorData.image': doctorData.image,
    'apiDoctor.image': apiDoctor.image, 
    'userData.avatar': userData.avatar,
    'final_avatar': doctorData.image || apiDoctor.image || userData.avatar || undefined
  });
  
  console.log('✅ Mapped to DisplayDoctor:', mappedDoctor);
  return mappedDoctor;
};

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<DisplayDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DisplayDoctor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  
  // Get current user role for permissions
  const userRole = getCurrentUserRole();

  const loadData = async () => {
    try {
      setLoading(true);
      
      // ✅ Validate auth token trước khi gọi API
      if (!validateAndFixAuthToken()) {
        return; // Will redirect to login
      }
      
      // Sử dụng getAllWithDetails để lấy thêm feedback và status data
      const response = await doctorApi.getAllWithDetails();
      
      // API trả về { message, data, total }
      const apiDoctors = response.data || [];
      
      if (Array.isArray(apiDoctors)) {
        // ✅ Use enhanced mapping function
        const mapped = apiDoctors.map(mapApiDoctorToDisplay);
        setDoctors(mapped);
      }
    } catch (err: any) {
      // Check if error is 401 - token issue
      if (err?.response?.status === 401) {
        console.warn('[DoctorManagement] 401 error, cleaning up auth');
        cleanupInvalidTokens();
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      // Fallback to basic getAllDoctors if getAllWithDetails fails
      try {
        const fallbackData = await doctorApi.getAllDoctors();
        
        if (Array.isArray(fallbackData)) {
          // ✅ Use enhanced mapping function for fallback too
          const mapped = fallbackData.map(mapApiDoctorToDisplay);
          setDoctors(mapped);
        }
      } catch (fallbackErr: any) {
        if (fallbackErr?.response?.status === 401) {
          cleanupInvalidTokens();
          message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }
        message.error(fallbackErr?.response?.data?.message || 'Không thể tải danh sách bác sĩ');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ Cleanup invalid tokens on component mount
    cleanupInvalidTokens();
    
    // Validate auth before loading data
    if (validateAndFixAuthToken()) {
      loadData();
    }
  }, []);

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchText.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchText.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialization === selectedSpecialty;
    const matchesStatus = selectedStatus === 'all' || doctor.status === selectedStatus;
    
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const getStatusColor = (status: DisplayDoctor['status']) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      suspended: 'error'
    };
    return colors[status];
  };

  const getStatusText = (status: DisplayDoctor['status']) => {
    const texts = {
      active: 'Hoạt động',
      inactive: 'Tạm dừng',
      suspended: 'Bị khóa'
    };
    return texts[status];
  };

  const handleEdit = (doctor: DisplayDoctor) => {
    setEditingDoctor(doctor);
    
    // ✅ Enhanced form mapping để ensure all fields được set đúng
    const formData = {
      fullName: doctor.fullName || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      gender: doctor.gender || undefined, // Ensure gender is properly set
      address: doctor.address || '', // Ensure address is properly set
      specialization: doctor.specialization || '',
      experience: doctor.experience || 0,
      rating: doctor.rating || 0,
      education: doctor.education || '',
      certificate: doctor.certificate || '',
      bio: doctor.bio || '',
      status: doctor.status || 'active', // Thêm status để tránh lỗi validation
      avatar: doctor.avatar || undefined
    };
    
    console.log('🔄 [EDIT] Setting form fields:', formData);
    console.log('🖼️ [EDIT] Avatar value:', doctor.avatar);
    console.log('📊 [EDIT] Original doctor data:', doctor);
    
    form.setFieldsValue(formData);
    setIsModalVisible(true);
  };

  const handleDelete = async (doctorId: string) => {
    try {
      const result = await doctorApi.deleteDoctor(doctorId);
      message.success('Xóa bác sĩ thành công');
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa bác sĩ');
    }
  };

  const handleModalOk = async () => {
    try {
      setSubmitting(true);
      console.log('🔍 [FORM DEBUG] Starting form validation...');
      const values = await form.validateFields();
      console.log('✅ [FORM DEBUG] Validation passed, values:', values);
      
      // Ensure experience is number
      if (values.experience) {
        values.experience = Number(values.experience);
      }
      
      // Lấy status từ form và chuẩn hóa sang isActive
      const status = values.status;
      let isActive: boolean | undefined = undefined;
      if (status === 'active') isActive = true;
      if (status === 'inactive' || status === 'suspended') isActive = false;
      
      // Debug log để kiểm tra trạng thái
      console.log(`🔍 [STATUS DEBUG] Form status: ${status}, isActive: ${isActive}, editingDoctor.status: ${editingDoctor?.status}`);
      
      // Xóa status khỏi values để không gửi lên API updateDoctor
      delete values.status;
      
      if (editingDoctor) {
        console.log(`🔄 [FRONTEND] Updating doctor with ID: ${editingDoctor.id}`);
        console.log(`📝 [FRONTEND] Update data:`, values);
        
        // Nếu đổi tên, gọi update user trước
        if (values.fullName && values.fullName !== editingDoctor.fullName && editingDoctor.id) {
          try {
            // Cần lấy userId từ doctor record, không phải doctorId
            const doctorDetail = await doctorApi.getById(editingDoctor.id);
            const userId = doctorDetail.userId._id;
            await userApi.updateUser(userId, { fullName: values.fullName });
            console.log(`✅ [FRONTEND] Updated user fullName to: ${values.fullName}`);
          } catch (err) {
            console.error('❌ [FRONTEND] Update user fullName failed:', err);
            message.error('Cập nhật tên người dùng thất bại!');
          }
        }
        
        // Nếu có avatar, đồng bộ cả user và doctor
        if (values.avatar && values.avatar !== editingDoctor.avatar && editingDoctor.id) {
          try {
            const doctorDetail = await doctorApi.getById(editingDoctor.id);
            const userId = doctorDetail.userId._id;
            // Đồng bộ avatar sang user.avatar
            await userApi.updateUser(userId, { avatar: values.avatar });
            console.log(`✅ [FRONTEND] Synced avatar to user: ${values.avatar}`);
          } catch (err) {
            console.error('❌ [FRONTEND] Sync avatar to user failed:', err);
          }
        }
        
        // Xóa fullName khỏi values để không gửi lên updateDoctor (nếu backend Doctor không lưu)
        delete values.fullName;
        // Gọi updateDoctor cho các trường thông tin chuyên môn
        // Note: values vẫn chứa avatar, sẽ được lưu vào doctor.image
        const result = await doctorApi.updateDoctor(editingDoctor.id, values);
        console.log(`✅ [FRONTEND] Update API response:`, result);
        
        // Nếu có status từ form thì luôn cập nhật trạng thái
        if (typeof isActive === 'boolean') {
          console.log(`🔄 [STATUS UPDATE] Calling updateStatus with isActive=${isActive}`);
          try {
            await doctorApi.updateStatus(editingDoctor.id, isActive);
            console.log(`✅ [FRONTEND] Updated doctor status to isActive=${isActive}`);
          } catch (statusErr) {
            console.error('❌ [FRONTEND] Update status failed:', statusErr);
            message.error('Cập nhật trạng thái thất bại!');
          }
        }
        
        message.success(`Cập nhật bác sĩ "${values.fullName || editingDoctor.fullName}" thành công!`);
      } else {
        const result = await doctorApi.createDoctor(values);
        message.success(`Tạo bác sĩ "${values.fullName}" thành công!`);
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingDoctor(null);
      
      console.log(`🔄 [FRONTEND] Reloading data after update...`);
      await loadData();
      console.log(`✅ [FRONTEND] Data reloaded successfully`);
    } catch (err: any) {
      // ✅ Enhanced error logging để dễ debug
      console.error(`❌❌❌ [FRONTEND ERROR] ❌❌❌`);
      console.error(`🔴 [ERROR TYPE]:`, typeof err);
      console.error(`🔴 [ERROR OBJECT]:`, err);
      
      // ✅ Special handling for form validation errors
      if (err?.errorFields && Array.isArray(err.errorFields)) {
        console.error(`🔴 [FORM VALIDATION ERROR] Failed fields:`, err.errorFields);
        const failedFieldNames = err.errorFields.map((field: any) => field.name?.join('.') || 'unknown').join(', ');
        message.error(`Lỗi validation: ${failedFieldNames}`);
        return;
      }
      
      console.error(`🔴 [ERROR MESSAGE]:`, err?.message);
      console.error(`🔴 [RESPONSE STATUS]:`, err?.response?.status);
      console.error(`🔴 [RESPONSE DATA]:`, err?.response?.data);
      console.error(`🔴 [RESPONSE MESSAGE]:`, err?.response?.data?.message);
      
      // Enhanced error message based on error type
      let errorMessage = 'Có lỗi xảy ra khi cập nhật bác sĩ';
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      console.error(`🚨 [FINAL ERROR MESSAGE]:`, errorMessage);
      message.error(errorMessage);
      
      // ✅ Alert backup nếu user không thấy console
      if (errorMessage.includes('Kinh nghiệm')) {
        message.warning('💡 Gợi ý: Kinh nghiệm phải từ 0 đến 50 năm!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingDoctor(null);
  };

  const showDoctorDetails = (doctor: DisplayDoctor) => {
    Modal.info({
      title: 'Chi tiết bác sĩ',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>ID:</strong> {doctor.id}</p>
          <p><strong>Họ tên:</strong> {doctor.fullName}</p>
          <p><strong>Email:</strong> {doctor.email}</p>
          <p><strong>Số điện thoại:</strong> {doctor.phone}</p>
          <p><strong>Chuyên khoa:</strong> {doctor.specialization}</p>
          <p><strong>Kinh nghiệm:</strong> {doctor.experience} năm</p>
          <p><strong>Đánh giá:</strong> <Rate disabled value={doctor.rating} /></p>
          <p><strong>Học vấn:</strong> {doctor.education}</p>
          <p><strong>Chứng chỉ:</strong> {doctor.certificate}</p>
          <p><strong>Tiểu sử:</strong> {doctor.bio}</p>
          <p><strong>Trạng thái:</strong> {getStatusText(doctor.status)}</p>
          <p><strong>Ngày tạo:</strong> {new Date(doctor.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>
      ),
    });
  };

  // ✅ File upload handling functions
  const handleFileChange = (info: any) => {
    if (info.file.status === 'uploading') {
      console.log('🔄 [AVATAR] Uploading...', info.file.name);
      return;
    }
    
    if (info.file.status === 'done') {
      // ✅ Handle backend response từ uploadDoctorImage endpoint
      if (info.file.response && info.file.response.success) {
        const imageUrl = info.file.response.data.imageUrl;
        
        console.log('✅ [AVATAR] Upload successful, imageUrl:', imageUrl);
        // ✅ Set avatar URL vào form để submit cùng doctor data
        form.setFieldsValue({ avatar: imageUrl });
        console.log('✅ [AVATAR] Set to form field:', imageUrl);
        
        message.success(`Upload ảnh "${info.file.name}" thành công!`);
      } else {
        const errorMsg = info.file.response?.message || 'Upload response không hợp lệ';
        console.error('❌ [AVATAR] Upload failed:', errorMsg);
        message.error(`Upload thất bại: ${errorMsg}`);
      }
    } else if (info.file.status === 'error') {
      // ✅ Handle specific error messages từ backend
      const errorMsg = info.file.response?.message || 
                      info.file.error?.message || 
                      'Upload thất bại';
      
      // ✅ Check if 401 error - token issue
      if (info.file.response?.status === 401 || errorMsg.includes('Unauthorized')) {
        console.warn('[DoctorManagement] Upload 401 error, cleaning up auth');
        cleanupInvalidTokens();
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      message.error(`Upload thất bại: ${errorMsg}`);
    }
  };

  const handleBeforeUpload = (file: any): boolean | Promise<boolean> => {
    // ✅ Enhanced validation cho medical photos - now includes WebP
    const isValidFormat = file.type === 'image/jpeg' || 
                         file.type === 'image/jpg' || 
                         file.type === 'image/png' || 
                         file.type === 'image/webp';
    if (!isValidFormat) {
      message.error('Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG, WebP!');
      return false;
    }
    
    // ✅ Professional medical photo size limit: 5MB
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Kích thước ảnh không được vượt quá 5MB!');
      return false;
    }
    
    // ✅ Recommend image dimensions cho professional photos
    return new Promise<boolean>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Recommend minimum resolution cho professional photos
          if (img.width < 200 || img.height < 200) {
            message.warning('Khuyến nghị sử dụng ảnh có độ phân giải tối thiểu 200x200px cho chất lượng tốt nhất');
          }
          
          // Recommend square-ish ratio cho profile photos
          const ratio = img.width / img.height;
          if (ratio < 0.5 || ratio > 2) {
            message.info('Khuyến nghị sử dụng ảnh có tỷ lệ gần vuông (1:1) để hiển thị tốt nhất');
          }
          
          resolve(true);
        };
        img.onerror = () => {
          message.error('Không thể đọc file ảnh');
          reject(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (file: any) => {
    return true;
  };

  const columns: ColumnsType<DisplayDoctor> = [
    {
      title: 'Bác sĩ',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
      render: (fullName: string, record: DisplayDoctor) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />}
            size={40}
          />
          <div>
            <Text strong>{fullName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.certificate}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Liên hệ',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string, record: DisplayDoctor) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <MailOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: '12px' }}>{email}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PhoneOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '12px' }}>{record.phone}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Chuyên khoa',
      dataIndex: 'specialization',
      key: 'specialization',
      width: 150,
      render: (specialization: string) => (
        <Tag color="blue">{specialization}</Tag>
      )
    },
    {
      title: 'Kinh nghiệm',
      dataIndex: 'experience',
      key: 'experience',
      width: 100,
      render: (experience: number) => (
        <Text>{experience} năm</Text>
      ),
      sorter: (a, b) => a.experience - b.experience
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Rate disabled value={rating} style={{ fontSize: '12px' }} />
          <Text style={{ fontSize: '12px' }}>({rating})</Text>
        </div>
      ),
      sorter: (a, b) => a.rating - b.rating
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: DisplayDoctor['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record: DisplayDoctor) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showDoctorDetails(record)}
            />
          </Tooltip>
          {canUpdateDoctor(userRole) && (
            <Tooltip title="Chỉnh sửa">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDeleteDoctor(userRole) && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa bác sĩ này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Có"
                cancelText="Không"
              >
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Quản lý bác sĩ
          </Title>
          {canCreateDoctor(userRole) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Thêm bác sĩ mới
            </Button>
          )}
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Search
            placeholder="Tìm kiếm theo tên, email hoặc chuyên khoa..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Select
            placeholder="Chuyên khoa"
            style={{ width: 200 }}
            value={selectedSpecialty}
            onChange={setSelectedSpecialty}
          >
            <Option value="all">Tất cả chuyên khoa</Option>
            <Option value="Phụ sản">Phụ sản</Option>
            <Option value="Nội tiết sinh sản">Nội tiết sinh sản</Option>
            <Option value="Tâm lý học lâm sàng">Tâm lý học lâm sàng</Option>
            <Option value="Dinh dưỡng & Sức khỏe sinh sản">Dinh dưỡng & Sức khỏe sinh sản</Option>
          </Select>

          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Tạm dừng</Option>
            <Option value="suspended">Bị khóa</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredDoctors}
          loading={loading}
          pagination={{
            total: filteredDoctors.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} bác sĩ`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingDoctor ? 'Chỉnh sửa bác sĩ' : 'Thêm bác sĩ mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={700}
        okText={editingDoctor ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        confirmLoading={submitting}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Nhập họ tên bác sĩ" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập địa chỉ email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Giới tính"
            rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
          >
            <Select placeholder="Chọn giới tính">
              <Option value="male">Nam</Option>
              <Option value="female">Nữ</Option>
              <Option value="other">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Form.Item
            name="specialization"
            label="Chuyên khoa"
            rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa!' }]}
          >
            <Select placeholder="Chọn chuyên khoa">
              <Option value="Phụ sản">Phụ sản</Option>
              <Option value="Nội tiết sinh sản">Nội tiết sinh sản</Option>
              <Option value="Tâm lý học lâm sàng">Tâm lý học lâm sàng</Option>
              <Option value="Dinh dưỡng & Sức khỏe sinh sản">Dinh dưỡng & Sức khỏe sinh sản</Option>
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="experience"
              label="Kinh nghiệm (năm)"
              rules={[
                { required: true, message: 'Vui lòng nhập số năm kinh nghiệm!' },
                { 
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const exp = Number(value);
                    if (isNaN(exp)) {
                      return Promise.reject(new Error('Kinh nghiệm phải là số hợp lệ!'));
                    }
                    if (exp < 0) {
                      return Promise.reject(new Error('Kinh nghiệm không thể âm!'));
                    }
                    if (exp > 50) {
                      return Promise.reject(new Error('Kinh nghiệm không thể vượt quá 50 năm!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
              style={{ flex: 1 }}
            >
              <Input 
                type="number" 
                placeholder="Nhập số năm kinh nghiệm (0-50)" 
                max={50}
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="rating"
              label="Đánh giá"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value < 0 || value > 5) {
                      return Promise.reject(new Error('Đánh giá phải từ 0 đến 5 sao!'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
              style={{ flex: 1 }}
            >
              <Rate allowHalf />
            </Form.Item>
          </div>

          <Form.Item
            name="education"
            label="Học vấn"
            rules={[{ required: true, message: 'Vui lòng nhập thông tin học vấn!' }]}
          >
            <Input placeholder="Nhập thông tin học vấn" />
          </Form.Item>

          <Form.Item
            name="certificate"
            label="Chứng chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập mã chứng chỉ!' }]}
          >
            <Input placeholder="Nhập mã chứng chỉ hành nghề" />
          </Form.Item>

          <Form.Item
            name="bio"
            label="Tiểu sử"
          >
            <Input.TextArea rows={3} placeholder="Nhập tiểu sử và kinh nghiệm của bác sĩ" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Tạm dừng</Option>
              <Option value="suspended">Bị khóa</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Ảnh đại diện"
            name="avatar"
            extra="Khuyến nghị: JPG/PNG/WebP, tối đa 5MB, tỷ lệ gần vuông (1:1) cho hiển thị tốt nhất"
          >
            <Upload
              name="image"
              listType="picture-card"
              maxCount={1}
              action={`${axiosInstance.defaults.baseURL}/doctors/upload-image`}
              headers={{
                'Authorization': `Bearer ${getValidTokenFromStorage('access_token') || ''}`
              }}
              beforeUpload={handleBeforeUpload} 
              onChange={handleFileChange}
              onRemove={handleRemoveFile}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              showUploadList={{
                showPreviewIcon: true,
                showDownloadIcon: false,
                showRemoveIcon: true,
              }}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Chọn ảnh bác sĩ</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  JPG/PNG/WebP supported
                </div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorManagement;