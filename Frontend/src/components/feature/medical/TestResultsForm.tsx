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
import { testResultItemsApi, TestResultTemplate } from '../../../api/endpoints/testManagementApi';

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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const validItems = testItems.filter(item => item.value.trim());
      if (validItems.length === 0) {
        message.error('Vui lòng nhập ít nhất một kết quả xét nghiệm');
        return;
      }
      setSubmitting(true);
      await testResultItemsApi.bulkCreate({
        appointmentId: testResultId,
        items: validItems.map(item => ({
          testCategoryId: item.testCategoryId,
          value: item.value.trim(),
          unit: item.unit,
          flag: form.getFieldValue(['flag', item.testCategoryId]) || 'normal'
        }))
      });
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

              // Lấy thresholdRules từ category nếu có
              const thresholdRules = (category as any).thresholdRules || [];
              const minValue = (category as any).minValue;
              const maxValue = (category as any).maxValue;
              const unit = category.customUnit || category.unit || '';

              // Hàm đánh giá threshold
              const evaluateThreshold = (value: string) => {
                if (!thresholdRules.length || !value) return { flag: 'normal', message: '' };
                
                const valueNum = parseFloat(value);
                if (isNaN(valueNum)) return { flag: 'normal', message: '' };
                
                // Sắp xếp rules theo thứ tự from tăng dần để kiểm tra từ thấp đến cao
                const sortedRules = [...thresholdRules].sort((a, b) => {
                  if (a.from === null) return -1;
                  if (b.from === null) return 1;
                  return a.from - b.from;
                });
                
                let foundRule = null;
                for (const rule of sortedRules) {
                  if (rule.from === null && rule.to === null) {
                    // Rule mặc định (nếu có)
                    foundRule = rule;
                    break;
                  } else if (rule.from !== null && rule.to === null) {
                    // Rule "từ X trở lên"
                    if (valueNum >= rule.from) {
                      foundRule = rule;
                    }
                  } else if (rule.from === null && rule.to !== null) {
                    // Rule "đến X"
                    if (valueNum <= rule.to) {
                      foundRule = rule;
                      break;
                    }
                  } else if (rule.from !== null && rule.to !== null) {
                    // Rule "từ X đến Y"
                    if (valueNum >= rule.from && valueNum <= rule.to) {
                      foundRule = rule;
                      break;
                    }
                  }
                }
                
                return foundRule ? { flag: foundRule.flag, message: foundRule.message } : { flag: 'normal', message: '' };
              };

              // Đánh giá flag và message hiện tại
              const evaluation = evaluateThreshold(testItem.value);
              let flag = evaluation.flag;
              let messageText = evaluation.message;

              // Debug log để kiểm tra
              if (testItem.value) {
                console.log('=== THRESHOLD DEBUG ===');
                console.log('Category:', category.name);
                console.log('Value:', testItem.value, '→ Parsed:', parseFloat(testItem.value));
                console.log('ThresholdRules:', thresholdRules);
                console.log('Evaluation result:', evaluation);
                console.log('========================');
              }

              return (
                <div key={category._id} style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                  <Row align="middle" gutter={12}>
                    <Col flex="220px">
                      <div style={{ fontWeight: 500, fontSize: 15 }}>{category.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{unit}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                        {minValue !== undefined && maxValue !== undefined && (
                          <span>Giá trị dao động: {minValue} - {maxValue}</span>
                        )}
                      </div>
                    </Col>
                    <Col flex="180px">
                      <Form.Item style={{ marginBottom: 0 }} required={category.isRequired}>
                        <Input
                          value={testItem.value}
                          onChange={e => {
                            const v = e.target.value;
                            setTestItems(prev => prev.map(item =>
                              item.testCategoryId === category._id ? { ...item, value: v } : item
                            ));
                            // Tự động set flag nếu có rule - sử dụng lại hàm evaluateThreshold
                            const evaluation = evaluateThreshold(v);
                            if (evaluation.flag !== 'normal') {
                              form.setFieldValue(['flag', category._id], evaluation.flag);
                            }
                          }}
                          placeholder="Nhập kết quả"
                        />
                      </Form.Item>
                    </Col>
                    <Col flex="140px">
                      <div style={{ 
                        padding: '4px 11px', 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '6px',
                        backgroundColor: flag === 'normal' ? '#f6ffed' : 
                                      flag === 'low' || flag === 'very_low' ? '#fff2e8' :
                                      flag === 'mild_high' ? '#fff7e6' :
                                      flag === 'high' ? '#fff1f0' : '#ffe7e7',
                        color: flag === 'normal' ? '#52c41a' : 
                               flag === 'low' || flag === 'very_low' ? '#fa8c16' :
                               flag === 'mild_high' ? '#fa8c16' :
                               flag === 'high' ? '#f5222d' : '#a8071a',
                        fontWeight: 500,
                        fontSize: 13,
                        textAlign: 'center' as const
                      }}>
                        {flag === 'very_low' ? 'Rất thấp' :
                         flag === 'low' ? 'Thấp' :
                         flag === 'normal' ? 'Bình thường' :
                         flag === 'mild_high' ? 'Hơi cao' :
                         flag === 'high' ? 'Cao' :
                         flag === 'critical' ? 'Nguy kịch' : 'Bình thường'}
                      </div>
                    </Col>
                  </Row>
                  {/* Message đánh giá */}
                  {messageText && (
                    <div style={{ fontSize: 12, color: '#fa8c16', marginTop: 2 }}>{messageText}</div>
                  )}
                </div>
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

        <Form layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="Chẩn đoán (diagnosis)" name="diagnosis">
            <TextArea rows={2} placeholder="Nhập chẩn đoán cho xét nghiệm (nếu có)" />
          </Form.Item>
          <Form.Item label="Khuyến nghị (recommendations)" name="recommendations">
            <TextArea rows={2} placeholder="Nhập khuyến nghị cho bệnh nhân (nếu có)" />
          </Form.Item>
        </Form>
      </Form>
    </Modal>
  );
}; 