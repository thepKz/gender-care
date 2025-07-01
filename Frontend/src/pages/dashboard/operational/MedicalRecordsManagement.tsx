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
  message
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
  const [medicineList, setMedicineList] = useState([{ name: '', dosage: '', instruction: '' }]);
  const [medicalRecordMap, setMedicalRecordMap] = useState<{ [key: string]: boolean }>({});

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
      width: 40,
      render: (_, record: AppointmentTableItem) => (
        <Button
          type="text"
          icon={<FileTextOutlined />}
          onClick={() => handleCreateMedicalRecord(record)}
          disabled={!!medicalRecordMap[record.id]}
        />
      )
    }
  ];

  const handleCreateMedicalRecord = (record?: AppointmentTableItem) => {
    setSelectedAppointment(record || null);
    setMedicalModalOpen(true);
    // Reset form and medicine list
    medicalForm.resetFields();
    setMedicineList([{ name: '', dosage: '', instruction: '' }]);
  };

  const handleAddMedicine = () => {
    setMedicineList([...medicineList, { name: '', dosage: '', instruction: '' }]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicineList(medicineList.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx: number, field: string, value: string) => {
    const newList = [...medicineList];
    newList[idx][field] = value;
    setMedicineList(newList);
  };

  const handleMedicalSubmit = async () => {
    try {
      const values = await medicalForm.validateFields();
      if (!selectedAppointment) {
        message.error('Không tìm thấy thông tin cuộc hẹn!');
        return;
      }
      const data = {
        profileId: selectedAppointment.id, // hoặc selectedAppointment.profileId nếu có
        appointmentId: selectedAppointment.id,
        diagnosis: values.summary,
        symptoms: values.symptoms,
        treatment: values.treatment,
        notes: values.notes,
        // Có thể bổ sung medicines nếu backend hỗ trợ
      };
      await medicalApi.createMedicalRecord(data);
      message.success('Tạo hồ sơ bệnh án thành công!');
      setMedicalModalOpen(false);
      medicalForm.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Tạo hồ sơ bệnh án thất bại!');
    }
  };

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
        title="Thêm hồ sơ y tế mới"
        footer={null}
        width={700}
      >
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
          <Form.Item name="symptoms" label="Triệu chứng" rules={[{ required: true, message: 'Vui lòng nhập triệu chứng!' }]}>
            <TextArea placeholder="Nhập triệu chứng" autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item name="summary" label="Kết luận" rules={[{ required: true, message: 'Vui lòng nhập kết luận!' }]}>
            <TextArea placeholder="Không có kết luận" autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item
            name="treatment"
            label="Điều trị"
            rules={[{ required: true, message: 'Vui lòng nhập phương pháp điều trị!' }]}
          >
            <TextArea placeholder="Nhập phương pháp điều trị" autoSize={{ minRows: 2 }} />
          </Form.Item>
          <div style={{ marginBottom: 8 }}>Thuốc</div>
          {medicineList.map((med, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Input
                placeholder="Tên thuốc"
                value={med.name}
                onChange={e => handleMedicineChange(idx, 'name', e.target.value)}
                style={{ width: 120 }}
              />
              <Input
                placeholder="Liều lượng/nhóm"
                value={med.dosage}
                onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)}
                style={{ width: 120 }}
              />
              <Input
                placeholder="Hướng dẫn sử dụng"
                value={med.instruction}
                onChange={e => handleMedicineChange(idx, 'instruction', e.target.value)}
                style={{ width: 180 }}
              />
              <Button disabled={medicineList.length === 1} onClick={() => handleRemoveMedicine(idx)}>Xóa</Button>
            </div>
          ))}
          <Button type="dashed" onClick={handleAddMedicine} style={{ marginBottom: 16 }}>Thêm thuốc</Button>
          <Form.Item name="notes" label="Ghi chú">
            <TextArea placeholder="Nhập ghi chú thêm (tùy chọn)" autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="draft">Bản nháp</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="reviewed">Đã xem xét</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: 200 }}>Tạo hồ sơ</Button>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MedicalRecordsManagement;