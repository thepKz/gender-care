/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    CalendarOutlined,
    DeleteOutlined,
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
    Popconfirm,
    Progress,
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

// Component hiển thị tổng quan chu kỳ hiện tại
const CurrentCycleOverview: React.FC<{ currentCycle: MenstrualCycle }> = ({ currentCycle }) => {
  const [cycleAnalysis, setCycleAnalysis] = useState<any>(null);
  const [recentCycleDays, setRecentCycleDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentCycleInfo();
  }, [currentCycle._id]);

  const loadCurrentCycleInfo = async () => {
    try {
      setLoading(true);
      
      // Load cycle analysis và recent cycle days
      const [analysisRes, cycleDaysRes] = await Promise.allSettled([
        menstrualCycleApi.getCycleAnalysis(currentCycle._id),
        menstrualCycleApi.getCycleDays(currentCycle._id)
      ]);

      if (analysisRes.status === 'fulfilled') {
        const data = (analysisRes.value as any)?.data;
        if (data?.success) {
          setCycleAnalysis(data.data);
        }
      }

      if (cycleDaysRes.status === 'fulfilled') {
        const data = (cycleDaysRes.value as any)?.data;
        if (data?.success) {
          // Lấy 7 ngày gần nhất
          const sortedDays = (data.data || []).sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ).slice(0, 7);
          setRecentCycleDays(sortedDays);
        }
      }
    } catch (error) {
      console.error('Error loading current cycle info:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysSinceStart = dayjs().diff(dayjs(currentCycle.startDate), 'days') + 1;
  const peakDay = cycleAnalysis?.analysis?.peakDay;
  const currentPhase = cycleAnalysis?.analysis?.phase;

  // Xác định giai đoạn hiện tại
  const getPhaseInfo = () => {
    if (!currentPhase) return { name: 'Đang phân tích...', color: 'blue', description: 'Hệ thống đang phân tích chu kỳ' };
    
    switch (currentPhase) {
      case 'waiting_for_menstruation':
        return { name: 'Chờ kinh nguyệt', color: 'red', description: 'Ghi nhận ngày đầu có máu kinh nguyệt' };
      case 'pre_peak_tracking':
        return { name: 'Theo dõi trước đỉnh', color: 'orange', description: 'Theo dõi đến khi xuất hiện ngày đỉnh' };
      case 'post_peak_tracking':
        return { name: 'Theo dõi sau đỉnh', color: 'yellow', description: 'Cần theo dõi thêm sau ngày đỉnh' };
      case 'waiting_for_next_menstruation':
        return { name: 'Chờ chu kỳ tiếp theo', color: 'green', description: 'Đã hoàn thành giai đoạn chính' };
      case 'completed_case_1':
        return { name: 'Đã hoàn thành', color: 'green', description: 'Chu kỳ đã hoàn thành' };
      default:
        return { name: 'Đang theo dõi', color: 'blue', description: 'Tiếp tục ghi nhận dữ liệu hàng ngày' };
    }
  };

  const phaseInfo = getPhaseInfo();
  const progress = Math.min((daysSinceStart / 35) * 100, 100); // Giả sử chu kỳ tối đa 35 ngày

  if (loading) {
    return (
      <Card className="text-center p-4">
        <Spin />
        <div className="mt-2 text-gray-600">Đang tải thông tin chu kỳ...</div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <span>🔍 Chu kỳ hiện tại - Chu kỳ {currentCycle.cycleNumber}</span>
          <Tag color={phaseInfo.color}>{phaseInfo.name}</Tag>
        </div>
      }
      className="mb-4"
    >
      <div className="space-y-4">
        {/* Progress và thông tin cơ bản */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-700 mb-1">{daysSinceStart}</div>
            <div className="text-sm text-blue-600">Ngày thứ {daysSinceStart}</div>
            <div className="text-xs text-gray-500 mt-1">
              Từ {dayjs(currentCycle.startDate).format('DD/MM/YYYY')}
            </div>
          </div>
          
          {peakDay && (
            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-700 mb-1">
                Ngày {peakDay.cycleDayNumber}
              </div>
              <div className="text-sm text-orange-600">Ngày đỉnh (X)</div>
              <div className="text-xs text-gray-500 mt-1">
                {dayjs(peakDay.date).format('DD/MM/YYYY')}
              </div>
            </div>
          )}
          
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-700 mb-1">
              {currentCycle.isCompleted ? '✓' : '...'}
            </div>
            <div className="text-sm text-green-600">
              {currentCycle.isCompleted ? 'Hoàn thành' : 'Đang theo dõi'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {phaseInfo.description}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tiến độ chu kỳ</span>
            <span className="text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress 
            percent={progress} 
            strokeColor={{
              '0%': '#108ee9',
              '50%': '#87d068',
              '100%': '#87d068'
            }}
            showInfo={false}
          />
          <div className="text-xs text-gray-500">
            Chu kỳ bình thường: 21-35 ngày • Hiện tại: {daysSinceStart} ngày
          </div>
        </div>

        {/* 7 ngày gần nhất */}
        {recentCycleDays.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">📅 7 ngày gần nhất:</div>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {recentCycleDays.reverse().map((day: any, dayIndex: number) => {
                const symbol = getSymbolForDay(day);
                const symbolColor = getSymbolColor(symbol);
                
                return (
                  <Tooltip 
                    key={dayIndex}
                    title={
                      <div>
                        <div><strong>Ngày {day.cycleDayNumber || 'N/A'}</strong></div>
                        <div>{dayjs(day.date).format('DD/MM/YYYY')}</div>
                        {day.mucusObservation && <div>Quan sát: {day.mucusObservation}</div>}
                        {day.feeling && <div>Cảm giác: {day.feeling}</div>}
                        {day.notes && <div>Ghi chú: {day.notes}</div>}
                      </div>
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-transform hover:scale-110 flex-shrink-0"
                      style={{ backgroundColor: symbolColor }}
                    >
                      {symbol}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
            <div className="text-xs text-gray-500">
              Hover vào các ký hiệu để xem chi tiết • M: Máu, X: Đỉnh, C: Có thể thụ thai, D: Khô, S: An toàn
            </div>
          </div>
        )}

        {/* Hướng dẫn tiếp theo */}
        <Alert
          message={`Hướng dẫn tiếp theo`}
          description={cycleAnalysis?.analysis?.analysis || phaseInfo.description}
          type="info"
          showIcon
          className="mt-4"
        />
      </div>
    </Card>
  );
};

// Helper functions
const getSymbolForDay = (day: any): string => {
  if (day.mucusObservation === 'có máu' || day.mucusObservation === 'lấm tấm máu') {
    return 'M';
  } else if (day.isPeakDay || (day.mucusObservation === 'trong và âm hộ căng' && day.feeling === 'trơn')) {
    return 'X';
  } else if (day.peakDayRelative === 1) {
    return '1';
  } else if (day.peakDayRelative === 2) {
    return '2';
  } else if (day.peakDayRelative === 3) {
    return '3';
  } else if (day.mucusObservation === 'đục' || day.mucusObservation === 'đục nhiều sợi' || day.mucusObservation === 'trong nhiều sợi') {
    return 'C';
  } else if (isDryDay(day.feeling, day.mucusObservation)) {
    return 'D';
  } else {
    return 'S';
  }
};

const getSymbolColor = (symbol: string): string => {
  const colors: Record<string, string> = {
    'M': '#e53935', // Đỏ cho kinh nguyệt
    'X': '#ff9800', // Cam cho ngày đỉnh
    '1': '#fdd835', // Vàng cho ngày 1 sau đỉnh
    '2': '#66bb6a', // Xanh lá cho ngày 2 sau đỉnh
    '3': '#42a5f5', // Xanh dương cho ngày 3 sau đỉnh
    'C': '#ab47bc', // Tím cho có thể thụ thai
    'S': '#26c6da', // Xanh nhạt cho an toàn
    'D': '#78909c'  // Xám cho khô
  };
  return colors[symbol] || '#999';
};

const isDryDay = (feeling?: string, mucusObservation?: string): boolean => {
  return feeling === 'khô' || mucusObservation === 'ít chất tiết' || (!feeling && !mucusObservation);
};

// Component báo cáo đơn giản tập trung vào thông tin chính
const CycleReportSection: React.FC<{ currentCycle: MenstrualCycle }> = ({ currentCycle }) => {
  const [predictiveAnalysis, setPredictiveAnalysis] = useState<any>(null);
  const [healthAssessment, setHealthAssessment] = useState<any>(null);
  const [threeCycleComparison, setThreeCycleComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [currentCycle._id]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const [predictiveRes, healthRes, comparisonRes] = await Promise.allSettled([
        menstrualCycleApi.getPredictiveAnalysis(),
        menstrualCycleApi.getHealthAssessment(),
        menstrualCycleApi.getThreeCycleComparison()
      ]);

      if (predictiveRes.status === 'fulfilled') {
        const data = (predictiveRes.value as any)?.data;
        if (data?.success) {
          setPredictiveAnalysis(data.data);
        }
      }

      if (healthRes.status === 'fulfilled') {
        const data = (healthRes.value as any)?.data;
        if (data?.success) {
          setHealthAssessment(data.data);
        }
      }

      if (comparisonRes.status === 'fulfilled') {
        const data = (comparisonRes.value as any)?.data;
        if (data?.success) {
          setThreeCycleComparison(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="text-center p-8">
        <Spin size="large" />
        <div className="mt-4 text-gray-600">Đang tải báo cáo...</div>
      </Card>
    );
  }

  // Lấy thông tin chu kỳ cũ và mới
  const cycles = threeCycleComparison?.cycles || [];
  const currentCycleInfo = cycles.find((c: any) => c.cycleNumber === currentCycle.cycleNumber);
  const previousCycle = cycles.find((c: any) => c.cycleNumber === currentCycle.cycleNumber - 1);

  // Xác định tình trạng sức khỏe
  const getHealthStatus = () => {
    if (!healthAssessment) return { status: 'unknown', color: 'gray', text: 'Đang phân tích...', advice: '' };
    
    const score = healthAssessment.overall.score;
    const hasRedFlags = healthAssessment.redFlags && healthAssessment.redFlags.length > 0;
    
    if (hasRedFlags || score < 60) {
      return { 
        status: 'poor', 
        color: 'red', 
        text: '🔴 Cần khám bác sĩ', 
        advice: 'Nên đặt lịch khám với bác sĩ phụ khoa để được tư vấn chi tiết' 
      };
    } else if (score < 80) {
      return { 
        status: 'monitoring', 
        color: 'orange', 
        text: '🟡 Cần theo dõi', 
        advice: 'Tiếp tục theo dõi chu kỳ đều đặn và chú ý chế độ sinh hoạt' 
      };
    } else {
      return { 
        status: 'good', 
        color: 'green', 
        text: '🟢 Bình thường', 
        advice: 'Chu kỳ của bạn rất tốt, tiếp tục duy trì lối sống lành mạnh' 
      };
    }
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Thông tin chu kỳ cũ và mới */}
      <Card title={<span className="text-gray-800">📊 Thông tin chu kỳ</span>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chu kỳ cũ */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-3">Chu kỳ trước đó</h4>
            {previousCycle ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chu kỳ:</span>
                  <span className="font-medium">Chu kỳ {previousCycle.cycleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày bắt đầu:</span>
                  <span className="font-medium">{new Date(previousCycle.startDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày kết thúc:</span>
                  <span className="font-medium">
                    {previousCycle.endDate ? new Date(previousCycle.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Độ dài:</span>
                  <span className="font-medium">{previousCycle.length || 'N/A'} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày đỉnh:</span>
                  <span className="font-medium">Ngày {previousCycle.peakDay || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">Chưa có dữ liệu chu kỳ trước</div>
            )}
          </div>

          {/* Chu kỳ hiện tại */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-3">Chu kỳ hiện tại</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Chu kỳ:</span>
                <span className="font-medium">Chu kỳ {currentCycle.cycleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày bắt đầu:</span>
                <span className="font-medium">{dayjs(currentCycle.startDate).format('DD/MM/YYYY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số ngày hiện tại:</span>
                <span className="font-medium">{dayjs().diff(dayjs(currentCycle.startDate), 'days') + 1} ngày</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <Tag color={currentCycle.isCompleted ? 'green' : 'blue'}>
                  {currentCycle.isCompleted ? 'Đã hoàn thành' : 'Đang theo dõi'}
                </Tag>
              </div>
              {currentCycleInfo?.peakDay && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày đỉnh:</span>
                  <span className="font-medium">Ngày {currentCycleInfo.peakDay}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Dự đoán chu kỳ tiếp theo */}
      {predictiveAnalysis && predictiveAnalysis.nextCycle && (
        <Card title={<span className="text-gray-800">🔮 Dự đoán chu kỳ tiếp theo</span>}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-lg font-bold text-purple-700 mb-1">
                📅 Ngày có kinh
              </div>
              <div className="text-xl font-bold text-purple-800">
                {new Date(predictiveAnalysis.nextCycle.predictedStartDate).toLocaleDateString('vi-VN')}
              </div>
              <div className="text-sm text-purple-600 mt-1">
                (±3 ngày)
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <div className="text-lg font-bold text-orange-700 mb-1">
                🎯 Ngày đỉnh dự kiến
              </div>
              <div className="text-xl font-bold text-orange-800">
                Ngày {predictiveAnalysis.nextCycle.predictedPeakDay}
              </div>
              <div className="text-sm text-orange-600 mt-1">
                của chu kỳ mới
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-lg font-bold text-green-700 mb-1">
                📊 Độ tin cậy
              </div>
              <div className="text-xl font-bold text-green-800">
                {predictiveAnalysis.nextCycle.confidenceLevel === 'high' ? 'Cao' :
                 predictiveAnalysis.nextCycle.confidenceLevel === 'medium' ? 'TB' : 'Thấp'}
              </div>
              <div className="text-sm text-green-600 mt-1">
                {predictiveAnalysis.basedOn.cycles} chu kỳ
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-lg font-bold text-blue-700 mb-1">
                ⏱️ Dự kiến kết thúc
              </div>
              <div className="text-xl font-bold text-blue-800">
                {(() => {
                  const startDate = new Date(predictiveAnalysis.nextCycle.predictedStartDate);
                  const avgLength = predictiveAnalysis.basedOn.averageLength;
                  const endDate = new Date(startDate);
                  endDate.setDate(endDate.getDate() + avgLength - 1);
                  return endDate.toLocaleDateString('vi-VN');
                })()}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                (~{Math.round(predictiveAnalysis.basedOn.averageLength)} ngày)
              </div>
            </div>
          </div>

          {predictiveAnalysis.warnings && (
            <Alert
              message="⚠️ Lưu ý"
              description={predictiveAnalysis.warnings.join('; ')}
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
        </Card>
      )}

      {/* Tình trạng sức khỏe */}
      <Card title={<span className="text-gray-800">💖 Tình trạng sức khỏe</span>}>
        <div className="space-y-4">
          <div className={`p-6 rounded-lg text-center bg-${healthStatus.status === 'good' ? 'green' : healthStatus.status === 'monitoring' ? 'yellow' : 'red'}-50`}>
            <div className="text-2xl font-bold mb-2" style={{ color: healthStatus.color === 'green' ? '#16a34a' : healthStatus.color === 'orange' ? '#ea580c' : '#dc2626' }}>
              {healthStatus.text}
            </div>
            <div className="text-lg mb-3" style={{ color: healthStatus.color === 'green' ? '#15803d' : healthStatus.color === 'orange' ? '#c2410c' : '#b91c1c' }}>
              {healthStatus.advice}
            </div>
            
            {/* Phân tích ngắn gọn */}
            {threeCycleComparison && threeCycleComparison.cycles?.length >= 2 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-white rounded border">
                  <div className="font-medium text-gray-700">Độ dài chu kỳ</div>
                  <div className="text-lg font-bold text-blue-600">
                    {threeCycleComparison.pattern.averageLength.toFixed(0)} ngày
                  </div>
                  <div className="text-sm text-gray-600">
                    {threeCycleComparison.pattern.averageLength < 21 ? 'Ngắn' : 
                     threeCycleComparison.pattern.averageLength > 35 ? 'Dài' : 'Bình thường'}
                  </div>
                </div>
                
                <div className="p-3 bg-white rounded border">
                  <div className="font-medium text-gray-700">Tính ổn định</div>
                  <div className="text-lg font-bold text-green-600">
                    {threeCycleComparison.pattern.consistency === 'stable' ? 'Ổn định' :
                     threeCycleComparison.pattern.consistency === 'variable' ? 'Thay đổi' : 'Không đều'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {threeCycleComparison.cycles.length} chu kỳ
                  </div>
                </div>
                
                <div className="p-3 bg-white rounded border">
                  <div className="font-medium text-gray-700">Xu hướng</div>
                  <div className="text-lg font-bold text-purple-600">
                    {threeCycleComparison.pattern.trend === 'normal' ? 'Bình thường' :
                     threeCycleComparison.pattern.trend === 'getting_shorter' ? 'Ngắn dần' : 'Dài dần'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Gần đây
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Khuyến nghị */}
          {healthAssessment?.recommendations && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">💡 Khuyến nghị:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {healthAssessment.recommendations.slice(0, 3).map((rec: string, index: number) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cảnh báo */}
          {healthAssessment?.redFlags && healthAssessment.redFlags.length > 0 && (
            <Alert
              message="⚠️ Cần chú ý"
              description={
                <ul className="mt-2">
                  {healthAssessment.redFlags.map((flag: string, index: number) => (
                    <li key={index}>• {flag}</li>
                  ))}
                </ul>
              }
              type="error"
              showIcon
            />
          )}
        </div>
      </Card>
    </div>
  );
};

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
  const [selectedCycleDay, setSelectedCycleDay] = useState<any>(null);

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

  const handleDeleteCycleDay = async () => {
    if (!selectedCycleDay?._id) {
      notification.error({
        message: 'Lỗi',
        description: 'Không tìm thấy dữ liệu để xóa'
      });
      return;
    }

    // Kiểm tra nếu đây là ngày bắt đầu chu kỳ
    const isStartDay = currentCycle && 
      dayjs(selectedDate).isSame(dayjs(currentCycle.startDate), 'day');

    if (isStartDay) {
      notification.error({
        message: 'Không thể xóa ngày bắt đầu chu kỳ',
        description: 'Ngày bắt đầu chu kỳ không thể xóa vì sẽ làm hỏng cấu trúc dữ liệu. Nếu cần thay đổi, hãy sử dụng "Đổi ngày bắt đầu".',
        duration: 8
      });
      return;
    }

    // Kiểm tra nếu là ngày đầu tiên có dữ liệu
    try {
      const cycleDaysResponse = await menstrualCycleApi.getCycleDays(currentCycle!._id);
      const cycleDays = (cycleDaysResponse as any)?.data?.data || [];
      
      if (cycleDays.length > 0) {
        const sortedDays = cycleDays.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const firstDay = sortedDays[0];
        
        if (selectedCycleDay._id === firstDay._id) {
          notification.warning({
            message: 'Cảnh báo: Đây là ngày đầu tiên có dữ liệu',
            description: 'Xóa ngày này có thể ảnh hưởng đến việc tính toán chu kỳ. Bạn có chắc chắn muốn tiếp tục?',
            duration: 6,
            btn: (
              <div className="space-x-2">
                <Button size="small" onClick={() => notification.destroy()}>
                  Hủy
                </Button>
                <Button 
                  size="small" 
                  danger 
                  onClick={() => {
                    notification.destroy();
                    performDelete();
                  }}
                >
                  Vẫn xóa
                </Button>
              </div>
            )
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking cycle days:', error);
    }

    await performDelete();
  };

  const performDelete = async () => {
    try {
      await menstrualCycleApi.deleteCycleDay(selectedCycleDay!._id);
      
      notification.success({
        message: 'Thành công',
        description: 'Đã xóa dữ liệu ngày thành công'
      });
      
      setLogModalVisible(false);
      form.resetFields();
      setSelectedCycleDay(null);
      
      // Reload data
      await loadCalendarData(selectedDate.month() + 1, selectedDate.year());
      await loadCycleData();
      await loadCycleAnalysis();
    } catch (error) {
      console.error('Error deleting cycle day:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể xóa dữ liệu ngày'
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

      // Advanced validation trước khi lưu
      try {
        const advancedValidation = await menstrualCycleApi.validateAdvancedCycleDay({
          cycleId: currentCycle._id,
          date: values.date.format('YYYY-MM-DD'),
          mucusObservation: values.mucusObservation,
          feeling: values.feeling
        });

        const validationData = (advancedValidation as any)?.data?.data;
        
        if (validationData && !validationData.isValid) {
          // Hiển thị errors và không cho lưu
          notification.error({
            message: 'Dữ liệu không hợp lệ',
            description: validationData.errors.join('; '),
            duration: 8
          });
          
          if (validationData.suggestions?.length > 0) {
            notification.info({
              message: 'Gợi ý sửa lỗi',
              description: validationData.suggestions.join('; '),
              duration: 10
            });
          }
          return; // Không lưu
        }
        
        if (validationData?.warnings?.length > 0) {
          // Hiển thị warnings nhưng vẫn cho lưu
          notification.warning({
            message: 'Cảnh báo dữ liệu',
            description: validationData.warnings.join('; '),
            duration: 6
          });
          
          if (validationData.suggestions?.length > 0) {
            notification.info({
              message: 'Gợi ý',
              description: validationData.suggestions.join('; '),
              duration: 8
            });
          }
        }
      } catch (error) {
        console.error('Advanced validation error:', error);
        // Fallback to basic validation
      }

      // Basic validation theo Billings method
      if (values.mucusObservation && values.feeling) {
        const validationResponse = await menstrualCycleApi.validateDayInput({
          mucusObservation: values.mucusObservation,
          feeling: values.feeling
        });

        const validationData = (validationResponse as any)?.data;
        if (validationData?.success && !validationData.data?.isValid) {
          notification.warning({
            message: 'Cảnh báo validation cơ bản',
            description: validationData.data?.warning || 'Sự kết hợp này không phù hợp theo phương pháp Billings'
          });
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
        // Kiểm tra xem có tạo chu kỳ mới không
        if (responseData?.data?.newCycleCreated) {
          notification.success({
            message: '🎉 Chu kỳ mới được tạo!',
            description: `Chu kỳ cũ đã hoàn thành và hệ thống đã tự động tạo chu kỳ mới (Chu kỳ ${responseData.data.newCycle.cycleNumber})`
          });
          
          // Cập nhật currentCycle về chu kỳ mới
          setCurrentCycle(responseData.data.newCycle);
        } else {
          notification.success({
            message: 'Thành công',
            description: 'Đã ghi nhận dữ liệu chu kỳ'
          });
        }
        
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
      
      // Lưu thông tin cycle day để có thể xóa
      setSelectedCycleDay(dayData.cycleDay);
      
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
      setSelectedCycleDay(null);
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
    (() => {
      // Sắp xếp cycles theo startDate để tính toán chính xác
      const sortedCycles = [...cycles].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      const cycleLengths: number[] = [];
      for (let i = 1; i < sortedCycles.length; i++) {
        const current = dayjs(sortedCycles[i].startDate);
        const previous = dayjs(sortedCycles[i - 1].startDate);
        const length = current.diff(previous, 'days');
        
        // Chỉ tính chu kỳ hợp lệ (21-60 ngày)
        if (length >= 21 && length <= 60) {
          cycleLengths.push(length);
        }
      }
      
      return cycleLengths.length > 0 ? 
        cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length : 28;
    })() : 28;

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

  // const nextOnboardingStep = () => {
  //   if (onboardingStep < 4) {
  //     setOnboardingStep(onboardingStep + 1);
  //   } else {
  //     completeOnboarding();
  //   }
  // };

  // const prevOnboardingStep = () => {
  //   if (onboardingStep > 0) {
  //     setOnboardingStep(onboardingStep - 1);
  //   }
  // };

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
              <Tooltip title="Sửa chữa dữ liệu chu kỳ bị lỗi (xóa nhầm, số thứ tự sai)">
                <Button 
                  icon={<ReloadOutlined />} 
                  size="large"
                  onClick={async () => {
                    try {
                      const response = await menstrualCycleApi.autoFixCycleData();
                      const responseData = (response as any)?.data;
                      
                      if (responseData?.success) {
                        notification.success({
                          message: 'Sửa chữa thành công',
                          description: responseData.data?.message || 'Đã sửa chữa dữ liệu chu kỳ',
                          duration: 5
                        });
                        
                        // Reload tất cả dữ liệu
                        await loadCycleData();
                        await loadCalendarData(selectedDate.month() + 1, selectedDate.year());
                        await loadCycleAnalysis();
                      }
                    } catch (error) {
                      console.error('Auto fix error:', error);
                      notification.error({
                        message: 'Lỗi sửa chữa',
                        description: 'Không thể sửa chữa dữ liệu tự động'
                      });
                    }
                  }}
                  className="text-gray-700 border-gray-300 hover:text-purple-600 hover:border-purple-300"
                >
                  Sửa chữa
                </Button>
              </Tooltip>
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
                    valueStyle={{ 
                      color: averageCycleLength < 15 ? '#ef4444' : '#ec4899' 
                    }}
                    prefix={<CalendarOutlined />}
                  />
                  {averageCycleLength < 15 && (
                    <div className="mt-2">
                      <Tooltip title="Chu kỳ trung bình bất thường có thể do dữ liệu bị lỗi">
                        <Button 
                          size="small" 
                          type="link" 
                          danger
                          icon={<ReloadOutlined />}
                          onClick={async () => {
                            try {
                              const response = await menstrualCycleApi.autoFixCycleData();
                              const responseData = (response as any)?.data;
                              
                              if (responseData?.success) {
                                notification.success({
                                  message: 'Sửa chữa thành công',
                                  description: responseData.data?.message || 'Đã sửa chữa dữ liệu chu kỳ',
                                });
                                
                                await loadCycleData();
                                await loadCalendarData(selectedDate.month() + 1, selectedDate.year());
                              }
                            } catch (_error) {
                              notification.error({
                                message: 'Lỗi sửa chữa',
                                description: 'Không thể sửa chữa dữ liệu tự động'
                              });
                            }
                          }}
                        >
                          Sửa ngay
                        </Button>
                      </Tooltip>
                    </div>
                  )}
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
                        {/* Current Cycle Overview */}
                        {currentCycle && (
                          <CurrentCycleOverview currentCycle={currentCycle} />
                        )}

                        {/* Detailed Cycle Report with Chart */}
                        {currentCycle && (
                          <CycleReportSection currentCycle={currentCycle} />
                        )}

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
                                      } catch (_error) {
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
              setSelectedCycleDay(null);
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

              <Form.Item className="mb-0">
                <div className="flex justify-between items-center">
                  {/* Nút xóa bên trái - chỉ hiển thị khi có dữ liệu */}
                  <div>
                    {selectedCycleDay && (
                      <Popconfirm
                        title="Xóa dữ liệu ngày này?"
                        description={`Bạn có chắc chắn muốn xóa tất cả dữ liệu đã ghi nhận cho ngày ${selectedDate.format('DD/MM/YYYY')}? Hành động này không thể hoàn tác.`}
                        onConfirm={handleDeleteCycleDay}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button 
                          danger 
                          icon={<DeleteOutlined />}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Xóa dữ liệu
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                  
                  {/* Nút hủy và lưu bên phải */}
                  <div>
                    <Button 
                      onClick={() => {
                        setLogModalVisible(false);
                        form.resetFields();
                        setSelectedCycleDay(null);
                      }}
                      className="mr-2 text-gray-700 border-gray-300"
                    >
                      Hủy
                    </Button>
                    <Button type="primary" htmlType="submit" className="bg-pink-500 hover:bg-pink-600 border-pink-500">
                      {selectedCycleDay ? 'Cập nhật' : 'Lưu'}
                    </Button>
                  </div>
                </div>
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