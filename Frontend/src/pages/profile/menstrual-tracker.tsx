import React, { useState, useEffect } from 'react';
import { Select, DatePicker, Button, Tooltip, message, Spin, Breadcrumb, Typography, Tabs } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, BarChartOutlined, ExportOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
// import * as XLSX from 'xlsx';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import userProfileApi from '../../api/endpoints/userProfileApi';
import menstrualCycleApi from '../../api/endpoints/menstrualCycle';
import { UserProfile } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const NUM_DAYS = 31;

// Mapping tem: icon, màu, text, ý nghĩa
const TEM_MAP: Record<string, { icon: string; color: string; text: string; desc: string }> = {
  red_rectangle: {
    icon: '🟥',
    color: '#e53935',
    text: 'Kinh nguyệt',
    desc: 'Ngày có kinh',
  },
  red_rectangle_dots: {
    icon: '🟥⋯',
    color: '#e57373',
    text: 'Kinh ít',
    desc: 'Kinh ít/ra lấm tấm',
  },
  blue_rectangle: {
    icon: '🟦',
    color: '#1976d2',
    text: 'Khô',
    desc: 'Ngày khô',
  },
  baby: {
    icon: '👶',
    color: '#ffd600',
    text: 'Thụ thai',
    desc: 'Có thể thụ thai',
  },
  baby_x: {
    icon: '👶❌',
    color: '#1976d2',
    text: 'Đỉnh',
    desc: 'Ngày thụ thai đỉnh',
  },
  baby_yellow_1: {
    icon: '👶1️⃣',
    color: '#ffd600',
    text: 'Ngày 1',
    desc: 'Ngày đầu sau đỉnh có thể thụ thai',
  },
  baby_blue_2: {
    icon: '👶2️⃣',
    color: '#1976d2',
    text: 'Ngày 2',
    desc: 'Ngày thứ 2 sau đỉnh có thể thụ thai',
  },
  baby_blue_3: {
    icon: '👶3️⃣',
    color: '#1976d2',
    text: 'Ngày 3',
    desc: 'Ngày thứ 3 sau đỉnh có thể thụ thai',
  },
};

const TEM_OPTIONS = Object.entries(TEM_MAP).map(([value, { icon, color, text, desc }]) => ({
  value,
  label: (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ color }}>{text}</span>
    </div>
  ),
  desc,
}));

const SENSATION_OPTIONS: { value: string; label: string }[] = [
  { value: 'wet', label: 'Ướt' },
  { value: 'dry', label: 'Khô' },
  { value: 'sticky', label: 'Dính' },
  { value: 'moist', label: 'Ẩm' },
  { value: 'slippery', label: 'Trơn' },
];

const MUCUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'blood', label: 'Có máu' },
  { value: 'spotting', label: 'Lấm tấm máu' },
  { value: 'cloudy', label: 'Đục' },
  { value: 'cloudy_stretchy', label: 'Đục có sợi' },
  { value: 'clear_stretchy', label: 'Trong và căng' },
  { value: 'little', label: 'Ít chất tiết' },
];

const MenstrualTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('1');
  const [error, setError] = useState<string | null>(null);
  
  // Dữ liệu chu kỳ
  const [month, setMonth] = useState(dayjs());
  const [tem, setTem] = useState<string[]>(Array(NUM_DAYS).fill(''));
  const [sensation, setSensation] = useState<string[]>(Array(NUM_DAYS).fill(''));
  const [mucus, setMucus] = useState<string[]>(Array(NUM_DAYS).fill(''));
  const [editingCell, setEditingCell] = useState<{ row: 'tem' | 'sensation' | 'mucus'; col: number } | null>(null);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Lấy thông tin hồ sơ
  const fetchProfileData = async () => {
    if (!profileId) {
      message.error('Không tìm thấy ID hồ sơ');
      navigate('/profile/health-profiles');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await userProfileApi.getProfileById(profileId);
      
      // Kiểm tra và xử lý nhiều cấu trúc dữ liệu có thể có
      let profileData;
      if ((response as any)?.data?.data) {
        profileData = (response as any).data.data;
      } else if ((response as any)?.data) {
        profileData = (response as any).data;
      } else {
        profileData = response;
      }
      
      if (!profileData) {
        setError('Không tìm thấy thông tin hồ sơ');
        message.error('Không tìm thấy thông tin hồ sơ');
        return;
      }

      // Kiểm tra nếu hồ sơ không phải là nữ
      if (profileData.gender !== 'female') {
        message.error('Tính năng này chỉ khả dụng cho hồ sơ giới tính nữ');
        navigate(`/profile/view-profile/${profileId}`);
        return;
      }

      setProfile(profileData);
      
      // TODO: Lấy dữ liệu chu kỳ kinh nguyệt từ API
      // fetchCycleData();
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Không thể tải thông tin hồ sơ.');
      message.error('Không thể tải thông tin hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin hồ sơ
  useEffect(() => {
    fetchProfileData();
  }, [profileId, navigate]);

  // Xử lý khi chọn giá trị cho một ô
  const handleSelect = (row: 'tem' | 'sensation' | 'mucus', dayIdx: number, value: string) => {
    if (row === 'tem') {
      if (value === 'baby_x') {
        // Đếm số lượng baby_x, không tính ô hiện tại
        const count = tem.filter((v, i) => v === 'baby_x' && i !== dayIdx).length;
        const isSameCell = tem[dayIdx] === 'baby_x';
        if (count >= 2 && !isSameCell) {
          message.warning('Chỉ được chọn tối đa 2 ngày đỉnh (em bé có dấu X) trong 1 tháng!');
          setEditingCell(null);
          return;
        }
        setTem(prev => {
          const newArr = [...prev];
          newArr[dayIdx] = 'baby_x';
          // Auto-fill 3 ô tiếp theo, nhưng không ghi đè nếu đã là baby_x
          if (dayIdx + 1 < NUM_DAYS && newArr[dayIdx + 1] !== 'baby_x') newArr[dayIdx + 1] = 'baby_yellow_1';
          if (dayIdx + 2 < NUM_DAYS && newArr[dayIdx + 2] !== 'baby_x') newArr[dayIdx + 2] = 'baby_blue_2';
          if (dayIdx + 3 < NUM_DAYS && newArr[dayIdx + 3] !== 'baby_x') newArr[dayIdx + 3] = 'baby_blue_3';
          return newArr;
        });
      } else if (value === 'baby_yellow_1') {
        setTem(prev => {
          const newArr = [...prev];
          newArr[dayIdx] = 'baby_yellow_1';
          if (dayIdx + 1 < NUM_DAYS && newArr[dayIdx + 1] !== 'baby_x') newArr[dayIdx + 1] = 'baby_blue_2';
          if (dayIdx + 2 < NUM_DAYS && newArr[dayIdx + 2] !== 'baby_x') newArr[dayIdx + 2] = 'baby_blue_3';
          return newArr;
        });
      } else {
        setTem(prev => prev.map((v, i) => (i === dayIdx ? value : v)));
      }
    } else if (row === 'sensation') {
      setSensation(prev => prev.map((v, i) => (i === dayIdx ? value : v)));
    } else {
      setMucus(prev => prev.map((v, i) => (i === dayIdx ? value : v)));
    }
    setEditingCell(null);
  };

  // Xử lý thay đổi tháng
  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setMonth(date);
      // TODO: Lấy dữ liệu của tháng mới từ API
      // Hiện tại reset dữ liệu
      setTem(Array(NUM_DAYS).fill(''));
      setSensation(Array(NUM_DAYS).fill(''));
      setMucus(Array(NUM_DAYS).fill(''));
      setEditingCell(null);
    }
  };

  // Xuất dữ liệu ra Excel
  const exportToExcel = () => {
    // TODO: Install xlsx package first: npm install xlsx @types/xlsx
    message.info('Tính năng xuất Excel sẽ được cập nhật sau!');
    /*
    const wsData = [
      ['Trường/Ngày', ...Array.from({ length: NUM_DAYS }, (_, i) => i + 1)],
      ['Tem', ...tem.map(v => (v ? TEM_MAP[v]?.text : ''))],
      ['Cảm giác', ...sensation.map(v => {
        const option = SENSATION_OPTIONS.find(opt => opt.value === v);
        return option ? option.label : '';
      })],
      ['Quan sát chất nhờn', ...mucus.map(v => {
        const option = MUCUS_OPTIONS.find(opt => opt.value === v);
        return option ? option.label : '';
      })],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ChuKy');
    XLSX.writeFile(wb, `ChuKy_${profile?.fullName || 'HoSo'}_${month.format('YYYY_MM')}.xlsx`);
    message.success('Đã xuất dữ liệu thành công!');
    */
  };

  // Render cell: nếu đang chỉnh sửa thì hiện Select, không thì chỉ hiện icon+text+tooltip
  const renderCell = (row: 'tem' | 'sensation' | 'mucus', idx: number, value: string) => {
    const isEditing = editingCell && editingCell.row === row && editingCell.col === idx;
    if (isEditing) {
      if (row === 'tem') {
        return (
          <Select
            autoFocus
            value={value || undefined}
            onChange={v => handleSelect(row, idx, v)}
            onBlur={() => setEditingCell(null)}
            options={TEM_OPTIONS}
            style={{ width: 120 }}
            placeholder="Chọn"
            size="small"
            open
          />
        );
      } else if (row === 'sensation') {
        return (
          <Select
            autoFocus
            value={value || undefined}
            onChange={v => handleSelect(row, idx, v)}
            onBlur={() => setEditingCell(null)}
            options={SENSATION_OPTIONS}
            style={{ width: 120 }}
            placeholder="Chọn"
            size="small"
            open
          />
        );
      } else {
        return (
          <Select
            autoFocus
            value={value || undefined}
            onChange={v => handleSelect(row, idx, v)}
            onBlur={() => setEditingCell(null)}
            options={MUCUS_OPTIONS}
            style={{ width: 120 }}
            placeholder="Chọn"
            size="small"
            open
          />
        );
      }
    }
    if (row === 'tem' && value) {
      const t = TEM_MAP[value];
      return (
        <Tooltip title={t.desc}>
          <div
            className="cursor-pointer flex items-center gap-1"
            style={{ color: t.color, fontWeight: 500 }}
            onClick={() => setEditingCell({ row, col: idx })}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span>{t.text}</span>
          </div>
        </Tooltip>
      );
    }
    if (row === 'sensation' && value) {
      const opt = SENSATION_OPTIONS.find(o => o.value === value);
      return (
        <Tooltip title={opt?.label}>
          <div className="cursor-pointer" onClick={() => setEditingCell({ row, col: idx })}>
            {opt?.label}
          </div>
        </Tooltip>
      );
    }
    if (row === 'mucus' && value) {
      const opt = MUCUS_OPTIONS.find(o => o.value === value);
      return (
        <Tooltip title={opt?.label}>
          <div className="cursor-pointer" onClick={() => setEditingCell({ row, col: idx })}>
            {opt?.label}
          </div>
        </Tooltip>
      );
    }
    return (
      <div
        className="cursor-pointer text-gray-400 text-center"
        onClick={() => setEditingCell({ row, col: idx })}
        style={{ minHeight: 32 }}
      >
        Chọn
      </div>
    );
  };

  // Lưu dữ liệu chu kỳ
  const saveCycleData = async () => {
    try {
      // TODO: Gửi dữ liệu lên API
      message.success('Đã lưu dữ liệu thành công!');
    } catch (error) {
      console.error('Error saving cycle data:', error);
      message.error('Không thể lưu dữ liệu. Vui lòng thử lại sau.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex justify-center items-center min-h-[60vh]">
        <Spin size="large" tip="Đang tải thông tin..." />
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
            {
              title: <Link to="/profile">Tài khoản</Link>
            },
            {
              title: <Link to="/profile/health-profiles">Hồ sơ sức khỏe</Link>
            },
            {
              title: <Link to={`/profile/view-profile/${profileId}`}>Chi tiết hồ sơ</Link>
            },
            {
              title: "Quản lý chu kỳ kinh nguyệt"
            }
          ]}
        />

        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!text-[#0C3C54] !m-0 flex items-center">
              <CalendarOutlined className="mr-2" /> 
              Quản lý chu kỳ kinh nguyệt
            </Title>
            <Text className="text-gray-500 mt-2 block">
              Theo dõi chu kỳ kinh nguyệt theo phương pháp Billings - {profile.fullName}
            </Text>
          </div>
          <div className="flex gap-3">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(`/profile/view-profile/${profileId}`)}
              className="flex items-center"
            >
              Quay lại
            </Button>
            <Button 
              type="primary"
              icon={<ExportOutlined />}
              onClick={exportToExcel}
              className="flex items-center bg-[#0C3C54] hover:bg-[#1a5570] border-none"
            >
              Xuất Excel
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div className="flex items-center gap-2">
            <DatePicker.MonthPicker
              value={month}
              onChange={handleMonthChange}
              format="MM/YYYY"
              placeholder="Chọn tháng"
            />
            <Button 
              type="primary" 
              onClick={saveCycleData}
              className="bg-[#0C3C54] hover:bg-[#1a5570] border-none"
            >
              Lưu dữ liệu
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-max border border-gray-300 bg-white">
              <thead>
                <tr>
                  <th className="border px-2 py-1 bg-gray-100 text-center w-32">Trường/Ngày</th>
                  {Array.from({ length: NUM_DAYS }, (_, i) => (
                    <th key={i} className="border px-2 py-1 text-center">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1 font-semibold bg-gray-50">Tem</td>
                  {tem.map((value, idx) => (
                    <td key={idx} className="border px-1 py-1">
                      {renderCell('tem', idx, value)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-2 py-1 font-semibold bg-gray-50">Cảm giác</td>
                  {sensation.map((value, idx) => (
                    <td key={idx} className="border px-1 py-1">
                      {renderCell('sensation', idx, value)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-2 py-1 font-semibold bg-gray-50">Quan sát chất nhờn</td>
                  {mucus.map((value, idx) => (
                    <td key={idx} className="border px-1 py-1">
                      {renderCell('mucus', idx, value)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-3">Chú thích:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(TEM_MAP).map(([key, { icon, color, text, desc }]) => (
              <div
                key={key}
                className="flex flex-col items-center p-4 rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200"
                style={{ background: `${color}10` }}
              >
                <div
                  className="mb-2 flex items-center justify-center"
                  style={{ fontSize: 36, color }}
                >
                  {icon}
                </div>
                <div className="font-bold text-base mb-1" style={{ color }}>{text}</div>
                <div className="text-xs text-gray-600 text-center" style={{ minHeight: 32 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8">
            <div>
              <h4 className="font-medium mb-2">Cảm giác:</h4>
              <div className="flex flex-wrap gap-2">
                {SENSATION_OPTIONS.map(option => (
                  <span
                    key={option.value}
                    className="px-4 py-2 rounded-full bg-blue-50 text-blue-800 font-semibold text-base shadow-sm border border-blue-100"
                  >
                    {option.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quan sát chất nhờn:</h4>
              <div className="flex flex-wrap gap-2">
                {MUCUS_OPTIONS.map(option => (
                  <span
                    key={option.value}
                    className="px-4 py-2 rounded-full bg-green-50 text-green-800 font-semibold text-base shadow-sm border border-green-100"
                  >
                    {option.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MenstrualTrackerPage; 