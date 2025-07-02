import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Typography,
  Tooltip,
  Popconfirm,
  DatePicker,
  message,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { appointmentApi } from '../../../api/endpoints/appointment';
import type { ApiAppointment } from '../../../types/appointment';
import dayjs from 'dayjs';
import medicalApi from '../../../api/endpoints/medical';
// import './medical-records-view.css';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface AppointmentTableItem {
  key: string;
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  appointmentType: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// Định nghĩa type MedicineItem
interface MedicineItem {
  name: string;
  type?: string;
  dosage: string;
  frequency?: number;
  timingInstructions?: string;
  duration?: string;
  instructions?: string;
}

const MedicalRecordsManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentTableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AppointmentTableItem | null>(null);
  const [form] = Form.useForm();
  const [medicalModalOpen, setMedicalModalOpen] = useState(false);
  const [medicalForm] = Form.useForm();
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentTableItem | null>(null);
  const [medicineList, setMedicineList] = useState<MedicineItem[]>([{ name: '', dosage: '' }]);
  const [medicalRecordMap, setMedicalRecordMap] = useState<{ [key: string]: boolean }>({});
  const [medicinesOptions, setMedicinesOptions] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentMedicalRecord, setCurrentMedicalRecord] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.getAllAppointments({});
      const data: ApiAppointment[] = response.data.appointments;
      const mapped = data.map((item) => ({
        key: item._id,
        id: item._id,
        patientName: item.profileId?.fullName || 'N/A',
        patientPhone: item.profileId?.phone || 'N/A',
        doctorName: item.doctorId?.userId?.fullName || 'N/A',
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime,
        serviceName: item.serviceId?.serviceName || '',
        appointmentType: item.appointmentType,
        status: item.status,
        paymentStatus: item.paymentStatus,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        notes: item.notes || '',
      }));
      setAppointments(mapped);
    } catch (err: any) {
      message.error(err?.message || 'Không thể tải danh sách cuộc hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      const map: { [key: string]: boolean } = {};
      for (const appt of appointments) {
        try {
          const res = await medicalApi.getMedicalRecordsByAppointment(appt.id);
          map[appt.id] = res.data && res.data.length > 0;
        } catch (err: any) {
          if (err?.response?.status === 404) {
            map[appt.id] = false;
          } else {
            console.error('API error:', err);
            map[appt.id] = false;
          }
        }
      }
      setMedicalRecordMap(map);
    };
    if (appointments.length) fetchMedicalRecords();
  }, [appointments]);

  useEffect(() => {
    if (medicalModalOpen) {
      medicalApi.getMedicines(1, 100).then(res => {
        setMedicinesOptions(res.data?.data || []);
      });
    }
  }, [medicalModalOpen]);

  const filteredRecords = appointments.filter(record => {
    const matchesSearch = record.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
      record.doctorName.toLowerCase().includes(searchText.toLowerCase()) ||
      record.serviceName.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesDoctor = selectedDoctor === 'all' || record.doctorName === selectedDoctor;
    const matchesVerify = record.status === 'done_testResult' || record.status === 'completed';
    return matchesSearch && matchesStatus && matchesDoctor && matchesVerify;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      done_testResult: 'cyan',
      completed: 'green',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      done_testResult: 'Hoàn thành hồ sơ',
      completed: 'Hoàn thành',
    };
    return texts[status] || status;
  };

  const handleEdit = (record: AppointmentTableItem) => {
    setSelectedRecord(record);
    form.setFieldsValue({
      ...record,
      appointmentDate: dayjs(record.appointmentDate)
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (recordId: string) => {
    try {
      await appointmentApi.deleteAppointment(recordId);
      message.success('Đã hủy cuộc hẹn');
      loadData();
    } catch (err: any) {
      message.error('Không thể hủy cuộc hẹn');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        appointmentDate: values.appointmentDate.format('YYYY-MM-DD')
      };
      
      if (selectedRecord) {
        await appointmentApi.updateAppointment(selectedRecord.id, {
          notes: formattedValues.notes
        });
        message.success('Cập nhật thông tin cuộc hẹn thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      setSelectedRecord(null);
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedRecord(null);
  };

  const showDetailModal = selectedRecord !== null;

  const handleViewMedicalRecord = async (record: AppointmentTableItem) => {
    setSelectedAppointment(record);
    setModalMode('view');
    setMedicalModalOpen(true);
    try {
      const res = await medicalApi.getMedicalRecordsByAppointment(record.id);
      const medRecord = Array.isArray(res.data) ? res.data[0] : res.data;
      setCurrentMedicalRecord(medRecord);
      medicalForm.setFieldsValue({
        symptoms: medRecord.symptoms,
        conclusion: medRecord.conclusion,
        treatment: medRecord.treatment,
        notes: medRecord.notes,
        status: medRecord.status,
      });
      setMedicineList(
        (medRecord.medicines || []).map((m: any) => ({
          name: m.name,
          type: m.type,
          dosage: m.dosage,
          frequency: m.frequency,
          timingInstructions: m.timingInstructions,
          duration: m.duration,
          instructions: m.instructions,
        }))
      );
    } catch (err) {
      message.error('Không thể tải chi tiết hồ sơ bệnh án');
    }
  };

  const handleEditMedicalRecord = async (record: AppointmentTableItem) => {
    setSelectedAppointment(record);
    setModalMode('edit');
    setMedicalModalOpen(true);
    try {
      const res = await medicalApi.getMedicalRecordsByAppointment(record.id);
      const medRecord = Array.isArray(res.data) ? res.data[0] : res.data;
      setCurrentMedicalRecord(medRecord);
      medicalForm.setFieldsValue({
        symptoms: medRecord.symptoms,
        conclusion: medRecord.conclusion,
        treatment: medRecord.treatment,
        notes: medRecord.notes,
        status: medRecord.status,
      });
      setMedicineList(
        (medRecord.medicines || []).map((m: any) => ({
          name: m.name,
          type: m.type,
          dosage: m.dosage,
          frequency: m.frequency,
          timingInstructions: m.timingInstructions,
          duration: m.duration,
          instructions: m.instructions,
        }))
      );
    } catch (err) {
      message.error('Không thể tải chi tiết hồ sơ bệnh án');
    }
  };

  const columns: ColumnsType<AppointmentTableItem> = [
    {
      title: 'Bệnh nhân',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 120,
      render: (text: string, record: AppointmentTableItem) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.patientPhone}</Text>
        </div>
      )
    },
    {
      title: 'Bác sĩ',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 100,
      render: (text: string) => <Text>{text}</Text>
    },
    {
      title: 'Ngày',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      width: 80,
      render: (text: string) => <Text>{new Date(text).toLocaleDateString('vi-VN')}</Text>
    },
    {
      title: 'Giờ',
      dataIndex: 'appointmentTime',
      key: 'appointmentTime',
      width: 50,
      render: (text: string) => <Text>{text}</Text>
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 110,
      render: (text: string) => <Text>{text}</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_, record: AppointmentTableItem) => (
        <Space>
          <Tooltip title="Tạo hồ sơ bệnh án">
            <Button
              type="text"
              icon={<FileTextOutlined />}
              onClick={() => handleCreateMedicalRecord(record)}
              disabled={!!medicalRecordMap[record.id]}
            />
          </Tooltip>
          <Tooltip title="Xem chi tiết hồ sơ bệnh án">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewMedicalRecord(record)}
              disabled={!medicalRecordMap[record.id]}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa hồ sơ bệnh án">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditMedicalRecord(record)}
              disabled={!medicalRecordMap[record.id]}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const handleCreateMedicalRecord = (record?: AppointmentTableItem) => {
    setSelectedAppointment(record || null);
    setModalMode('create');
    setMedicalModalOpen(true);
    medicalForm.resetFields();
    setMedicineList([{ name: '', dosage: '' }]);
    setCurrentMedicalRecord(null);
  };

  const handleAddMedicine = () => {
    setMedicineList([...medicineList, { name: '', dosage: '', instructions: '' }]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicineList(medicineList.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx: number, field: string, value: string) => {
    const newList = [...medicineList];
    if (field === 'instruction' || field === 'instructions') {
      newList[idx].instructions = value;
    } else {
      (newList[idx] as any)[field] = value;
    }
    setMedicineList(newList);
  };

  // Hàm parse frequency từ defaultDosage
  const parseFrequency = (dosage) => {
    const match = dosage && dosage.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  const handleMedicalSubmit = async () => {
    try {
      const values = await medicalForm.validateFields();
      if (!selectedAppointment) {
        message.error('Không tìm thấy thông tin cuộc hẹn!');
        return;
      }
      const medicines = medicineList.map(med => ({
        name: med.name || '',
        type: med.type || 'other',
        dosage: med.dosage || '',
        frequency: med.frequency || 1,
        timingInstructions: med.timingInstructions || 'Theo chỉ định',
        duration: med.duration || '',
        instructions: med.instructions || med.dosage || 'Theo chỉ định',
      })).filter(med => med.name && med.dosage); // Filter out empty medicines
      if (medicines.some(m => !m.name || !m.dosage)) {
        message.error('Thuốc phải có tên và liều dùng!');
        return;
      }
      const data = {
        profileId: selectedAppointment.id, // hoặc selectedAppointment.profileId nếu có
        appointmentId: selectedAppointment.id,
        conclusion: values.conclusion,
        symptoms: values.symptoms,
        treatment: values.treatment,
        notes: values.notes,
        medicines,
        status: values.status,
      };
      if (modalMode === 'edit' && currentMedicalRecord && currentMedicalRecord._id) {
        const updateData = {
          conclusion: values.conclusion,
          symptoms: values.symptoms,
          treatment: values.treatment,
          notes: values.notes,
          medicines,
          status: values.status,
        };
        await medicalApi.updateMedicalRecord(currentMedicalRecord._id, updateData);
        message.success('Cập nhật hồ sơ bệnh án thành công!');
      } else {
        await medicalApi.createMedicalRecord(data);
        message.success('Tạo hồ sơ bệnh án thành công!');
      }
      setMedicalModalOpen(false);
      medicalForm.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err?.message || err?.response?.data?.message || 'Tạo/Cập nhật hồ sơ bệnh án thất bại!');
    }
  };

  // Thêm component chi tiết hồ sơ xét nghiệm
  const TestRecordDetail = () => (
    <div style={{ padding: 16 }}>
      <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Chi tiết hồ sơ xét nghiệm</h3>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 500 }}>Chẩn đoán</div>
        <div style={{ width: '100%', minHeight: 48, marginBottom: 8, border: '1px solid #d9d9d9', borderRadius: 4, padding: 8, background: '#fafafa' }}>Nam</div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 500 }}>Khuyến nghị</div>
        <div style={{ width: '100%', minHeight: 48, marginBottom: 8, border: '1px solid #d9d9d9', borderRadius: 4, padding: 8, background: '#fafafa' }}>Thắng</div>
      </div>
      <div style={{ fontWeight: 500, marginBottom: 8 }}>Kết quả chỉ số đã nhập:</div>
      <div style={{ marginBottom: 8 }}>
        <b>HBeAg (Hepatitis B e Antigen)</b><br />
        giá trị dao động: <b>0 - 0.05</b> (IU/mL)  Kết quả: <b>0.025</b>  Đánh giá: <b>Bình thường</b>
      </div>
      <div style={{ marginBottom: 8 }}>
        <b>Anti-HBs (Hepatitis B surface Antibody)</b><br />
        giá trị dao động: <b>10 - 1000</b> (mIU/mL)  Kết quả: <b>501</b>  Đánh giá: <b>Bình thường</b>
      </div>
      <div style={{ marginBottom: 8 }}>
        <b>HBsAg (Hepatitis B surface Antigen)</b><br />
        giá trị dao động: <b>0 - 0.05</b> (IU/mL)  Kết quả: <b>0.025</b>  Đánh giá: <b>Bình thường</b>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Quản lý cuộc hẹn
          </Title>
        </div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Search
            placeholder="Tìm kiếm theo tên bệnh nhân, bác sĩ hoặc dịch vụ..."
            allowClear
            style={{ width: 350 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="pending">Chờ xác nhận</Option>
            <Option value="scheduled">Đã lên lịch</Option>
            <Option value="confirmed">Đã xác nhận</Option>
            <Option value="consulting">Đang tư vấn</Option>
            <Option value="completed">Hoàn thành</Option>
            <Option value="cancelled">Đã hủy</Option>
          </Select>
          <Select
            placeholder="Bác sĩ"
            style={{ width: 200 }}
            value={selectedDoctor}
            onChange={setSelectedDoctor}
          >
            <Option value="all">Tất cả bác sĩ</Option>
            {/* Có thể map động danh sách bác sĩ nếu cần */}
          </Select>
        </div>
        <Table
          columns={columns}
          dataSource={filteredRecords}
          loading={loading}
          pagination={{
            total: filteredRecords.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} cuộc hẹn`
          }}
        />
      </Card>
      <Modal
        title="Chi tiết cuộc hẹn"
        open={showDetailModal}
        onCancel={() => { setIsModalVisible(false); setSelectedRecord(null); }}
        footer={null}
        width={600}
      >
        {selectedRecord && (
          <div style={{ marginTop: 16 }}>
            <p><strong>Bệnh nhân:</strong> {selectedRecord.patientName}</p>
            <p><strong>Số điện thoại:</strong> {selectedRecord.patientPhone}</p>
            <p><strong>Bác sĩ:</strong> {selectedRecord.doctorName}</p>
            <p><strong>Ngày:</strong> {new Date(selectedRecord.appointmentDate).toLocaleDateString('vi-VN')}</p>
            <p><strong>Giờ:</strong> {selectedRecord.appointmentTime}</p>
            <p><strong>Dịch vụ:</strong> {selectedRecord.serviceName}</p>
            <p><strong>Loại hẹn:</strong> {selectedRecord.appointmentType}</p>
            <p><strong>Trạng thái:</strong> {selectedRecord.status}</p>
            <p><strong>Thanh toán:</strong> {selectedRecord.paymentStatus}</p>
            <p><strong>Ghi chú:</strong> {selectedRecord.notes || 'Không có'}</p>
            <p><strong>Ngày tạo:</strong> {new Date(selectedRecord.createdAt).toLocaleDateString('vi-VN')}</p>
            <p><strong>Cập nhật:</strong> {new Date(selectedRecord.updatedAt).toLocaleDateString('vi-VN')}</p>
          </div>
        )}
      </Modal>
      <Modal
        open={medicalModalOpen}
        onCancel={() => setMedicalModalOpen(false)}
        title={modalMode === 'view' ? 'Chi tiết hồ sơ bệnh án' : (modalMode === 'edit' ? 'Chỉnh sửa hồ sơ bệnh án' : 'Thêm hồ sơ bệnh án mới')}
        footer={null}
        width={700}
      >
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Tạo hồ sơ bệnh án" key="1">
            {selectedAppointment && (
              <div
                style={{
                  background: '#f6f8fa',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  fontSize: 15,
                  gap: 32
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                    Tên bệnh nhân: <span style={{ fontWeight: 400 }}>{selectedAppointment.patientName}</span>
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    Bác sĩ: <span style={{ fontWeight: 400 }}>{selectedAppointment.doctorName}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 210 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                    <span style={{ minWidth: 100, display: 'inline-block' }}>Số điện thoại:</span>
                    <span style={{ fontWeight: 400 }}>{selectedAppointment.patientPhone}</span>
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    <span style={{ minWidth: 100, display: 'inline-block' }}>Ngày khám:</span>
                    <span style={{ fontWeight: 400 }}>{new Date(selectedAppointment.appointmentDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            )}
            <Form
              form={medicalForm}
              layout="vertical"
              onFinish={handleMedicalSubmit}
            >
              <Form.Item name="symptoms" label="Triệu chứng" rules={[{ required: true, message: 'Vui lòng nhập triệu chứng!' }]}
                >
                <TextArea placeholder="Nhập triệu chứng" autoSize={{ minRows: 2 }} readOnly={modalMode === 'view'} />
              </Form.Item>
              <Form.Item name="conclusion" label="Kết luận" rules={[{ required: true, message: 'Vui lòng nhập kết luận!' }]}
                >
                <TextArea placeholder="Không có kết luận" autoSize={{ minRows: 2 }} readOnly={modalMode === 'view'} />
              </Form.Item>
              <Form.Item name="treatment" label="Điều trị" rules={[{ required: true, message: 'Vui lòng nhập phương pháp điều trị!' }]}
                >
                <TextArea placeholder="Nhập phương pháp điều trị" autoSize={{ minRows: 2 }} readOnly={modalMode === 'view'} />
              </Form.Item>
              <div style={{ marginBottom: 8 }}>Thuốc</div>
              {medicineList.map((med, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Select
                    showSearch
                    placeholder="Tên thuốc"
                    value={med.name}
                    style={{ width: 150 }}
                    onChange={val => {
                      if (modalMode === 'view') return;
                      const selected = medicinesOptions.find(m => m.name === val);
                      handleMedicineChange(idx, 'name', selected?.name || val);
                      if (selected) {
                        handleMedicineChange(idx, 'dosage', selected.defaultDosage || '');
                        handleMedicineChange(idx, 'instructions', selected.defaultTimingInstructions || '');
                      } else {
                        handleMedicineChange(idx, 'dosage', '');
                        handleMedicineChange(idx, 'instructions', '');
                      }
                    }}
                    options={medicinesOptions.map(m => ({ label: m.name, value: m.name }))}
                    disabled={modalMode === 'view'}
                  />
                  <Input
                    placeholder="Liều lượng/nhóm"
                    value={med.dosage}
                    onChange={e => modalMode !== 'view' && handleMedicineChange(idx, 'dosage', e.target.value)}
                    style={{ width: 120 }}
                    readOnly={modalMode === 'view'}
                  />
                  <Input
                    placeholder="Hướng dẫn sử dụng"
                    value={med.instructions}
                    onChange={e => modalMode !== 'view' && handleMedicineChange(idx, 'instructions', e.target.value)}
                    style={{ width: 180 }}
                    readOnly={modalMode === 'view'}
                  />
                  <Input
                    placeholder="Thời gian dùng (VD: 7 ngày, 2 tuần)"
                    value={med.duration}
                    onChange={e => modalMode !== 'view' && handleMedicineChange(idx, 'duration', e.target.value)}
                    style={{ width: 120 }}
                    readOnly={modalMode === 'view'}
                  />
                  <Button disabled={medicineList.length === 1 || modalMode === 'view'} onClick={() => handleRemoveMedicine(idx)}>Xóa</Button>
                </div>
              ))}
              <Button type="dashed" onClick={handleAddMedicine} style={{ marginBottom: 16 }} disabled={modalMode === 'view'}>Thêm thuốc</Button>
              <Form.Item name="notes" label="Ghi chú">
                <TextArea placeholder="Nhập ghi chú thêm (tùy chọn)" autoSize={{ minRows: 2 }} readOnly={modalMode === 'view'} />
              </Form.Item>
              <Form.Item name="status" label="Trạng thái" initialValue="completed" rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                >
                <Select placeholder="Chọn trạng thái" disabled={modalMode === 'view'}>
                  <Option value="completed">Hoàn thành</Option>
                </Select>
              </Form.Item>
              {modalMode !== 'view' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" style={{ width: 200 }}>
                      {modalMode === 'edit' ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ'}
                    </Button>
                  </Form.Item>
                </div>
              )}
            </Form>
            {modalMode === 'view' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Button type="primary" onClick={() => setMedicalModalOpen(false)} style={{ width: 120 }}>OK</Button>
              </div>
            )}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Chi tiết hồ sơ xét nghiệm" key="2">
            <TestRecordDetail />
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default MedicalRecordsManagement;