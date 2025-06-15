import React, { useState } from 'react';
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
  Avatar,
  Descriptions,
  Upload,
  Image
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  PictureOutlined,
  UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

// NOTE: MOCKDATA - Dữ liệu giả dựa trên ERD MedicalRecords
interface MedicalRecord {
  key: string;
  _id: string;
  doctorId: string;
  doctorName: string;
  profileId: string;
  patientName: string;
  patientPhone: string;
  appointmentId: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes?: string;
  pictures: string[];
  createdAt: string;
  updatedAt: string;
}

const mockMedicalRecords: MedicalRecord[] = [
  {
    key: '1',
    _id: 'MR001',
    doctorId: 'DOC001',
    doctorName: 'Dr. Nguyễn Thị Hương',
    profileId: 'PROF001',
    patientName: 'Nguyễn Thị Lan',
    patientPhone: '0901234567',
    appointmentId: 'APT001',
    diagnosis: 'Viêm nhiễm phụ khoa nhẹ',
    symptoms: 'Ngứa, khí hư bất thường, đau bụng dưới',
    treatment: 'Kê đơn thuốc kháng sinh, vệ sinh cá nhân, tái khám sau 1 tuần',
    notes: 'Bệnh nhân cần tuân thủ điều trị đầy đủ',
    pictures: ['/images/medical/mr001_1.jpg', '/images/medical/mr001_2.jpg'],
    createdAt: '2024-01-28',
    updatedAt: '2024-01-28'
  },
  {
    key: '2',
    _id: 'MR002',
    doctorId: 'DOC002',
    doctorName: 'Dr. Trần Minh Đức',
    profileId: 'PROF002',
    patientName: 'Trần Văn Nam',
    patientPhone: '0901234568',
    appointmentId: 'APT002',
    diagnosis: 'Kết quả xét nghiệm STI âm tính',
    symptoms: 'Không có triệu chứng bất thường',
    treatment: 'Tư vấn phòng ngừa, duy trì vệ sinh cá nhân',
    notes: 'Khuyến khích xét nghiệm định kỳ 6 tháng/lần',
    pictures: ['/images/medical/mr002_test.jpg'],
    createdAt: '2024-01-28',
    updatedAt: '2024-01-28'
  },
  {
    key: '3',
    _id: 'MR003',
    doctorId: 'DOC003',
    doctorName: 'Dr. Lê Thị Mai',
    profileId: 'PROF003',
    patientName: 'Lê Thị Mai',
    patientPhone: '0901234569',
    appointmentId: 'APT003',
    diagnosis: 'Rối loạn lo âu liên quan đến tình dục',
    symptoms: 'Lo lắng, căng thẳng, mất ngủ, giảm ham muốn',
    treatment: 'Liệu pháp tâm lý nhận thức hành vi, thuốc an thần nhẹ',
    notes: 'Cần theo dõi tiến triển tâm lý, hẹn tái khám sau 2 tuần',
    pictures: [],
    createdAt: '2024-01-29',
    updatedAt: '2024-01-29'
  },
  {
    key: '4',
    _id: 'MR004',
    doctorId: 'DOC002',
    doctorName: 'Dr. Trần Minh Đức',
    profileId: 'PROF004',
    patientName: 'Phạm Văn Hùng',
    patientPhone: '0901234570',
    appointmentId: 'APT004',
    diagnosis: 'Sức khỏe tổng quát tốt',
    symptoms: 'Không có triệu chứng bất thường',
    treatment: 'Duy trì lối sống lành mạnh, tập thể dục đều đặn',
    notes: 'Theo dõi huyết áp do có tiền sử bệnh tim',
    pictures: ['/images/medical/mr004_checkup.jpg'],
    createdAt: '2024-01-30',
    updatedAt: '2024-01-30'
  },
  {
    key: '5',
    _id: 'MR005',
    doctorId: 'DOC004',
    doctorName: 'Dr. Hoàng Thị Nga',
    profileId: 'PROF005',
    patientName: 'Hoàng Thị Nga',
    patientPhone: '0901234571',
    appointmentId: 'APT005',
    diagnosis: 'Thai kỳ 20 tuần bình thường',
    symptoms: 'Buồn nôn nhẹ, mệt mỏi',
    treatment: 'Bổ sung vitamin, dinh dưỡng hợp lý, nghỉ ngơi đầy đủ',
    notes: 'Thai nhi phát triển bình thường, hẹn siêu âm lần sau',
    pictures: ['/images/medical/mr005_ultrasound.jpg'],
    createdAt: '2024-01-31',
    updatedAt: '2024-01-31'
  }
];

