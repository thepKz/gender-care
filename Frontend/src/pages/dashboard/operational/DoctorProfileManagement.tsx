import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Button,
  Form,
  Input,
  InputNumber,
  Upload,
  message,
  Statistic,
  Tag,
  Space,
  Divider,
  Spin,
  Rate,
  Modal,
  Select
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CameraOutlined,
  StarOutlined,
  MessageOutlined,
  BookOutlined,
  LockOutlined,
  KeyOutlined,
  UploadOutlined,
  PhoneOutlined,
  PlusOutlined,
  DeleteOutlined,
  BankOutlined,
  MedicineBoxOutlined,
  CarryOutOutlined,
  MailOutlined
} from '@ant-design/icons';
import { doctorApi, type Doctor, type UpdateDoctorRequest } from '../../../api/endpoints/doctorApi';
import authApi from '../../../api/endpoints/auth';
import useAuth from '../../../hooks/useAuth';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface DoctorProfileData extends Doctor {
  feedback?: {
    totalFeedbacks: number;
    averageRating: number;
    message: string;
    feedbacks: Array<{
      _id: string;
      rating: number;
      feedback: string;
      comment?: string;
      createdAt: string;
    }>;
  };
  status?: {
    isActive: boolean;
    statusText: string;
    message: string;
  };
  approvalStatus?: {
    bio: 'approved' | 'pending' | 'rejected';
    specialization: 'approved' | 'pending' | 'rejected';
    education: 'approved' | 'pending' | 'rejected';
    certificate: 'approved' | 'pending' | 'rejected';
    lastUpdated: string;
  };
}

