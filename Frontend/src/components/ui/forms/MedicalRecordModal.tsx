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
  Space,
  Typography,
  Select
} from 'antd';
import SimpleDatePicker from '../SimpleDatePicker';
import {
  MedicineBoxOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { UnifiedAppointment } from '../../../types/appointment';
import moment from 'moment';
import medicinesApi, { IMedicine } from '../../../api/endpoints/medicines';
import { preventNonNumericInput } from '../../../utils';
const { Text } = Typography;

interface MedicalRecordModalProps {
  visible: boolean;
  appointment: UnifiedAppointment | null;
  onCancel: () => void;
  onSubmit: (medicalRecordData: MedicalRecordFormData) => Promise<boolean>;
}

export interface MedicalRecordFormData {
  profileId: string;
  doctorId: string;
  appointmentId: string;
  conclusion: string;
  symptoms?: string;
  treatment: string;
  medications?: string;
  notes?: string;
  followUpDate?: string;
}

const MedicalRecordModal: React.FC<MedicalRecordModalProps> = ({
  visible,
  appointment,
  onCancel,
  onSubmit
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [medicineList, setMedicineList] = useState<IMedicine[]>([]);
  const [prescriptions, setPrescriptions] = useState([
    { medicineId: '', name: '', dosage: '', instructions: '', note: '', duration: '' }
  ]);

  useEffect(() => {
    if (visible) {
      medicinesApi.getAllMedicines({ isActive: true }).then(setMedicineList);
    }
  }, [visible]);

  const handlePrescriptionChange = (idx, field, value) => {
    let processedValue = value;
    if (field === 'duration') {
      // Chỉ cho phép nhập số cho trường duration
      processedValue = value.replace(/[^0-9]/g, '');
    }
    setPrescriptions(prev => prev.map((item, i) => i === idx ? { ...item, [field]: processedValue } : item));
  };

  const handleMedicineSelect = (idx, medicineId) => {
    const med = medicineList.find(m => m._id === medicineId);
    setPrescriptions(prev => prev.map((item, i) =>
      i === idx
        ? {
            ...item,
            medicineId,
            name: med?.name || '',
            dosage: med?.defaultDosage || '',
            instructions: med?.defaultTimingInstructions || ''
          }
        : item
    ));
  };

  const handleAddPrescription = () => {
    setPrescriptions(prev => [...prev, { medicineId: '', name: '', dosage: '', instructions: '', note: '', duration: '' }]);
  };

  const handleRemovePrescription = (idx) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      if (!appointment) {
        message.error('Không tìm thấy thông tin lịch hẹn');
        return;
      }

      const medicalRecordData: MedicalRecordFormData = {
        profileId: (appointment.originalData as any)?.profileId?._id || '',
        doctorId: (appointment.originalData as any)?.doctorId?._id || '',
        appointmentId: appointment._id,
        conclusion: values.conclusion,
        symptoms: values.symptoms,
        treatment: values.treatment,
        medications: JSON.stringify(prescriptions),
        notes: values.notes,
        followUpDate: values.followUpDate ? values.followUpDate.format('YYYY-MM-DD') : undefined
      };

      const success = await onSubmit(medicalRecordData);
      
      if (success) {
        message.success('Tạo hồ sơ bệnh án thành công');
        form.resetFields();
        onCancel();
      } else {
        message.error('Tạo hồ sơ bệnh án thất bại');
      }
    } catch (error) {
      console.error('[ERROR] Failed to create medical record:', error);
      message.error('Có lỗi xảy ra khi tạo hồ sơ bệnh án');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
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
            <MedicineBoxOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
              Tạo hồ sơ bệnh án
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
              Ghi lại thông tin khám bệnh và điều trị
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" size="large" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          size="large"
          loading={loading}
          onClick={handleSubmit}
          icon={<MedicineBoxOutlined />}
        >
          Tạo hồ sơ bệnh án
        </Button>
      ]}
      destroyOnClose
    >
      {appointment && (
        <div style={{ marginBottom: '20px' }}>
          {/* Patient Info Card */}
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  <div>
                    <Text strong>{appointment.patientName}</Text>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {appointment.patientPhone}
                    </div>
                  </div>
                </Space>
              </Col>
              <Col span={12}>
                <Space>
                  <CalendarOutlined style={{ color: '#52c41a' }} />
                  <div>
                    <Text strong>{appointment.serviceName}</Text>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {moment(appointment.appointmentDate).format('DD/MM/YYYY')} - {appointment.appointmentTime}
                    </div>
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Medical Record Form */}
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Kết luận"
                  name="conclusion"
                  rules={[
                    { required: true, message: 'Vui lòng nhập kết luận' },
                    { min: 5, message: 'Kết luận phải có ít nhất 5 ký tự' }
                  ]}
                >
                  <Input.TextArea
                    placeholder="Nhập kết luận của bác sĩ..."
                    rows={3}
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Triệu chứng"
                  name="symptoms"
                >
                  <Input.TextArea
                    placeholder="Mô tả triệu chứng của bệnh nhân..."
                    rows={2}
                    showCount
                    maxLength={300}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Phương pháp điều trị"
                  name="treatment"
                  rules={[
                    { required: true, message: 'Vui lòng nhập phương pháp điều trị' },
                    { min: 5, message: 'Phương pháp điều trị phải có ít nhất 5 ký tự' }
                  ]}
                >
                  <Input.TextArea
                    placeholder="Nhập phương pháp điều trị..."
                    rows={2}
                    showCount
                    maxLength={300}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Thuốc được kê đơn" required>
                  <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ display: 'flex', background: '#fafafa', fontWeight: 500, padding: '8px 0', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                      <div style={{ flex: 2, paddingLeft: 12 }}>Tên thuốc (autocomplete)</div>
                      <div style={{ flex: 1 }}>Liều dùng</div>
                      <div style={{ flex: 2 }}>Hướng dẫn sử dụng</div>
                      <div style={{ flex: 1.5 }}>Thời gian dùng</div>
                      <div style={{ flex: 2 }}>Ghi chú thêm</div>
                      <div style={{ width: 40, textAlign: 'center' }}></div>
                    </div>
                    {prescriptions.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', borderBottom: idx === prescriptions.length - 1 ? 'none' : '1px solid #eee', padding: '8px 0' }}>
                        <div style={{ flex: 2, paddingLeft: 12 }}>
                          <Select
                            showSearch
                            placeholder="Tên thuốc"
                            value={item.medicineId}
                            onChange={val => handleMedicineSelect(idx, val)}
                            filterOption={(input, option) => {
                              const label = String(option?.children ?? '');
                              return label.toLowerCase().includes(input.toLowerCase());
                            }}
                            style={{ width: '100%' }}
                          >
                            {medicineList.map(med => (
                              <Select.Option key={med._id} value={med._id}>{med.name}</Select.Option>
                            ))}
                          </Select>
                        </div>
                        <div style={{ flex: 1, padding: '0 4px' }}>
                          <Input
                            placeholder="Liều dùng"
                            value={item.dosage}
                            onChange={e => handlePrescriptionChange(idx, 'dosage', e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 2, padding: '0 4px' }}>
                          <Input
                            placeholder="Hướng dẫn sử dụng"
                            value={item.instructions}
                            onChange={e => handlePrescriptionChange(idx, 'instructions', e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 1.5, padding: '0 4px' }}>
                          <Input
                            placeholder="Thời gian dùng (VD: 7 ngày, 2 tuần)"
                            value={item.duration}
                            onChange={e => handlePrescriptionChange(idx, 'duration', e.target.value)}
                            onKeyDown={preventNonNumericInput}
                          />
                        </div>
                        <div style={{ flex: 2, padding: '0 4px' }}>
                          <Input
                            placeholder="Ghi chú"
                            value={item.note}
                            onChange={e => handlePrescriptionChange(idx, 'note', e.target.value)}
                          />
                        </div>
                        <div style={{ width: 40, textAlign: 'center' }}>
                          <Button danger type="text" onClick={() => handleRemovePrescription(idx)} disabled={prescriptions.length === 1} style={{ fontSize: 18 }}>
                            ❌
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button type="dashed" onClick={handleAddPrescription} block icon={<span style={{ fontSize: 18, color: '#6c63ff' }}>＋</span>} style={{ marginTop: 4, color: '#6c63ff', fontWeight: 500 }}>
                    Thêm thuốc
                  </Button>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span style={{ fontWeight: 500 }}>Ngày tái khám</span>} name="followUpDate">
                  <SimpleDatePicker
                    style={{ width: '100%' }}
                    placeholder="Chọn ngày tái khám"
                    value=""
                    onChange={() => {}}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 0 }}>
              <Col span={24}>
                <Form.Item label={<span style={{ fontWeight: 500 }}>Ghi chú bổ sung</span>} name="notes">
                  <Input.TextArea
                    placeholder="Ghi chú thêm của bác sĩ về tình trạng bệnh nhân... (tối đa 500 ký tự)"
                    rows={2}
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      )}
    </Modal>
  );
};

export default MedicalRecordModal;