const MedicalRecordsManagement: React.FC = () => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(mockMedicalRecords);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [form] = Form.useForm();

  // Filter medical records based on search and filters
  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = record.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.diagnosis.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.patientPhone.includes(searchText) ||
                         record._id.toLowerCase().includes(searchText.toLowerCase());
    const matchesDoctor = selectedDoctor === 'all' || record.doctorId === selectedDoctor;
    
    return matchesSearch && matchesDoctor;
  });

  const handleEdit = (record: MedicalRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      createdAt: dayjs(record.createdAt)
    });
    setIsModalVisible(true);
  };

  const handleDelete = (recordId: string) => {
    setMedicalRecords(medicalRecords.filter(record => record._id !== recordId));
    message.success('Xóa hồ sơ y tế thành công!');
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const formattedValues = {
        ...values,
        createdAt: values.createdAt.format('YYYY-MM-DD'),
        pictures: values.pictures || []
      };

      if (editingRecord) {
        // Update existing record
        setMedicalRecords(medicalRecords.map(record => 
          record._id === editingRecord._id 
            ? { ...record, ...formattedValues, updatedAt: new Date().toISOString().split('T')[0] }
            : record
        ));
        message.success('Cập nhật hồ sơ y tế thành công!');
      } else {
        // Add new record
        const newRecord: MedicalRecord = {
          key: Date.now().toString(),
          _id: `MR${Date.now()}`,
          ...formattedValues,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        setMedicalRecords([...medicalRecords, newRecord]);
        message.success('Thêm hồ sơ y tế mới thành công!');
      }
      setIsModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const showRecordDetails = (record: MedicalRecord) => {
    Modal.info({
      title: 'Chi tiết hồ sơ y tế',
      width: 800,
      content: (
        <div style={{ marginTop: '16px' }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Mã hồ sơ" span={2}>
              <Text code>{record._id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Bệnh nhân">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar icon={<UserOutlined />} size="small" />
                {record.patientName}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {record.patientPhone}
            </Descriptions.Item>
            <Descriptions.Item label="Bác sĩ điều trị" span={2}>
              <MedicineBoxOutlined style={{ marginRight: '4px' }} />
              {record.doctorName}
            </Descriptions.Item>
            <Descriptions.Item label="Mã lịch hẹn" span={2}>
              <Text code>{record.appointmentId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Chẩn đoán" span={2}>
              <Text strong style={{ color: '#1890ff' }}>{record.diagnosis}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Triệu chứng" span={2}>
              {record.symptoms}
            </Descriptions.Item>
            <Descriptions.Item label="Điều trị" span={2}>
              {record.treatment}
            </Descriptions.Item>
            {record.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {record.notes}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày tạo">
              {record.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              {record.updatedAt}
            </Descriptions.Item>
            {record.pictures.length > 0 && (
              <Descriptions.Item label="Hình ảnh" span={2}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {record.pictures.map((pic, index) => (
                    <Image
                      key={index}
                      width={100}
                      height={100}
                      src={pic}
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                    />
                  ))}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      ),
    });
  };

  const columns: ColumnsType<MedicalRecord> = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Avatar icon={<UserOutlined />} size="small" />
            <Text strong style={{ fontSize: '14px' }}>{record.patientName}</Text>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {record.patientPhone}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            ID: {record._id}
          </div>
        </div>
      )
    },
    {
      title: 'Bác sĩ điều trị',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 150,
      render: (doctorName: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MedicineBoxOutlined style={{ color: '#52c41a' }} />
          <Text style={{ fontSize: '13px' }}>{doctorName}</Text>
        </div>
      )
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      width: 250,
      render: (diagnosis: string) => (
        <Text strong style={{ color: '#1890ff', fontSize: '13px' }}>
          {diagnosis}
        </Text>
      )
    },
    {
      title: 'Triệu chứng',
      dataIndex: 'symptoms',
      key: 'symptoms',
      width: 200,
      render: (symptoms: string) => (
        <Text style={{ fontSize: '12px' }}>
          {symptoms.length > 50 ? `${symptoms.substring(0, 50)}...` : symptoms}
        </Text>
      )
    },
    {
      title: 'Hình ảnh',
      key: 'pictures',
      width: 100,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <PictureOutlined style={{ color: '#722ed1' }} />
          <Text style={{ fontSize: '12px' }}>{record.pictures.length}</Text>
        </div>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt: string) => (
        <Text style={{ fontSize: '13px' }}>
          {dayjs(createdAt).format('DD/MM/YYYY')}
        </Text>
      ),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => showRecordDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa hồ sơ y tế này?"
              onConfirm={() => handleDelete(record._id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Quản lý hồ sơ y tế
        </Title>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          NOTE: MOCKDATA - Quản lý hồ sơ y tế và kết quả khám bệnh
        </p>
      </div>

      <Card>
        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <Space wrap>
            <Search
              placeholder="Tìm kiếm bệnh nhân, chẩn đoán..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={selectedDoctor}
              onChange={setSelectedDoctor}
              style={{ width: 200 }}
            >
              <Option value="all">Tất cả bác sĩ</Option>
              <Option value="DOC001">Dr. Nguyễn Thị Hương</Option>
              <Option value="DOC002">Dr. Trần Minh Đức</Option>
              <Option value="DOC003">Dr. Lê Thị Mai</Option>
              <Option value="DOC004">Dr. Hoàng Thị Nga</Option>
            </Select>
          </Space>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Thêm hồ sơ y tế
          </Button>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredRecords}
          loading={loading}
          pagination={{
            total: filteredRecords.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} hồ sơ`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingRecord ? 'Chỉnh sửa hồ sơ y tế' : 'Thêm hồ sơ y tế mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText={editingRecord ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="patientName"
              label="Tên bệnh nhân"
              rules={[{ required: true, message: 'Vui lòng nhập tên bệnh nhân!' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Nhập tên bệnh nhân" />
            </Form.Item>
            
            <Form.Item
              name="patientPhone"
              label="Số điện thoại"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="doctorName"
              label="Bác sĩ điều trị"
              rules={[{ required: true, message: 'Vui lòng nhập tên bác sĩ!' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Nhập tên bác sĩ" />
            </Form.Item>
            
            <Form.Item
              name="appointmentId"
              label="Mã lịch hẹn"
              rules={[{ required: true, message: 'Vui lòng nhập mã lịch hẹn!' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Nhập mã lịch hẹn" />
            </Form.Item>
          </div>
          
          <Form.Item
            name="diagnosis"
            label="Chẩn đoán"
            rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán!' }]}
          >
            <Input placeholder="Nhập chẩn đoán" />
          </Form.Item>
          
          <Form.Item
            name="symptoms"
            label="Triệu chứng"
            rules={[{ required: true, message: 'Vui lòng nhập triệu chứng!' }]}
          >
            <TextArea rows={3} placeholder="Mô tả triệu chứng" />
          </Form.Item>
          
          <Form.Item
            name="treatment"
            label="Điều trị"
            rules={[{ required: true, message: 'Vui lòng nhập phương pháp điều trị!' }]}
          >
            <TextArea rows={3} placeholder="Mô tả phương pháp điều trị" />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <TextArea rows={2} placeholder="Nhập ghi chú (tùy chọn)" />
          </Form.Item>
          
          <Form.Item
            name="createdAt"
            label="Ngày tạo"
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="pictures"
            label="Hình ảnh"
          >
            <Upload
              listType="picture-card"
              multiple
              beforeUpload={() => false}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Tải lên</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MedicalRecordsManagement;