const DoctorProfileManagement: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [basicForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  
  // States
  const [doctorData, setDoctorData] = useState<DoctorProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [basicEditing, setBasicEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [certificateImages, setCertificateImages] = useState<string[]>([]);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const [experiences, setExperiences] = useState<Array<{
    startYear: number;
    endYear: number | null;
    workplace: string;
    position: string;
  }>>([]);
  
  // Email verification states
  const [emailVerificationModalVisible, setEmailVerificationModalVisible] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Load doctor profile data
  const loadDoctorProfile = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      console.log('📊 Loading doctor profile for user:', user._id);
      
      // Try to find existing doctor profile using public API
      try {
        // First try to get all doctors (public endpoint)
        const allDoctorsResponse = await doctorApi.getAllDoctors();
        const currentDoctor = allDoctorsResponse.find(
          (doctor: Doctor) => doctor.userId._id === user._id
        );
        
        if (currentDoctor) {
          console.log('✅ Found existing doctor profile:', currentDoctor);
          
          // Try to get feedback data (public endpoint)
          try {
            const feedbackResponse = await doctorApi.getFeedbacks(currentDoctor._id);
            setDoctorData({
              ...currentDoctor,
              feedback: feedbackResponse.data,
              status: {
                isActive: true,
                statusText: 'Đang hoạt động',
                message: 'Đang hoạt động bình thường'
              },
              approvalStatus: {
                bio: 'approved',
                specialization: 'approved', 
                education: 'pending',
                certificate: 'approved',
                lastUpdated: new Date().toISOString()
              }
            });
                     } catch (feedbackError) {
             console.log('⚠️ Could not load feedback data:', feedbackError);
             // If feedback fails, use basic doctor data
            setDoctorData({
              ...currentDoctor,
              feedback: {
                totalFeedbacks: 0,
                averageRating: 0,
                message: 'Chưa có đánh giá',
                feedbacks: []
              },
              status: {
                isActive: true,
                statusText: 'Đang hoạt động',
                message: 'Đang hoạt động bình thường'
              },
              approvalStatus: {
                bio: 'approved',
                specialization: 'approved', 
                education: 'pending',
                certificate: 'approved',
                lastUpdated: new Date().toISOString()
              }
            });
          }
          
          setImageUrl(currentDoctor.image || currentDoctor.userId?.avatar || '');
          
          // Parse certificate images if stored as JSON string
          let certImages: string[] = [];
          if (currentDoctor.certificate) {
            try {
              // Try to parse as JSON array of image URLs
              certImages = JSON.parse(currentDoctor.certificate);
              if (!Array.isArray(certImages)) {
                certImages = [];
              }
            } catch {
              // If not JSON, treat as single text entry
              certImages = [];
            }
          }
          setCertificateImages(certImages);
          
          // Set form values
          form.setFieldsValue({
            bio: currentDoctor.bio || '',
            experience: currentDoctor.experience || 0,
            specialization: currentDoctor.specialization || '',
            education: currentDoctor.education || '',
            certificate: currentDoctor.certificate || ''
          });

          // Set basic form values
          basicForm.setFieldsValue({
            fullName: currentDoctor.userId?.fullName || '',
            email: currentDoctor.userId?.email || '',
            phone: currentDoctor.userId?.phone || '',
            gender: currentDoctor.userId?.gender || 'male'
          });
          
        } else {
          // No doctor profile found, create basic structure
          console.log('⚠️ No doctor profile found, creating basic structure');
          
          const basicDoctorData: DoctorProfileData = {
            _id: user._id, // Use user ID as temp doctor ID
            userId: {
              _id: user._id,
              fullName: user.fullName || 'Bác sĩ',
              email: user.email || '',
              avatar: user.avatar,
              phone: user.phone,
              role: user.role,
              isActive: true,
            },
            bio: '',
            experience: 0,
            specialization: '',
            education: '',
            certificate: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            feedback: {
              totalFeedbacks: 0,
              averageRating: 0,
              message: 'Chưa có đánh giá',
              feedbacks: []
            },
            status: {
              isActive: true,
              statusText: 'Chưa có hồ sơ',
              message: 'Vui lòng cập nhật thông tin hồ sơ'
            }
          };
          
          setDoctorData(basicDoctorData);
          setImageUrl(user.avatar || '');
          
          // Set basic form for new profile
          basicForm.setFieldsValue({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            gender: user.gender || 'male'
          });
          
          // Only show message once for new profile
          if (!sessionStorage.getItem('doctor-profile-message-shown')) {
            message.info('Chưa có hồ sơ bác sĩ. Vui lòng cập nhật thông tin của bạn.');
            sessionStorage.setItem('doctor-profile-message-shown', 'true');
          }
        }
        
      } catch (apiError) {
        console.error('❌ Error loading doctor profile from API:', apiError);
        
        // Complete fallback - create basic profile from user info
        const fallbackDoctorData: DoctorProfileData = {
          _id: user._id,
          userId: {
            _id: user._id,
            fullName: user.fullName || 'Bác sĩ',
            email: user.email || '',
            avatar: user.avatar,
            phone: user.phone,
            role: user.role,
            isActive: true,
          },
          bio: '',
          experience: 0,
          specialization: '',
          education: '',
          certificate: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          feedback: {
            totalFeedbacks: 0,
            averageRating: 0,
            message: 'Chưa có đánh giá',
            feedbacks: []
          },
          status: {
            isActive: true,
            statusText: 'Offline',
            message: 'Không thể kết nối đến server'
          }
        };
        
        setDoctorData(fallbackDoctorData);
        setImageUrl(user.avatar || '');
        
        // Set basic form for fallback
        basicForm.setFieldsValue({
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          gender: user.gender || 'male'
        });
        
        // Only show warning message once
        if (!sessionStorage.getItem('server-error-message-shown')) {
          message.warning('Không thể tải thông tin từ server. Đang sử dụng dữ liệu cơ bản.');
          sessionStorage.setItem('server-error-message-shown', 'true');
        }
      }
      
    } catch (error) {
      console.error('❌ Critical error loading doctor profile:', error);
      message.error('Không thể tải thông tin bác sĩ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorProfile();
  }, [user]);

  // Handle form submit
  const handleUpdateProfile = async (values: {
    bio: string;
    experience: number;
    specialization: string;
    education: string;
    certificate: string;
  }) => {
    try {
      setLoading(true);
      
      const updateData = {
        bio: values.bio,
        specialization: values.specialization,
        education: values.education,
        certificate: Array.isArray(certificateImages) ? certificateImages.join(', ') : certificateImages,
        experience: values.experience,
        // Include image if it was uploaded
        ...(imageUrl !== doctorData.image && { image: imageUrl })
      };

      console.log('🔄 Updating doctor profile:', updateData);
      
      // Use new updateMyProfile API
      const response = await doctorApi.updateMyProfile(updateData);
      
      message.success({
        content: (
          <div>
            <strong>🕐 Đã gửi yêu cầu thay đổi thành công!</strong>
            <br />
            <span style={{fontSize: '12px', color: '#666'}}>
              Thông tin sẽ được cập nhật sau khi manager duyệt
            </span>
          </div>
        ),
        duration: 5
      });
      
      
      // Exit edit mode and refresh data
      setEditing(false);
      loadDoctorProfile();
      
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi gửi yêu cầu thay đổi';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      message.error({
        content: errorMessage,
        duration: 4
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      console.log('📸 Uploading doctor image...');
      
      const response = await doctorApi.uploadImage(formData);
      
      if (response.success && response.data.imageUrl) {
        setImageUrl(response.data.imageUrl);
        message.success('Tải ảnh lên thành công!');
        console.log('✅ Image uploaded:', response.data.imageUrl);
      } else {
        throw new Error('Upload response invalid');
      }
      
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      message.error('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      message.success('Đổi mật khẩu thành công!');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error: unknown) {
      console.error('❌ Error changing password:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      message.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle basic info update
  const handleBasicInfoUpdate = async (values: {
    fullName: string;
    phone: string;
    gender: string;
    email?: string;
  }) => {
    console.log('📝 Form values received:', values);
    console.log('👤 Current doctor data:', doctorData?.userId);
    
    // Check if email is changed
    if (values.email && values.email !== doctorData?.userId.email) {
      console.log('📧 Email changed, showing verification modal');
      setPendingEmail(values.email);
      setEmailVerificationModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Updating basic info:', values);
      
      // Update user profile
      const updateData = {
        fullName: values.fullName,
        phone: values.phone,
        gender: values.gender as 'male' | 'female' | 'other'
      };
      console.log('📤 Sending update data:', updateData);
      
      const response = await authApi.updateProfile(updateData);
      console.log('✅ Update response:', response);
      
      message.success('Cập nhật thông tin cá nhân thành công!');
      setBasicEditing(false);
      
      // Reload profile to reflect changes
      await loadDoctorProfile();
      
    } catch (error: unknown) {
      console.error('❌ Error updating basic profile:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
      }
      
      // Check if it's an API error
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        console.error('❌ API Error details:', apiError.response?.data);
        message.error(`Lỗi: ${apiError.response?.data?.message || 'Không thể cập nhật thông tin'}`);
      } else {
        message.error('Không thể cập nhật thông tin cá nhân. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle send OTP for email verification
  const handleSendOtp = async () => {
    console.log('🔄 Sending OTP to new email:', pendingEmail);
    
    if (!pendingEmail) {
      message.error('Không có email để gửi OTP!');
      return;
    }

    setOtpSending(true);
    try {
      console.log('📤 Calling sendOtpForNewEmail API with email:', pendingEmail);
      const response = await authApi.sendOtpForNewEmail(pendingEmail);
      console.log('✅ OTP sent successfully:', response);
      
      setOtpSent(true);
      message.success('Mã OTP đã được gửi đến email mới!');
    } catch (error: unknown) {
      console.error('❌ Error sending OTP:', error);
      
      // Type guard for axios error
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
        console.error('❌ Error details:', {
          message: axiosError.message,
          status: axiosError.response?.status,
          data: axiosError.response?.data
        });
        
        const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Có lỗi xảy ra khi gửi mã OTP!';
        message.error(errorMessage);
      } else {
        message.error('Có lỗi xảy ra khi gửi mã OTP!');
      }
    } finally {
      setOtpSending(false);
    }
  };

  // Handle verify OTP and update email
  const handleVerifyOtpAndUpdateEmail = async () => {
    if (!otpCode || otpCode.length !== 6) {
      message.error('Vui lòng nhập mã OTP 6 chữ số!');
      return;
    }

    setOtpVerifying(true);
    try {
      console.log('🔄 Verifying OTP for new email:', pendingEmail, 'OTP:', otpCode);
      
      // Verify OTP for new email
      await authApi.verifyNewEmailOtp(pendingEmail, otpCode);
      console.log('✅ OTP verified successfully');
      
      // Update user profile with new email
      console.log('🔄 Updating profile with new email...');
      await authApi.updateProfile({
        email: pendingEmail
      });
      console.log('✅ Profile updated successfully');

      message.success('Cập nhật email thành công!');
      setEmailVerificationModalVisible(false);
      setOtpCode('');
      setOtpSent(false);
      setPendingEmail('');
      setBasicEditing(false);
      
      // Reload data
      await loadDoctorProfile();
    } catch (error: unknown) {
      console.error('❌ Error verifying OTP:', error);
      
      // Type guard for axios error
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
        const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!';
        message.error(errorMessage);
      } else {
        message.error('Mã OTP không hợp lệ hoặc đã hết hạn!');
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  // Handle certificate image upload
  const handleCertificateUpload = async (file: File) => {
    setCertificateUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      console.log('📄 Uploading certificate image...');
      
      const response = await doctorApi.uploadImage(formData);
      
      if (response.success && response.data.imageUrl) {
        const newImageUrl = response.data.imageUrl;
        setCertificateImages(prev => [...prev, newImageUrl]);
        message.success('Tải ảnh chứng chỉ lên thành công!');
        console.log('✅ Certificate image uploaded:', newImageUrl);
      } else {
        throw new Error('Upload response invalid');
      }
      
    } catch (error) {
      console.error('❌ Error uploading certificate image:', error);
      message.error('Không thể tải ảnh chứng chỉ lên. Vui lòng thử lại.');
    } finally {
      setCertificateUploading(false);
    }
  };

  // Remove certificate image
  const removeCertificateImage = (imageUrl: string) => {
    setCertificateImages(prev => prev.filter(img => img !== imageUrl));
    message.success('Đã xóa ảnh chứng chỉ');
  };

  // Handle experiences
  const addExperience = () => {
    setExperiences(prev => [...prev, {
      startYear: new Date().getFullYear(),
      endYear: null,
      workplace: '',
      position: ''
    }]);
  };

  const removeExperience = (index: number) => {
    setExperiences(prev => prev.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: string, value: string | number | null) => {
    setExperiences(prev => prev.map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    ));
  };

  // Render approval status badge
  const renderApprovalBadge = (status: 'approved' | 'pending' | 'rejected') => {
    const config = {
      approved: { color: 'green', text: 'Đã duyệt' },
      pending: { color: 'orange', text: 'Đang chờ duyệt' },
      rejected: { color: 'red', text: 'Bị từ chối' }
    };
    
    return (
      <Tag color={config[status].color} style={{ marginLeft: '8px' }}>
        {config[status].text}
      </Tag>
    );
  };

  // Custom upload component
  const uploadProps = {
    beforeUpload: (file: File) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('Chỉ có thể tải lên file JPG/PNG!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Ảnh phải nhỏ hơn 2MB!');
        return false;
      }
      
      handleImageUpload(file);
      return false; // Prevent default upload
    },
    showUploadList: false,
  };

  if (loading && !doctorData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Đang tải thông tin...</Text>
        </div>
      </div>
    );
  }

  if (!doctorData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="secondary">Không tìm thấy thông tin bác sĩ</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>Thông Tin Cá Nhân</Title>
          <Text type="secondary">Quản lý và cập nhật thông tin hồ sơ bác sĩ</Text>
        </Col>
        <Col>
          <Button 
            icon={<LockOutlined />}
            onClick={() => setPasswordModalVisible(true)}
          >
            Đổi mật khẩu
          </Button>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Left Column - Profile Info */}
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={120}
                  src={imageUrl}
                  icon={<UserOutlined />}
                  style={{ marginBottom: '16px' }}
                />
                <Upload {...uploadProps}>
                  <Button
                    shape="circle"
                    icon={uploading ? <Spin size="small" /> : <CameraOutlined />}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      border: '2px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                    loading={uploading}
                    title="Thay đổi ảnh đại diện"
                  />
                </Upload>
              </div>
              
              <Title level={4} style={{ margin: '8px 0 4px 0' }}>
                {doctorData.userId.fullName}
              </Title>
              <Text type="secondary">{doctorData.userId.email}</Text>
              
              <div style={{ marginTop: '16px' }}>
                <Tag 
                  color={doctorData.status?.isActive ? 'green' : 'red'}
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                >
                  {doctorData.status?.statusText || 'Đang hoạt động'}
                </Tag>
              </div>
            </div>

            {/* Quick Stats */}
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Đánh giá"
                  value={doctorData.feedback?.averageRating || 0}
                  precision={1}
                  suffix={<StarOutlined style={{ color: '#faad14' }} />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Phản hồi"
                  value={doctorData.feedback?.totalFeedbacks || 0}
                  suffix={<MessageOutlined />}
                />
              </Col>
            </Row>

            <Divider />


            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>
                <MedicineBoxOutlined style={{ marginRight: '8px' }} />
                Chuyên khoa: {doctorData.specialization || 'Chưa cập nhật'}
              </Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>
                <BookOutlined style={{ marginRight: '8px' }} />
                Học vấn: {doctorData.education ? 
                  (doctorData.education.length > 50 ? 
                    `${doctorData.education.substring(0, 50)}...` : 
                    doctorData.education) : 
                  'Chưa cập nhật'}
              </Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>
                <CarryOutOutlined style={{ marginRight: '8px' }} />
                Kinh nghiệm: {experiences.length > 0 ? 
                  `${experiences.length} vị trí làm việc` : 
                  'Chưa có thông tin'}
              </Text>
            </div>
          </Card>

          {/* Feedback Summary */}
          {doctorData.feedback && doctorData.feedback.totalFeedbacks > 0 && (
            <Card title="Đánh Giá Gần Đây" style={{ marginTop: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <Rate disabled value={doctorData.feedback.averageRating} />
                <Text style={{ marginLeft: '8px' }}>
                  {doctorData.feedback.averageRating.toFixed(1)}/5.0
                </Text>
              </div>
              
              {doctorData.feedback.feedbacks.slice(0, 3).map((feedback, index) => (
                <div key={feedback._id} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                         <Rate disabled value={feedback.rating} />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </div>
                  <Paragraph 
                    style={{ margin: '4px 0 0 0', fontSize: '13px' }}
                    ellipsis={{ rows: 2 }}
                  >
                    {feedback.feedback}
                  </Paragraph>
                  {index < 2 && <Divider style={{ margin: '8px 0' }} />}
                </div>
              ))}
            </Card>
          )}
        </Col>

        {/* Right Column - Editable Profile Details */}
        <Col xs={24} lg={16}>
          {/* Basic Information Card */}
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Thông Tin Cơ Bản</span>
                {!basicEditing ? (
                  <Button 
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setBasicEditing(true)}
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Space>
                    <Button size="small" onClick={() => setBasicEditing(false)}>
                      Hủy
                    </Button>
                    <Button 
                      size="small"
                      type="primary" 
                      icon={<SaveOutlined />}
                      onClick={() => basicForm.submit()}
                      loading={loading}
                    >
                      Lưu
                    </Button>
                  </Space>
                )}
              </div>
            }
            style={{ marginBottom: '16px' }}
          >
            <Form
              form={basicForm}
              layout="vertical"
              onFinish={handleBasicInfoUpdate}
              disabled={!basicEditing}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                    rules={[
                      { required: true, message: 'Vui lòng nhập họ và tên!' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined />}
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email!' },
                      { type: 'email', message: 'Email không hợp lệ!' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />}
                      placeholder="VD: doctor@example.com"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại!' },
                      { pattern: /^0\d{9}$/, message: 'Số điện thoại phải có đúng 10 chữ số!' }
                    ]}
                  >
                    <Input 
                      prefix={<PhoneOutlined />}
                      placeholder="VD: 0123456789"
                      maxLength={10}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Giới tính"
                    name="gender"
                    rules={[
                      { required: true, message: 'Vui lòng chọn giới tính!' }
                    ]}
                  >
                    <Select 
                      placeholder="Chọn giới tính"
                      disabled={!basicEditing}
                    >
                      <Select.Option value="male">Nam</Select.Option>
                      <Select.Option value="female">Nữ</Select.Option>
                      <Select.Option value="other">Khác</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Thông Tin Chi Tiết</span>
                {!editing ? (
                  <Button 
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setEditing(true)}
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Space>
                    <Button size="small" onClick={() => setEditing(false)}>
                      Hủy
                    </Button>
                    <Button 
                      size="small"
                      type="primary" 
                      icon={<SaveOutlined />}
                      onClick={() => form.submit()}
                      loading={loading}
                    >
                      Lưu
                    </Button>
                  </Space>
                )}
              </div>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              disabled={!editing}
            >
                            <Form.Item
                label={
                  <span>
                    Chuyên khoa
                    {doctorData.approvalStatus?.specialization && renderApprovalBadge(doctorData.approvalStatus.specialization)}
                  </span>
                }
                name="specialization"
                rules={[
                  { required: true, message: 'Vui lòng nhập chuyên khoa!' }
                ]}
              >
                <Input placeholder="VD: Tim mạch, Nội tổng hợp..." />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Giới thiệu bản thân
                    {doctorData.approvalStatus?.bio && renderApprovalBadge(doctorData.approvalStatus.bio)}
                  </span>
                }
                name="bio"
                rules={[
                  { required: true, message: 'Vui lòng viết giới thiệu về bản thân!' }
                ]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Viết ngắn gọn về bản thân, kinh nghiệm và phương pháp điều trị..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Học vấn
                    {doctorData.approvalStatus?.education && renderApprovalBadge(doctorData.approvalStatus.education)}
                  </span>
                }
                name="education"
                rules={[
                  { required: true, message: 'Vui lòng nhập thông tin học vấn!' }
                ]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="VD: Bác sĩ Y khoa, Đại học Y Hà Nội (2010-2016)..."
                  showCount
                  maxLength={300}
                />
              </Form.Item>

              {/* Experience Timeline Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    <BankOutlined style={{ marginRight: '8px' }} />
                    Kinh nghiệm làm việc
                  </Text>
                </div>

                {experiences.map((exp, index) => (
                  <Card 
                    key={index}
                    size="small" 
                    style={{ marginBottom: '12px', border: '1px dashed #d9d9d9' }}
                    extra={editing && (
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => removeExperience(index)}
                        size="small"
                      />
                    )}
                  >
                    <Row gutter={12}>
                      <Col xs={24} sm={8}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>Năm bắt đầu</Text>
                          <InputNumber
                            value={exp.startYear}
                            min={1950}
                            max={new Date().getFullYear()}
                            style={{ width: '100%', marginTop: '4px' }}
                            onChange={(value) => updateExperience(index, 'startYear', value || 2020)}
                            disabled={!editing}
                          />
                        </div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>Năm kết thúc</Text>
                          <InputNumber
                            value={exp.endYear}
                            min={exp.startYear}
                            max={new Date().getFullYear()}
                            style={{ width: '100%', marginTop: '4px' }}
                            placeholder="Hiện tại"
                            onChange={(value) => updateExperience(index, 'endYear', value)}
                            disabled={!editing}
                          />
                        </div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>Vị trí</Text>
                          <Input
                            value={exp.position}
                            placeholder="VD: Bác sĩ nội trú"
                            style={{ marginTop: '4px' }}
                            onChange={(e) => updateExperience(index, 'position', e.target.value)}
                            disabled={!editing}
                          />
                        </div>
                      </Col>
                      <Col xs={24}>
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>Nơi làm việc</Text>
                          <Input
                            value={exp.workplace}
                            placeholder="VD: Bệnh viện Bạch Mai"
                            style={{ marginTop: '4px' }}
                            onChange={(e) => updateExperience(index, 'workplace', e.target.value)}
                            disabled={!editing}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}

                {experiences.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px', 
                    border: '2px dashed #d9d9d9', 
                    borderRadius: '6px',
                    color: '#999'
                  }}>
                    <BankOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                    <div>Chưa có thông tin kinh nghiệm làm việc</div>
                    {editing && (
                      <Button 
                        type="dashed" 
                        icon={<PlusOutlined />}
                        onClick={addExperience}
                        style={{ marginTop: '12px' }}
                      >
                        Thêm kinh nghiệm đầu tiên
                      </Button>
                    )}
                  </div>
                )}

                {/* Add experience button when there are existing experiences */}
                {editing && experiences.length > 0 && (
                  <Button 
                    type="dashed" 
                    icon={<PlusOutlined />}
                    onClick={addExperience}
                    style={{ 
                      width: '100%',
                      marginTop: '12px',
                      height: '40px',
                      border: '2px dashed #1890ff',
                      color: '#1890ff'
                    }}
                  >
                    Thêm kinh nghiệm mới
                  </Button>
                )}
              </div>

              <Form.Item
                label={
                  <span>
                    Chứng chỉ & Bằng cấp
                    {doctorData.approvalStatus?.certificate && renderApprovalBadge(doctorData.approvalStatus.certificate)}
                  </span>
                }
                name="certificate"
              >
                <div>
                  {/* Display uploaded certificate images */}
                  {certificateImages.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong>Ảnh chứng chỉ đã tải lên:</Text>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px', 
                        marginTop: '8px' 
                      }}>
                        {certificateImages.map((imageUrl, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img
                              src={imageUrl}
                              alt={`Chứng chỉ ${index + 1}`}
                              style={{
                                width: '120px',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #d9d9d9'
                              }}
                            />
                            {editing && (
                              <Button
                                type="primary"
                                danger
                                size="small"
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  minWidth: '24px',
                                  height: '24px',
                                  padding: '0'
                                }}
                                onClick={() => removeCertificateImage(imageUrl)}
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload button for certificate images - Beautiful design */}
                  <div style={{ 
                    border: '2px dashed #1890ff', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    textAlign: 'center',
                    backgroundColor: '#f8f9ff',
                    marginBottom: '16px',
                    transition: 'all 0.3s ease'
                  }}>
                    <Upload
                      beforeUpload={(file: File) => {
                        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                        if (!isJpgOrPng) {
                          message.error('Chỉ có thể tải lên file JPG/PNG!');
                          return false;
                        }
                        const isLt5M = file.size / 1024 / 1024 < 5;
                        if (!isLt5M) {
                          message.error('Ảnh phải nhỏ hơn 5MB!');
                          return false;
                        }
                        
                        handleCertificateUpload(file);
                        return false;
                      }}
                      showUploadList={false}
                      multiple={false}
                      style={{ width: '100%' }}
                    >
                      <div style={{ cursor: 'pointer' }}>
                        <UploadOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
                        <div style={{ fontSize: '16px', fontWeight: '500', color: '#1890ff', marginBottom: '4px' }}>
                          {certificateUploading ? 'Đang tải lên...' : 'Kéo thả hoặc click để tải ảnh chứng chỉ'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          Hỗ trợ JPG, PNG • Tối đa 5MB
                        </div>
                      </div>
                    </Upload>
                  </div>


                </div>
              </Form.Item>
            </Form>
          </Card>


        </Col>
      </Row>

      {/* Password Change Modal */}
      <Modal
        title={
          <Space>
            <KeyOutlined />
            Đổi mật khẩu
          </Space>
        }
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            label="Mật khẩu hiện tại"
            name="currentPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' }
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setPasswordModalVisible(false);
                passwordForm.resetFields();
              }}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={passwordLoading}
              >
                Đổi mật khẩu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Email Verification Modal */}
      <Modal
        title={
          <Space>
            <MailOutlined />
            Xác thực email mới
          </Space>
        }
        open={emailVerificationModalVisible}
        onCancel={() => {
          setEmailVerificationModalVisible(false);
          setOtpCode('');
          setOtpSent(false);
          setPendingEmail('');
        }}
        footer={null}
        width={450}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Text type="secondary">
            Để thay đổi email từ <strong>{doctorData?.userId.email}</strong> thành <strong>{pendingEmail}</strong>, 
            bạn cần xác thực bằng mã OTP được gửi đến email mới.
          </Text>
        </div>

        {!otpSent ? (
          <div style={{ textAlign: 'center' }}>
            <Text>Email mới: <strong>{pendingEmail}</strong></Text>
            <div style={{ marginTop: '16px' }}>
              <Button 
                type="primary" 
                loading={otpSending}
                onClick={handleSendOtp}
                block
              >
                {otpSending ? 'Đang gửi...' : 'Gửi mã OTP'}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              Mã OTP đã được gửi đến <strong>{pendingEmail}</strong>. Vui lòng kiểm tra email và nhập mã 6 chữ số.
            </Text>
            
            <Input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Nhập mã OTP 6 chữ số"
              maxLength={6}
              style={{ marginBottom: '16px', textAlign: 'center', fontSize: '18px' }}
            />

            <Space style={{ width: '100%' }} direction="vertical">
              <Button 
                type="primary" 
                loading={otpVerifying}
                onClick={handleVerifyOtpAndUpdateEmail}
                disabled={otpCode.length !== 6}
                block
              >
                {otpVerifying ? 'Đang xác thực...' : 'Xác thực và cập nhật email'}
              </Button>
              
              <Button 
                type="link" 
                onClick={handleSendOtp}
                loading={otpSending}
                block
              >
                Gửi lại mã OTP
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorProfileManagement; 