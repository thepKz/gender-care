/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    CalendarOutlined,
    FileTextOutlined,
    HeartOutlined,
    LineChartOutlined,
    PlusOutlined,
    SettingOutlined,
    ReloadOutlined,
    QuestionCircleOutlined,
    BookOutlined
} from '@ant-design/icons';
import {
    Button,
    Calendar,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    Modal,
    notification,
    Row,
    Select,
    Spin,
    Statistic,
    Tag,
    Tooltip,
    Alert,
    Tabs
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import relativeTime from 'dayjs/plugin/relativeTime';
import { motion } from 'framer-motion';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import menstrualCycleApi from '../../api/endpoints/menstrualCycle';
import { 
  MenstrualCycle, 
  CalendarDayData, 
  CreateCycleDayRequest,
  MenstrualCycleReminder
} from '../../types';
import './cycle.css';
import HelpModal from '../../components/ui/HelpModal';
import OnboardingTour from '../../components/ui/OnboardingTour';

dayjs.extend(isBetween);
dayjs.extend(relativeTime);

const { TextArea } = Input;

const CyclePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<MenstrualCycle[]>([]);
  const [currentCycle, setCurrentCycle] = useState<MenstrualCycle | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([]);
  const [reminderSettings, setReminderSettings] = useState<MenstrualCycleReminder | null>(null);
  const [cycleAnalysis, setCycleAnalysis] = useState<any>(null);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [createCycleModalVisible, setCreateCycleModalVisible] = useState(false);
  const [updateStartDateModalVisible, setUpdateStartDateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [createCycleForm] = Form.useForm();
  const [updateStartDateForm] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  // New states for onboarding and help
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [selectedMucus, setSelectedMucus] = useState<string>('');
  const [allowedFeelings, setAllowedFeelings] = useState<string[]>([]);
  const [validationWarning, setValidationWarning] = useState<string>('');
  const [calendarCache, setCalendarCache] = useState<Map<string, any[]>>(new Map());
  const [activeTab, setActiveTab] = useState<'calendar' | 'reports'>('calendar');

  // Debounced calendar change to avoid too many API calls
  const debouncedCalendarChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (date: Dayjs) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          setSelectedDate(date);
          await loadCalendarData(date.month() + 1, date.year());
        }, 300); // 300ms debounce
      };
    })(),
    []
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCycleData(),
        loadCalendarData(selectedDate.month() + 1, selectedDate.year()),
        loadReminderSettings()
      ]);
      
      // Load cycle analysis sau khi có currentCycle
      await loadCycleAnalysis();
      
      // Check if this is first time user
      const hasSeenOnboarding = localStorage.getItem('menstrual_cycle_onboarding_seen');
      if (!hasSeenOnboarding) {
        setIsFirstTimeUser(true);
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error in loadInitialData:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCycleData = async () => {
    try {
      const response = await menstrualCycleApi.getCycles({ limit: 10 });
      const responseData = (response as any)?.data;
      
      if (responseData?.success && responseData.data) {
        const cyclesData = responseData.data.cycles || responseData.data.data || responseData.data || [];
        setCycles(cyclesData);
        
        // Tìm chu kỳ hiện tại (chưa hoàn thành)
        const activeCycle = cyclesData.find((c: MenstrualCycle) => !c.isCompleted);
        setCurrentCycle(activeCycle || null);
        
        // Nếu không có chu kỳ active, tự động tạo mới
        if (!activeCycle && cyclesData.length === 0) {
          await createNewCycleIfNeeded();
        }
      } else {
        // Fallback: tạo chu kỳ mới nếu chưa có
        await createNewCycleIfNeeded();
      }
    } catch (error) {
      console.error('Error loading cycle data:', error);
      // Vẫn thử tạo chu kỳ mới khi lỗi
      await createNewCycleIfNeeded();
    }
  };

  const loadCalendarData = async (month: number, year: number) => {
    const cacheKey = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Check cache first
    if (calendarCache.has(cacheKey)) {
      const cachedData = calendarCache.get(cacheKey)!;
      setCalendarData(cachedData);
      return;
    }
    
    try {
      const response = await menstrualCycleApi.getCalendarData({ month, year });
      const responseData = (response as any)?.data;
      
      if (responseData?.success && responseData?.data?.days) {
        const days = responseData.data.days;
        setCalendarData(days);
        
        // Cache the data for 5 minutes
        const newCache = new Map(calendarCache);
        newCache.set(cacheKey, days);
        setCalendarCache(newCache);
        
        // Auto-clear cache after 5 minutes
        setTimeout(() => {
          setCalendarCache(prev => {
            const updated = new Map(prev);
            updated.delete(cacheKey);
            return updated;
          });
        }, 5 * 60 * 1000);
      } else {
        setCalendarData([]);
      }
    } catch (error) {
      console.error('Load calendar data error:', error);
      setCalendarData([]);
    }
  };

  const loadReminderSettings = async () => {
    try {
      const response = await menstrualCycleApi.getReminderSettings();
      const responseData = (response as any)?.data;
      if (responseData?.success || responseData?._id) {
        setReminderSettings(responseData?.data || responseData);
      }
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  };

  const loadCycleAnalysis = async () => {
    if (!currentCycle) return;
    
    try {
      const response = await menstrualCycleApi.getCycleAnalysis(currentCycle._id);
      const responseData = (response as any)?.data;
      if (responseData?.success) {
        setCycleAnalysis(responseData.data);
      }
    } catch (error) {
      console.error('Error loading cycle analysis:', error);
    }
  };

  const createNewCycleIfNeeded = async () => {
    try {
      const response = await menstrualCycleApi.createCycle({
        startDate: dayjs().format('YYYY-MM-DD')
      });
      
      const responseData = (response as any)?.data;
      
      if (responseData?.success || responseData?._id) {
        const newCycle = responseData?.data || responseData;
        setCurrentCycle(newCycle);
        notification.success({
          message: 'Thành công',
          description: 'Đã tạo chu kỳ mới để bắt đầu theo dõi'
        });
        await loadCycleData();
        await loadCalendarData(selectedDate.month() + 1, selectedDate.year());
        await loadCycleAnalysis();
      } else {
        console.error('Failed to create cycle:', responseData);
        notification.error({
          message: 'Lỗi',
          description: 'Không thể tạo chu kỳ mới. Vui lòng thử lại.'
        });
      }
    } catch (error) {
      console.error('Error creating new cycle:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.'
      });
    }
  };

  const handleManualCreateCycle = async () => {
    // Hiển thị modal để user chọn ngày bắt đầu chu kỳ
    setCreateCycleModalVisible(true);
  };

  const handleCreateCycleWithDate = async (values: { startDate: Dayjs }) => {
    try {
      const response = await menstrualCycleApi.createCycle({
        startDate: values.startDate.format('YYYY-MM-DD')
      });
      
      const responseData = (response as any)?.data;
      
      if (responseData?.success || responseData?._id) {
        const newCycle = responseData?.data || responseData;
        setCurrentCycle(newCycle);
        notification.success({
          message: 'Thành công',
          description: `Đã tạo chu kỳ mới bắt đầu từ ngày ${values.startDate.format('DD/MM/YYYY')}`
        });
        
        setCreateCycleModalVisible(false);
        createCycleForm.resetFields();
        await loadCycleData();
        await loadCalendarData(selectedDate.month() + 1, selectedDate.year());
        await loadCycleAnalysis();
      } else {
        notification.error({
          message: 'Lỗi',
          description: 'Không thể tạo chu kỳ mới. Vui lòng thử lại.'
        });
      }
    } catch (error) {
      console.error('Error creating cycle with date:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.'
      });
    }
  };

  const handleUpdateStartDate = async (values: { newStartDate: Dayjs }) => {
    if (!currentCycle) {
      notification.error({
        message: 'Lỗi',
        description: 'Không tìm thấy chu kỳ hiện tại'
      });
      return;
    }

    try {
      const response = await menstrualCycleApi.updateCycle(currentCycle._id, {
        startDate: values.newStartDate.format('YYYY-MM-DD')
      });
      
      const responseData = (response as any)?.data;
      
      if (responseData?.success) {
        notification.success({
          message: 'Thành công',
          description: `Đã cập nhật ngày bắt đầu chu kỳ thành ${values.newStartDate.format('DD/MM/YYYY')}. Hệ thống đã tự động tính lại thứ tự ngày cho tất cả dữ liệu đã ghi nhận.`
        });
        
        setUpdateStartDateModalVisible(false);
        updateStartDateForm.resetFields();
        
        // Reload tất cả dữ liệu
        await loadCycleData();
        await loadCalendarData(selectedDate.month() + 1, selectedDate.year());
        await loadCycleAnalysis();
      } else {
        notification.error({
          message: 'Lỗi',
          description: 'Không thể cập nhật ngày bắt đầu chu kỳ. Vui lòng thử lại.'
        });
      }
    } catch (error) {
      console.error('Error updating cycle start date:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.'
      });
    }
  };

  const handleLogCycle = async (values: {
    date: Dayjs;
    mucusObservation?: string;
    feeling?: string;
    notes?: string;
  }) => {
    try {
      if (!currentCycle) {
        notification.error({
          message: 'Lỗi',
          description: 'Vui lòng tạo chu kỳ mới trước'
        });
        return;
      }

      // Validate theo Billings method nếu có cả mucus và feeling
      if (values.mucusObservation && values.feeling) {
        const validationResponse = await menstrualCycleApi.validateDayInput({
          mucusObservation: values.mucusObservation,
          feeling: values.feeling
        });

        const validationData = (validationResponse as any)?.data;
        if (validationData?.success && !validationData.data?.isValid) {
          notification.warning({
            message: 'Cảnh báo validation',
            description: validationData.data?.warning || 'Sự kết hợp này không phù hợp theo phương pháp Billings'
          });
          
          // Vẫn cho phép lưu nhưng có warning
        }

        // Auto-generate các ngày sau nếu là ngày đỉnh
        if (validationData?.data?.isPeakDay) {
          try {
            await menstrualCycleApi.generatePostPeakDays({
              cycleId: currentCycle._id,
              peakDate: values.date.format('YYYY-MM-DD')
            });
            
            notification.info({
              message: 'Đã tự động tạo',
              description: 'Hệ thống đã tự động tạo 3 ngày sau ngày đỉnh'
            });
          } catch (error) {
            console.error('Error generating post-peak days:', error);
          }
        }
      }

      const logData: CreateCycleDayRequest = {
        cycleId: currentCycle._id,
        date: values.date.format('YYYY-MM-DD'),
        mucusObservation: values.mucusObservation,
        feeling: values.feeling,
        notes: values.notes
      };

      const response = await menstrualCycleApi.createOrUpdateCycleDay(logData);
      const responseData = (response as any)?.data;
      
      if (responseData?.success || responseData?._id) {
        notification.success({
          message: 'Thành công',
          description: 'Đã ghi nhận dữ liệu chu kỳ'
        });
        
        setLogModalVisible(false);
        form.resetFields();
        
        // Reload data
        await loadCalendarData(selectedDate.month() + 1, selectedDate.year());
        await loadCycleData();
        await loadCycleAnalysis();
      }
    } catch (error) {
      console.error('Error logging cycle:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể ghi nhận chu kỳ'
      });
    }
  };

  const handleDateSelect = (date: Dayjs) => {
    if (!currentCycle) {
      notification.warning({
        message: 'Chưa có chu kỳ',
        description: 'Vui lòng tạo chu kỳ mới trước khi ghi nhận dữ liệu'
      });
      return;
    }

    // Loại bỏ giới hạn ngày - cho phép nhập dữ liệu cho bất kỳ ngày nào
    // Chỉ giữ lại cảnh báo cho ngày quá xa trong tương lai (sau 7 ngày)
    if (date.isAfter(dayjs().add(7, 'day'))) {
      notification.warning({
        message: 'Lưu ý',
        description: 'Bạn đang nhập dữ liệu cho ngày quá xa trong tương lai. Hãy chắc chắn về ngày bạn chọn.'
      });
    }

    setSelectedDate(date);
    
    // Tìm dữ liệu của ngày được chọn
    const dateStr = date.format('YYYY-MM-DD');
    const dayData = calendarData.find(d => d.date === dateStr);
    
    if (dayData?.cycleDay) {
      // Hiển thị modal với dữ liệu có sẵn
      const mucusValue = dayData.cycleDay.mucusObservation || '';
      const feelingValue = dayData.cycleDay.feeling || '';
      
      // Set selected mucus để trigger filtering
      setSelectedMucus(mucusValue);
      
      // Set allowed feelings for the mucus
      if (mucusValue) {
        const rules = menstrualCycleApi.MUCUS_FEELING_RULES;
        const allowed = rules[mucusValue as keyof typeof rules] || [];
        setAllowedFeelings([...allowed]);
      } else {
        setAllowedFeelings([]);
      }
      
      form.setFieldsValue({
        date: date,
        mucusObservation: mucusValue,
        feeling: feelingValue,
        notes: dayData.cycleDay.notes
      });
      setLogModalVisible(true);
    } else {
      // Ngày mới, khởi tạo form trống
      setSelectedMucus('');
      setAllowedFeelings([]);
      setValidationWarning('');
      
      form.setFieldsValue({
        date: date,
        mucusObservation: undefined,
        feeling: undefined,
        notes: ''
      });
      setLogModalVisible(true);
    }
  };

  const getCellRender = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayData = calendarData.find(d => d.date === dateStr);

    // Cho phép nhập dữ liệu cho mọi ngày khi có chu kỳ
    const canInputData = !!currentCycle;

    // Nếu có dữ liệu chu kỳ, hiển thị symbol
    if (dayData?.symbol) {
      const { symbol, color, fertilityProbability, isPeakDay } = dayData;
      const symbolData = menstrualCycleApi.CALENDAR_SYMBOLS[symbol as keyof typeof menstrualCycleApi.CALENDAR_SYMBOLS];
      
      // Đảm bảo màu text có contrast tốt với background
      const textColor = (color === '#ffffff' || color === '#f0f0f0' || color === 'white') ? '#000000' : '#ffffff';
      
      return (
        <Tooltip title={`${symbolData?.description || symbol}${fertilityProbability ? ` - ${fertilityProbability}% khả năng thụ thai` : ''}`}>
          <div 
            className={`cycle-day ${isPeakDay ? 'peak-day' : ''}`}
            style={{ 
              backgroundColor: color || symbolData?.color, 
              color: textColor, 
              borderRadius: '50%', 
              width: '24px', 
              height: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '12px', 
              fontWeight: 'bold' 
            }}
          >
            {symbol}
          </div>
        </Tooltip>
      );
    }

    // Nếu không có dữ liệu nhưng có thể nhập, hiển thị dấu chấm nhỏ
    if (canInputData) {
      return (
        <Tooltip title="Nhấp để ghi nhận dữ liệu">
          <div 
            className="cycle-day-empty"
            style={{ 
              backgroundColor: '#e3f2fd', 
              borderRadius: '50%', 
              width: '8px', 
              height: '8px', 
              margin: '8px auto',
              cursor: 'pointer',
              opacity: 0.6
            }}
          />
        </Tooltip>
      );
    }

    return null;
  };

  const handleReminderSettings = async (values: {
    reminderEnabled?: boolean;
    reminderTime?: string;
  }) => {
    try {
      const response = await menstrualCycleApi.updateReminderSettings({
        reminderEnabled: values.reminderEnabled,
        reminderTime: values.reminderTime
      });

      const responseData = (response as any)?.data;
      if (responseData?.success || responseData?._id) {
        notification.success({
          message: 'Thành công',
          description: 'Đã cập nhật cài đặt nhắc nhở'
        });
        
        setReminderSettings(responseData?.data || responseData);
        setSettingsModalVisible(false);
      }
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể cập nhật cài đặt'
      });
    }
  };

  const averageCycleLength = cycles.length > 1 ? 
    cycles.reduce((acc, cycle, index) => {
      if (index === 0) return acc;
      const current = dayjs(cycle.startDate);
      const previous = dayjs(cycles[index - 1].startDate);
      return acc + current.diff(previous, 'days');
    }, 0) / (cycles.length - 1) : 28;

  // Smart validation for mucus-feeling combination
  const handleMucusChange = async (value: string) => {
    setSelectedMucus(value);
    setValidationWarning('');
    
    // Get allowed feelings for this mucus observation
    const rules = menstrualCycleApi.MUCUS_FEELING_RULES;
    const allowed = (rules[value as keyof typeof rules] || []) as string[];
    setAllowedFeelings([...allowed]); // Convert readonly to mutable array
    
    // Clear feeling if not allowed with current mucus
    const currentFeeling = form.getFieldValue('feeling') as string;
    if (currentFeeling && allowed.length > 0 && !allowed.includes(currentFeeling)) {
      form.setFieldValue('feeling', undefined);
    }
    
    // Show tip for peak day detection
    if (value === 'trong và âm hộ căng') {
      notification.info({
        message: '🎯 Ngày đỉnh phát hiện!',
        description: 'Đây có thể là ngày X (ngày đỉnh). Hãy chọn cảm giác "trơn" để xác nhận.',
        duration: 4
      });
    }
  };

  const handleFeelingChange = (value: string) => {
    setValidationWarning('');
    
    // Auto-detect peak day
    if (selectedMucus === 'trong và âm hộ căng' && value === 'trơn') {
      notification.success({
        message: '🌟 Ngày X được xác nhận!',
        description: 'Đây là ngày đỉnh (X) - khả năng thụ thai cao nhất. Hệ thống sẽ tự động tạo các ngày theo dõi tiếp theo.',
        duration: 5
      });
    }
  };

  // Get filtered feeling options based on selected mucus
  const getFilteredFeelingOptions = () => {
    if (!selectedMucus || allowedFeelings.length === 0) {
      return menstrualCycleApi.FEELING_OPTIONS;
    }
    
    return menstrualCycleApi.FEELING_OPTIONS.filter(option => 
      allowedFeelings.includes(option.value)
    );
  };

  // Onboarding control functions
  const startOnboarding = () => {
    setShowOnboarding(true);
    setOnboardingStep(0);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('menstrual_cycle_onboarding_seen', 'true');
    setIsFirstTimeUser(false);
  };

  const nextOnboardingStep = () => {
    if (onboardingStep < 4) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevOnboardingStep = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="cycle-page min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Theo dõi chu kỳ kinh nguyệt - Phương pháp Billings
              </h1>
              <p className="text-gray-600">
                Quản lý và theo dõi chu kỳ kinh nguyệt theo phương pháp Billings một cách khoa học
              </p>
            </div>
            <div className="flex gap-2">
              <Tooltip title={!currentCycle ? "Vui lòng tạo chu kỳ mới trước" : "Ghi nhận dữ liệu hàng ngày"}>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  size="large"
                  className="bg-pink-500 hover:bg-pink-600 border-pink-500 text-white"
                  onClick={() => setLogModalVisible(true)}
                  disabled={!currentCycle}
                >
                  Ghi nhận ngày
                </Button>
              </Tooltip>
              <Tooltip title={!currentCycle ? "Vui lòng tạo chu kỳ mới trước" : "Chỉnh sửa ngày bắt đầu chu kỳ hiện tại"}>
                <Button 
                  icon={<CalendarOutlined />} 
                  size="large"
                  onClick={() => setUpdateStartDateModalVisible(true)}
                  disabled={!currentCycle}
                  className="text-gray-700 border-gray-300 hover:text-orange-600 hover:border-orange-300"
                >
                  Đổi ngày bắt đầu
                </Button>
              </Tooltip>
              <Button 
                icon={<SettingOutlined />} 
                size="large"
                onClick={() => setSettingsModalVisible(true)}
                className="text-gray-700 border-gray-300 hover:text-blue-600 hover:border-blue-300"
              >
                Nhắc nhở
              </Button>
              <Button 
                icon={<QuestionCircleOutlined />} 
                size="large"
                onClick={() => setShowHelpModal(true)}
                className="text-gray-700 border-gray-300 hover:text-green-600 hover:border-green-300"
              >
                Trợ giúp
              </Button>
              {isFirstTimeUser && (
                <Button 
                  type="dashed"
                  icon={<BookOutlined />} 
                  size="large"
                  onClick={startOnboarding}
                  className="text-blue-600 border-blue-300 hover:text-blue-700 hover:border-blue-400"
                >
                  Hướng dẫn
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {!currentCycle ? (
            // Hiển thị khi chưa có chu kỳ
            <Card className="text-center p-8 border-2 border-dashed border-blue-300 bg-blue-50">
              <div className="mb-4">
                <CalendarOutlined className="text-6xl text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Chưa có chu kỳ nào để theo dõi
                </h3>
                <p className="text-gray-600 mb-6">
                  Bắt đầu theo dõi chu kỳ kinh nguyệt theo phương pháp Billings
                </p>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleManualCreateCycle}
                  className="bg-blue-500 hover:bg-blue-600 border-blue-500"
                >
                  Tạo chu kỳ mới
                </Button>
              </div>
            </Card>
          ) : (
            // Statistics như cũ khi đã có chu kỳ
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="text-center border-pink-200 bg-white/80 backdrop-blur-sm">
                  <Statistic
                    title={<span className="text-gray-700">Chu kỳ trung bình</span>}
                    value={Math.round(averageCycleLength)}
                    suffix="ngày"
                    valueStyle={{ color: '#ec4899' }}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="text-center border-purple-200 bg-white/80 backdrop-blur-sm">
                  <Statistic
                    title={<span className="text-gray-700">Chu kỳ hiện tại</span>}
                    value={currentCycle ? `Chu kỳ ${currentCycle.cycleNumber}` : 'Chưa có'}
                    valueStyle={{ color: '#a855f7' }}
                    prefix={<HeartOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="text-center border-green-200 bg-white/80 backdrop-blur-sm">
                  <Statistic
                    title={<span className="text-gray-700">Nhắc nhở</span>}
                    value={reminderSettings?.reminderEnabled ? `${reminderSettings.reminderTime}` : 'Tắt'}
                    valueStyle={{ color: '#10b981' }}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="text-center border-blue-200 bg-white/80 backdrop-blur-sm">
                  <Statistic
                    title={<span className="text-gray-700">Chu kỳ đã theo dõi</span>}
                    value={cycles.length}
                    suffix="chu kỳ"
                    valueStyle={{ color: '#3b82f6' }}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          )}
        </motion.div>

        {/* Main Content */}
        {currentCycle ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm">
              <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as 'calendar' | 'reports')}
                items={[
                  {
                    key: 'calendar',
                    label: (
                      <span className="flex items-center gap-2">
                        <CalendarOutlined />
                        Lịch theo dõi
                      </span>
                    ),
                    children: (
                      <Row gutter={[16, 16]}>
                        {/* Calendar */}
                        <Col xs={24} lg={16}>
                          <Card 
                            title={<span className="text-gray-800">Lịch chu kỳ kinh nguyệt</span>}
                            className="cycle-calendar-card"
                            extra={
                              <div className="flex gap-2 flex-wrap">
                                <Tag color="red">M: Kinh nguyệt</Tag>
                                <Tag color="orange">X: Ngày đỉnh</Tag>
                                <Tag color="yellow">1,2,3: Sau đỉnh</Tag>
                                <Tag color="purple">C: Có thể thụ thai</Tag>
                                <Tag color="cyan">S: An toàn</Tag>
                                <Tag color="default">D: Khô</Tag>
                              </div>
                            }
                          >
                            <Calendar
                              value={selectedDate}
                              onSelect={handleDateSelect}
                              cellRender={getCellRender}
                              className="cycle-calendar"
                              onChange={debouncedCalendarChange}
                            />
                          </Card>
                        </Col>

                        {/* Side Panel */}
                        <Col xs={24} lg={8}>
                          <div className="space-y-4">
                            {/* Today's Info */}
                            <Card 
                              title="Hôm nay" 
                              extra={<span className="text-gray-600">{dayjs().format('DD/MM/YYYY')}</span>}
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-700">Chu kỳ hiện tại:</span>
                                  <Tag color="blue">Chu kỳ {currentCycle.cycleNumber}</Tag>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-700">Ngày bắt đầu:</span>
                                  <span className="text-gray-800 font-medium">{dayjs(currentCycle.startDate).format('DD/MM/YYYY')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-700">Số ngày đã theo dõi:</span>
                                  <Tag color="green">{dayjs().diff(dayjs(currentCycle.startDate), 'days') + 1} ngày</Tag>
                                </div>
                              </div>
                            </Card>

                            {/* Legend */}
                            <Card title={<span className="text-gray-800">📋 Chú thích</span>}>
                              {/* Ký hiệu trên lịch */}
                              <div className="mb-4">
                                <div className="text-gray-800 font-medium mb-2">🗓️ Ký hiệu trên lịch:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
                                    <span className="text-gray-700">Kinh nguyệt</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">X</div>
                                    <span className="text-gray-700">Ngày đỉnh</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                                    <span className="text-gray-700">Sau đỉnh 1</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>
                                    <span className="text-gray-700">Có thể thụ thai</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">S</div>
                                    <span className="text-gray-700">An toàn</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">D</div>
                                    <span className="text-gray-700">Khô</span>
                                  </div>
                                </div>
                              </div>

                              {/* Quy tắc Billings */}
                              <div className="border-t pt-3">
                                <div className="text-gray-800 font-medium mb-2">🔬 Phương pháp Billings:</div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                    <span className="text-gray-700">Có máu, lấm tấm máu → Ướt</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                    <span className="text-gray-700">Đục → Dính, ẩm</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                    <span className="text-gray-700">Trong nhiều sợi → Ướt, trơn</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-1 bg-orange-50 rounded">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                    <span className="text-orange-800 font-medium">Trong & âm hộ căng → Trơn (Ngày X)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                    <span className="text-gray-700">Ít chất tiết → Ẩm, ướt</span>
                                  </div>
                                </div>
                              </div>

                              {/* Hướng dẫn sử dụng */}
                              <div className="border-t pt-3 mt-3">
                                <div className="text-gray-800 font-medium mb-2">💡 Hướng dẫn:</div>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div>• Nhấp vào ngày để ghi nhận dữ liệu</div>
                                  <div>• Có thể nhập từ 7 ngày trước chu kỳ</div>
                                  <div>• Dấu chấm xanh: ngày có thể nhập</div>
                                </div>
                              </div>
                            </Card>

                            {/* Quick Actions */}
                            <Card title={<span className="text-gray-800">Thao tác nhanh</span>}>
                              <div className="space-y-2">
                                <Button 
                                  block 
                                  icon={<PlusOutlined />}
                                  onClick={() => setLogModalVisible(true)}
                                  className="text-gray-700 border-gray-300 hover:text-blue-600 hover:border-blue-300"
                                >
                                  Ghi nhận ngày mới
                                </Button>
                                <Button 
                                  block 
                                  icon={<SettingOutlined />}
                                  onClick={() => setSettingsModalVisible(true)}
                                  className="text-gray-700 border-gray-300 hover:text-blue-600 hover:border-blue-300"
                                >
                                  Cài đặt nhắc nhở
                                </Button>
                                <Button 
                                  block 
                                  icon={<LineChartOutlined />}
                                  onClick={() => navigate('/profile/menstrual-tracker')}
                                  className="text-gray-700 border-gray-300 hover:text-blue-600 hover:border-blue-300"
                                >
                                  Xem bảng chi tiết
                                </Button>
                              </div>
                            </Card>
                          </div>
                        </Col>
                      </Row>
                    ),
                  },
                  {
                    key: 'reports',
                    label: (
                      <span className="flex items-center gap-2">
                        <LineChartOutlined />
                        Báo cáo & Phân tích
                      </span>
                    ),
                    children: (
                      <div className="space-y-6">
                        {/* Cycle Analysis Report */}
                        {cycleAnalysis && (
                          <Card 
                            title={<span className="text-gray-800">📊 Báo cáo chu kỳ hiện tại</span>}
                          >
                            <div className="space-y-4">
                              {/* Trạng thái chu kỳ */}
                              <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="text-blue-800 font-medium mb-2 text-lg">
                                  {cycleAnalysis.analysis?.pattern?.name || 'Đang phân tích...'}
                                </div>
                                <div className="text-blue-600">
                                  {cycleAnalysis.analysis?.analysis || 'Chưa có đủ dữ liệu'}
                                </div>
                              </div>

                              <Row gutter={[16, 16]}>
                                {/* Thông tin chu kỳ */}
                                <Col xs={24} md={12}>
                                  <Card size="small" title="Thông tin chu kỳ" className="h-full">
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span>Chu kỳ số:</span>
                                        <Tag color="blue">{currentCycle.cycleNumber}</Tag>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Ngày bắt đầu:</span>
                                        <span>{dayjs(currentCycle.startDate).format('DD/MM/YYYY')}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Số ngày theo dõi:</span>
                                        <Tag color="green">{dayjs().diff(dayjs(currentCycle.startDate), 'days') + 1} ngày</Tag>
                                      </div>
                                      {cycleAnalysis.analysis?.peakDay && (
                                        <div className="flex justify-between">
                                          <span>Ngày đỉnh:</span>
                                          <Tag color="red">
                                            Ngày {cycleAnalysis.analysis.peakDay.cycleDayNumber} ({dayjs(cycleAnalysis.analysis.peakDay.date).format('DD/MM')})
                                          </Tag>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </Col>

                                {/* Dự đoán */}
                                <Col xs={24} md={12}>
                                  <Card size="small" title="Dự đoán chu kỳ tiếp theo" className="h-full">
                                    {cycleAnalysis.analysis?.nextPeakPrediction?.prediction ? (
                                      <div className="space-y-2">
                                        <div className="p-3 bg-green-50 rounded-lg">
                                          <div className="text-green-800 font-medium mb-1">
                                            🔮 Ngày đỉnh dự kiến
                                          </div>
                                          <div className="text-green-600">
                                            {dayjs(cycleAnalysis.analysis.nextPeakPrediction.prediction.date).format('DD/MM/YYYY')} (±2 ngày)
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Độ tin cậy: {cycleAnalysis.analysis.nextPeakPrediction.confidence === 'medium' ? 'Trung bình' : 'Thấp'}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-gray-500 text-center py-4">
                                        Chưa đủ dữ liệu để dự đoán
                                      </div>
                                    )}
                                  </Card>
                                </Col>
                              </Row>

                              {/* Khuyến nghị */}
                              {cycleAnalysis.analysis?.recommendations && cycleAnalysis.analysis.recommendations.length > 0 && (
                                <Card size="small" title="💡 Khuyến nghị">
                                  <div className="space-y-2">
                                    {cycleAnalysis.analysis.recommendations.map((rec: string, index: number) => (
                                      <div key={index} className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                        {rec}
                                      </div>
                                    ))}
                                  </div>
                                </Card>
                              )}

                              {/* Auto complete button */}
                              {cycleAnalysis.analysis?.isComplete && !currentCycle?.isCompleted && (
                                <div className="flex justify-center pt-4">
                                  <Button 
                                    type="primary"
                                    size="large"
                                    className="bg-green-500 hover:bg-green-600 border-green-500"
                                    onClick={async () => {
                                      try {
                                        await menstrualCycleApi.autoCompleteCycle(currentCycle._id);
                                        notification.success({
                                          message: 'Thành công',
                                          description: 'Chu kỳ đã được đánh dấu hoàn thành'
                                        });
                                        await loadCycleData();
                                        await loadCycleAnalysis();
                                      } catch (error) {
                                        notification.error({
                                          message: 'Lỗi',
                                          description: 'Không thể hoàn thành chu kỳ'
                                        });
                                      }
                                    }}
                                  >
                                    ✅ Hoàn thành chu kỳ này
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        )}

                        {/* Placeholder for more reports */}
                        <Card 
                          title={<span className="text-gray-800">📈 Báo cáo tổng hợp</span>}
                          className="text-center"
                        >
                          <div className="py-8 text-gray-500">
                            <LineChartOutlined className="text-4xl mb-4" />
                            <div className="text-lg font-medium mb-2">Sắp có thêm báo cáo</div>
                            <div className="text-sm">
                              Báo cáo so sánh nhiều chu kỳ, thống kê, và phân tích xu hướng sẽ được bổ sung trong tương lai
                            </div>
                          </div>
                        </Card>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </motion.div>
        ) : (
          // Hiển thị thông báo khi chưa có chu kỳ
          <Card className="text-center p-8 bg-gray-50">
            <div className="text-gray-600">
              <CalendarOutlined className="text-4xl mb-4 text-gray-400" />
              <p className="text-gray-700 font-medium">Vui lòng tạo chu kỳ mới để bắt đầu theo dõi</p>
            </div>
          </Card>
        )}

        {/* Log Modal - chỉ hiển thị khi có currentCycle */}
        {currentCycle && (
          <Modal
            title={<span className="text-gray-800">{`Ghi nhận dữ liệu ngày ${selectedDate.format('DD/MM/YYYY')}`}</span>}
            open={logModalVisible}
            onCancel={() => {
              setLogModalVisible(false);
              form.resetFields();
              // Reset filtering states
              setSelectedMucus('');
              setAllowedFeelings([]);
              setValidationWarning('');
            }}
            footer={null}
            width={600}
            className="cycle-log-modal"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleLogCycle}
              initialValues={{
                date: selectedDate
              }}
            >
              <Form.Item
                name="date"
                label={<span className="text-gray-700 font-medium">Ngày</span>}
              >
                <DatePicker className="w-full" disabled />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="mucusObservation"
                    label={<span className="text-gray-700 font-medium">Quan sát chất nhờn</span>}
                  >
                    <Select placeholder="Chọn quan sát" allowClear onChange={handleMucusChange}>
                      {menstrualCycleApi.MUCUS_OPTIONS.map(option => (
                        <Select.Option key={option.value} value={option.value}>
                          {option.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="feeling"
                    label={<span className="text-gray-700 font-medium">Cảm giác</span>}
                    help={selectedMucus && allowedFeelings.length > 0 && allowedFeelings.length < menstrualCycleApi.FEELING_OPTIONS.length ? (
                      <span className="text-blue-600 text-xs">
                        Chỉ hiển thị cảm giác phù hợp với "{selectedMucus}"
                      </span>
                    ) : null}
                  >
                    <Select placeholder="Chọn cảm giác" allowClear onChange={handleFeelingChange}>
                      {getFilteredFeelingOptions().map(option => (
                        <Select.Option key={option.value} value={option.value}>
                          {option.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notes"
                label={<span className="text-gray-700 font-medium">Ghi chú</span>}
              >
                <TextArea rows={3} placeholder="Ghi chú thêm về ngày này..." />
              </Form.Item>

              {/* Validation Warning */}
              {validationWarning && (
                <Alert
                  message="Cảnh báo validation"
                  description={validationWarning}
                  type="warning"
                  showIcon
                  closable
                  className="mb-4"
                  onClose={() => setValidationWarning('')}
                />
              )}

              <Form.Item className="mb-0 text-right">
                <Button 
                  onClick={() => {
                    setLogModalVisible(false);
                    form.resetFields();
                  }}
                  className="mr-2 text-gray-700 border-gray-300"
                >
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" className="bg-pink-500 hover:bg-pink-600 border-pink-500">
                  Lưu
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        )}

        {/* Settings Modal */}
        <Modal
          title={<span className="text-gray-800">Cài đặt nhắc nhở</span>}
          open={settingsModalVisible}
          onCancel={() => setSettingsModalVisible(false)}
          footer={null}
          width={400}
        >
          <Form
            form={settingsForm}
            layout="vertical"
            onFinish={handleReminderSettings}
            initialValues={{
              reminderEnabled: reminderSettings?.reminderEnabled || true,
              reminderTime: reminderSettings?.reminderTime || '20:00'
            }}
          >
            <Form.Item
              name="reminderEnabled"
              label={<span className="text-gray-700 font-medium">Bật nhắc nhở</span>}
              valuePropName="checked"
            >
              <input type="checkbox" />
            </Form.Item>

            <Form.Item
              name="reminderTime"
              label={<span className="text-gray-700 font-medium">Thời gian nhắc nhở</span>}
            >
              <Input placeholder="20:00" />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
              <Button 
                onClick={() => setSettingsModalVisible(false)}
                className="mr-2 text-gray-700 border-gray-300"
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" className="bg-blue-500 hover:bg-blue-600 border-blue-500">
                Lưu
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Update Start Date Modal */}
        <Modal
          title={<span className="text-gray-800">Cập nhật ngày bắt đầu chu kỳ</span>}
          open={updateStartDateModalVisible}
          onCancel={() => {
            setUpdateStartDateModalVisible(false);
            updateStartDateForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <div className="mb-4">
            <Alert
              message="Thay đổi ngày bắt đầu chu kỳ"
              description={`Chu kỳ hiện tại bắt đầu từ ngày ${currentCycle ? dayjs(currentCycle.startDate).format('DD/MM/YYYY') : 'N/A'}. Khi bạn thay đổi ngày bắt đầu, hệ thống sẽ tự động tính lại thứ tự ngày (cycleDayNumber) cho tất cả dữ liệu đã ghi nhận trong chu kỳ này.`}
              type="warning"
              showIcon
              className="mb-4"
            />
          </div>
          
          <Form
            form={updateStartDateForm}
            layout="vertical"
            onFinish={handleUpdateStartDate}
            initialValues={{
              newStartDate: currentCycle ? dayjs(currentCycle.startDate) : dayjs()
            }}
          >
            <Form.Item
              name="newStartDate"
              label={<span className="text-gray-700 font-medium">Ngày bắt đầu mới</span>}
              rules={[
                { required: true, message: 'Vui lòng chọn ngày bắt đầu mới' }
              ]}
            >
              <DatePicker 
                className="w-full" 
                format="DD/MM/YYYY"
                placeholder="Chọn ngày bắt đầu chu kỳ mới"
              />
            </Form.Item>

            <div className="bg-orange-50 p-4 rounded-lg mb-4">
              <h4 className="text-orange-800 font-medium mb-2">⚠️ Lưu ý quan trọng:</h4>
              <ul className="text-orange-700 text-sm space-y-1">
                <li>• Việc thay đổi ngày bắt đầu sẽ ảnh hưởng đến tất cả dữ liệu đã ghi nhận</li>
                <li>• Hệ thống sẽ tự động tính lại thứ tự ngày cho các ngày đã có dữ liệu</li>
                <li>• Điều này hữu ích khi bạn phát hiện ngày bắt đầu thực tế khác với ban đầu</li>
                <li>• Ví dụ: Đã đặt ngày 15/1 nhưng thực tế ngày 12/1 mới là ngày đầu kinh nguyệt</li>
              </ul>
            </div>

            <Form.Item className="mb-0 text-right">
              <Button 
                onClick={() => {
                  setUpdateStartDateModalVisible(false);
                  updateStartDateForm.resetFields();
                }}
                className="mr-2 text-gray-700 border-gray-300"
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" className="bg-orange-500 hover:bg-orange-600 border-orange-500">
                Cập nhật ngày bắt đầu
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Create Cycle Modal */}
        <Modal
          title={<span className="text-gray-800">Tạo chu kỳ mới</span>}
          open={createCycleModalVisible}
          onCancel={() => {
            setCreateCycleModalVisible(false);
            createCycleForm.resetFields();
          }}
          footer={null}
          width={500}
        >
          <div className="mb-4">
            <Alert
              message="Chọn ngày bắt đầu chu kỳ"
              description="Thông thường chu kỳ kinh nguyệt bắt đầu từ ngày đầu tiên có kinh nguyệt. Bạn có thể tự do chọn bất kỳ ngày nào - trong quá khứ, hiện tại, hoặc tương lai."
              type="info"
              showIcon
              className="mb-4"
            />
          </div>
          
          <Form
            form={createCycleForm}
            layout="vertical"
            onFinish={handleCreateCycleWithDate}
            initialValues={{
              startDate: dayjs().subtract(3, 'days') // Mặc định là 3 ngày trước để user có thể nhập dữ liệu quá khứ
            }}
          >
            <Form.Item
              name="startDate"
              label={<span className="text-gray-700 font-medium">Ngày bắt đầu chu kỳ</span>}
              rules={[
                { required: true, message: 'Vui lòng chọn ngày bắt đầu chu kỳ' }
              ]}
            >
              <DatePicker 
                className="w-full" 
                format="DD/MM/YYYY"
                placeholder="Chọn ngày bắt đầu chu kỳ"
              />
            </Form.Item>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="text-blue-800 font-medium mb-2">💡 Gợi ý:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Chọn ngày đầu tiên có kinh nguyệt của chu kỳ này</li>
                <li>• Bạn có thể nhập dữ liệu cho bất kỳ ngày nào sau khi tạo chu kỳ</li>
                <li>• Chu kỳ kinh nguyệt thường kéo dài 21-35 ngày</li>
                <li>• Không có giới hạn thời gian - bạn có thể chọn ngày trong quá khứ hoặc tương lai</li>
              </ul>
            </div>

            <Form.Item className="mb-0 text-right">
              <Button 
                onClick={() => {
                  setCreateCycleModalVisible(false);
                  createCycleForm.resetFields();
                }}
                className="mr-2 text-gray-700 border-gray-300"
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" className="bg-blue-500 hover:bg-blue-600 border-blue-500">
                Tạo chu kỳ
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Debug Info - Chỉ hiển thị khi đang development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-6 bg-gray-100" title={<span className="text-gray-800">🔧 Debug Info</span>}>
            <div className="space-y-2 text-sm">
              <div className="text-gray-800"><strong>Authentication:</strong> {isAuthenticated ? '✅ Đã đăng nhập' : '❌ Chưa đăng nhập'}</div>
              <div className="text-gray-800"><strong>Current Cycle:</strong> {currentCycle ? `✅ Chu kỳ ${currentCycle.cycleNumber}` : '❌ Không có'}</div>
              <div className="text-gray-800"><strong>Cycles Count:</strong> {cycles.length}</div>
              <div className="text-gray-800"><strong>Calendar Data:</strong> {calendarData.length} ngày</div>
              <div className="text-gray-800"><strong>Reminder Settings:</strong> {reminderSettings ? '✅ Có' : '❌ Không có'}</div>
            </div>
            {!currentCycle && (
              <div className="mt-4">
                <Button 
                  type="dashed" 
                  onClick={handleManualCreateCycle}
                  icon={<PlusOutlined />}
                  className="text-gray-700 border-gray-400 hover:text-blue-600 hover:border-blue-400 mr-2"
                >
                  Debug: Thử tạo chu kỳ lại
                </Button>
                <Button 
                  type="dashed" 
                  onClick={() => loadCalendarData(selectedDate.month() + 1, selectedDate.year())}
                  icon={<ReloadOutlined />}
                  className="text-gray-700 border-gray-400 hover:text-blue-600 hover:border-blue-400"
                >
                  Reload Calendar
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Help Modal */}
        <HelpModal 
          visible={showHelpModal} 
          onClose={() => setShowHelpModal(false)} 
        />

        {/* Onboarding Tour */}
        <OnboardingTour
          visible={showOnboarding}
          onClose={completeOnboarding}
        />
      </div>
    </div>
  );
};

export default CyclePage; 