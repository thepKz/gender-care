import { ArrowLeftOutlined, CalendarOutlined, ExportOutlined, SaveOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, DatePicker, message, Select, Spin, Tooltip, Typography, notification, Card } from 'antd';

import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import userProfileApi from '../../api/endpoints/userProfileApi';
import menstrualCycleApi from '../../api/endpoints/menstrualCycle';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile, MenstrualCycle, CycleDay } from '../../types';

const { Title, Text } = Typography;
const NUM_DAYS = 31;

const MenstrualTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentCycle, setCurrentCycle] = useState<MenstrualCycle | null>(null);
  
  // Dữ liệu chu kỳ
  const [month, setMonth] = useState(dayjs());
  const [cycleDays, setCycleDays] = useState<CycleDay[]>([]);
  const [editingCell, setEditingCell] = useState<{ row: 'mucus' | 'feeling'; col: number } | null>(null);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Lấy thông tin hồ sơ và chu kỳ
  useEffect(() => {
    if (profileId) {
      fetchData();
    }
  }, [profileId, month]);

  const fetchData = async () => {
    if (!profileId) {
      message.error('Không tìm thấy ID hồ sơ');
      navigate('/profile/health-profiles');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      

      // Kiểm tra và xử lý nhiều cấu trúc dữ liệu có thể có
      let profileData;
      const responseWithData = response as { data?: { data?: UserProfile } | UserProfile };
      if (responseWithData?.data && typeof responseWithData.data === 'object' && 'data' in responseWithData.data) {
        profileData = responseWithData.data.data;
      } else if (responseWithData?.data) {
        profileData = responseWithData.data;
      } else {
        profileData = response as UserProfile;
      }

      
      if (!profileData) {
        setError('Không tìm thấy thông tin hồ sơ');
        return;
      }

      if (profileData.gender !== 'female') {
        message.error('Tính năng này chỉ khả dụng cho hồ sơ giới tính nữ');
        navigate(`/profile/view-profile/${profileId}`);
        return;
      }

      setProfile(profileData);

      // Lấy chu kỳ hiện tại
      await fetchCurrentCycle();
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Không thể tải thông tin hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentCycle = async () => {
    try {
      const response = await menstrualCycleApi.getCycles({ limit: 1 });
      const responseData = (response as any)?.data;
      const cyclesData = responseData?.data?.cycles || responseData?.data?.data || responseData?.data || [];
      
      if (cyclesData.length > 0) {
        const cycle = cyclesData.find((c: MenstrualCycle) => !c.isCompleted) || cyclesData[0];
        setCurrentCycle(cycle);
        
        // Lấy dữ liệu ngày trong chu kỳ
        if (cycle) {
          await fetchCycleDays(cycle._id);
        }
      } else {
        // Tạo chu kỳ mới nếu chưa có
        await createNewCycle();
      }
    } catch (error) {
      console.error('Error fetching cycles:', error);
      await createNewCycle();
    }
  };

  const createNewCycle = async () => {
    try {
      const response = await menstrualCycleApi.createCycle({
        startDate: dayjs().format('YYYY-MM-DD')
      });
      
      const responseData = (response as any)?.data;
      if (responseData?.success || responseData?._id) {
        setCurrentCycle(responseData?.data || responseData);
        notification.success({
          message: 'Đã tạo chu kỳ mới',
          description: 'Bắt đầu theo dõi chu kỳ kinh nguyệt'
        });
      }
    } catch (error) {
      console.error('Error creating new cycle:', error);
    }
  };


  const fetchCycleDays = async (cycleId: string) => {
    try {
      const response = await menstrualCycleApi.getCycleDays(cycleId);
      const responseData = (response as any)?.data;
      if (responseData?.success || Array.isArray(responseData?.data)) {
        setCycleDays(responseData?.data || responseData || []);
      }
    } catch (error) {
      console.error('Error fetching cycle days:', error);
      setCycleDays([]);
    }
  };

  // Lấy dữ liệu ngày theo index (1-31)
  const getDayData = (dayIndex: number) => {
    const targetDate = month.date(dayIndex + 1);
    return cycleDays.find(day => dayjs(day.date).isSame(targetDate, 'day'));
  };

  // Xử lý khi chọn giá trị cho một ô
  const handleSelect = async (row: 'mucus' | 'feeling', dayIdx: number, value: string) => {
    if (!currentCycle) {
      message.error('Chưa có chu kỳ để ghi nhận dữ liệu');
      return;
    }

    const targetDate = month.date(dayIdx + 1);
    const existingDay = getDayData(dayIdx);

    try {
      // Validate nếu có đủ cả mucus và feeling
      const newMucus = row === 'mucus' ? value : existingDay?.mucusObservation;
      const newFeeling = row === 'feeling' ? value : existingDay?.feeling;

      if (newMucus && newFeeling) {
        const validationResponse = await menstrualCycleApi.validateDayInput({
          mucusObservation: newMucus,
          feeling: newFeeling
        });

        const validationData = (validationResponse as any)?.data;
        if (validationData?.success && !validationData.data?.isValid) {
          notification.warning({
            message: 'Cảnh báo validation',
            description: validationData.data?.warning || 'Sự kết hợp này không phù hợp theo phương pháp Billings'
          });
        }

        // Auto-generate nếu là ngày đỉnh
        if (validationData?.data?.isPeakDay) {
          try {
            await menstrualCycleApi.generatePostPeakDays({
              cycleId: currentCycle._id,
              peakDate: targetDate.format('YYYY-MM-DD')
            });
            
            notification.success({
              message: 'Đã tự động tạo ngày sau đỉnh',
              description: 'Hệ thống đã tự động tạo 3 ngày sau ngày X'
            });
          } catch (error) {
            console.error('Error generating post-peak days:', error);
          }
        }
      }

      // Lưu dữ liệu
      const cycleData = {
        cycleId: currentCycle._id,
        date: targetDate.format('YYYY-MM-DD'),
        mucusObservation: newMucus,
        feeling: newFeeling,
        notes: existingDay?.notes || ''
      };

      const response = await menstrualCycleApi.createOrUpdateCycleDay(cycleData);
      const responseData = (response as any)?.data;
      
      if (responseData?.success || responseData?._id) {
        // Refresh data
        await fetchCycleDays(currentCycle._id);
        message.success('Đã lưu dữ liệu thành công');
      }
      
    } catch (error) {
      console.error('Error saving cycle day:', error);
      message.error('Không thể lưu dữ liệu');
    }

    setEditingCell(null);
  };

  // Render cell
  const renderCell = (row: 'mucus' | 'feeling', dayIdx: number) => {
    const dayData = getDayData(dayIdx);
    const value = row === 'mucus' ? dayData?.mucusObservation : dayData?.feeling;
    
    const isEditing = editingCell && editingCell.row === row && editingCell.col === dayIdx;
    
    if (isEditing) {
      const options = row === 'mucus' ? menstrualCycleApi.MUCUS_OPTIONS : menstrualCycleApi.FEELING_OPTIONS;
      
      return (
        <Select
          autoFocus
          value={value || undefined}
          onChange={v => handleSelect(row, dayIdx, v)}
          onBlur={() => setEditingCell(null)}
          options={options.map(opt => ({ value: opt.value, label: opt.label }))}
          style={{ width: 120 }}
          placeholder="Chọn"
          size="small"
          open
        />
      );
    }

    if (value) {
      const options = row === 'mucus' ? menstrualCycleApi.MUCUS_OPTIONS : menstrualCycleApi.FEELING_OPTIONS;
      const option = options.find(opt => opt.value === value);
      
      return (
        <Tooltip title={option?.label}>
          <div 
            className="cursor-pointer font-medium"
            onClick={() => setEditingCell({ row, col: dayIdx })}
            style={{ 
              color: value === 'trong và âm hộ căng' ? '#ff6b35' : '#333',
              backgroundColor: dayData?.isPeakDay ? '#fff3cd' : 'transparent',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            {option?.label || value}
            {dayData?.isPeakDay && ' ⭐'}
          </div>
        </Tooltip>
      );
    }

    return (
      <div
        className="cursor-pointer text-gray-400 text-center hover:bg-gray-50"
        onClick={() => setEditingCell({ row, col: dayIdx })}
        style={{ minHeight: 32, padding: '4px' }}
      >
        Chọn
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-2 text-gray-600">Đang tải thông tin...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <Title level={4} className="text-red-500">{error || 'Không tìm thấy thông tin hồ sơ'}</Title>
          <Button 
            type="primary"
            onClick={() => navigate('/profile/health-profiles')}
            className="mt-4"
          >
            Quay lại danh sách hồ sơ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Breadcrumb 
          className="mb-6"
          items={[
            { title: <Link to="/profile">Tài khoản</Link> },
            { title: <Link to="/profile/health-profiles">Hồ sơ sức khỏe</Link> },
            { title: <Link to={`/profile/view-profile/${profileId}`}>Chi tiết hồ sơ</Link> },
            { title: "Quản lý chu kỳ kinh nguyệt" }
          ]}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!text-[#0C3C54] !m-0 flex items-center">
              <CalendarOutlined className="mr-2" /> 
              Quản lý chu kỳ kinh nguyệt - Phương pháp Billings
            </Title>
            <Text className="text-gray-500 mt-2 block">
              {profile.fullName} - Chu kỳ {currentCycle?.cycleNumber || 'mới'}
            </Text>
          </div>
          <div className="flex gap-3">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(`/profile/view-profile/${profileId}`)}
            >
              Quay lại
            </Button>
            <Button 
              icon={<SaveOutlined />}
              onClick={() => navigate('/cycle')}
              className="bg-[#0C3C54] text-white hover:bg-[#1a5570]"
            >
              Xem calendar
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-600">{currentCycle?.cycleNumber || 0}</div>
            <div className="text-gray-600">Chu kỳ hiện tại</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">{cycleDays.length}</div>
            <div className="text-gray-600">Ngày đã ghi nhận</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {cycleDays.filter(d => d.isPeakDay).length}
            </div>
            <div className="text-gray-600">Ngày đỉnh (X)</div>
          </Card>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <DatePicker.MonthPicker
            value={month}
            onChange={(date) => date && setMonth(date)}
            format="MM/YYYY"
            placeholder="Chọn tháng"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-max border border-gray-300 bg-white">
              <thead>
                <tr>
                  <th className="border px-2 py-1 bg-gray-100 text-center w-32">Trường/Ngày</th>
                  {Array.from({ length: NUM_DAYS }, (_, i) => (
                    <th key={i} className="border px-2 py-1 text-center min-w-[80px]">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1 font-semibold bg-gray-50">Quan sát chất nhờn</td>
                  {Array.from({ length: NUM_DAYS }, (_, idx) => (
                    <td key={idx} className="border px-1 py-1">
                      {renderCell('mucus', idx)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-2 py-1 font-semibold bg-gray-50">Cảm giác</td>
                  {Array.from({ length: NUM_DAYS }, (_, idx) => (
                    <td key={idx} className="border px-1 py-1">
                      {renderCell('feeling', idx)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-3">Chú thích phương pháp Billings:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Quan sát chất nhờn:</h4>
              <div className="space-y-1 text-sm">
                {menstrualCycleApi.MUCUS_OPTIONS.map(option => (
                  <div key={option.value} className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-gray-200 rounded"></span>
                    <span>{option.label}</span>
                    {option.value === 'trong và âm hộ căng' && <span className="text-orange-600 font-bold">⭐ Ngày X</span>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cảm giác:</h4>
              <div className="space-y-1 text-sm">
                {menstrualCycleApi.FEELING_OPTIONS.map(option => (
                  <div key={option.value} className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-gray-300 rounded"></span>
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm text-amber-800">
              <strong>Quy tắc validation:</strong> Hệ thống sẽ cảnh báo nếu kết hợp quan sát + cảm giác không phù hợp theo phương pháp Billings.
              Ngày X được tự động phát hiện khi chọn "Trong và âm hộ căng" + "Trơn".
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MenstrualTrackerPage; 