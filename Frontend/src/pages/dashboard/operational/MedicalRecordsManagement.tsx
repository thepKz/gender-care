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
import { medicalApi } from '../../../api/endpoints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface MedicalRecord {
  key: string;
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  notes: string;
  status: 'draft' | 'completed' | 'reviewed';
  createdAt: string;
  updatedAt: string;
}

const MedicalRecordsManagement: React.FC = () => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await medicalApi.getMedicalRecords({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      // Convert API response to component format
      const convertedRecords = response.data.map((record: any) => ({
        key: record._id,
        id: record._id,
        patientName: record.profileId?.fullName || 'N/A',
        patientEmail: record.profileId?.email || 'N/A',
        patientPhone: record.profileId?.phone || 'N/A',
        doctorName: record.doctorId?.fullName || 'N/A',
        appointmentDate: record.createdAt,
        diagnosis: record.diagnosis || '',
        treatment: record.treatment || '',
        prescription: record.prescription || '',
        notes: record.notes || '',
        status: 'completed', // Default status
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }));
      setMedicalRecords(convertedRecords);
    } catch (err: any) {
      message.error(err?.message || 'Không thể tải danh sách hồ sơ y tế');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = record.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.patientEmail.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.doctorName.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.diagnosis.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesDoctor = selectedDoctor === 'all' || record.doctorName === selectedDoctor;
    
    return matchesSearch && matchesStatus && matchesDoctor;
  });

  const getStatusColor = (status: MedicalRecord['status']) => {
    const colors = {
      draft: 'orange',
      completed: 'green',
      reviewed: 'blue'
    };
    return colors[status];
  };

  const getStatusText = (status: MedicalRecord['status']) => {
    const texts = {
      draft: 'Bản nháp',
      completed: 'Hoàn thành',
      reviewed: 'Đã xem xét'
    };
    return texts[status];
  };

  const handleEdit = (record: MedicalRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      appointmentDate: dayjs(record.appointmentDate)
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (recordId: string) => {
    try {
      // Note: medicalApi doesn't have delete method, so we'll show a message
      message.warning('Chức năng xóa hồ sơ y tế chưa được hỗ trợ');
    } catch (err: any) {
      message.error(err?.message || 'Không thể xóa hồ sơ y tế');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        appointmentDate: values.appointmentDate.format('YYYY-MM-DD')
      };
      
      if (editingRecord) {
        await medicalApi.updateMedicalRecord(editingRecord.id, {
          diagnosis: formattedValues.diagnosis,
          treatment: formattedValues.treatment,
          notes: formattedValues.notes
        });
        message.success('Cập nhật hồ sơ y tế thành công');
      } else {
        await medicalApi.createMedicalRecord({
          profileId: formattedValues.profileId,
          appointmentId: formattedValues.appointmentId,
          diagnosis: formattedValues.diagnosis,
          symptoms: formattedValues.symptoms || '',
          treatment: formattedValues.treatment,
          notes: formattedValues.notes
        });
        message.success('Tạo hồ sơ y tế thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
  };

  const showRecordDetails = (record: MedicalRecord) => {
    Modal.info({
      title: 'Chi tiết hồ sơ y tế',
      width: 700,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>Mã hồ sơ:</strong> {record.id}</p>
          <p><strong>Bệnh nhân:</strong> {record.patientName}</p>
          <p><strong>Email:</strong> {record.patientEmail}</p>
          <p><strong>Số điện thoại:</strong> {record.patientPhone}</p>
          <p><strong>Bác sĩ:</strong> {record.doctorName}</p>
          <p><strong>Ngày khám:</strong> {new Date(record.appointmentDate).toLocaleDateString('vi-VN')}</p>
          <p><strong>Chẩn đoán:</strong> {record.diagnosis}</p>
          <p><strong>Điều trị:</strong> {record.treatment}</p>
          <p><strong>Đơn thuốc:</strong> {record.prescription}</p>
          <p><strong>Ghi chú:</strong> {record.notes || 'Không có'}</p>
          <p><strong>Trạng thái:</strong> {getStatusText(record.status)}</p>
          <p><strong>Ngày tạo:</strong> {new Date(record.createdAt).toLocaleDateString('vi-VN')}</p>
          <p><strong>Cập nhật:</strong> {new Date(record.updatedAt).toLocaleDateString('vi-VN')}</p>
        </div>
      ),
    });
  };

  const columns: ColumnsType<MedicalRecord> = [
    {
      title: 'Bệnh nhân',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 200,
      render: (text: string, record: MedicalRecord) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.patientEmail}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.patientPhone}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Bác sĩ & Ngày khám',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 180,
      render: (text: string, record: MedicalRecord) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <MedicineBoxOutlined style={{ color: '#52c41a' }} />
            <Text strong style={{ fontSize: '12px' }}>{text}</Text>
          </div>
          <Text style={{ fontSize: '12px' }}>
            {new Date(record.appointmentDate).toLocaleDateString('vi-VN')}
          </Text>
        </div>
      )
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      width: 200,
      render: (text: string) => (
        <Text style={{ fontSize: '12px' }}>
          {text.length > 50 ? `${text.substring(0, 50)}...` : text}
        </Text>
      )
    },
    {
      title: 'Điều trị',
      dataIndex: 'treatment',
      key: 'treatment',
      width: 200,
      render: (text: string) => (
        <Text style={{ fontSize: '12px' }}>
          {text.length > 50 ? `${text.substring(0, 50)}...` : text}
        </Text>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: MedicalRecord['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record: MedicalRecord) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showRecordDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa hồ sơ y tế này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Quản lý hồ sơ y tế
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Thêm hồ sơ mới
          </Button>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Search
            placeholder="Tìm kiếm theo tên bệnh nhân, bác sĩ hoặc chẩn đoán..."
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
            <Option value="draft">Bản nháp</Option>
            <Option value="completed">Hoàn thành</Option>
            <Option value="reviewed">Đã xem xét</Option>
          </Select>

          <Select
            placeholder="Bác sĩ"
            style={{ width: 200 }}
            value={selectedDoctor}
            onChange={setSelectedDoctor}
          >
            <Option value="all">Tất cả bác sĩ</Option>
            <Option value="Dr. Nguyễn Thị Hương">Dr. Nguyễn Thị Hương</Option>
            <Option value="Dr. Trần Minh Đức">Dr. Trần Minh Đức</Option>
            <Option value="Dr. Lê Thị Mai">Dr. Lê Thị Mai</Option>
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
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} hồ sơ y tế`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingRecord ? 'Chỉnh sửa hồ sơ y tế' : 'Thêm hồ sơ y tế mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={700}
        okText={editingRecord ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="patientName"
            label="Tên bệnh nhân"
            rules={[{ required: true, message: 'Vui lòng nhập tên bệnh nhân!' }]}
          >
            <Input placeholder="Nhập tên bệnh nhân" />
          </Form.Item>

          <Form.Item
            name="patientEmail"
            label="Email bệnh nhân"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập email bệnh nhân" />
          </Form.Item>

          <Form.Item
            name="patientPhone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="doctorName"
              label="Bác sĩ"
              rules={[{ required: true, message: 'Vui lòng chọn bác sĩ!' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Chọn bác sĩ">
                <Option value="Dr. Nguyễn Thị Hương">Dr. Nguyễn Thị Hương</Option>
                <Option value="Dr. Trần Minh Đức">Dr. Trần Minh Đức</Option>
                <Option value="Dr. Lê Thị Mai">Dr. Lê Thị Mai</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="appointmentDate"
              label="Ngày khám"
              rules={[{ required: true, message: 'Vui lòng chọn ngày khám!' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="diagnosis"
            label="Chẩn đoán"
            rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán!' }]}
          >
            <TextArea rows={3} placeholder="Nhập chẩn đoán chi tiết" />
          </Form.Item>

          <Form.Item
            name="treatment"
            label="Điều trị"
            rules={[{ required: true, message: 'Vui lòng nhập phương pháp điều trị!' }]}
          >
            <TextArea rows={3} placeholder="Nhập phương pháp điều trị" />
          </Form.Item>

          <Form.Item
            name="prescription"
            label="Đơn thuốc"
          >
            <TextArea rows={3} placeholder="Nhập đơn thuốc (tùy chọn)" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <TextArea rows={2} placeholder="Nhập ghi chú thêm (tùy chọn)" />
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
        </Form>
      </Modal>
    </div>
  );
};

export default MedicalRecordsManagement;