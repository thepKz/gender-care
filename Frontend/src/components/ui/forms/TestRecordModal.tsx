import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
  Row,
  Col,
  Typography,
  Card,
  Space,
  Tag,
  Descriptions,
  Avatar,
  Divider
} from 'antd';
import SimpleDatePicker from '../SimpleDatePicker';
import dayjs from 'dayjs';
import {
  UserOutlined,
  PhoneOutlined,
  ExperimentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface AppointmentData {
  _id: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
}

interface TestRecordModalProps {
  visible: boolean;
  appointment: AppointmentData | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface SelectedTest {
  _id: string;
  name: string;
  description: string;
  unit: string;
  normalRange: string;
}

const TestRecordModal: React.FC<TestRecordModalProps> = ({
  visible,
  appointment,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);

  // ✅ Test Categories từ database thật
  const testCategories = [
    { _id: '68550b9a32df881ae033a68b', name: 'Glucose lúc đói', description: 'Đo nồng độ đường huyết sau khi nhịn ăn ít nhất 8 giờ', unit: 'mg/dL', normalRange: '70-100' },
    { _id: '68550b9a32df881ae033a68c', name: 'HbA1c', description: 'Đo nồng độ đường huyết trung bình trong 2-3 tháng qua', unit: '%', normalRange: '4.0-5.6' },
    { _id: '68550b9a32df881ae033a68d', name: 'Glucose sau ăn 2h', description: 'Đo nồng độ đường huyết 2 giờ sau khi ăn', unit: 'mg/dL', normalRange: '<140' },
    { _id: '68550b9a32df881ae033a68e', name: 'Cholesterol toàn phần', description: 'Đo tổng lượng cholesterol trong máu', unit: 'mg/dL', normalRange: '<200' },
    { _id: '68550b9a32df881ae033a68f', name: 'HDL Cholesterol', description: 'Cholesterol tốt - giúp bảo vệ tim mạch', unit: 'mg/dL', normalRange: '>40 (nam), >50 (nữ)' },
    { _id: '68550b9a32df881ae033a690', name: 'LDL Cholesterol', description: 'Cholesterol xấu - có thể gây tắc nghẽn động mạch', unit: 'mg/dL', normalRange: '<100' },
    { _id: '68550b9a32df881ae033a691', name: 'Triglycerides', description: 'Chất béo trong máu có thể gây bệnh tim mạch', unit: 'mg/dL', normalRange: '<150' },
    { _id: '68550b9a32df881ae033a692', name: 'ALT (SGPT)', description: 'Enzyme gan - chỉ báo tổn thương tế bào gan', unit: 'IU/L', normalRange: '7-41' },
    { _id: '68550b9a32df881ae033a693', name: 'AST (SGOT)', description: 'Enzyme gan - chỉ báo tổn thương gan và tim', unit: 'IU/L', normalRange: '13-35' },
    { _id: '68550b9a32df881ae033a694', name: 'Bilirubin toàn phần', description: 'Sản phẩm phân hủy hồng cầu - chỉ báo chức năng gan', unit: 'mg/dL', normalRange: '0.2-1.2' },
    { _id: '68550b9a32df881ae033a695', name: 'Creatinine', description: 'Chỉ báo chức năng thận và khối lượng cơ', unit: 'mg/dL', normalRange: '0.6-1.2 (nam), 0.5-1.1 (nữ)' },
    { _id: '68550b9b32df881ae033a696', name: 'Urea', description: 'Sản phẩm chuyển hóa protein - chỉ báo chức năng thận', unit: 'mg/dL', normalRange: '7-25' },
    { _id: '68550b9b32df881ae033a697', name: 'eGFR', description: 'Tốc độ lọc cầu thận ước tính', unit: 'mL/min/1.73m²', normalRange: '>60' },
    { _id: '68550b9b32df881ae033a698', name: 'TSH', description: 'Hormone kích thích tuyến giáp', unit: 'mIU/L', normalRange: '0.4-4.0' },
    { _id: '68550b9b32df881ae033a699', name: 'Free T4', description: 'Hormone tuyến giáp tự do', unit: 'ng/dL', normalRange: '0.8-1.8' },
    { _id: '68550b9b32df881ae033a69a', name: 'Free T3', description: 'Hormone tuyến giáp hoạt tính tự do', unit: 'pg/mL', normalRange: '2.3-4.2' },
    { _id: '68550b9b32df881ae033a69b', name: 'Hemoglobin', description: 'Protein vận chuyển oxy trong hồng cầu', unit: 'g/dL', normalRange: '12-15 (nữ), 14-17 (nam)' },
    { _id: '68550b9b32df881ae033a69c', name: 'Hematocrit', description: 'Tỷ lệ thể tích hồng cầu trong máu', unit: '%', normalRange: '36-46 (nữ), 41-50 (nam)' },
    { _id: '68550b9b32df881ae033a69d', name: 'Bạch cầu', description: 'Tế bào bạch cầu - chỉ báo nhiễm trùng và miễn dịch', unit: 'cells/μL', normalRange: '4,000-11,000' },
    { _id: '68550b9b32df881ae033a69e', name: 'Tiểu cầu', description: 'Tế bào giúp đông máu', unit: 'cells/μL', normalRange: '150,000-450,000' }
  ];

  useEffect(() => {
    if (appointment && visible) {
      form.setFieldsValue({
        patientName: appointment.patientName,
        patientPhone: appointment.patientPhone,
        testDate: dayjs(appointment.appointmentDate),
        urgentLevel: 'normal'
      });
    }
  }, [appointment, visible, form]);

  const handleTestCategoryChange = (selectedCategoryIds: string[]) => {
    const selected = testCategories.filter(test => selectedCategoryIds.includes(test._id));
    setSelectedTests(selected);
    
    console.log('🧪 [DEBUG] Selected tests:', selected.map(t => t.name));
  };

  const handleSubmit = async (values: any) => {
    if (!appointment) {
      message.error('Không tìm thấy thông tin cuộc hẹn');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...values,
        appointmentId: appointment._id,
        selectedTests: selectedTests,
        testCategories: selectedTests.map(test => test._id)
      };
      
      console.log('Creating test record:', submitData);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success(`Tạo đăng ký xét nghiệm thành công cho bệnh nhân ${appointment.patientName}! Đã chọn ${selectedTests.length} loại xét nghiệm.`);
      form.resetFields();
      setSelectedTests([]);
      onSuccess();
      
    } catch (error) {
      message.error('Không thể tạo đăng ký xét nghiệm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedTests([]);
    onCancel();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#f6ffed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ExperimentOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
              Đăng ký xét nghiệm
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
              {appointment && `Bệnh nhân: ${appointment.patientName}`}
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={900}
      footer={[
        <Button key="cancel" size="large" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          size="large"
          loading={loading}
          onClick={() => form.submit()}
          icon={<ExperimentOutlined />}
          style={{
            backgroundColor: '#52c41a',
            borderColor: '#52c41a'
          }}
        >
          Đăng ký xét nghiệm
        </Button>
      ]}
    >
      {appointment && (
        <>
          <Card 
            size="small" 
            style={{ 
              marginBottom: '24px',
              backgroundColor: '#fafafa',
              border: '1px solid #e8f4fd'
            }}
          >
            <Row gutter={16} align="middle">
              <Col span={4}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar icon={<UserOutlined />} size={48} />
                  <div style={{ fontWeight: 500, fontSize: '14px', marginTop: '8px' }}>
                    {appointment.patientName}
                  </div>
                </div>
              </Col>
              <Col span={20}>
                <Descriptions column={3} size="small">
                  <Descriptions.Item label="Dịch vụ">
                    <Text strong>{appointment.serviceName}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày hẹn">
                    <CalendarOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                    {dayjs(appointment.appointmentDate).format('DD/MM/YYYY')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giờ hẹn">
                    <ClockCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                    {appointment.appointmentTime}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>

          <Divider orientation="left">
            <Space>
              <MedicineBoxOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a', fontWeight: 500 }}>Thông tin xét nghiệm</span>
            </Space>
          </Divider>
        </>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Họ và tên bệnh nhân"
              name="patientName"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input prefix={<UserOutlined />} size="large" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Số điện thoại"
              name="patientPhone"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input prefix={<PhoneOutlined />} size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Chọn các loại xét nghiệm"
          name="testCategories"
          rules={[{ required: true, message: 'Vui lòng chọn ít nhất một loại xét nghiệm' }]}
        >
          <Select
            mode="multiple"
            size="large"
            placeholder="Chọn các loại xét nghiệm cần thực hiện"
            onChange={handleTestCategoryChange}
            showSearch
            filterOption={(input, option) => {
              if (option && option.value) {
                const testItem = testCategories.find(test => test._id === option.value);
                if (testItem) {
                  return testItem.name.toLowerCase().includes(input.toLowerCase()) ||
                         testItem.description.toLowerCase().includes(input.toLowerCase());
                }
              }
              return false;
            }}
          >
            {testCategories.map(test => (
              <Option key={test._id} value={test._id}>
                <div style={{ padding: '4px 0' }}>
                  <div style={{ fontWeight: 500 }}>{test.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{test.description}</div>
                  <Space size="small">
                    <Tag color="blue">{test.unit}</Tag>
                    <Tag color="green">Bình thường: {test.normalRange}</Tag>
                  </Space>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedTests.length > 0 && (
          <Card 
            size="small" 
            style={{ 
              marginBottom: '16px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f'
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Đã chọn {selectedTests.length} loại xét nghiệm:</Text>
            </div>
            <Space wrap>
              {selectedTests.map(test => (
                <Tag key={test._id} color="green">
                  {test.name} ({test.unit})
                </Tag>
              ))}
            </Space>
          </Card>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Ngày lấy mẫu"
              name="testDate"
              rules={[{ required: true }]}
            >
              <SimpleDatePicker
                style={{ width: '100%', height: '40px' }}
                value=""
                onChange={() => {}}
                placeholder="Chọn ngày lấy mẫu"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Mức độ ưu tiên"
              name="urgentLevel"
              rules={[{ required: true }]}
            >
              <Select size="large">
                <Option value="normal">Bình thường</Option>
                <Option value="urgent">Khẩn cấp</Option>
                <Option value="emergency">Cấp cứu</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Ghi chú từ bác sĩ" name="notes">
          <TextArea rows={3} placeholder="Yêu cầu đặc biệt, lưu ý về bệnh nhân..." />
        </Form.Item>

        <Card 
          size="small"
          style={{ 
            backgroundColor: '#fff7e6',
            border: '1px solid #ffd591'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <WarningOutlined style={{ color: '#fa8c16', marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 500, color: '#ad6800', marginBottom: '4px' }}>
                Lưu ý quan trọng
              </div>
              <div style={{ color: '#ad6800', fontSize: '13px', lineHeight: '1.5' }}>
                • Đây là đăng ký các loại xét nghiệm theo yêu cầu của bác sĩ<br/>
                • Kết quả sẽ được cập nhật sau khi hoàn thành xét nghiệm<br/>
                • Nhân viên lab sẽ nhập kết quả và so sánh với chỉ số bình thường
              </div>
            </div>
          </div>
        </Card>
      </Form>
    </Modal>
  );
};

export default TestRecordModal;
