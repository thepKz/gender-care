import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
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
  Divider,
  Spin,
  Alert
} from 'antd';
import {
  ExperimentOutlined,
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  testResultItemsApi, 
  TestResultTemplate, 
  AutoEvaluateData, 
  EvaluationResult 
} from '../../../api/endpoints/testManagementApi';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

interface TestResultsFormProps {
  serviceId: string;
  testResultId: string;
  patientName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  visible?: boolean;
}

interface TestItemInput {
  testCategoryId: string;
  value: string;
  unit?: string;
  notes?: string;
  evaluation?: EvaluationResult;
}

export const TestResultsForm: React.FC<TestResultsFormProps> = ({
  serviceId,
  testResultId,
  patientName,
  onSuccess,
  onCancel,
  visible = true
}) => {
  const [template, setTemplate] = useState<TestResultTemplate | null>(null);
  const [testItems, setTestItems] = useState<TestItemInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Load template
  useEffect(() => {
    if (visible && serviceId) {
      loadTemplate();
    }
  }, [serviceId, visible]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await testResultItemsApi.getTemplate(serviceId);
      setTemplate(data);
      
      // Initialize test items
      const items: TestItemInput[] = data.testCategories.map(cat => ({
        testCategoryId: cat._id,
        value: '',
        unit: cat.customUnit || cat.unit,
        notes: ''
      }));
      setTestItems(items);
      
      // Set form values
      form.setFieldsValue({
        serviceName: data.serviceName,
        patientName: patientName,
        testDate: dayjs()
      });
    } catch (error) {
      message.error('Lỗi khi tải template');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateTestItem = (testCategoryId: string, field: keyof TestItemInput, value: string) => {
    setTestItems(prev => prev.map(item => 
      item.testCategoryId === testCategoryId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  const evaluateValue = async (testCategoryId: string, value: string) => {
    if (!value.trim()) return;

    try {
      setEvaluating(testCategoryId);
      const evaluation = await testResultItemsApi.evaluateValue({
        serviceId,
        testCategoryId,
        value: value.trim()
      });

      setTestItems(prev => prev.map(item => 
        item.testCategoryId === testCategoryId 
          ? { ...item, evaluation }
          : item
      ));
    } catch (error) {
      message.error('Lỗi khi đánh giá giá trị');
      console.error(error);
    } finally {
      setEvaluating(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const validItems = testItems.filter(item => item.value.trim());
      if (validItems.length === 0) {
        message.error('Vui lòng nhập ít nhất một kết quả xét nghiệm');
        return;
      }

      setSubmitting(true);
      
      const data: AutoEvaluateData = {
        testResultId,
        serviceId,
        testItems: validItems.map(item => ({
          testCategoryId: item.testCategoryId,
          value: item.value.trim(),
          unit: item.unit,
          notes: item.notes
        }))
      };

      await testResultItemsApi.bulkCreateWithAutoEvaluation(data);
      message.success('Lưu kết quả xét nghiệm thành công!');
      onSuccess?.();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setTestItems([]);
    onCancel?.();
  };

  const getEvaluationBadge = (evaluation: EvaluationResult) => {
    if (evaluation.isNormal) {
      return <Tag color="success" icon={<CheckCircleOutlined />}>Bình thường</Tag>;
    }
    if (evaluation.isHigh) {
      return <Tag color="error" icon={<ExclamationCircleOutlined />}>Cao</Tag>;
    }
    if (evaluation.isLow) {
      return <Tag color="warning" icon={<CloseCircleOutlined />}>Thấp</Tag>;
    }
    return null;
  };

  if (loading) {
    return (
      <Modal
        title="Nhập kết quả xét nghiệm"
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Đang tải template...</Text>
          </div>
        </div>
      </Modal>
    );
  }

  if (!template) {
    return (
      <Modal
        title="Nhập kết quả xét nghiệm"
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
          <Title level={4}>Không thể tải template</Title>
          <Text type="secondary">Không thể tải template cho dịch vụ này</Text>
          <div style={{ marginTop: 16 }}>
            <Button onClick={handleCancel}>Quay lại</Button>
          </div>
        </div>
      </Modal>
    );
  }

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
            <ExperimentOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
              Nhập kết quả xét nghiệm
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
              Cập nhật kết quả xét nghiệm cho bệnh nhân
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={1000}
      footer={[
        <Button key="cancel" size="large" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          size="large"
          loading={submitting}
          onClick={handleSubmit}
        >
          Lưu kết quả
        </Button>
      ]}
      styles={{
        footer: {
          textAlign: 'right',
          paddingTop: '20px',
          borderTop: '1px solid #f0f0f0'
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        {/* Header Information */}
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="serviceName"
                label="Dịch vụ"
              >
                <Input 
                  prefix={<MedicineBoxOutlined />} 
                  disabled 
                  style={{ backgroundColor: '#fafafa' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="patientName"
                label="Bệnh nhân"
              >
                <Input 
                  prefix={<UserOutlined />} 
                  disabled 
                  style={{ backgroundColor: '#fafafa' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="testDate"
                label="Ngày xét nghiệm"
                rules={[{ required: true, message: 'Vui lòng chọn ngày xét nghiệm!' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày xét nghiệm"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Test Results */}
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            <ExperimentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Kết quả xét nghiệm
          </Title>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {template.testCategories.map((category) => {
              const testItem = testItems.find(item => item.testCategoryId === category._id);
              if (!testItem) return null;

              return (
                <Card 
                  key={category._id}
                  size="small" 
                  style={{ marginBottom: 12, border: '1px solid #d9d9d9' }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Text strong style={{ fontSize: '14px' }}>
                          {category.name}
                          {category.isRequired && (
                            <Tag color="red" style={{ marginLeft: 8 }}>Bắt buộc</Tag>
                          )}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Khoảng bình thường: <Text strong>
                              {category.customNormalRange || category.normalRange}
                              {' '}
                              {category.customUnit || category.unit}
                            </Text>
                          </Text>
                        </div>
                        {category.targetValue && (
                          <div style={{ marginTop: 2 }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Giá trị mục tiêu: <Text strong>{category.targetValue}</Text>
                            </Text>
                          </div>
                        )}
                        {category.notes && (
                          <div style={{ marginTop: 2 }}>
                            <Text type="secondary" style={{ fontSize: '12px', color: '#1890ff' }}>
                              {category.notes}
                            </Text>
                          </div>
                        )}
                      </div>
                      {testItem.evaluation && getEvaluationBadge(testItem.evaluation)}
                    </div>
                  </div>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="Kết quả"
                        required={category.isRequired}
                      >
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Input
                            value={testItem.value}
                            onChange={(e) => updateTestItem(category._id, 'value', e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                evaluateValue(category._id, e.target.value);
                              }
                            }}
                            placeholder="Nhập kết quả"
                            suffix={evaluating === category._id ? <Spin size="small" /> : null}
                          />
                        </div>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Đơn vị">
                        <Input
                          value={testItem.unit || ''}
                          onChange={(e) => updateTestItem(category._id, 'unit', e.target.value)}
                          placeholder="Đơn vị"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Ghi chú">
                        <Input
                          value={testItem.notes || ''}
                          onChange={(e) => updateTestItem(category._id, 'notes', e.target.value)}
                          placeholder="Ghi chú thêm"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Evaluation Result */}
                  {testItem.evaluation && (
                    <Alert
                      message="Đánh giá kết quả"
                      description={
                        <div>
                          <Text>{testItem.evaluation.evaluation}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Khoảng hiệu lực: {testItem.evaluation.effectiveRange} {testItem.evaluation.effectiveUnit}
                          </Text>
                        </div>
                      }
                      type={testItem.evaluation.isNormal ? 'success' : testItem.evaluation.isHigh ? 'error' : 'warning'}
                      showIcon
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <Card size="small" style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: '#fa8c16', marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 500, color: '#ad6800', marginBottom: 4 }}>
                Lưu ý quan trọng
              </div>
              <div style={{ color: '#ad6800', fontSize: '13px', lineHeight: '1.5' }}>
                • Hệ thống sẽ tự động đánh giá kết quả dựa trên khoảng bình thường<br/>
                • Vui lòng kiểm tra kỹ các giá trị trước khi lưu<br/>
                • Kết quả sẽ được gửi cho bệnh nhân sau khi lưu
              </div>
            </div>
          </div>
        </Card>
      </Form>
    </Modal>
  );
}; 