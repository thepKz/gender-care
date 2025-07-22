import React, { useState } from 'react';
import {
  Card,
  Button,
  Table,
  message,
  Space,
  Typography,
  Steps,
  Tag,
  Modal,
  Descriptions,
  Alert,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;

/**
 * Demo Flow 5: Appointment → Xét nghiệm → Báo cáo hồ sơ bệnh án
 * Mô phỏng quy trình hoàn chỉnh từ appointment có kết quả đến medical record
 */
const Flow5Demo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMedicalRecord, setShowMedicalRecord] = useState(false);

  // Mock data - Appointment "Hoàn thành kết quả"
  const mockAppointment = {
    _id: '669d6e566ac20fecfe414a8',
    appointmentDate: '2025-07-29',
    appointmentTime: '14:00-15:00',
    status: 'done_testResult',
    profileName: 'Thanh Long',
    doctorName: 'Thanh Long Nguyen Tran',
    service: 'Xét nghiệm máu tổng quát',
    cost: 150000,
    paymentStatus: 'paid',
    symptoms: 'Mệt mỏi, chóng mặt, khó ngủ',
    notes: 'Cần xét nghiệm để kiểm tra tình trạng sức khỏe tổng quát'
  };

  // Mock test results
  const mockTestResults = {
    diagnosis: 'Thiếu máu nhẹ, vitamin D thấp',
    recommendations: 'Bổ sung sắt và vitamin D, tái khám sau 1 tháng',
    testItems: [
      { name: 'Hemoglobin', value: '10.5', unit: 'g/dL', normalRange: '12.0-15.5', flag: 'low' },
      { name: 'Hematocrit', value: '32%', unit: '%', normalRange: '36-46%', flag: 'low' },
      { name: 'Vitamin D', value: '15', unit: 'ng/mL', normalRange: '30-100', flag: 'low' },
      { name: 'Glucose', value: '95', unit: 'mg/dL', normalRange: '70-100', flag: 'normal' },
      { name: 'Cholesterol', value: '180', unit: 'mg/dL', normalRange: '<200', flag: 'normal' }
    ]
  };

  // Mock medical record được tạo
  const mockMedicalRecord = {
    _id: '669d6e566ac20fecfe414a9',
    appointmentId: mockAppointment._id,
    profileName: mockAppointment.profileName,
    doctorName: mockAppointment.doctorName,
    conclusion: mockTestResults.diagnosis,
    symptoms: mockAppointment.symptoms,
    treatment: mockTestResults.recommendations,
    testResults: mockTestResults.testItems,
    status: 'completed',
    createdAt: new Date().toISOString(),
    notes: `Tự động tạo từ appointment ${mockAppointment._id} - ${new Date().toISOString()}`
  };

  const steps = [
    {
      title: 'Appointment Hoàn Thành',
      description: 'Appointment có trạng thái "Hoàn thành kết quả"',
      icon: <CalendarOutlined />
    },
    {
      title: 'Kết Quả Xét Nghiệm',
      description: 'Có kết quả xét nghiệm chi tiết',
      icon: <ExperimentOutlined />
    },
    {
      title: 'Đồng Bộ Medical Record',
      description: 'Tự động tạo medical record từ appointment',
      icon: <SyncOutlined />
    },
    {
      title: 'Hồ Sơ Bệnh Án',
      description: 'Medical record xuất hiện trong hồ sơ bệnh án',
      icon: <FileTextOutlined />
    }
  ];

  const handleNextStep = async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      if (currentStep === 2) {
        message.success('Đồng bộ medical record thành công!');
      }
    }
    
    setLoading(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setShowMedicalRecord(false);
  };

  const testResultColumns = [
    {
      title: 'Chỉ số',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Kết quả',
      dataIndex: 'value',
      key: 'value',
      render: (value: string, record: any) => (
        <Text strong={record.flag !== 'normal'}>
          {value} {record.unit}
        </Text>
      )
    },
    {
      title: 'Giá trị bình thường',
      dataIndex: 'normalRange',
      key: 'normalRange'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'flag',
      key: 'flag',
      render: (flag: string) => {
        const config = {
          'normal': { color: 'green', text: 'Bình thường' },
          'low': { color: 'orange', text: 'Thấp' },
          'high': { color: 'red', text: 'Cao' }
        };
        const { color, text } = config[flag] || { color: 'default', text: flag };
        return <Tag color={color}>{text}</Tag>;
      }
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <ExperimentOutlined style={{ marginRight: 8 }} />
            Flow 5 Demo: Appointment → Xét nghiệm → Báo cáo hồ sơ bệnh án
          </Title>
          <Text type="secondary">
            Mô phỏng quy trình hoàn chỉnh từ appointment "Hoàn thành kết quả" đến medical record
          </Text>
        </div>

        {/* Progress Steps */}
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={index <= currentStep ? <CheckCircleOutlined /> : step.icon}
              status={index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait'}
            />
          ))}
        </Steps>

        {/* Step Content */}
        <div style={{ minHeight: '400px' }}>
          {/* Step 0: Appointment Details */}
          {currentStep === 0 && (
            <Card title="📅 Appointment 'Hoàn thành kết quả'" type="inner">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="ID">{mockAppointment._id}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color="green">Hoàn thành kết quả</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn">{mockAppointment.appointmentDate}</Descriptions.Item>
                <Descriptions.Item label="Giờ hẹn">{mockAppointment.appointmentTime}</Descriptions.Item>
                <Descriptions.Item label="Bệnh nhân">{mockAppointment.profileName}</Descriptions.Item>
                <Descriptions.Item label="Bác sĩ">{mockAppointment.doctorName}</Descriptions.Item>
                <Descriptions.Item label="Dịch vụ">{mockAppointment.service}</Descriptions.Item>
                <Descriptions.Item label="Chi phí">{mockAppointment.cost.toLocaleString()} ₫</Descriptions.Item>
                <Descriptions.Item label="Triệu chứng" span={2}>{mockAppointment.symptoms}</Descriptions.Item>
                <Descriptions.Item label="Ghi chú" span={2}>{mockAppointment.notes}</Descriptions.Item>
              </Descriptions>
              
              <Alert
                message="Appointment đã hoàn thành và có kết quả xét nghiệm"
                description="Trạng thái 'done_testResult' cho thấy appointment này đã có kết quả xét nghiệm và sẵn sàng để tạo medical record."
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>
          )}

          {/* Step 1: Test Results */}
          {currentStep === 1 && (
            <Card title="🧪 Kết quả xét nghiệm" type="inner">
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="Chẩn đoán"
                      value={mockTestResults.diagnosis}
                      valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="Khuyến nghị"
                      value={mockTestResults.recommendations}
                      valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Table
                columns={testResultColumns}
                dataSource={mockTestResults.testItems}
                rowKey="name"
                pagination={false}
                size="small"
              />

              <Alert
                message="Kết quả xét nghiệm đã sẵn sàng"
                description="Có đầy đủ thông tin chẩn đoán, khuyến nghị và chi tiết các chỉ số xét nghiệm để tạo medical record."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>
          )}

          {/* Step 2: Sync Process */}
          {currentStep === 2 && (
            <Card title="🔄 Đồng bộ Medical Record" type="inner">
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <SyncOutlined spin style={{ fontSize: '48px', color: '#1890ff', marginBottom: 16 }} />
                <Title level={4}>Đang tạo Medical Record...</Title>
                <Text type="secondary">
                  Hệ thống đang tự động tạo medical record từ appointment và kết quả xét nghiệm
                </Text>
                
                <div style={{ marginTop: 24 }}>
                  <Text>✅ Lấy thông tin appointment</Text><br />
                  <Text>✅ Lấy kết quả xét nghiệm</Text><br />
                  <Text>✅ Tạo medical record</Text><br />
                  <Text>✅ Lưu vào database</Text><br />
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Medical Record Created */}
          {currentStep === 3 && (
            <Card title="📋 Medical Record đã được tạo" type="inner">
              <Alert
                message="Thành công!"
                description="Medical record đã được tự động tạo và lưu vào hồ sơ bệnh án."
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Descriptions bordered column={2}>
                <Descriptions.Item label="Medical Record ID">{mockMedicalRecord._id}</Descriptions.Item>
                <Descriptions.Item label="Appointment ID">{mockMedicalRecord.appointmentId}</Descriptions.Item>
                <Descriptions.Item label="Bệnh nhân">{mockMedicalRecord.profileName}</Descriptions.Item>
                <Descriptions.Item label="Bác sĩ">{mockMedicalRecord.doctorName}</Descriptions.Item>
                <Descriptions.Item label="Kết luận">{mockMedicalRecord.conclusion}</Descriptions.Item>
                <Descriptions.Item label="Điều trị">{mockMedicalRecord.treatment}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color="green">Hoàn thành</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {new Date(mockMedicalRecord.createdAt).toLocaleString('vi-VN')}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => setShowMedicalRecord(true)}
                >
                  Xem chi tiết Medical Record
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space>
            <Button onClick={handleReset}>Reset Demo</Button>
            {currentStep < steps.length - 1 && (
              <Button
                type="primary"
                onClick={handleNextStep}
                loading={loading}
                icon={currentStep === 2 ? <SyncOutlined /> : undefined}
              >
                {currentStep === 2 ? 'Đồng bộ Medical Record' : 'Tiếp theo'}
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Medical Record Detail Modal */}
      <Modal
        title="Chi tiết Medical Record"
        open={showMedicalRecord}
        onCancel={() => setShowMedicalRecord(false)}
        footer={null}
        width={800}
      >
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="ID">{mockMedicalRecord._id}</Descriptions.Item>
          <Descriptions.Item label="Bệnh nhân">{mockMedicalRecord.profileName}</Descriptions.Item>
          <Descriptions.Item label="Bác sĩ">{mockMedicalRecord.doctorName}</Descriptions.Item>
          <Descriptions.Item label="Triệu chứng">{mockMedicalRecord.symptoms}</Descriptions.Item>
          <Descriptions.Item label="Kết luận">{mockMedicalRecord.conclusion}</Descriptions.Item>
          <Descriptions.Item label="Điều trị">{mockMedicalRecord.treatment}</Descriptions.Item>
          <Descriptions.Item label="Ghi chú">{mockMedicalRecord.notes}</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16 }}>
          <Title level={5}>Kết quả xét nghiệm chi tiết:</Title>
          <Table
            columns={testResultColumns}
            dataSource={mockMedicalRecord.testResults}
            rowKey="name"
            pagination={false}
            size="small"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Flow5Demo;
