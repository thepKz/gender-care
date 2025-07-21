import { CalendarOutlined, EditOutlined, FileTextOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, Modal, notification, Select, Spin, Tooltip, Tabs, Descriptions, List, Tag } from 'antd';
import axios from 'axios';
import axiosInstance from '../../api/axiosConfig';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import medicalApi from '../../api/endpoints/medical';
import userProfileApi from '../../api/endpoints/userProfileApi';
import { useAuth } from '../../hooks/useAuth';
import { MedicalRecord, UserProfile } from '../../types';

interface TestResult {
  date: string;
  testType: string;
  result: string;
}

const ViewProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [medicalLoading, setMedicalLoading] = useState(false);
  const [completedAppointments, setCompletedAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();

  const [showMedicalRecordTabs, setShowMedicalRecordTabs] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<any | null>(null);

  // 1. State quản lý dữ liệu xét nghiệm
  const [testCategories, setTestCategories] = useState<any[]>([]);
  const [serviceTestCategories, setServiceTestCategories] = useState<any[]>([]);
  const [testResultItems, setTestResultItems] = useState<any[]>([]);
  const [loadingTestResult, setLoadingTestResult] = useState(false);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Lấy thông tin hồ sơ
  const fetchProfileData = async () => {
    if (!profileId) {
      console.error('Lỗi', 'Không tìm thấy ID hồ sơ');
      navigate('/profile');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // First, get user's profiles to check if this profile belongs to them
      const userProfiles = await userProfileApi.getMyProfiles();
      const profileExists = userProfiles.find(p => p._id === profileId);
      
      if (!profileExists) {
        setError('Bạn không có quyền truy cập hồ sơ này');
        console.error('Không có quyền truy cập', 'Bạn chỉ có thể xem các hồ sơ thuộc về tài khoản của mình');
        return;
      }

      setProfile(profileExists);
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      
      let errorMessage = 'Không thể tải thông tin hồ sơ.';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          errorMessage = 'Bạn không có quyền truy cập hồ sơ này';
        } else if (error.response?.status === 404) {
          errorMessage = 'Không tìm thấy hồ sơ này';
        } else if (error.response) {
          errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        } else {
          errorMessage = 'Lỗi khi gửi yêu cầu: ' + error.message;
        }
      } else {
        errorMessage = 'Lỗi không xác định: ' + String(error);
      }
      
      setError(errorMessage);
      console.error('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch medical records cho profile
  const fetchMedicalRecords = async () => {
    if (!profileId) return;
    try {
      setMedicalLoading(true);
      const response = await medicalApi.getMedicalRecordsByProfile(profileId, 1, 50);
      // Đảm bảo luôn setMedicalRecords đúng logic
      if (response.data?.data && Array.isArray(response.data.data)) {
        setMedicalRecords(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setMedicalRecords(response.data);
      } else if (response && Array.isArray(response)) {
        setMedicalRecords(response);
      } else {
        setMedicalRecords([]);
      }
    } catch (error: unknown) {
      setMedicalRecords([]);
    } finally {
      setMedicalLoading(false);
    }
  };

  // Hàm lấy danh sách lịch hẹn completed theo profileId
  const fetchCompletedAppointments = async () => {
    if (!profileId) return;
    try {
      setAppointmentsLoading(true);
      const response = await axios.get(`/api/appointments?profileId=${profileId}&status=completed`);
      if (response.data?.success) {
        setCompletedAppointments(response.data.data.appointments || []);
      } else {
        setCompletedAppointments([]);
      }
    } catch (error) {
      setCompletedAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // Lấy thông tin hồ sơ
  useEffect(() => {
    fetchProfileData();
  }, [profileId]); // Removed navigate dependency to prevent duplicate calls

  // Fetch medical records khi profile được load
  useEffect(() => {
    if (profile) {
      fetchMedicalRecords();
    }
  }, [profile]);

  // Fetch completed appointments khi profile được load
  useEffect(() => {
    if (profile) {
      fetchCompletedAppointments();
    }
  }, [profile]);

  // Hiển thị biểu tượng giới tính
  const renderGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return '👨';
      case 'female':
        return '👩';
      default:
        return '❓';
    }
  };

  // Hiển thị nhãn giới tính
  const renderGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      default:
        return 'Khác';
    }
  };

  // Hàm mở modal chỉnh sửa
  const handleEditClick = () => {
    if (profile) {
      form.setFieldsValue({
        fullName: profile.fullName,
        gender: profile.gender,
        phone: profile.phone,
        year: profile.year ? dayjs(profile.year) : null
      });
      setEditModalVisible(true);
    }
  };

  // Hàm lưu thông tin chỉnh sửa
  const handleEditSave = async (values: {
    fullName: string;
    gender: 'male' | 'female' | 'other';
    phone?: string;
    year?: dayjs.Dayjs;
  }) => {
    if (!profile) return;
    
    try {
      setEditLoading(true);
      
      const updateData = {
        id: profile._id,
        fullName: values.fullName,
        gender: values.gender,
        phone: values.phone,
        year: values.year ? values.year.format('YYYY-MM-DD') : null
      };

      const updatedProfile = await userProfileApi.updateProfile(profile._id, updateData);
      setProfile(updatedProfile);
      setEditModalVisible(false);
      
      notification.success({
        message: 'Cập nhật thành công',
        description: 'Thông tin hồ sơ đã được cập nhật'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật thông tin';
      notification.error({
        message: 'Cập nhật thất bại',
        description: errorMessage
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Separate effect for finding medical record when appointment is selected
  useEffect(() => {
    if (!showMedicalRecordTabs || !selectedAppointment) {
      setSelectedMedicalRecord(null);
      return;
    }

    if (medicalRecords.length === 0) {
      return; // Don't clear, might be loading
    }

    const selectedAppointmentId = selectedAppointment._id;
    
    const record = medicalRecords.find(r => {
      if (!r.appointmentId) {
        return false;
      }
      
      const appId: any = r.appointmentId;
      const recordAppointmentId = typeof appId === 'object' ? appId._id : appId;
      
      return recordAppointmentId === selectedAppointmentId;
    });
    
    setSelectedMedicalRecord(record || null);
    
  }, [showMedicalRecordTabs, selectedAppointment, medicalRecords]);

  // 2. Hàm fetch test categories
  const fetchTestCategories = async () => {
    try {
      const res = await axiosInstance.get('/test-categories');
      const data = res.data;
      if (data && Array.isArray(data.data)) setTestCategories(data.data);
    } catch {}
  };

  // 3. Hàm fetch service test categories theo serviceId hoặc packageId
  const fetchServiceTestCategoriesForAppointment = async (apt: any) => {
    // Hàm phụ fetch cho serviceId lẻ
    const fetchServiceTestCategories = async (serviceId: string) => {
      try {
        const res = await axiosInstance.get(`/service-test-categories?serviceId=${serviceId}`);
        const data = res.data;
        if (data && Array.isArray(data.data)) setServiceTestCategories(data.data);
      } catch {
        setServiceTestCategories([]);
      }
    };
    if (apt.packageId?._id || apt.packageId?.id) {
      // Nếu là package, lấy tất cả serviceId trong package
      try {
        const pkgId = apt.packageId._id || apt.packageId.id;
        const pkgRes = await axiosInstance.get(`/service-packages/${pkgId}`);
        const services = pkgRes.data?.data?.services || [];
        let allCats: any[] = [];
        for (const s of services) {
          const sid = typeof s.serviceId === 'object' ? s.serviceId._id : s.serviceId;
          if (!sid) continue;
          const res = await axiosInstance.get(`/service-test-categories?serviceId=${sid}`);
          if (Array.isArray(res.data?.data)) allCats = allCats.concat(res.data.data);
        }
        setServiceTestCategories(allCats);
      } catch {
        setServiceTestCategories([]);
      }
    } else if (apt.serviceId) {
      // Nếu là dịch vụ lẻ
      fetchServiceTestCategories(apt.serviceId);
    }
  };

  // Hàm fetch testResultItems trực tiếp theo appointmentId
  const fetchTestResultItemsByAppointment = async (appointmentId: string) => {
    setLoadingTestResult(true);
    try {
      // Đoán endpoint: /api/test-result-items/appointment/:appointmentId
      const res = await axiosInstance.get(`/test-result-items/appointment/${appointmentId}`);
      const data = res.data;
      let items = [];
      if (data && data.data && Array.isArray(data.data.items)) {
        items = data.data.items;
      } else if (data && data.data && Array.isArray(data.data)) {
        // Nếu trả về mảng testResultItems, lấy items của phần tử đầu tiên
        items = data.data[0]?.items || [];
      }
      setTestResultItems(items);
    } catch {
      setTestResultItems([]);
    } finally {
      setLoadingTestResult(false);
    }
  };

  // Sửa useEffect khi mở modal:
  useEffect(() => {
    if (showMedicalRecordTabs && selectedAppointment) {
      if (testCategories.length === 0) fetchTestCategories();
      fetchServiceTestCategoriesForAppointment(selectedAppointment);
      // Gọi fetchTestResultItemsByAppointment thay vì fetchTestResultByAppointment
      if (selectedAppointment._id) fetchTestResultItemsByAppointment(selectedAppointment._id);
    } else {
      setTestResultItems([]);
    }
    // eslint-disable-next-line
  }, [showMedicalRecordTabs, selectedAppointment]);

  // Hàm lấy màu theo flag giống TestResultsEntryStaff
  const getFlagColor = (flag: string) => {
    if (flag === 'very_low' || flag === 'high' || flag === 'critical') return '#ff4d4f';
    return undefined; // Không set màu cho low, normal, mild_high
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#0C3C54]/20 border-t-[#0C3C54] rounded-full animate-spin"></div>
        <span className="ml-4 text-[#0C3C54] font-semibold text-lg">Đang tải thông tin hồ sơ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Lỗi:</strong>
          <span className="block sm:inline">{error}</span>
          <button 
            type="button"
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={fetchProfileData}
          >
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697l2.652 3.03 2.651-3.03a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </button>
        </div>
        <div className="text-center mt-4">
          <button 
            type="button"
            onClick={() => navigate('/user-profiles')}
            className="rounded-lg bg-[#0C3C54] hover:bg-[#0C3C54]/90 border-none px-4 py-2 text-white"
          >
            Quay lại danh sách hồ sơ
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Lỗi:</strong>
          <span className="block sm:inline">Không tìm thấy thông tin hồ sơ</span>
        </div>
        <div className="text-center mt-4">
          <button 
            type="button"
            onClick={() => navigate('/user-profiles')}
            className="rounded-lg bg-[#0C3C54] hover:bg-[#0C3C54]/90 border-none px-4 py-2 text-white"
          >
            Quay lại danh sách hồ sơ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-8"> {/* Thêm padding-top để tránh header che khuất */}
      <div className="container mx-auto px-2 md:px-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >


          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cột trái: Avatar, tên, badge, ngày tạo */}
            <div className="rounded-2xl shadow-lg p-8 bg-white flex flex-col items-center justify-start gap-4">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 ${profile.gender === 'male' ? 'border-[#0C3C54]' : profile.gender === 'female' ? 'border-[#a78bfa]' : 'border-[#fde68a]'} bg-[#f8fafc] shadow-lg`}>
                <span className="text-5xl">{renderGenderIcon(profile.gender)}</span>
              </div>
              <div className="text-2xl font-bold text-[#0C3C54] mt-2">{profile.fullName}</div>
              <span className={`px-4 py-1 rounded-lg text-white text-base font-semibold mb-2 ${profile.gender === 'male' ? 'bg-[#0C3C54]' : profile.gender === 'female' ? 'bg-[#a78bfa]' : 'bg-[#fde68a] text-[#0C3C54]'}`}>{renderGenderLabel(profile.gender)}</span>
              <div className="text-sm text-gray-500 mt-2">Ngày tạo: <span className="font-semibold text-[#0C3C54]">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</span></div>
            </div>
            {/* Cột phải: Thông tin chung, bệnh án, xét nghiệm */}
            <div className="md:col-span-2 flex flex-col gap-8">
              {/* Thông tin chung */}
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#0C3C54]">Thông tin chung</h2>
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />}
                    onClick={handleEditClick}
                    className="bg-[#0C3C54] hover:bg-[#0C3C54]/90"
                  >
                    Chỉnh sửa
                  </Button>
                </div>
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <tbody>
                    <tr className="bg-[#f8fafc]">
                      <td className="py-2 px-4 font-semibold text-[#0C3C54]">Họ và tên</td>
                      <td className="py-2 px-4">{profile.fullName}</td>
                      <td className="py-2 px-4 font-semibold text-[#0C3C54]">Giới tính</td>
                      <td className="py-2 px-4">{renderGenderLabel(profile.gender)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-semibold text-[#0C3C54]">Số điện thoại</td>
                      <td className="py-2 px-4">{profile.phone || 'Chưa cập nhật'}</td>
                      <td className="py-2 px-4 font-semibold text-[#0C3C54]">Ngày sinh</td>
                      <td className="py-2 px-4">{profile.year ? new Date(profile.year).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Thông tin bệnh án */}
              <div>
                <div className="flex items-center justify-between mb-4 mt-8">
                  <h2 className="text-xl font-bold text-[#0C3C54]">Thông tin bệnh án</h2>
                  <div className="flex items-center gap-2">
                    {appointmentsLoading && <Spin size="small" />}
                    <Button
                      type="primary"
                      className="bg-[#0C3C54] hover:bg-[#0C3C54]/90"
                      icon={<FileTextOutlined />}
                      onClick={() => setShowMedicalRecordTabs(true)}
                    >
                      Xem thông tin bệnh án
                    </Button>
                  </div>
                </div>
                
                {medicalLoading ? (
                  <div className="text-center py-8">
                    <Spin size="large" />
                    <p className="text-gray-500 mt-2">Đang tải hồ sơ bệnh án...</p>
                  </div>
                ) : completedAppointments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedAppointments.map((apt, idx) => (
                      <motion.div
                        key={apt._id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card 
                          className="bg-[#f8fafc] border-l-4 border-l-[#0C3C54] hover:shadow-md transition-shadow"
                          styles={{ body: { padding: '16px' } }}
                        >
                          <div className="flex items-center gap-2 mb-3 justify-between">
                            <div className="flex items-center gap-2">
                              <CalendarOutlined className="text-[#0C3C54]" />
                              <span className="text-[#0C3C54] text-lg font-bold">
                                {dayjs(apt.appointmentDate).format('DD/MM/YYYY')}
                              </span>
                            </div>
                            <Tooltip title="Xem thông tin bệnh án">
                              <Button
                                type="text"
                                icon={<FileTextOutlined style={{ fontSize: 20, color: '#0C3C54' }} />}
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setShowMedicalRecordTabs(true);
                                }}
                                disabled={medicalLoading}
                              />
                            </Tooltip>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <FileTextOutlined className="text-red-500 mt-1 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-[#0C3C54]">Dịch vụ:</span>
                                <p className="text-gray-700 mt-1">{apt.packageId?.name || apt.serviceId?.serviceName || 'N/A'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <UserOutlined className="text-blue-500" />
                              <span className="font-semibold text-[#0C3C54]">Bác sĩ:</span>
                              <span className="text-gray-700">
                                {apt.doctorInfo?.fullName || 'Chưa chỉ định bác sĩ'}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Chưa có hồ sơ bệnh án</h3>
                    <p className="text-gray-500">
                      Hồ sơ bệnh án sẽ được tạo sau khi bạn thực hiện khám bệnh và bác sĩ hoàn thành chẩn đoán.
                    </p>
                  </Card>
                )}
              </div>
              {/* Tóm tắt thống kê */}
              <div className="mt-8">
                <h2 className="text-xl font-bold text-[#0C3C54] mb-4">Tổng quan sức khỏe</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="text-center">
                    <div className="text-2xl text-blue-500 mb-2">📋</div>
                    <div className="text-2xl font-bold text-[#0C3C54]">{medicalRecords.length}</div>
                    <div className="text-gray-600">Lần khám bệnh</div>
                  </Card>
                  
                  <Card className="text-center">
                    <div className="text-2xl text-green-500 mb-2">👨‍⚕️</div>
                    <div className="text-2xl font-bold text-[#0C3C54]">
                      {new Set(medicalRecords.map(r => r.doctorId).filter(Boolean)).size}
                    </div>
                    <div className="text-gray-600">Bác sĩ đã thăm khám</div>
                  </Card>
                  
                  <Card className="text-center">
                    <div className="text-2xl text-orange-500 mb-2">💊</div>
                    <div className="text-2xl font-bold text-[#0C3C54]">0</div>
                    <div className="text-gray-600">Loại thuốc đã kê</div>
                  </Card>
                </div>
                
                {medicalRecords.length > 0 && (
                  <Card className="mt-4">
                    <div className="text-center">
                      <div className="text-2xl text-blue-500 mb-2">📅</div>
                      <div className="text-sm text-gray-600">Lần khám gần nhất</div>
                      <div className="text-lg font-bold text-[#0C3C54]">
                        {new Date(medicalRecords[0]?.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {medicalRecords[0]?.diagnosis || 'Không có thông tin chẩn đoán'}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modal chỉnh sửa thông tin */}
        <Modal
          title="Chỉnh sửa thông tin cơ bản"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleEditSave}
            className="mt-4"
          >
            <Form.Item
              label="Họ và tên"
              name="fullName"
              rules={[
                { required: true, message: 'Vui lòng nhập họ và tên' },
                { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                { max: 50, message: 'Họ tên không được quá 50 ký tự' }
              ]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>

            <Form.Item
              label="Giới tính"
              name="gender"
              rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
            >
              <Select placeholder="Chọn giới tính">
                <Select.Option value="male">Nam</Select.Option>
                <Select.Option value="female">Nữ</Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại' },
                { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có đúng 10 chữ số' }
              ]}
            >
              <Input placeholder="Nhập số điện thoại" maxLength={10} />
            </Form.Item>

            <Form.Item
              label="Ngày sinh"
              name="year"
              rules={[
                { required: true, message: 'Vui lòng chọn ngày sinh' }
              ]}
            >
              <DatePicker
                placeholder="Chọn ngày sinh"
                format="DD/MM/YYYY"
                className="w-full"
                disabledDate={(current) => {
                  return current && current > dayjs().endOf('day');
                }}
              />
            </Form.Item>

            <div className="flex gap-3 justify-end mt-6">
              <Button onClick={() => setEditModalVisible(false)}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={editLoading}
                className="bg-[#0C3C54] hover:bg-[#0C3C54]/90"
              >
                Lưu thay đổi
              </Button>
            </div>
          </Form>
        </Modal>

        {showMedicalRecordTabs && (
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FileTextOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                    Xem bệnh án
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                    {selectedAppointment?.profileName && `Bệnh nhân: ${selectedAppointment.profileName}`}
                  </div>
                </div>
              </div>
            }
            open={showMedicalRecordTabs}
            onCancel={() => setShowMedicalRecordTabs(false)}
            width={900}
            footer={null}
          >
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: '1',
                  label: 'Hồ sơ bệnh án',
                  children: (
                    <div className="w-full">
                      {selectedMedicalRecord && typeof selectedMedicalRecord === 'object' && Object.keys(selectedMedicalRecord).length > 0 ? (
                        <div className="flex flex-col md:flex-row gap-8 w-full">
                          {/* Cột trái: Thông tin bệnh án */}
                          <div className="flex-1 min-w-[220px] max-w-[380px]">
                            <Descriptions bordered column={1} size="middle">
                              <Descriptions.Item label="Tên bệnh nhân">{profile.fullName}</Descriptions.Item>
                              <Descriptions.Item label="Số điện thoại">{profile.phone || '---'}</Descriptions.Item>
                              <Descriptions.Item label="Bác sĩ">{selectedMedicalRecord.doctorId?.userId?.fullName || '---'}</Descriptions.Item>
                              <Descriptions.Item label="Ngày khám">{selectedMedicalRecord.appointmentId?.appointmentDate ? dayjs(selectedMedicalRecord.appointmentId.appointmentDate).format('DD/MM/YYYY') : '---'}</Descriptions.Item>
                              <Descriptions.Item label="Triệu chứng">{selectedMedicalRecord.symptoms || '---'}</Descriptions.Item>
                              <Descriptions.Item label="Kết luận">{selectedMedicalRecord.conclusion || '---'}</Descriptions.Item>
                              <Descriptions.Item label="Điều trị">{selectedMedicalRecord.treatment || '---'}</Descriptions.Item>
                              <Descriptions.Item label="Ghi chú">{selectedMedicalRecord.notes || '---'}</Descriptions.Item>
                            </Descriptions>
                          </div>
                          {/* Cột phải: Thuốc */}
                          <div className="flex-1 min-w-[220px] max-w-[380px]">
                            <div className="font-semibold text-lg mb-2 text-[#0C3C54]">Thuốc kê đơn</div>
                            {selectedMedicalRecord.medicines && selectedMedicalRecord.medicines.length > 0 ? (
                              <div className="flex flex-col gap-4">
                                {selectedMedicalRecord.medicines.map((med, idx) => {
                                  // Hiển thị thời gian dùng: nếu là số hoặc parse được số thì thêm ' ngày'
                                  let durationStr = '---';
                                  if (med.duration) {
                                    const num = Number(med.duration);
                                    if (!isNaN(num)) {
                                      durationStr = `${num} ngày`;
                                    } else {
                                      durationStr = med.duration;
                                    }
                                  }
                                  return (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-[#f8fafc]">
                                      <div className="font-semibold mb-1">{med.name}</div>
                                      <div className="text-sm mb-1"><b>Liều lượng:</b> {med.dosage || '---'}</div>
                                      <div className="text-sm mb-1"><b>Thời gian dùng:</b> {durationStr}</div>
                                      {med.instructions && <div className="italic text-xs text-gray-900 mt-1">Hướng dẫn: {med.instructions}</div>}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div>Không có thuốc kê đơn</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">Chưa có hồ sơ bệnh án cho lịch này</div>
                      )}
                    </div>
                  )
                },
                {
                  key: '2',
                  label: 'Hồ sơ xét nghiệm',
                  children: (
                    loadingTestResult ? (
                      <div className="text-center py-8"><Spin size="large" /><p className="text-gray-500 mt-2">Đang tải dữ liệu xét nghiệm...</p></div>
                    ) : (
                      <table className="w-full border mt-4">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 border">Tên chỉ số</th>
                            <th className="p-2 border text-center">Kết quả</th>
                            <th className="p-2 border text-center">Chỉ số tham khảo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testResultItems && testResultItems.length > 0 ? (
                            testResultItems.map((item, idx) => {
                              // Lấy tên chỉ số
                              const cat = testCategories.find(c => c._id === (item.testCategoryId?._id || item.testCategoryId));
                              // Lấy chỉ số tham khảo
                              const ref = serviceTestCategories.find(s => (s.testCategoryId?._id || s.testCategoryId) === (item.testCategoryId?._id || item.testCategoryId));
                              let refStr = '';
                              if (ref) {
                                if (ref.minValue !== undefined && ref.maxValue !== undefined) {
                                  refStr = `${ref.minValue} - ${ref.maxValue}${ref.unit ? ' ' + ref.unit : ''}`;
                                } else if (ref.unit) {
                                  refStr = ref.unit;
                                }
                              }
                              return (
                                <tr key={idx}>
                                  <td className="p-2 border">{cat?.name || '---'}</td>
                                  <td className="p-2 border text-center" style={['very_low','high','critical'].includes(item.flag) ? {color: '#111', fontWeight: 700, textDecoration: 'underline'} : {color: '#111'}}>{item.value || '---'}</td>
                                  <td className="p-2 border text-center">{refStr || '---'}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr><td colSpan={3} className="text-center p-2">Không có dữ liệu</td></tr>
                          )}
                        </tbody>
                      </table>
                    )
                  )
                }
              ]}
            />
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ViewProfilePage; 