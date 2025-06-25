import React, { useState, useEffect } from 'react';
import {
  Modal,
  Descriptions,
  Button,
  message,
  Row,
  Col,
  Card,
  Avatar,
  Typography,
  Space,
  Tabs,
  Tag,
  List,
  Spin
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface AppointmentData {
  _id: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
}

interface MedicalRecordData {
  _id: string;
  appointmentId: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes?: string;
  medicines: Array<{
    id: string;
    name: string;
    type: string;
    dosage: string;
    frequency: number;
    timingInstructions: string;
    duration?: string;
    instructions: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ViewMedicalRecordModalProps {
  visible: boolean;
  appointment: AppointmentData | null;
  onCancel: () => void;
}

const ViewMedicalRecordModal: React.FC<ViewMedicalRecordModalProps> = ({
  visible,
  appointment,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordData | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const medicineTypes = [
    { value: 'contraceptive', label: 'Thuốc tránh thai', color: 'purple' },
    { value: 'vitamin', label: 'Vitamin/Thực phẩm chức năng', color: 'green' },
    { value: 'antibiotic', label: 'Kháng sinh', color: 'red' },
    { value: 'painkiller', label: 'Thuốc giảm đau', color: 'blue' },
    { value: 'other', label: 'Thuốc khác', color: 'default' }
  ];

  const getMedicineTypeColor = (type: string) => {
    const typeConfig = medicineTypes.find(t => t.value === type);
    return typeConfig?.color || 'default';
  };

  const getMedicineTypeLabel = (type: string) => {
    const typeConfig = medicineTypes.find(t => t.value === type);
    return typeConfig?.label || 'Khác';
  };

  const fetchMedicalRecord = async () => {
    if (!appointment) return;

    setLoading(true);
    try {
      // TODO: Replace with real API call
      console.log('Fetching medical record for appointment:', appointment._id);
      
      // Mock delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demo
      const mockRecord: MedicalRecordData = {
        _id: 'record-' + appointment._id,
        appointmentId: appointment._id,
        diagnosis: 'Viêm âm đạo do nấm Candida',
        symptoms: 'Ngứa, khí hư bất thường có màu trắng, đau rát khi tiểu',
        treatment: 'Điều trị bằng thuốc kháng nấm tại chỗ và toàn thân. Khuyến cáo vệ sinh cá nhân sạch sẽ, tránh tình trạng ẩm ướt. Tái khám sau 1 tuần.',
        notes: 'Bệnh nhân cần kiêng quan hệ tình dục trong thời gian điều trị. Nếu triệu chứng không cải thiện sau 5 ngày, cần tái khám sớm.',
        medicines: [
          {
            id: '1',
            name: 'Fluconazole',
            type: 'antibiotic',
            dosage: '150mg',
            frequency: 1,
            timingInstructions: 'Uống 1 lần',
            duration: '1 ngày',
            instructions: 'Uống 1 viên duy nhất, có thể uống cùng hoặc không cùng thức ăn'
          },
          {
            id: '2',
            name: 'Miconazole cream',
            type: 'other',
            dosage: '2%',
            frequency: 2,
            timingInstructions: 'Sáng và tối',
            duration: '7 ngày',
            instructions: 'Thoa mỏng lên vùng bị ảnh hưởng sau khi vệ sinh sạch sẽ'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setMedicalRecord(mockRecord);
      
    } catch (error) {
      console.error('Failed to fetch medical record:', error);
      message.error('Không thể tải thông tin bệnh án. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && appointment) {
      fetchMedicalRecord();
      setActiveTab('basic');
    }
  }, [visible, appointment]);

  const handleCancel = () => {
    setMedicalRecord(null);
    setActiveTab('basic');
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
            backgroundColor: '#e6f7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <EyeOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
              Xem bệnh án
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
        <Button key="close" size="large" onClick={handleCancel}>
          Đóng
        </Button>
      ]}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>
            Đang tải thông tin bệnh án...
          </div>
        </div>
      ) : (
        <>
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
                    <Descriptions.Item label="Ngày khám">
                      <CalendarOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                      {dayjs(appointment.appointmentDate).format('DD/MM/YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Giờ khám">
                      <ClockCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                      {appointment.appointmentTime}
                    </Descriptions.Item>
                    {medicalRecord && (
                      <>
                        <Descriptions.Item label="Ngày tạo bệnh án">
                          <span style={{ color: '#666' }}>
                            {dayjs(medicalRecord.createdAt).format('DD/MM/YYYY HH:mm')}
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Cập nhật cuối">
                          <span style={{ color: '#666' }}>
                            {dayjs(medicalRecord.updatedAt).format('DD/MM/YYYY HH:mm')}
                          </span>
                        </Descriptions.Item>
                      </>
                    )}
                  </Descriptions>
                </Col>
              </Row>
            </Card>
          )}

          {medicalRecord && (
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Thông tin cơ bản" key="basic">
                <div style={{ padding: '20px 0' }}>
                  <Row gutter={[24, 20]}>
                    <Col span={12}>
                      <Card size="small" style={{ height: '100%' }}>
                        <Title level={5} style={{ marginBottom: '12px', color: '#1890ff' }}>
                          <MedicineBoxOutlined style={{ marginRight: '8px' }} />
                          Chẩn đoán
                        </Title>
                        <Text style={{ fontSize: '16px', fontWeight: 500 }}>
                          {medicalRecord.diagnosis}
                        </Text>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" style={{ height: '100%' }}>
                        <Title level={5} style={{ marginBottom: '12px', color: '#52c41a' }}>
                          Triệu chứng
                        </Title>
                        <Text style={{ fontSize: '16px' }}>
                          {medicalRecord.symptoms}
                        </Text>
                      </Card>
                    </Col>
                  </Row>

                  <Card size="small" style={{ marginTop: '20px' }}>
                    <Title level={5} style={{ marginBottom: '12px', color: '#fa8c16' }}>
                      Phương pháp điều trị
                    </Title>
                    <Text style={{ fontSize: '16px', lineHeight: '1.6' }}>
                      {medicalRecord.treatment}
                    </Text>
                  </Card>

                  {medicalRecord.notes && (
                    <Card size="small" style={{ marginTop: '20px' }}>
                      <Title level={5} style={{ marginBottom: '12px', color: '#722ed1' }}>
                        Ghi chú của bác sĩ
                      </Title>
                      <Text style={{ fontSize: '16px', lineHeight: '1.6', fontStyle: 'italic' }}>
                        {medicalRecord.notes}
                      </Text>
                    </Card>
                  )}
                </div>
              </TabPane>

              <TabPane 
                tab={
                  <Space>
                    <span>Đơn thuốc</span>
                    <Tag color="blue">{medicalRecord.medicines.length}</Tag>
                  </Space>
                } 
                key="medicines"
              >
                <div style={{ padding: '20px 0' }}>
                  {medicalRecord.medicines.length === 0 ? (
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
                          Không có thuốc trong đơn
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <List
                      itemLayout="vertical"
                      dataSource={medicalRecord.medicines}
                      renderItem={(medicine, index) => (
                        <Card 
                          key={medicine.id}
                          size="small"
                          style={{ marginBottom: '16px' }}
                          title={
                            <Space>
                              <Text strong>Thuốc #{index + 1}: {medicine.name}</Text>
                              <Tag color={getMedicineTypeColor(medicine.type)}>
                                {getMedicineTypeLabel(medicine.type)}
                              </Tag>
                            </Space>
                          }
                        >
                          <Row gutter={16}>
                            <Col span={12}>
                              <Descriptions column={1} size="small">
                                <Descriptions.Item label="Liều dùng">
                                  <Text strong>{medicine.dosage}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Số lần/ngày">
                                  <Text strong>{medicine.frequency} lần/ngày</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Thời gian uống">
                                  <Text>{medicine.timingInstructions}</Text>
                                </Descriptions.Item>
                              </Descriptions>
                            </Col>
                            <Col span={12}>
                              <Descriptions column={1} size="small">
                                <Descriptions.Item label="Thời gian điều trị">
                                  <Text strong>{medicine.duration}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Hướng dẫn sử dụng">
                                  <Text style={{ lineHeight: '1.5' }}>
                                    {medicine.instructions}
                                  </Text>
                                </Descriptions.Item>
                              </Descriptions>
                            </Col>
                          </Row>
                        </Card>
                      )}
                    />
                  )}
                </div>
              </TabPane>
            </Tabs>
          )}
        </>
      )}
    </Modal>
  );
};

export default ViewMedicalRecordModal; 