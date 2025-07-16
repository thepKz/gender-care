import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Avatar,
  Row,
  Col,
  Divider,
  Upload,
  App
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  HomeOutlined,
  InboxOutlined,
  DeleteOutlined,
  IdcardOutlined,
  WarningOutlined,
  CloseOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps, UploadFile } from 'antd/es/upload';
import { userApi, User as ApiUser, CreateUserRequest, CreateDoctorRequest, CreateStaffRequest } from '../../../api/endpoints/userApi';
import { 
  canCreateUser, 
  getCurrentUserRole 
} from '../../../utils/permissions';
import { validateTimeRangeText } from '../../../utils/validation';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

interface User {
  key: string;
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: 'admin' | 'manager' | 'doctor' | 'staff' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

interface EducationItem {
  id: string;
  timeRange: [Dayjs, Dayjs] | null;
  institution: string;
}

interface ExperienceItem {
  id: string;
  timeRange: [Dayjs, Dayjs] | null;
  workplace: string;
}

interface SpecializationItem {
  id: string;
  specialization: string;
}

const UserManagement: React.FC = () => {
  // Get message API from App
  const { message: messageApi } = App.useApp();

  // CSS tùy chỉnh cho DatePicker
  useEffect(() => {
    // Tùy chỉnh CSS cho DatePicker
    const style = document.createElement('style');
    style.innerHTML = `
      .ant-picker-year-panel .ant-picker-cell-inner,
      .ant-picker-decade-panel .ant-picker-cell-inner {
        padding: 0 10px;
        text-align: center;
        border-radius: 4px;
      }
      .ant-picker-year-panel .ant-picker-cell:hover .ant-picker-cell-inner,
      .ant-picker-decade-panel .ant-picker-cell:hover .ant-picker-cell-inner {
        background-color: #e6f7ff;
      }
      .ant-picker-header-super-prev-btn, .ant-picker-header-super-next-btn {
        display: inline-block !important;
      }
      .ant-picker-decade-panel .ant-picker-header-super-prev-btn,
      .ant-picker-decade-panel .ant-picker-header-super-next-btn {
        display: none !important;
      }
      .ant-picker-header-view {
        flex: auto;
        font-weight: 500;
        line-height: 40px;
      }
      .ant-picker-year-panel .ant-picker-content,
      .ant-picker-decade-panel .ant-picker-content {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
      }
      .ant-picker-year-panel .ant-picker-cell,
      .ant-picker-decade-panel .ant-picker-cell {
        width: auto;
      }
      .ant-picker-decade-panel .ant-picker-cell-inner,
      .ant-picker-year-panel .ant-picker-cell-inner {
        width: 100%;
        height: 32px;
        line-height: 32px;
        margin: 0;
        padding: 0;
      }
      .ant-picker-cell {
        padding: 3px;
        text-align: center;
      }
      
      /* Improved DatePicker styles */
      .year-picker-dropdown {
        position: absolute !important;
        z-index: 1060 !important;
      }
      
      .ant-picker-dropdown {
        position: absolute !important;
        z-index: 1060 !important;
      }
      
      /* Fix for DatePicker panels */
      .ant-picker-panels {
        display: flex;
      }
      
      /* Fix for year panel width */
      .ant-picker-year-panel {
        width: 280px !important;
      }
      
      /* Enable all year selections */
      .ant-picker-cell-disabled {
        color: rgba(0, 0, 0, 0.85) !important;
        background: transparent !important;
        cursor: pointer !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      
      .ant-picker-cell-disabled .ant-picker-cell-inner {
        background: transparent !important;
        color: rgba(0, 0, 0, 0.85) !important;
      }
      
      .ant-picker-cell-disabled:hover .ant-picker-cell-inner {
        background-color: #e6f7ff !important;
      }
      
      .ant-picker-cell-disabled.ant-picker-cell-selected .ant-picker-cell-inner {
        background-color: #1890ff !important;
        color: #fff !important;
      }
      
      /* Ensure DatePicker doesn't interfere with other elements */
      .ant-picker-range-wrapper {
        box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
      }
      
      /* Prevent click events from being captured by other elements */
      .ant-picker-panel-container {
        overflow: hidden;
        vertical-align: top;
        background: #fff;
        border-radius: 2px;
        box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
        transition: margin 0.3s;
      }
      
      /* Fix input focus issues */
      .ant-input:focus {
        z-index: 1;
        position: relative;
      }
      
      /* Ensure modal content is above DatePicker */
      .ant-modal-content {
        position: relative;
        z-index: 1050;
      }
      
      /* Fix DatePicker positioning */
      .ant-picker {
        position: relative;
        z-index: 1;
      }
    `;
    document.head.appendChild(style);

    // Add event listener to close DatePicker when clicking outside
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If clicking on an input field that's not a DatePicker
      if (target && !target.closest('.ant-picker') && !target.closest('.ant-picker-dropdown')) {
        // Find any open DatePicker dropdowns and force them to close
        const openDropdowns = document.querySelectorAll('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
        if (openDropdowns.length > 0) {
          // Click on the document body to force close any open pickers
          document.body.click();
        }
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);

    return () => {
      document.head.removeChild(style);
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, []);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditRoleModalVisible, setIsEditRoleModalVisible] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('');
  const [certificateFileList, setCertificateFileList] = useState<UploadFile[]>([]);
  const pageSize = 10; // Fixed page size

  // Thêm state để quản lý nhiều mục học vấn và kinh nghiệm
  const [educationItems, setEducationItems] = useState<EducationItem[]>([
    { id: '1', timeRange: null, institution: '' }
  ]);
  const [experienceItems, setExperienceItems] = useState<ExperienceItem[]>([
    { id: '1', timeRange: null, workplace: '' }
  ]);
  // Thêm state cho chuyên khoa
  const [specializationItems, setSpecializationItems] = useState<SpecializationItem[]>([
    { id: '1', specialization: '' }
  ]);
  
  const [form] = Form.useForm();
  const [editRoleForm] = Form.useForm();
  
  // Get current user role for permissions
  const userRole = getCurrentUserRole();

  // Thêm state để lưu các cảnh báo về kinh nghiệm và học tập
  const [educationWarnings, setEducationWarnings] = useState<string[]>([]);
  const [experienceWarnings, setExperienceWarnings] = useState<string[]>([]);
  // Thêm state để kiểm soát hiển thị cảnh báo
  const [showEducationWarnings, setShowEducationWarnings] = useState<boolean>(false);
  const [showExperienceWarnings, setShowExperienceWarnings] = useState<boolean>(false);
  // Thêm state để đếm số lần hiển thị cảnh báo
  const [educationWarningCount, setEducationWarningCount] = useState<number>(0);
  const [experienceWarningCount, setExperienceWarningCount] = useState<number>(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAllUsers({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (response.success) {
        // Convert API user format to component format
        const convertedUsers = response.data.users.map((user: ApiUser) => ({
          key: user._id,
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phone || '',
          role: user.role,
          status: (user.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
          emailVerified: user.emailVerified || false,
          lastLogin: user.updatedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }));
        setUsers(convertedUsers);
      }
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { status?: number; data?: { message?: string } } };
      messageApi.error(error?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.phoneNumber.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: User['role']) => {
    const colors = {
      admin: 'red',
      manager: 'orange',
      doctor: 'blue',
      staff: 'green',
      customer: 'default'
    };
    return colors[role];
  };

  const getRoleText = (role: User['role']) => {
    const texts = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      doctor: 'Bác sĩ',
      staff: 'Nhân viên',
      customer: 'Khách hàng'
    };
    return texts[role];
  };

  const getStatusColor = (status: User['status']) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      suspended: 'error'
    };
    return colors[status];
  };

  const getStatusText = (status: User['status']) => {
    const texts = {
      active: 'Hoạt động',
      inactive: 'Tạm dừng',
      suspended: 'Bị khóa'
    };
    return texts[status];
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'active' ? 'khóa' : 'mở khóa';
      await userApi.toggleUserStatus(userId, {
        reason: `${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản từ quản lý`
      });
      messageApi.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công`);
      loadData();
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { status?: number; data?: { message?: string } } };
      messageApi.error(error?.message || 'Không thể thay đổi trạng thái tài khoản');
    }
  };

  // Certificate upload props
  const certificateUploadProps: UploadProps = {
    name: 'certificate',
    multiple: true,
    fileList: certificateFileList,
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type === 'image/jpeg' || 
                         file.type === 'image/png' ||
                         file.type === 'image/jpg';
      if (!isValidType) {
        messageApi.error('Chỉ cho phép upload file PDF, JPG, JPEG, PNG!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        messageApi.error('File phải nhỏ hơn 2MB!');
        return false;
      }
      return false; // Prevent auto upload, we'll handle it manually
    },
    onChange: (info) => {
      setCertificateFileList(info.fileList);
    },
    onRemove: (file) => {
      setCertificateFileList(prev => prev.filter(item => item.uid !== file.uid));
    },
  };

  const addEducationItem = () => {
    setEducationItems([...educationItems, { 
      id: Date.now().toString(), 
      timeRange: null, 
      institution: '' 
    }]);
    // Ẩn cảnh báo khi thêm mục mới
    setShowEducationWarnings(false);
  };

  const removeEducationItem = (id: string) => {
    if (educationItems.length > 1) {
      setEducationItems(educationItems.filter(item => item.id !== id));
    }
  };

  const updateEducationItem = (id: string, field: 'timeRange' | 'institution', value: [Dayjs, Dayjs] | string) => {
    setEducationItems(educationItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
    
    // Ẩn cảnh báo chi tiết khi người dùng sửa đổi
    if (showEducationWarnings) {
      // Giữ lại danh sách cảnh báo nhưng ẩn hiển thị
      setShowEducationWarnings(false);
    }
  };

  const addExperienceItem = () => {
    setExperienceItems([...experienceItems, { 
      id: Date.now().toString(), 
      timeRange: null, 
      workplace: '' 
    }]);
    // Ẩn cảnh báo khi thêm mục mới
    setShowExperienceWarnings(false);
  };

  const removeExperienceItem = (id: string) => {
    if (experienceItems.length > 1) {
      setExperienceItems(experienceItems.filter(item => item.id !== id));
    }
  };

  const updateExperienceItem = (id: string, field: 'timeRange' | 'workplace', value: [Dayjs, Dayjs] | string) => {
    setExperienceItems(experienceItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
    
    // Ẩn cảnh báo chi tiết khi người dùng sửa đổi
    if (showExperienceWarnings) {
      // Giữ lại danh sách cảnh báo nhưng ẩn hiển thị
      setShowExperienceWarnings(false);
    }
  };

  // Thêm các hàm xử lý thêm/xóa chuyên khoa
  const addSpecializationItem = () => {
    setSpecializationItems([...specializationItems, { 
      id: Date.now().toString(), 
      specialization: '' 
    }]);
  };

  const removeSpecializationItem = (id: string) => {
    if (specializationItems.length > 1) {
      setSpecializationItems(specializationItems.filter(item => item.id !== id));
    }
  };

  const updateSpecializationItem = (id: string, value: string) => {
    setSpecializationItems(specializationItems.map(item => 
      item.id === id ? { ...item, specialization: value } : item
    ));
  };

  const validateEducationData = () => {
    const validEducation = educationItems.filter(item => 
      item.timeRange && 
      item.timeRange[0] && 
      item.timeRange[1] && 
      item.institution.trim() !== ''
    );
    
    if (validEducation.length === 0) {
      messageApi.error('Vui lòng nhập ít nhất một thông tin học vấn với đầy đủ thời gian và trường học!');
      return { isValid: false, formattedEducation: '' };
    }

    try {
      // Format education data
      const educationLines = validEducation.map(item => {
        const startYear = item.timeRange![0].format('YYYY');
        const endYear = item.timeRange![1].format('YYYY');
        return `${startYear}-${endYear}: ${item.institution.trim()}`;
      }).join('\n');
      
      // Validate toàn bộ nội dung học tập
      const validation = validateTimeRangeText(educationLines, 'education');
      
      // Lưu các cảnh báo (nếu có) và kiểm soát hiển thị
      if (validation.errorMessages.length > 0) {
        setEducationWarnings(validation.errorMessages);
        
        // Chỉ hiển thị cảnh báo popup tối đa 2 lần để tránh spam
        if (educationWarningCount < 2) {
          messageApi.warning('Thông tin học vấn có vấn đề, vui lòng kiểm tra chi tiết bên dưới.');
          setEducationWarningCount(prev => prev + 1);
        }
        
        // Luôn hiển thị cảnh báo chi tiết trong form
        setShowEducationWarnings(true);
      } else {
        setEducationWarnings([]);
        setShowEducationWarnings(false);
      }
      
      if (!validation.isValid) {
        // Chỉ hiển thị thông báo lỗi popup một lần
        if (educationWarningCount === 0) {
          messageApi.error('Thông tin học vấn không hợp lệ, vui lòng kiểm tra lại!');
          setEducationWarningCount(1);
        }
        return { isValid: false, formattedEducation: '' };
      }
      
      return { 
        isValid: true, 
        formattedEducation: validation.normalizedText || educationLines 
      };
    } catch (e) {
      // Ghi lại lỗi vào console để debug
      console.error('Lỗi xác thực học vấn:', e);
      messageApi.error('Có lỗi khi xác thực thông tin học vấn.');
      return { isValid: false, formattedEducation: '' };
    }
  };

  const validateExperienceData = () => {
    const validExperience = experienceItems.filter(item => 
      item.timeRange && 
      item.timeRange[0] && 
      item.timeRange[1] && 
      item.workplace.trim() !== ''
    );
    
    if (validExperience.length === 0) {
      messageApi.error('Vui lòng nhập ít nhất một thông tin kinh nghiệm với đầy đủ thời gian và nơi làm việc!');
      return { isValid: false, formattedExperience: '' };
    }

    try {
      // Format experience data
      const experienceLines = validExperience.map(item => {
        const startYear = item.timeRange![0].format('YYYY');
        const endYear = item.timeRange![1].isSame(dayjs(), 'year') 
          ? 'hiện tại' 
          : item.timeRange![1].format('YYYY');
        return `${startYear}-${endYear}: ${item.workplace.trim()}`;
      }).join('\n');
      
      // Validate toàn bộ nội dung kinh nghiệm
      const validation = validateTimeRangeText(experienceLines, 'experience');
      
      // Lưu các cảnh báo (nếu có) và kiểm soát hiển thị
      if (validation.errorMessages.length > 0) {
        setExperienceWarnings(validation.errorMessages);
        
        // Chỉ hiển thị cảnh báo popup tối đa 2 lần để tránh spam
        if (experienceWarningCount < 2) {
          messageApi.warning('Thông tin kinh nghiệm có vấn đề, vui lòng kiểm tra chi tiết bên dưới.');
          setExperienceWarningCount(prev => prev + 1);
        }
        
        // Luôn hiển thị cảnh báo chi tiết trong form
        setShowExperienceWarnings(true);
      } else {
        setExperienceWarnings([]);
        setShowExperienceWarnings(false);
      }
      
      if (!validation.isValid) {
        // Chỉ hiển thị thông báo lỗi popup một lần
        if (experienceWarningCount === 0) {
          messageApi.error('Thông tin kinh nghiệm không hợp lệ, vui lòng kiểm tra lại!');
          setExperienceWarningCount(1);
        }
        return { isValid: false, formattedExperience: '' };
      }
      
      return { 
        isValid: true, 
        formattedExperience: validation.normalizedText || experienceLines,
        // Tính tổng số năm kinh nghiệm từ các mục đã xác thực
        yearsOfExperience: validExperience.map((item) => {
          const startYear = parseInt(item.timeRange![0].format('YYYY'));
          const endYear = item.timeRange![1].isSame(dayjs(), 'year') 
            ? dayjs().year() 
            : parseInt(item.timeRange![1].format('YYYY'));
          return (endYear - startYear) + 1;
        }).reduce((sum, years) => sum + years, 0)
      };
    } catch (e) {
      // Ghi lại lỗi vào console để debug
      console.error('Lỗi xác thực kinh nghiệm:', e);
      messageApi.error('Có lỗi khi xác thực thông tin kinh nghiệm.');
      return { isValid: false, formattedExperience: '' };
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Kiểm tra thông tin cơ bản
      if (!values.email || !values.email.trim()) {
        messageApi.error('Vui lòng nhập email!');
        return;
      }
      
      if (!values.fullName || !values.fullName.trim()) {
        messageApi.error('Vui lòng nhập họ tên!');
        return;
      }
      
      if (!values.role) {
        messageApi.error('Vui lòng chọn vai trò!');
        return;
      }
      
      if (values.role === 'doctor') {
        // Validate certificate files
        if (certificateFileList.length === 0) {
          messageApi.error('Vui lòng upload ít nhất một file chứng chỉ!');
          return;
        }

        // Validate specializations
        const validSpecializations = specializationItems.filter(item => item.specialization.trim() !== '');
        if (validSpecializations.length === 0) {
          messageApi.error('Vui lòng nhập ít nhất một chuyên khoa!');
          return;
        }
        
        // Validate education và experience
        const educationValidation = validateEducationData();
        if (!educationValidation.isValid) return;
        
        const experienceValidation = validateExperienceData();
        if (!experienceValidation.isValid) return;
        
        // Validate phone
        if (!values.phone || !values.phone.trim()) {
          messageApi.error('Vui lòng nhập số điện thoại!');
          return;
        }
        
        if (!/^[0-9]{10,11}$/.test(values.phone)) {
          messageApi.error('Số điện thoại không hợp lệ! Phải có 10-11 chữ số.');
          return;
        }
        
        // Validate gender
        if (!values.gender) {
          messageApi.error('Vui lòng chọn giới tính!');
          return;
        }
        
        // Validate address
        if (!values.address || !values.address.trim()) {
          messageApi.error('Vui lòng nhập địa chỉ!');
          return;
        }
        
        // Validate bio
        if (!values.bio || !values.bio.trim()) {
          messageApi.error('Vui lòng nhập tiểu sử bác sĩ!');
          return;
        }

        // Format specialization data
        const formattedSpecialization = validSpecializations
          .map(item => item.specialization.trim())
          .join(', ');

        // Hiển thị thông báo xác nhận
        Modal.confirm({
          title: 'Xác nhận tạo tài khoản bác sĩ',
          content: (
            <div>
              <p><strong>Email:</strong> {values.email}</p>
              <p><strong>Họ tên:</strong> {values.fullName}</p>
              <p><strong>Số điện thoại:</strong> {values.phone}</p>
              <p><strong>Giới tính:</strong> {values.gender === 'male' ? 'Nam' : values.gender === 'female' ? 'Nữ' : 'Khác'}</p>
              <p><strong>Địa chỉ:</strong> {values.address}</p>
              <p><strong>Chuyên khoa:</strong> {formattedSpecialization}</p>
              <p><strong>Số năm kinh nghiệm:</strong> {experienceValidation.yearsOfExperience}</p>
              <p><strong>Chi tiết kinh nghiệm:</strong></p>
              <div style={{ maxHeight: '100px', overflow: 'auto', border: '1px solid #eee', padding: '8px', marginBottom: '8px' }}>
                {experienceValidation.formattedExperience.split('\n').map((exp, index) => (
                  <div key={index}>{exp}</div>
                ))}
              </div>
              <p><strong>Số chứng chỉ đính kèm:</strong> {certificateFileList.length}</p>
            </div>
          ),
          okText: 'Tạo tài khoản',
          cancelText: 'Hủy',
          onOk: async () => {
            try {
              // Create doctor with full profile
              const doctorData: CreateDoctorRequest = {
                email: values.email,
                fullName: values.fullName,
                phone: values.phone || '',
                gender: values.gender || 'other',
                address: values.address || '',
                bio: values.bio || '',
                specialization: formattedSpecialization,
                education: educationValidation.formattedEducation,
                experience: experienceValidation.formattedExperience,
                certificate: certificateFileList.map(file => file.name).join(', '), 
                certificates: certificateFileList.map(file => file.originFileObj).filter(Boolean) as File[]
              };
              
              const response = await userApi.createDoctor(doctorData);
              messageApi.success(`Tạo bác sĩ thành công! Thông tin đăng nhập: Email: ${response.userCredentials.email}, Mật khẩu: ${response.userCredentials.defaultPassword}`);
              
              setIsModalVisible(false);
              form.resetFields();
              setSelectedUserRole('');
              setCertificateFileList([]);
              setEducationItems([{ id: '1', timeRange: null, institution: '' }]);
              setExperienceItems([{ id: '1', timeRange: null, workplace: '' }]);
              setSpecializationItems([{ id: '1', specialization: '' }]);
              setEducationWarnings([]);
              setExperienceWarnings([]);
              setShowEducationWarnings(false);
              setShowExperienceWarnings(false);
              setEducationWarningCount(0);
              setExperienceWarningCount(0);
              loadData();
            } catch (err: unknown) {
              handleApiError(err);
            }
          }
        });
        
        return; // Dừng lại ở đây, không thực hiện tiếp vì đã có Modal.confirm
      } else if (values.role === 'staff') {
        // Validate phone
        if (!values.phone || !values.phone.trim()) {
          messageApi.error('Vui lòng nhập số điện thoại!');
          return;
        }
        
        if (!/^[0-9]{10,11}$/.test(values.phone)) {
          messageApi.error('Số điện thoại không hợp lệ! Phải có 10-11 chữ số.');
          return;
        }
        
        // Validate gender
        if (!values.gender) {
          messageApi.error('Vui lòng chọn giới tính!');
          return;
        }
        
        // Validate address
        if (!values.address || !values.address.trim()) {
          messageApi.error('Vui lòng nhập địa chỉ!');
          return;
        }
        
        // Validate staffType
        if (!values.staffType) {
          messageApi.error('Vui lòng chọn loại nhân viên!');
          return;
        }
        
        // Hiển thị thông báo xác nhận
        Modal.confirm({
          title: 'Xác nhận tạo tài khoản nhân viên',
          content: (
            <div>
              <p><strong>Email:</strong> {values.email}</p>
              <p><strong>Họ tên:</strong> {values.fullName}</p>
              <p><strong>Số điện thoại:</strong> {values.phone}</p>
              <p><strong>Giới tính:</strong> {values.gender === 'male' ? 'Nam' : values.gender === 'female' ? 'Nữ' : 'Khác'}</p>
              <p><strong>Địa chỉ:</strong> {values.address}</p>
              <p><strong>Loại nhân viên:</strong> {values.staffType}</p>
            </div>
          ),
          okText: 'Tạo tài khoản',
          cancelText: 'Hủy',
          onOk: async () => {
            try {
              // Create staff with full profile
              const staffData: CreateStaffRequest = {
                email: values.email,
                fullName: values.fullName,
                phone: values.phone || '',
                gender: values.gender || 'other',
                address: values.address || '',
                staffType: values.staffType || 'Normal'
              };
              
              const response = await userApi.createStaff(staffData);
              messageApi.success(`Tạo nhân viên thành công! Thông tin đăng nhập: Email: ${response.userCredentials.email}, Mật khẩu: ${response.userCredentials.defaultPassword}`);
              
              setIsModalVisible(false);
              form.resetFields();
              setSelectedUserRole('');
              setCertificateFileList([]);
              setEducationItems([{ id: '1', timeRange: null, institution: '' }]);
              setExperienceItems([{ id: '1', timeRange: null, workplace: '' }]);
              setSpecializationItems([{ id: '1', specialization: '' }]);
              setEducationWarnings([]);
              setExperienceWarnings([]);
              setShowEducationWarnings(false);
              setShowExperienceWarnings(false);
              setEducationWarningCount(0);
              setExperienceWarningCount(0);
              loadData();
            } catch (err: unknown) {
              handleApiError(err);
            }
          }
        });
        
        return; // Dừng lại ở đây, không thực hiện tiếp vì đã có Modal.confirm
      } else {
        // Hiển thị thông báo xác nhận cho người dùng thông thường
        Modal.confirm({
          title: 'Xác nhận tạo tài khoản người dùng',
          content: (
            <div>
              <p><strong>Email:</strong> {values.email}</p>
              <p><strong>Họ tên:</strong> {values.fullName}</p>
              <p><strong>Vai trò:</strong> {getRoleText(values.role as User['role'])}</p>
              {values.phone && <p><strong>Số điện thoại:</strong> {values.phone}</p>}
              {values.gender && <p><strong>Giới tính:</strong> {values.gender === 'male' ? 'Nam' : values.gender === 'female' ? 'Nữ' : 'Khác'}</p>}
              {values.address && <p><strong>Địa chỉ:</strong> {values.address}</p>}
            </div>
          ),
          okText: 'Tạo tài khoản',
          cancelText: 'Hủy',
          onOk: async () => {
            try {
              // Create regular user
              const createData: CreateUserRequest = {
                email: values.email,
                fullName: values.fullName,
                role: values.role,
                password: '', // Backend sẽ tự generate
                phone: values.phone || '',
                gender: values.gender || 'other',
                address: values.address || ''
              };
              
              await userApi.createUser(createData);
              messageApi.success('Tạo người dùng thành công! Thông tin tài khoản đã được gửi qua email.');
              
              setIsModalVisible(false);
              form.resetFields();
              setSelectedUserRole('');
              setCertificateFileList([]);
              setEducationItems([{ id: '1', timeRange: null, institution: '' }]);
              setExperienceItems([{ id: '1', timeRange: null, workplace: '' }]);
              setSpecializationItems([{ id: '1', specialization: '' }]);
              setEducationWarnings([]);
              setExperienceWarnings([]);
              setShowEducationWarnings(false);
              setShowExperienceWarnings(false);
              setEducationWarningCount(0);
              setExperienceWarningCount(0);
              loadData();
            } catch (err: unknown) {
              handleApiError(err);
            }
          }
        });
        
        return; // Dừng lại ở đây, không thực hiện tiếp vì đã có Modal.confirm
      }
    } catch (err: unknown) {
      handleApiError(err);
    }
  };
  
  // Hàm xử lý lỗi API chung
  const handleApiError = (err: unknown) => {
    const error = err as { 
      message?: string; 
      response?: { 
        status?: number; 
        data?: { 
          message?: string;
          success?: boolean;
        } 
      } 
    };
    
    let errorMessage = 'Có lỗi xảy ra khi tạo người dùng';
    
    if (error?.response?.status === 409) {
      errorMessage = error?.response?.data?.message || 'Email này đã tồn tại trong hệ thống';
    } else if (error?.response?.status === 403) {
      errorMessage = error?.response?.data?.message || 'Bạn không có quyền tạo loại tài khoản này';
    } else if (error?.response?.status === 400) {
      errorMessage = error?.response?.data?.message || 'Thông tin không hợp lệ';
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    messageApi.error(errorMessage);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedUserRole('');
    setCertificateFileList([]);
    setEducationItems([{ id: '1', timeRange: null, institution: '' }]);
    setExperienceItems([{ id: '1', timeRange: null, workplace: '' }]);
    setSpecializationItems([{ id: '1', specialization: '' }]);
    setEducationWarnings([]);
    setExperienceWarnings([]);
    setShowEducationWarnings(false);
    setShowExperienceWarnings(false);
    setEducationWarningCount(0);
    setExperienceWarningCount(0);
  };

  const handleEditRole = (user: User) => {
    setSelectedUserForEdit(user);
    editRoleForm.setFieldsValue({
      currentRole: user.role,
      newRole: user.role
    });
    setIsEditRoleModalVisible(true);
  };

  const handleUpdateRole = async () => {
    try {
      const values = await editRoleForm.validateFields();
      
      if (!selectedUserForEdit) return;
      
      if (values.newRole === values.currentRole) {
        messageApi.warning('Vai trò mới phải khác với vai trò hiện tại');
        return;
      }
      
      await userApi.updateUserRole(selectedUserForEdit.id, {
        newRole: values.newRole,
        reason: `Thay đổi vai trò từ ${getRoleText(values.currentRole as User['role'])} thành ${getRoleText(values.newRole as User['role'])}`
      });
      
      messageApi.success('Cập nhật vai trò thành công');
      setIsEditRoleModalVisible(false);
      editRoleForm.resetFields();
      setSelectedUserForEdit(null);
      loadData();
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { status?: number; data?: { message?: string } } };
      messageApi.error(error?.message || 'Không thể cập nhật vai trò');
    }
  };

  const handleEditRoleModalCancel = () => {
    setIsEditRoleModalVisible(false);
    editRoleForm.resetFields();
    setSelectedUserForEdit(null);
  };

  const handleRoleChange = (value: string) => {
    setSelectedUserRole(value);
    // Reset form fields when role changes
    const currentValues = form.getFieldsValue();
    const baseFields = {
      email: currentValues.email,
      fullName: currentValues.fullName,
      role: value
    };
    form.setFieldsValue(baseFields);
    setCertificateFileList([]);
    setEducationItems([{ id: '1', timeRange: null, institution: '' }]);
    setExperienceItems([{ id: '1', timeRange: null, workplace: '' }]);
    setSpecializationItems([{ id: '1', specialization: '' }]);
  };

  const showUserDetails = (user: User) => {
    Modal.info({
      title: 'Chi tiết người dùng',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <Text strong>ID người dùng: </Text>
            <Text code style={{ fontSize: '12px' }}>{user.id}</Text>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Họ tên: </Text>
            <Text>{user.fullName}</Text>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Email: </Text>
            <Text>{user.email}</Text>
            <Tag color={user.emailVerified ? 'success' : 'warning'} style={{ marginLeft: 8 }}>
              {user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
            </Tag>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Số điện thoại: </Text>
            <Text>{user.phoneNumber}</Text>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Vai trò: </Text>
            <Tag color={getRoleColor(user.role)}>{getRoleText(user.role)}</Tag>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Trạng thái: </Text>
            <Tag color={getStatusColor(user.status)}>{getStatusText(user.status)}</Tag>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text strong>Ngày tạo: </Text>
            <Text>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</Text>
          </div>
          <div>
            <Text strong>Cập nhật: </Text>
            <Text>{new Date(user.updatedAt).toLocaleDateString('vi-VN')}</Text>
          </div>
        </div>
      ),
    });
  };

  // Render role-specific fields
  const renderRoleSpecificFields = () => {
    if (selectedUserRole === 'doctor') {
      return (
        <>
          <Divider orientation="left">
            <MedicineBoxOutlined style={{ marginRight: 8 }} />
            Thông tin bác sĩ
          </Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                ]}
              >
                <Input 
                  placeholder="Nhập số điện thoại" 
                  prefix={<PhoneOutlined />}
                />
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
            <Input 
              placeholder="Nhập địa chỉ" 
              prefix={<HomeOutlined />}
            />
          </Form.Item>

          {/* Chuyên khoa - UI cải tiến */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="ant-form-item-required" style={{ fontSize: '14px', fontWeight: 500 }}>Chuyên khoa</span>
                <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
              </div>
              <Button 
                type="link" 
                onClick={addSpecializationItem}
                style={{ 
                  padding: '0 8px',
                  color: '#1890ff',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <PlusOutlined style={{ fontSize: '12px', marginRight: 4 }} />
                <span style={{ fontSize: '14px' }}>Thêm chuyên khoa</span>
              </Button>
            </div>

            {specializationItems.map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  marginBottom: 16, 
                  border: '1px dashed #d9d9d9', 
                  padding: '16px 16px 8px', 
                  borderRadius: '8px',
                  backgroundColor: '#fafafa'
                }}
              >
                <Row gutter={16}>
                  <Col span={24} style={{ marginBottom: 8 }}>
                    <Input
                      value={item.specialization}
                      onChange={(e) => updateSpecializationItem(item.id, e.target.value)}
                      placeholder="Ví dụ: Nội khoa, Nhi khoa, Tim mạch, ..."
                      prefix={<MedicineBoxOutlined />}
                    />
                  </Col>
                  {specializationItems.length > 1 && (
                    <Col span={24} style={{ textAlign: 'right' }}>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => removeSpecializationItem(item.id)}
                        style={{ padding: '0 8px' }}
                      >
                        Xóa
                      </Button>
                    </Col>
                  )}
                </Row>
              </div>
            ))}
          </div>

          {/* Học vấn - UI cải tiến */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="ant-form-item-required" style={{ fontSize: '14px', fontWeight: 500 }}>Học vấn</span>
                <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
              </div>
              <Button 
                type="primary" 
                onClick={addEducationItem}
                style={{ 
                  padding: '0 12px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                icon={<PlusOutlined />}
              >
                Thêm học vấn
              </Button>
            </div>
            
            {/* Hiển thị cảnh báo về học vấn nếu có và được phép hiển thị */}
            {showEducationWarnings && educationWarnings.length > 0 && (
              <div style={{ marginBottom: 16, padding: 16, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
                <div style={{ marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    Cảnh báo thông tin học vấn:
                  </div>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CloseOutlined />} 
                    onClick={() => setShowEducationWarnings(false)} 
                    style={{ color: '#8c8c8c' }}
                  />
                </div>
                <ul style={{ paddingLeft: 24, margin: 0 }}>
                  {educationWarnings.map((warning, index) => (
                    <li key={index} style={{ color: '#705700', fontSize: 13 }}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {educationItems.map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  marginBottom: 16, 
                  border: '1px solid #d9d9d9', 
                  padding: '16px', 
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <Row gutter={16}>
                  <Col span={24} style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: 8 }}>Trường học</div>
                    <Input
                      value={item.institution}
                      onChange={(e) => updateEducationItem(item.id, 'institution', e.target.value)}
                      placeholder="Ví dụ: Đại học Y Dược TP.HCM - Bác sĩ Đa khoa"
                      onMouseDown={e => e.stopPropagation()}
                      onFocus={e => e.stopPropagation()}
                      size="large"
                    />
                  </Col>
                  <Col span={24}>
                    <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: 8 }}>Thời gian học</div>
                    <Row gutter={8}>
                      <Col span={11}>
                        <Input.Group compact>
                          <Select 
                            style={{ width: '100%' }}
                            placeholder="Năm bắt đầu"
                            value={item.timeRange ? item.timeRange[0]?.year() : undefined}
                            onChange={(value) => {
                              const startDate = value ? dayjs().year(value) : null;
                              const endDate = item.timeRange ? item.timeRange[1] : null;
                              updateEducationItem(
                                item.id, 
                                'timeRange', 
                                startDate && endDate ? [startDate, endDate] : startDate ? [startDate, dayjs()] : [null, endDate]
                              );
                              // Xóa cảnh báo khi thay đổi năm
                              setEducationWarnings([]);
                            }}
                          >
                            {Array.from({ length: 70 }, (_, i) => dayjs().year() - i).map(year => (
                              <Select.Option key={year} value={year}>{year}</Select.Option>
                            ))}
                          </Select>
                        </Input.Group>
                      </Col>
                      <Col span={2} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ color: '#999' }}>đến</span>
                      </Col>
                      <Col span={11}>
                        <Input.Group compact>
                          <Select 
                            style={{ width: '100%' }}
                            placeholder="Năm kết thúc"
                            value={item.timeRange ? item.timeRange[1]?.year() : undefined}
                            onChange={(value) => {
                              const startDate = item.timeRange ? item.timeRange[0] : null;
                              const endDate = value ? dayjs().year(value) : null;
                              updateEducationItem(
                                item.id, 
                                'timeRange', 
                                startDate && endDate ? [startDate, endDate] : [startDate, null]
                              );
                              // Xóa cảnh báo khi thay đổi năm
                              setEducationWarnings([]);
                            }}
                          >
                            {Array.from({ length: 70 }, (_, i) => dayjs().year() - i).map(year => (
                              <Select.Option key={year} value={year}>{year}</Select.Option>
                            ))}
                          </Select>
                        </Input.Group>
                      </Col>
                    </Row>
                  </Col>
                  {educationItems.length > 1 && (
                    <Col span={24} style={{ textAlign: 'right', marginTop: 16 }}>
                      <Button 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => removeEducationItem(item.id)}
                        style={{ borderRadius: '4px' }}
                      >
                        Xóa
                      </Button>
                    </Col>
                  )}
                </Row>
              </div>
            ))}
          </div>

          {/* Kinh nghiệm làm việc - UI cải tiến */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="ant-form-item-required" style={{ fontSize: '14px', fontWeight: 500 }}>Kinh nghiệm làm việc</span>
                <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
              </div>
              <Button 
                type="primary" 
                onClick={addExperienceItem}
                style={{ 
                  padding: '0 12px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                icon={<PlusOutlined />}
              >
                Thêm kinh nghiệm
              </Button>
            </div>
            
            {/* Hiển thị cảnh báo về kinh nghiệm nếu có và được phép hiển thị */}
            {showExperienceWarnings && experienceWarnings.length > 0 && (
              <div style={{ marginBottom: 16, padding: 16, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
                <div style={{ marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    Cảnh báo thông tin kinh nghiệm:
                  </div>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CloseOutlined />} 
                    onClick={() => setShowExperienceWarnings(false)} 
                    style={{ color: '#8c8c8c' }}
                  />
                </div>
                <ul style={{ paddingLeft: 24, margin: 0 }}>
                  {experienceWarnings.map((warning, index) => (
                    <li key={index} style={{ color: '#705700', fontSize: 13 }}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {experienceItems.map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  marginBottom: 16, 
                  border: '1px solid #d9d9d9', 
                  padding: '16px', 
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <Row gutter={16}>
                  <Col span={24} style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: 8 }}>Nơi làm việc</div>
                    <Input
                      value={item.workplace}
                      onChange={(e) => updateExperienceItem(item.id, 'workplace', e.target.value)}
                      placeholder="Ví dụ: Bệnh viện Chợ Rẫy - Bác sĩ nội trú"
                      onMouseDown={e => e.stopPropagation()}
                      onFocus={e => e.stopPropagation()}
                      size="large"
                    />
                  </Col>
                  <Col span={24}>
                    <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: 8 }}>Thời gian làm việc</div>
                    <Row gutter={8}>
                      <Col span={11}>
                        <Input.Group compact>
                          <Select 
                            style={{ width: '100%' }}
                            placeholder="Năm bắt đầu"
                            value={item.timeRange ? item.timeRange[0]?.year() : undefined}
                            onChange={(value) => {
                              const startDate = value ? dayjs().year(value) : null;
                              const endDate = item.timeRange ? item.timeRange[1] : null;
                              updateExperienceItem(
                                item.id, 
                                'timeRange', 
                                startDate && endDate ? [startDate, endDate] : startDate ? [startDate, dayjs()] : [null, endDate]
                              );
                              // Xóa cảnh báo khi thay đổi năm
                              setExperienceWarnings([]);
                            }}
                          >
                            {Array.from({ length: 70 }, (_, i) => dayjs().year() - i).map(year => (
                              <Select.Option key={year} value={year}>{year}</Select.Option>
                            ))}
                          </Select>
                        </Input.Group>
                      </Col>
                      <Col span={2} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ color: '#999' }}>đến</span>
                      </Col>
                      <Col span={11}>
                        <Input.Group compact>
                          <Select 
                            style={{ width: '100%' }}
                            placeholder="Năm kết thúc"
                            value={item.timeRange ? item.timeRange[1]?.year() : undefined}
                            onChange={(value) => {
                              const startDate = item.timeRange ? item.timeRange[0] : null;
                              const endDate = value ? dayjs().year(value) : null;
                              updateExperienceItem(
                                item.id, 
                                'timeRange', 
                                startDate && endDate ? [startDate, endDate] : [startDate, null]
                              );
                              // Xóa cảnh báo khi thay đổi năm
                              setExperienceWarnings([]);
                            }}
                          >
                            {Array.from({ length: 70 }, (_, i) => dayjs().year() - i).map(year => (
                              <Select.Option key={year} value={year}>{year}</Select.Option>
                            ))}
                            <Select.Option value={dayjs().year() + 1}>Hiện tại</Select.Option>
                          </Select>
                        </Input.Group>
                      </Col>
                    </Row>
                  </Col>
                  {experienceItems.length > 1 && (
                    <Col span={24} style={{ textAlign: 'right', marginTop: 16 }}>
                      <Button 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => removeExperienceItem(item.id)}
                        style={{ borderRadius: '4px' }}
                      >
                        Xóa
                      </Button>
                    </Col>
                  )}
                </Row>
              </div>
            ))}
          </div>

          <Form.Item
            label="Chứng chỉ hành nghề"
            rules={[{ required: true, message: 'Vui lòng upload chứng chỉ!' }]}
          >
            <Dragger {...certificateUploadProps} style={{ padding: '20px' }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Kéo thả file vào đây hoặc click để chọn file</p>
              <p className="ant-upload-hint">
                Hỗ trợ file PDF, JPG, PNG. Tối đa 2MB mỗi file.
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item
            name="bio"
            label="Tiểu sử"
            rules={[{ required: true, message: 'Vui lòng nhập tiểu sử!' }]}
          >
            <TextArea 
              placeholder="Nhập tiểu sử bác sĩ" 
              rows={4}
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </>
      );
    } else if (selectedUserRole === 'staff') {
      return (
        <>
          <Divider orientation="left">
            <TeamOutlined style={{ marginRight: 8 }} />
            Thông tin nhân viên
          </Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                ]}
              >
                <Input 
                  placeholder="Nhập số điện thoại" 
                  prefix={<PhoneOutlined />}
                />
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
            <Input 
              placeholder="Nhập địa chỉ" 
              prefix={<HomeOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="staffType"
            label="Loại nhân viên"
            rules={[{ required: true, message: 'Vui lòng chọn loại nhân viên!' }]}
          >
            <Select placeholder="Chọn loại nhân viên">
              <Option value="Nursing">Điều dưỡng</Option>
              <Option value="Blogers">Blogger</Option>
              <Option value="Normal">Nhân viên thường</Option>
            </Select>
          </Form.Item>
        </>
      );
    } else if (selectedUserRole && selectedUserRole !== 'customer') {
      return (
        <>
          <Divider orientation="left">
            <IdcardOutlined style={{ marginRight: 8 }} />
            Thông tin bổ sung
          </Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
              >
                <Input 
                  placeholder="Nhập số điện thoại" 
                  prefix={<PhoneOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Giới tính"
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
          >
            <Input 
              placeholder="Nhập địa chỉ" 
              prefix={<HomeOutlined />}
            />
          </Form.Item>
        </>
      );
    }
    return null;
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Người dùng',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{text}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Email & Liên hệ',
      dataIndex: 'email',
      key: 'email',
      width: 280,
      render: (email: string, record: User) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <MailOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: '13px' }}>{email}</Text>
            {record.emailVerified ? (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
            ) : (
              <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '14px' }} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PhoneOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '13px' }}>{record.phoneNumber}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      align: 'center',
      render: (role: User['role']) => (
        <Tag color={getRoleColor(role)}>
          {getRoleText(role)}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: User['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      align: 'center',
      render: (_, record: User) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showUserDetails(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa vai trò">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditRole(record)}
              style={{ color: '#fa8c16' }}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
            <Button 
              type="text" 
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleStatus(record.id, record.status)}
              style={{ 
                color: record.status === 'active' ? '#ff4d4f' : '#52c41a',
                fontSize: '16px'
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <App>
      <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Card 
          style={{ 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: 'none'
          }}
        >
          <div style={{ 
            marginBottom: 24, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingBottom: '16px',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Title level={3} style={{ 
              margin: 0, 
              display: 'flex', 
              alignItems: 'center',
              color: '#1890ff'
            }}>
              <UserOutlined style={{ marginRight: 12, fontSize: '24px' }} />
              Quản lý người dùng
            </Title>
            {canCreateUser(userRole) && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
                size="large"
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)'
                }}
              >
                Thêm người dùng mới
              </Button>
            )}
          </div>

          <div style={{ 
            marginBottom: 24, 
            display: 'flex', 
            gap: 16, 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <Search
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              allowClear
              style={{ width: 350 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
            />
            
            <Select
              placeholder="Vai trò"
              style={{ width: 160 }}
              value={selectedRole}
              onChange={setSelectedRole}
              size="large"
            >
              <Option value="all">Tất cả vai trò</Option>
              <Option value="admin">Quản trị viên</Option>
              <Option value="manager">Quản lý</Option>
              <Option value="doctor">Bác sĩ</Option>
              <Option value="staff">Nhân viên</Option>
              <Option value="customer">Khách hàng</Option>
            </Select>

            <Select
              placeholder="Trạng thái"
              style={{ width: 160 }}
              value={selectedStatus}
              onChange={setSelectedStatus}
              size="large"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="suspended">Bị khóa</Option>
            </Select>
          </div>

          <div>
            <Table
              columns={columns}
              dataSource={filteredUsers}
              loading={loading}
              size="middle"
              pagination={false}
              scroll={{ x: 1000 }}
              bordered
              style={{
                backgroundColor: 'white',
                borderRadius: '8px'
              }}
            />
            
            {/* Custom Pagination giống hệt ảnh */}
            {filteredUsers.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '20px',
                padding: '16px 0',
                gap: '4px'
              }}>
                {/* Prev Button */}
                <span 
                  onClick={() => {
                    const totalPages = Math.ceil(filteredUsers.length / pageSize);
                    if (currentPage > 1 && totalPages > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  style={{ 
                    color: (currentPage > 1 && Math.ceil(filteredUsers.length / pageSize) > 1) ? '#999' : '#ccc',
                    fontSize: '14px',
                    cursor: (currentPage > 1 && Math.ceil(filteredUsers.length / pageSize) > 1) ? 'pointer' : 'not-allowed',
                    userSelect: 'none',
                    padding: '8px 12px'
                  }}
                >
                  ‹‹ Prev.
                </span>
                
                {/* Page Numbers */}
                {(() => {
                  const totalPages = Math.ceil(filteredUsers.length / pageSize);
                  const pages = [];
                  
                  // Logic để hiển thị pages như trong ảnh
                  if (totalPages <= 7) {
                    // Nếu ít hơn hoặc bằng 7 trang, hiển thị tất cả
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Luôn hiển thị trang 1
                    pages.push(1);
                    
                    if (currentPage <= 4) {
                      // Hiển thị 1,2,3,4,5,6,7,...,last
                      for (let i = 2; i <= 7; i++) {
                        pages.push(i);
                      }
                      pages.push('...');
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      // Hiển thị 1,...,last-6,last-5,last-4,last-3,last-2,last-1,last
                      pages.push('...');
                      for (let i = totalPages - 6; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Hiển thị 1,...,current-1,current,current+1,...,last
                      pages.push('...');
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                        pages.push(i);
                      }
                      pages.push('...');
                      pages.push(totalPages);
                    }
                  }
                  
                  return pages.map((page, index) => {
                    if (page === '...') {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          style={{
                            padding: '8px 12px',
                            color: '#999',
                            fontSize: '14px'
                          }}
                        >
                          ...
                        </span>
                      );
                    }
                    
                    const isActive = page === currentPage;
                    const totalPages = Math.ceil(filteredUsers.length / pageSize);
                    const isClickable = totalPages > 1;
                    
                    return (
                      <span
                        key={page}
                        onClick={() => isClickable && setCurrentPage(page as number)}
                        style={{
                          display: 'inline-block',
                          minWidth: '32px',
                          height: '32px',
                          lineHeight: '30px',
                          textAlign: 'center',
                          fontSize: '14px',
                          cursor: isClickable ? 'pointer' : 'default',
                          border: '1px solid #d9d9d9',
                          borderRadius: '2px',
                          margin: '0 2px',
                          backgroundColor: isActive ? '#1890ff' : '#fff',
                          color: isActive ? '#fff' : '#262626',
                          fontWeight: isActive ? '500' : '400',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive && isClickable) {
                            e.currentTarget.style.borderColor = '#1890ff';
                            e.currentTarget.style.color = '#1890ff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive && isClickable) {
                            e.currentTarget.style.borderColor = '#d9d9d9';
                            e.currentTarget.style.color = '#262626';
                          }
                        }}
                      >
                        {page}
                      </span>
                    );
                  });
                })()}
                
                {/* Next Button */}
                <span 
                  onClick={() => {
                    const totalPages = Math.ceil(filteredUsers.length / pageSize);
                    if (currentPage < totalPages && totalPages > 1) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  style={{ 
                    color: (currentPage < Math.ceil(filteredUsers.length / pageSize) && Math.ceil(filteredUsers.length / pageSize) > 1) ? '#999' : '#ccc',
                    fontSize: '14px',
                    cursor: (currentPage < Math.ceil(filteredUsers.length / pageSize) && Math.ceil(filteredUsers.length / pageSize) > 1) ? 'pointer' : 'not-allowed',
                    userSelect: 'none',
                    padding: '8px 12px'
                  }}
                >
                  Next ››
                </span>
              </div>
            )}
          </div>
        </Card>

        <Modal
          title="Thêm người dùng mới"
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={900}
          okText="Tạo và gửi email"
          cancelText="Hủy"
          style={{ top: 20 }}
        >
          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Email không hợp lệ!' }
                  ]}
                >
                  <Input 
                    placeholder="Nhập địa chỉ email" 
                    prefix={<MailOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="fullName"
                  label="Họ tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                >
                  <Input 
                    placeholder="Nhập họ tên đầy đủ" 
                    prefix={<UserOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="role"
              label="Vai trò"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
            >
              <Select placeholder="Chọn vai trò" onChange={handleRoleChange}>
                <Option value="manager">Quản lý</Option>
                <Option value="doctor">Bác sĩ</Option>
                <Option value="staff">Nhân viên</Option>
                <Option value="customer">Khách hàng</Option>
              </Select>
            </Form.Item>

            {renderRoleSpecificFields()}
            
            <div style={{ 
              marginTop: 16, 
              padding: 12, 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: 6 
            }}>
              <Text style={{ color: '#52c41a', fontSize: '13px' }}>
                {selectedUserRole === 'doctor' 
                  ? 'Thông tin đăng nhập sẽ được tạo tự động và hiển thị sau khi tạo thành công'
                  : 'Mật khẩu sẽ được tự động tạo và gửi qua email cho người dùng'
                }
              </Text>
            </div>
          </Form>
        </Modal>

        <Modal
          title="Chỉnh sửa vai trò người dùng"
          open={isEditRoleModalVisible}
          onOk={handleUpdateRole}
          onCancel={handleEditRoleModalCancel}
          width={500}
          okText="Cập nhật"
          cancelText="Hủy"
        >
          <Form
            form={editRoleForm}
            layout="vertical"
            style={{ marginTop: 16 }}
          >
            {selectedUserForEdit && (
              <div style={{ 
                marginBottom: 16, 
                padding: 12, 
                backgroundColor: '#f5f5f5', 
                borderRadius: 8 
              }}>
                <Text strong>Người dùng: </Text>
                <Text>{selectedUserForEdit.fullName}</Text>
                <br />
                <Text strong>Email: </Text>
                <Text>{selectedUserForEdit.email}</Text>
              </div>
            )}

            <Form.Item
              name="currentRole"
              label="Vai trò hiện tại"
            >
              <Select disabled>
                <Option value="admin">Quản trị viên</Option>
                <Option value="manager">Quản lý</Option>
                <Option value="doctor">Bác sĩ</Option>
                <Option value="staff">Nhân viên</Option>
                <Option value="customer">Khách hàng</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="newRole"
              label="Vai trò mới"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò mới!' }]}
            >
              <Select placeholder="Chọn vai trò mới">
                <Option value="manager">Quản lý</Option>
                <Option value="doctor">Bác sĩ</Option>
                <Option value="staff">Nhân viên</Option>
                <Option value="customer">Khách hàng</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </App>
  );
};

export default UserManagement;