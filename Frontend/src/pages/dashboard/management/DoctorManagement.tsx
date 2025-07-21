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
  SwitcherOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { doctorApi } from '../../../api/endpoints'; // ✅ FIX: Import từ index file 
import axiosInstance from '../../../api/axiosConfig'; // Import để lấy base URL
import { 
  canCreateDoctor, 
  canUpdateDoctor, 
  canDeleteDoctor, 
  canCreateDoctorAccount,
  canEditDoctorProfile,
  canViewDoctorProfiles,
  canManageDoctorAccounts,
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
  experience: number | string;
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
    console.log('[EDIT] Setting form fields:', doctor);
    console.log('[EDIT] Avatar value:', doctor.avatar);
    console.log('[EDIT] Original doctor data:', doctor);
    
    // Convert certificate string to fileList array
    const certificateFileList = doctor.certificate
      ? [{
          uid: '-1',
          name: 'certificate',
          status: 'done',
          url: doctor.certificate
        }]
      : [];
    
    // ✅ Sửa certificate URL mapping để prefill đúng string
    form.setFieldsValue({
      fullName: doctor.fullName,
      email: doctor.email,
      phone: doctor.phone,
      gender: doctor.gender,
      address: doctor.address,
      specialization: doctor.specialization,
      experience: doctor.experience,
      rating: doctor.rating,
      education: doctor.education,
      certificate: doctor.certificate, // ✅ String URL thay vì array object
      bio: doctor.bio,
    });
    
    setEditingDoctor(doctor);
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
        // Removed automatic Number conversion to allow string descriptions
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
      
      // Extract certificate URL
      if (values.certificate && typeof values.certificate === 'string') {
        // ✅ Giữ string URL thay vì extract từ array
      } else {
        delete values.certificate;
      }
      
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
        // Tạo doctor mới với đầy đủ thông tin (backend sẽ tự tạo user account)
        console.log('🔄 [FRONTEND] Creating new doctor with data:', values);
        
        // Validate required fields
        if (!values.fullName || !values.specialization || !values.education || !values.certificate) {
          message.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
          return;
        }
        
        // Set default values for optional fields
        const doctorData = {
          ...values,
          experience: values.experience || 0,
          rating: values.rating || 0,
          bio: values.bio || '',
          image: values.avatar || '',
        };
        
        const result = await doctorApi.createDoctor(doctorData);
        console.log('✅ [FRONTEND] Created doctor:', result);
        
        message.success({
          content: (
            <div>
              <div>Tạo tài khoản bác sĩ "{values.fullName}" thành công!</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Email: bs.{values.fullName.toLowerCase().replace(/\s+/g, '')}@genderhealthcare.com
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Mật khẩu mặc định: doctor123
              </div>
            </div>
          ),
          duration: 6
        });
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
          <p><strong>Kinh nghiệm:</strong> {typeof doctor.experience === 'string' ? (
            <div style={{ whiteSpace: 'pre-line', marginTop: '8px', marginLeft: '24px' }}>
              {doctor.experience}
            </div>
          ) : (
            `${doctor.experience} năm`
          )}</p>
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

  const handleToggleStatus = async (doctorId: string, currentStatus: DisplayDoctor['status']) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const result = await doctorApi.updateStatus(doctorId, newStatus === 'active');
      message.success(`Đã đổi trạng thái bác sĩ "${currentStatus}" thành "${newStatus}" thành công!`);
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể đổi trạng thái bác sĩ');
    }
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
      render: (experience: number | string) => (
        typeof experience === 'string' ? (
          <Tooltip title={experience}>
            <Text ellipsis style={{ maxWidth: 100 }}>
              {experience.split('\n')[0]}...
            </Text>
          </Tooltip>
        ) : (
          <Text>{experience} năm</Text>
        )
      ),
      sorter: (a, b) => {
        if (typeof a.experience === 'number' && typeof b.experience === 'number') {
          return a.experience - b.experience;
        }
        return 0;
      }
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
          {canEditDoctorProfile(userRole) && (
            <Tooltip title="Chỉnh sửa tài khoản & hồ sơ">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDeleteDoctor(userRole) && (
            <Tooltip title="Xóa tài khoản">
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa tài khoản bác sĩ này? Hành động này không thể hoàn tác."
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
          {userRole === 'manager' && (
            <Tooltip title="Toggle trạng thái">
              <Button 
                type="text" 
                icon={<SwitcherOutlined />} 
                onClick={() => handleToggleStatus(record.id, record.status)}
              />
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
          <div>
            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <MedicineBoxOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              {userRole === 'admin' ? 'Quản lý tài khoản bác sĩ' : 'Danh sách bác sĩ'}
            </Title>
            <Text type="secondary">
              {userRole === 'admin' 
                ? 'Tạo tài khoản, cập nhật hồ sơ và quản lý toàn bộ thông tin bác sĩ'
                : 'Xem thông tin và hồ sơ của các bác sĩ trong hệ thống'
              }
            </Text>
          </div>
          <Space>
            {canCreateDoctorAccount(userRole) && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                Tạo tài khoản bác sĩ
              </Button>
            )}
          </Space>
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
        title={editingDoctor 
          ? 'Chỉnh sửa tài khoản & hồ sơ bác sĩ'
          : 'Tạo tài khoản bác sĩ mới'
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 24 }}
        okText={editingDoctor ? 'Cập nhật' : 'Tạo tài khoản & hồ sơ'}
        cancelText="Hủy"
        confirmLoading={submitting}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Row gutter={8}>
            <Col span={24}>
              <Title level={5} style={{ margin: '0 0 16px 0', color: '#1890ff' }}>
                🔒 Thông tin tài khoản
              </Title>
            </Col>
          </Row>
          
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Họ tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              >
                <Input placeholder="Nhập họ tên bác sĩ" />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          {!editingDoctor && (
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                  ]}
                >
                  <Input.Password placeholder="Nhập mật khẩu cho tài khoản" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Nhập lại mật khẩu" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Row gutter={8}>
            <Col span={24}>
              <Title level={5} style={{ margin: '24px 0 16px 0', color: '#52c41a' }}>
                🩺 Thông tin chuyên môn
              </Title>
            </Col>
          </Row>

          <Row gutter={8}>
            <Col span={12}>
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
            </Col>
            {/* Remove status field */}
          </Row>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="experience"
              label="Kinh nghiệm làm việc"
              rules={[
                { required: true, message: 'Vui lòng nhập thông tin kinh nghiệm làm việc!' }
              ]}
              style={{ flex: 1 }}
            >
              <Input.TextArea 
                placeholder="Nhập chi tiết kinh nghiệm làm việc (VD: 2012-2016: Bệnh viện Phụ sản Trung Ương)" 
                rows={4}
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

          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name="education"
                label="Học vấn"
                rules={[{ required: true, message: 'Vui lòng nhập thông tin học vấn!' }]}
              >
                <Input placeholder="VD: Bác sĩ đa khoa, Đại học Y Hà Nội" />
              </Form.Item>
            </Col>
            {/* Certificate Upload */}
            <Col span={12}>
              <Form.Item
                name="certificate"
                label="Chứng chỉ hành nghề (ảnh)"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
                rules={[{ required: true, message: 'Vui lòng tải ảnh chứng chỉ!' }]}
              >
                <Upload.Dragger
                  name="image"
                  accept=".jpg,.jpeg,.png,.webp"
                  maxCount={1}
                  beforeUpload={async (file) => {
                    try {
                      const formData = new FormData();
                      formData.append('image', file); // Match backend field name
                      const res = await doctorApi.uploadImage(formData);
                      if (res.success) {
                        form.setFieldsValue({ certificate: res.data.imageUrl });
                        return false;
                      }
                    } catch (err) {
                      message.error('Upload chứng chỉ thất bại');
                    }
                    return Upload.LIST_IGNORE;
                  }}
                  listType="picture"
                  showUploadList={{ showRemoveIcon: true }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Chọn hoặc kéo thả ảnh chứng chỉ</p>
                  <p className="ant-upload-hint">JPG/PNG/WebP, tối đa 5MB</p>
                </Upload.Dragger>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="bio"
            label="Tiểu sử & Kinh nghiệm"
            rules={[{ required: true, message: 'Vui lòng nhập tiểu sử!' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Nhập tiểu sử, kinh nghiệm làm việc và các thành tích chuyên môn của bác sĩ..." 
            />
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
              action={`${axiosInstance.defaults.baseURL}/api/doctors/upload-image`}
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