import {
    CalendarOutlined,
    FileTextOutlined,
    HeartOutlined,
    LineChartOutlined,
    PlusOutlined,
    SettingOutlined
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
    Timeline
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import relativeTime from 'dayjs/plugin/relativeTime';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MenstrualCycle } from '../../types';
import './cycle.css';

dayjs.extend(isBetween);
dayjs.extend(relativeTime);

const { TextArea } = Input;

interface CycleLog {
  _id?: string;
  startDate: string;
  endDate?: string;
  flow?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
  mood?: string;
  notes?: string;
}

const CyclePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<MenstrualCycle[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadCycleData();
  }, [isAuthenticated, navigate]);

  const loadCycleData = async () => {
    try {
      setLoading(true);
      // Tạm thời mock data cho đến khi backend sẵn sàng
      // const response = await menstrualCycleApi.getCycles();
      // setCycles(response.data);
      // const predResponse = await menstrualCycleApi.getPredictions();
      // setPredictions(predResponse.data);
      
      // Mock data
      const mockCycles: MenstrualCycle[] = [
        {
          _id: '1',
          createdByUserId: user?._id || '',
          profileId: '',
          startDate: dayjs().subtract(28, 'days').format('YYYY-MM-DD'),
          endDate: dayjs().subtract(23, 'days').format('YYYY-MM-DD'),
          stamp: '',
          symbol: '🔴',
          mood: 'normal',
          observation: 'medium',
          notes: 'Chu kỳ bình thường',
          createdAt: dayjs().subtract(28, 'days').format(),
          updatedAt: dayjs().subtract(28, 'days').format()
        }
      ];
      setCycles(mockCycles);
      
      // Mock predictions
      setPredictions({
        nextPeriod: dayjs().add(3, 'days').format('YYYY-MM-DD'),
        ovulation: dayjs().add(10, 'days').format('YYYY-MM-DD'),
        fertileWindow: {
          start: dayjs().add(8, 'days').format('YYYY-MM-DD'),
          end: dayjs().add(12, 'days').format('YYYY-MM-DD')
        }
      });
    } catch (error) {
      console.error('Error loading cycle data:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tải dữ liệu chu kỳ'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogCycle = async (values: any) => {
    try {
      const logData: CycleLog = {
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        flow: values.flow,
        symptoms: values.symptoms || [],
        mood: values.mood,
        notes: values.notes
      };

      // Tạm thời log ra console
      console.log('Cycle log data:', logData);
      
      // await menstrualCycleApi.createCycleLog(logData);
      
      notification.success({
        message: 'Thành công',
        description: 'Đã ghi nhận chu kỳ kinh nguyệt'
      });
      
      setLogModalVisible(false);
      form.resetFields();
      loadCycleData();
    } catch (error) {
      console.error('Error logging cycle:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể ghi nhận chu kỳ'
      });
    }
  };

  const getCellRender = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const cycleData = cycles.find(cycle => 
      dayjs(dateStr).isBetween(cycle.startDate, cycle.endDate, 'day', '[]')
    );

    if (cycleData) {
      return (
        <div className="cycle-day period">
          <div className="cycle-indicator period-indicator">🔴</div>
        </div>
      );
    }

    if (predictions?.nextPeriod === dateStr) {
      return (
        <div className="cycle-day predicted">
          <div className="cycle-indicator predicted-indicator">📅</div>
        </div>
      );
    }

    if (predictions?.ovulation === dateStr) {
      return (
        <div className="cycle-day ovulation">
          <div className="cycle-indicator ovulation-indicator">🥚</div>
        </div>
      );
    }

    if (predictions?.fertileWindow && 
        dayjs(dateStr).isBetween(predictions.fertileWindow.start, predictions.fertileWindow.end, 'day', '[]')) {
      return (
        <div className="cycle-day fertile">
          <div className="cycle-indicator fertile-indicator">💚</div>
        </div>
      );
    }

    return null;
  };

  const averageCycleLength = cycles.length > 1 ? 
    cycles.reduce((acc, cycle, index) => {
      if (index === 0) return acc;
      const current = dayjs(cycle.startDate);
      const previous = dayjs(cycles[index - 1].startDate);
      return acc + current.diff(previous, 'days');
    }, 0) / (cycles.length - 1) : 28;

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
                Theo dõi chu kỳ kinh nguyệt
              </h1>
              <p className="text-gray-600">
                Quản lý và theo dõi chu kỳ kinh nguyệt của bạn một cách khoa học
              </p>
            </div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="large"
              className="bg-pink-500 hover:bg-pink-600 border-pink-500"
              onClick={() => setLogModalVisible(true)}
            >
              Ghi nhận chu kỳ
            </Button>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center border-pink-200 bg-white/80 backdrop-blur-sm">
                <Statistic
                  title="Chu kỳ trung bình"
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
                  title="Kỳ kinh tiếp theo"
                  value={predictions?.nextPeriod ? dayjs(predictions.nextPeriod).fromNow() : 'Chưa có dữ liệu'}
                  valueStyle={{ color: '#a855f7' }}
                  prefix={<HeartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center border-green-200 bg-white/80 backdrop-blur-sm">
                <Statistic
                  title="Ngày rụng trứng"
                  value={predictions?.ovulation ? dayjs(predictions.ovulation).format('DD/MM') : 'Chưa có'}
                  valueStyle={{ color: '#10b981' }}
                  prefix={<LineChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center border-blue-200 bg-white/80 backdrop-blur-sm">
                <Statistic
                  title="Chu kỳ đã theo dõi"
                  value={cycles.length}
                  suffix="chu kỳ"
                  valueStyle={{ color: '#3b82f6' }}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </motion.div>

        {/* Main Content */}
        <Row gutter={[16, 16]}>
          {/* Calendar */}
          <Col xs={24} lg={16}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card 
                title="Lịch chu kỳ kinh nguyệt"
                className="cycle-calendar-card bg-white/90 backdrop-blur-sm"
                extra={
                  <div className="flex gap-2">
                    <Tag color="red">🔴 Kinh nguyệt</Tag>
                    <Tag color="green">💚 Thời kỳ sinh sản</Tag>
                    <Tag color="orange">🥚 Rụng trứng</Tag>
                    <Tag color="blue">📅 Dự đoán</Tag>
                  </div>
                }
              >
                <Calendar
                  value={selectedDate}
                  onSelect={setSelectedDate}
                  cellRender={getCellRender}
                  className="cycle-calendar"
                />
              </Card>
            </motion.div>
          </Col>

          {/* Side Panel */}
          <Col xs={24} lg={8}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {/* Today's Info */}
              <Card 
                title="Hôm nay" 
                className="bg-white/90 backdrop-blur-sm"
                extra={dayjs().format('DD/MM/YYYY')}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Ngày trong chu kỳ:</span>
                    <Tag color="blue">Ngày {dayjs().diff(dayjs().startOf('month'), 'days') + 1}</Tag>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pha chu kỳ:</span>
                    <Tag color="purple">Pha hoàng thể</Tag>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Khả năng có thai:</span>
                    <Tag color="green">Thấp</Tag>
                  </div>
                </div>
              </Card>

              {/* Predictions */}
              <Card title="Dự đoán" className="bg-white/90 backdrop-blur-sm">
                <Timeline>
                  <Timeline.Item color="red">
                    <div>
                      <strong>Kỳ kinh tiếp theo</strong>
                      <br />
                      {predictions?.nextPeriod ? dayjs(predictions.nextPeriod).format('DD/MM/YYYY') : 'Chưa có dữ liệu'}
                      <br />
                      <small className="text-gray-500">
                        {predictions?.nextPeriod ? dayjs(predictions.nextPeriod).fromNow() : ''}
                      </small>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item color="orange">
                    <div>
                      <strong>Rụng trứng</strong>
                      <br />
                      {predictions?.ovulation ? dayjs(predictions.ovulation).format('DD/MM/YYYY') : 'Chưa có dữ liệu'}
                    </div>
                  </Timeline.Item>
                  <Timeline.Item color="green">
                    <div>
                      <strong>Thời kỳ sinh sản</strong>
                      <br />
                      {predictions?.fertileWindow ? 
                        `${dayjs(predictions.fertileWindow.start).format('DD/MM')} - ${dayjs(predictions.fertileWindow.end).format('DD/MM')}` :
                        'Chưa có dữ liệu'
                      }
                    </div>
                  </Timeline.Item>
                </Timeline>
              </Card>

              {/* Quick Actions */}
              <Card title="Thao tác nhanh" className="bg-white/90 backdrop-blur-sm">
                <div className="space-y-2">
                  <Button 
                    block 
                    icon={<PlusOutlined />}
                    onClick={() => setLogModalVisible(true)}
                  >
                    Ghi nhận triệu chứng
                  </Button>
                  <Button 
                    block 
                    icon={<SettingOutlined />}
                  >
                    Cài đặt nhắc nhở
                  </Button>
                  <Button 
                    block 
                    icon={<LineChartOutlined />}
                  >
                    Xem thống kê
                  </Button>
                </div>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Log Modal */}
        <Modal
          title="Ghi nhận chu kỳ kinh nguyệt"
          open={logModalVisible}
          onCancel={() => {
            setLogModalVisible(false);
            form.resetFields();
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
              startDate: dayjs(),
              flow: 'medium',
              mood: 'normal'
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  label="Ngày bắt đầu"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
                >
                  <DatePicker className="w-full" placeholder="Chọn ngày" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  label="Ngày kết thúc (tuỳ chọn)"
                >
                  <DatePicker className="w-full" placeholder="Chọn ngày" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="flow"
                  label="Lưu lượng"
                >
                  <Select>
                    <Select.Option value="light">Nhẹ</Select.Option>
                    <Select.Option value="medium">Trung bình</Select.Option>
                    <Select.Option value="heavy">Nhiều</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="mood"
                  label="Tâm trạng"
                >
                  <Select>
                    <Select.Option value="happy">Vui vẻ</Select.Option>
                    <Select.Option value="normal">Bình thường</Select.Option>
                    <Select.Option value="sad">Buồn bã</Select.Option>
                    <Select.Option value="irritated">Cáu kỉnh</Select.Option>
                    <Select.Option value="anxious">Lo lắng</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="symptoms"
              label="Triệu chứng"
            >
              <Select mode="multiple" placeholder="Chọn triệu chứng">
                <Select.Option value="cramps">Đau bụng kinh</Select.Option>
                <Select.Option value="headache">Đau đầu</Select.Option>
                <Select.Option value="bloating">Đầy hơi</Select.Option>
                <Select.Option value="breast_tenderness">Đau ngực</Select.Option>
                <Select.Option value="fatigue">Mệt mỏi</Select.Option>
                <Select.Option value="mood_swings">Thay đổi tâm trạng</Select.Option>
                <Select.Option value="acne">Mụn trứng cá</Select.Option>
                <Select.Option value="backache">Đau lưng</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="notes"
              label="Ghi chú"
            >
              <TextArea rows={3} placeholder="Ghi chú thêm về chu kỳ..." />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
              <Button 
                onClick={() => {
                  setLogModalVisible(false);
                  form.resetFields();
                }}
                className="mr-2"
              >
                Huỷ
              </Button>
              <Button type="primary" htmlType="submit" className="bg-pink-500 hover:bg-pink-600 border-pink-500">
                Lưu
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default CyclePage; 