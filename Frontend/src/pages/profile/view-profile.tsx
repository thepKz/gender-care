import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import userProfileApi from '../../api/endpoints/userProfileApi';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile } from '../../types';

interface MedicalRecord {
  date: string;
  diagnosis: string;
  treatment: string;
  doctor: string;
}

interface TestResult {
  date: string;
  testType: string;
  result: string;
}

// Dữ liệu mẫu cho bệnh án
const sampleMedicalRecords: MedicalRecord[] = [
  {
    date: '2023-10-15',
    diagnosis: 'Viêm họng cấp',
    treatment: 'Kháng sinh, nghỉ ngơi, uống nhiều nước',
    doctor: 'BS. Nguyễn Văn A'
  },
  {
    date: '2023-08-20',
    diagnosis: 'Cảm cúm mùa',
    treatment: 'Paracetamol, vitamin C',
    doctor: 'BS. Trần Thị B'
  }
];

// Dữ liệu mẫu cho kết quả xét nghiệm
const sampleTestResults: TestResult[] = [
  {
    date: '2023-10-14',
    testType: 'Xét nghiệm máu',
    result: 'Bạch cầu tăng nhẹ'
  },
  {
    date: '2023-08-19',
    testType: 'Chụp X-quang phổi',
    result: 'Bình thường, không phát hiện bất thường'
  }
];

const ViewProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('1');
  const [error, setError] = useState<string | null>(null);

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

  // Lấy thông tin hồ sơ
  useEffect(() => {
    fetchProfileData();
  }, [profileId]); // Removed navigate dependency to prevent duplicate calls

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

  const breadcrumbRoutes = [
    { path: '/user-profiles', breadcrumbName: 'Hồ sơ bệnh án' }
  ];

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
    <div className="container mx-auto px-2 py-8 md:px-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="mb-6 flex items-center text-sm text-[#0C3C54]/80 gap-2">
          {breadcrumbRoutes.map((route, idx) => (
            <span key={route.path || route.breadcrumbName} className="flex items-center gap-1">
              {idx > 0 && <span className="mx-1">/</span>}
              {route.path ? (
                <Link to={route.path} className="hover:underline hover:text-[#0C3C54]">{route.breadcrumbName}</Link>
              ) : (
                <span>{route.breadcrumbName}</span>
              )}
            </span>
          ))}
          <span className="mx-1">/</span>
          <span className="font-semibold text-[#0C3C54]">Chi tiết hồ sơ</span>
        </nav>

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
              <h2 className="text-xl font-bold text-[#0C3C54] mb-4">Thông tin chung</h2>
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
              <h2 className="text-xl font-bold text-[#0C3C54] mb-4 mt-8">Thông tin bệnh án</h2>
              {sampleMedicalRecords.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sampleMedicalRecords.map((record, index) => (
                    <div key={index} className="bg-[#f8fafc] rounded-xl shadow p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#0C3C54] text-lg font-bold">{new Date(record.date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div><span className="font-semibold text-[#0C3C54]">Chẩn đoán:</span> {record.diagnosis}</div>
                      <div><span className="font-semibold text-[#0C3C54]">Điều trị:</span> {record.treatment}</div>
                      <div><span className="font-semibold text-[#0C3C54]">Bác sĩ:</span> {record.doctor}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Chưa có thông tin bệnh án</p>
              )}
            </div>
            {/* Kết quả xét nghiệm */}
            <div>
              <h2 className="text-xl font-bold text-[#0C3C54] mb-4 mt-8">Kết quả xét nghiệm</h2>
              {sampleTestResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sampleTestResults.map((test, index) => (
                    <div key={index} className="bg-[#f8fafc] rounded-xl shadow p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 text-lg font-bold">{new Date(test.date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div><span className="font-semibold text-[#0C3C54]">Loại xét nghiệm:</span> {test.testType}</div>
                      <div><span className="font-semibold text-[#0C3C54]">Kết quả:</span> {test.result}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Chưa có kết quả xét nghiệm</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ViewProfilePage; 