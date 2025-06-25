import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Card,
  Avatar,
  Descriptions,
  Typography,
  Space,
  Tabs,
  Tag,
  List,
  Select,
  Divider
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface AppointmentData {
  _id: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
}

interface MedicalRecordModalProps {
  visible: boolean;
  appointment: AppointmentData | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface Medicine {
  id: string;
  name: string;
  type: string;
  dosage: string;
  frequency: number;
  timingInstructions: string;
  duration?: string;
  instructions: string;
}

const MedicalRecordModal: React.FC<MedicalRecordModalProps> = ({
  visible,
  appointment,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  // Mock data cho thuốc thường dùng
  const commonMedicines = [
    {
      name: 'Paracetamol',
      type: 'painkiller',
      dosage: '500mg',
      defaultFrequency: 3,
      defaultInstructions: 'Uống sau ăn, cách nhau 6-8 tiếng'
    },
    {
      name: 'Amoxicillin',
      type: 'antibiotic',
      dosage: '250mg',
      defaultFrequency: 3,
      defaultInstructions: 'Uống trước ăn 30 phút, hoàn thành đủ liệu trình'
    },
    {
      name: 'Vitamin B Complex',
      type: 'vitamin',
      dosage: '1 viên',
      defaultFrequency: 1,
      defaultInstructions: 'Uống sau ăn sáng'
    },
    {
      name: 'Yasmin (Drospirenone/Ethinyl Estradiol)',
      type: 'contraceptive',
      dosage: '1 viên',
      defaultFrequency: 1,
      defaultInstructions: 'Uống hàng ngày cùng giờ, bắt đầu từ ngày đầu chu kỳ'
    }
  ];

  const medicineTypes = [
    { value: 'contraceptive', label: 'Thuốc tránh thai', color: 'purple' },
    { value: 'vitamin', label: 'Vitamin/Thực phẩm chức năng', color: 'green' },
    { value: 'antibiotic', label: 'Kháng sinh', color: 'red' },
    { value: 'painkiller', label: 'Thuốc giảm đau', color: 'blue' },
    { value: 'other', label: 'Thuốc khác', color: 'default' }
  ];

  useEffect(() => {
    if (appointment && visible) {
      form.setFieldsValue({
        patientName: appointment.patientName,
        patientPhone: appointment.patientPhone,
        appointmentDate: dayjs(appointment.appointmentDate).format('DD/MM/YYYY'),
        appointmentTime: appointment.appointmentTime
      });
    }
  }, [appointment, visible, form]);

  const addMedicine = () => {
    const newMedicine: Medicine = {
      id: Date.now().toString(),
      name: '',
      type: 'other',
      dosage: '',
      frequency: 1,
      timingInstructions: '',
      duration: '',
      instructions: ''
    };
    setMedicines([...medicines, newMedicine]);
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter(med => med.id !== id));
  };

  const updateMedicine = (id: string, field: keyof Medicine, value: any) => {
    setMedicines(medicines.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const addCommonMedicine = (commonMed: typeof commonMedicines[0]) => {
    const newMedicine: Medicine = {
      id: Date.now().toString(),
      name: commonMed.name,
      type: commonMed.type,
      dosage: commonMed.dosage,
      frequency: commonMed.defaultFrequency,
      timingInstructions: commonMed.defaultInstructions,
      duration: '7 ngày',
      instructions: commonMed.defaultInstructions
    };
    setMedicines([...medicines, newMedicine]);
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
        medicines: medicines,
        createdDate: dayjs().format('DD/MM/YYYY HH:mm')
      };
      
      console.log('Creating medical record:', submitData);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success(`Tạo hồ sơ bệnh án thành công cho bệnh nhân ${appointment.patientName}!`);
      form.resetFields();
      setMedicines([]);
      setActiveTab('basic');
      onSuccess();
      
    } catch (error) {
      message.error('Không thể tạo hồ sơ bệnh án. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setMedicines([]);
    setActiveTab('basic');
    onCancel();
  };

  const getMedicineTypeColor = (type: string) => {
    const typeConfig = medicineTypes.find(t => t.value === type);
    return typeConfig?.color || 'default';
  };

  const getMedicineTypeLabel = (type: string) => {
    const typeConfig = medicineTypes.find(t => t.value === type);
    return typeConfig?.label || 'Khác';
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#e6f7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MedicineBoxOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
              Tạo hồ sơ bệnh án
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
              {appointment && `Bệnh nhân: ${appointment.patientName}`}
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={1200}
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
          icon={<MedicineBoxOutlined />}
          style={{
            backgroundColor: '#1890ff',
            borderColor: '#1890ff'
          }}
        >
          Tạo hồ sơ bệnh án
        </Button>
      ]}
    >
      {appointment && (
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
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Thông tin cơ bản" key="basic">
            <div style={{ padding: '16px 0' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label="Chẩn đoán"
                    name="diagnosis"
                    rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán' }]}
                  >
                    <Input 
                      size="large" 
                      placeholder="VD: Viêm âm đạo do nấm Candida"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Triệu chứng"
                    name="symptoms"
                    rules={[{ required: true, message: 'Vui lòng nhập triệu chứng' }]}
                  >
                    <Input 
                      size="large" 
                      placeholder="VD: Ngứa, khí hư bất thường, đau rát"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Phương pháp điều trị"
                name="treatment"
                rules={[{ required: true, message: 'Vui lòng nhập phương pháp điều trị' }]}
                style={{ marginBottom: '16px' }}
              >
                <TextArea
                  rows={3}
                  placeholder="Mô tả chi tiết phương pháp điều trị, lưu ý đặc biệt..."
                />
              </Form.Item>

              <Form.Item
                label="Ghi chú của bác sĩ"
                name="notes"
                style={{ marginBottom: 0 }}
              >
                <TextArea
                  rows={4}
                  placeholder="Các lưu ý, khuyến cáo, lịch tái khám..."
                />
              </Form.Item>
            </div>
          </TabPane>

          <TabPane 
            tab={
              <Space>
                <span>Đơn thuốc</span>
                <Tag color="blue">{medicines.length}</Tag>
              </Space>
            } 
            key="medicines"
          >
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <Space wrap>
                  <Button 
                    type="dashed" 
                    icon={<PlusOutlined />} 
                    onClick={addMedicine}
                  >
                    Thêm thuốc mới
                  </Button>
                  <Divider type="vertical" />
                  <Text strong>Thuốc thường dùng:</Text>
                  {commonMedicines.map((med, index) => (
                    <Button 
                      key={index}
                      size="small"
                      onClick={() => addCommonMedicine(med)}
                    >
                      {med.name}
                    </Button>
                  ))}
                </Space>
              </div>

              {medicines.length === 0 ? (
                <Card 
                  style={{ 
                    textAlign: 'center', 
                    backgroundColor: '#fafafa',
                    border: '2px dashed #d9d9d9'
                  }}
                >
                  <div style={{ padding: '40px' }}>
                    <MedicineBoxOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                    <div style={{ marginTop: '16px', color: '#8c8c8c' }}>
                      Chưa có thuốc nào trong đơn
                    </div>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={addMedicine}
                      style={{ marginTop: '12px' }}
                    >
                      Thêm thuốc đầu tiên
                    </Button>
                  </div>
                </Card>
              ) : (
                <List
                  itemLayout="vertical"
                  dataSource={medicines}
                  renderItem={(medicine, index) => (
                    <Card 
                      key={medicine.id}
                      size="small"
                      style={{ marginBottom: '16px' }}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space>
                            <Text strong>Thuốc #{index + 1}</Text>
                            {medicine.type && (
                              <Tag color={getMedicineTypeColor(medicine.type)}>
                                {getMedicineTypeLabel(medicine.type)}
                              </Tag>
                            )}
                          </Space>
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={() => removeMedicine(medicine.id)}
                          />
                        </div>
                      }
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                              <Text strong>Tên thuốc:</Text>
                              <Input
                                value={medicine.name}
                                onChange={(e) => updateMedicine(medicine.id, 'name', e.target.value)}
                                placeholder="Nhập tên thuốc"
                                style={{ marginTop: '4px' }}
                              />
                            </div>
                            <div>
                              <Text strong>Loại thuốc:</Text>
                              <Select
                                value={medicine.type}
                                onChange={(value) => updateMedicine(medicine.id, 'type', value)}
                                style={{ width: '100%', marginTop: '4px' }}
                              >
                                {medicineTypes.map(type => (
                                  <Option key={type.value} value={type.value}>
                                    <Tag color={type.color}>{type.label}</Tag>
                                  </Option>
                                ))}
                              </Select>
                            </div>
                            <div>
                              <Text strong>Liều dùng:</Text>
                              <Input
                                value={medicine.dosage}
                                onChange={(e) => updateMedicine(medicine.id, 'dosage', e.target.value)}
                                placeholder="VD: 500mg, 1 viên"
                                style={{ marginTop: '4px' }}
                              />
                            </div>
                          </Space>
                        </Col>
                        <Col span={12}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                              <Text strong>Số lần/ngày:</Text>
                              <Select
                                value={medicine.frequency}
                                onChange={(value) => updateMedicine(medicine.id, 'frequency', value)}
                                style={{ width: '100%', marginTop: '4px' }}
                              >
                                {[1,2,3,4,5].map(num => (
                                  <Option key={num} value={num}>{num} lần/ngày</Option>
                                ))}
                              </Select>
                            </div>
                            <div>
                              <Text strong>Thời gian uống:</Text>
                              <Input
                                value={medicine.timingInstructions}
                                onChange={(e) => updateMedicine(medicine.id, 'timingInstructions', e.target.value)}
                                placeholder="VD: Sáng và tối"
                                style={{ marginTop: '4px' }}
                              />
                            </div>
                            <div>
                              <Text strong>Thời gian điều trị:</Text>
                              <Input
                                value={medicine.duration}
                                onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                                placeholder="VD: 7 ngày, 2 tuần"
                                style={{ marginTop: '4px' }}
                              />
                            </div>
                          </Space>
                        </Col>
                      </Row>
                      
                    </Card>
                  )}
                />
              )}
            </div>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

export default MedicalRecordModal;
