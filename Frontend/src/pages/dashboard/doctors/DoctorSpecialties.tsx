import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Descriptions,
  Tabs,
  List,
  Badge,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  TrophyOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface Specialty {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredCertifications: string[];
  averageConsultationTime: number;
  consultationFee: number;
  isActive: boolean;
  doctorCount: number;
  totalConsultations: number;
  averageRating: number;
}

interface DoctorSpecialtyAssignment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  specialtyName: string;
  certificationDate: string;
  certificationNumber: string;
  isVerified: boolean;
  yearsOfExperience: number;
  totalConsultationsInSpecialty: number;
  specialtyRating: number;
}

// Mock data chuyên khoa
const mockSpecialties: Specialty[] = [
  {
    id: '1',
    name: 'Sản phụ khoa',
    description: 'Chuyên khoa về sức khỏe sinh sản nữ, thai kỳ, và các vấn đề phụ khoa',
    category: 'Chuyên khoa chính',
    requiredCertifications: ['Chứng chỉ hành nghề bác sĩ', 'Chuyên khoa Sản phụ khoa cấp II'],
    averageConsultationTime: 30,
    consultationFee: 300000,
    isActive: true,
    doctorCount: 3,
    totalConsultations: 456,
    averageRating: 4.8
  },
  {
    id: '2',
    name: 'Tư vấn sức khỏe sinh sản',
    description: 'Tư vấn về kế hoạch hóa gia đình, sức khỏe sinh sản và tình dục',
    category: 'Tư vấn chuyên môn',
    requiredCertifications: ['Chứng chỉ hành nghề bác sĩ', 'Chứng chỉ tư vấn sức khỏe sinh sản'],
    averageConsultationTime: 25,
    consultationFee: 250000,
    isActive: true,
    doctorCount: 2,
    totalConsultations: 324,
    averageRating: 4.7
  },
  {
    id: '3',
    name: 'Xét nghiệm & Chẩn đoán',
    description: 'Thực hiện và diễn giải các xét nghiệm liên quan đến sức khỏe phụ nữ',
    category: 'Chẩn đoán',
    requiredCertifications: ['Chứng chỉ hành nghề bác sĩ', 'Chuyên khoa Xét nghiệm y học'],
    averageConsultationTime: 20,
    consultationFee: 200000,
    isActive: true,
    doctorCount: 2,
    totalConsultations: 567,
    averageRating: 4.6
  }
];

// Mock data phân công
const mockDoctorSpecialtyAssignments: DoctorSpecialtyAssignment[] = [
  {
    id: '1',
    doctorId: 'DOC001',
    doctorName: 'Dr. Nguyễn Minh Anh',
    specialtyId: '1',
    specialtyName: 'Sản phụ khoa',
    certificationDate: '2020-06-15',
    certificationNumber: 'SPK-2020-001',
    isVerified: true,
    yearsOfExperience: 8,
    totalConsultationsInSpecialty: 156,
    specialtyRating: 4.9
  },
  {
    id: '2',
    doctorId: 'DOC002',
    doctorName: 'Dr. Trần Văn Bình',
    specialtyId: '2',
    specialtyName: 'Tư vấn sức khỏe sinh sản',
    certificationDate: '2021-03-20',
    certificationNumber: 'TVSS-2021-002',
    isVerified: true,
    yearsOfExperience: 6,
    totalConsultationsInSpecialty: 142,
    specialtyRating: 4.8
  }
];

const DoctorSpecialties: React.FC = () => {
  const [activeTab, setActiveTab] = useState('specialties');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [form] = Form.useForm();

  const handleViewDetail = (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setIsModalVisible(true);
  };

  const specialtyColumns: ColumnsType<Specialty> = [
    {
      title: 'Chuyên khoa',
      key: 'name',
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          <div><Text type="secondary">{record.category}</Text></div>
        </div>
      ),
    },
    {
      title: 'Số bác sĩ',
      dataIndex: 'doctorCount',
      key: 'doctorCount',
      render: (count) => <Badge count={count} style={{ backgroundColor: '#52c41a' }} />,
    },
    {
      title: 'Tổng ca tư vấn',
      dataIndex: 'totalConsultations',
      key: 'totalConsultations',
    },
    {
      title: 'Đánh giá TB',
      dataIndex: 'averageRating',
      key: 'averageRating',
      render: (rating) => `${rating}/5`,
    },
    {
      title: 'Phí tư vấn',
      dataIndex: 'consultationFee',
      key: 'consultationFee',
      render: (fee) => `${fee.toLocaleString('vi-VN')}đ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          <Button type="text" icon={<EditOutlined />} />
          <Button type="text" icon={<DeleteOutlined />} danger />
        </Space>
      ),
    },
  ];

  const assignmentColumns: ColumnsType<DoctorSpecialtyAssignment> = [
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (_, record) => (
        <div>
          <Text strong>{record.doctorName}</Text>
          <div><Text type="secondary">{record.yearsOfExperience} năm kinh nghiệm</Text></div>
        </div>
      ),
    },
    {
      title: 'Chuyên khoa',
      dataIndex: 'specialtyName',
      key: 'specialtyName',
      render: (name) => <Tag color="blue">{name}</Tag>
    },
    {
      title: 'Chứng chỉ',
      key: 'certification',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '12px' }}>Số: {record.certificationNumber}</Text>
          <div><Text type="secondary" style={{ fontSize: '12px' }}>Cấp: {record.certificationDate}</Text></div>
        </div>
      ),
    },
    {
      title: 'Xác thực',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (isVerified) => (
        <Tag color={isVerified ? 'green' : 'orange'}>
          {isVerified ? 'Đã xác thực' : 'Chờ xác thực'}
        </Tag>
      ),
    },
    {
      title: 'Hiệu suất',
      key: 'performance',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '12px' }}>{record.totalConsultationsInSpecialty} ca</Text>
          <div><Text style={{ fontSize: '12px' }}>⭐ {record.specialtyRating}</Text></div>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Space>
          <Button type="text" icon={<EditOutlined />} />
          <Button type="text" icon={<DeleteOutlined />} danger />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý chuyên khoa bác sĩ
        </Title>
        <Text type="secondary">
          Quản lý các chuyên khoa và phân công bác sĩ theo từng lĩnh vực
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng chuyên khoa"
              value={mockSpecialties.length}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Bác sĩ có chuyên khoa"
              value={mockDoctorSpecialtyAssignments.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Đã xác thực"
              value={mockDoctorSpecialtyAssignments.filter(a => a.isVerified).length}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng ca tư vấn"
              value={mockSpecialties.reduce((sum, s) => sum + s.totalConsultations, 0)}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabBarExtraContent={
            <Button type="primary" icon={<PlusOutlined />}>
              {activeTab === 'specialties' ? 'Thêm chuyên khoa' : 'Phân công bác sĩ'}
            </Button>
          }
        >
          <TabPane tab="Danh sách chuyên khoa" key="specialties">
            <Table
              columns={specialtyColumns}
              dataSource={mockSpecialties}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab="Phân công bác sĩ" key="assignments">
            <Table
              columns={assignmentColumns}
              dataSource={mockDoctorSpecialtyAssignments}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết chuyên khoa"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />}>
            Chỉnh sửa
          </Button>,
        ]}
        width={700}
      >
        {selectedSpecialty && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Tên chuyên khoa" span={2}>
                {selectedSpecialty.name}
              </Descriptions.Item>
              <Descriptions.Item label="Danh mục" span={2}>
                <Tag color="blue">{selectedSpecialty.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>
                {selectedSpecialty.description}
              </Descriptions.Item>
              <Descriptions.Item label="Số bác sĩ">
                {selectedSpecialty.doctorCount}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng ca tư vấn">
                {selectedSpecialty.totalConsultations}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian TB">
                {selectedSpecialty.averageConsultationTime} phút
              </Descriptions.Item>
              <Descriptions.Item label="Phí tư vấn">
                {selectedSpecialty.consultationFee.toLocaleString('vi-VN')}đ
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '24px' }}>
              <Title level={5}>Chứng chỉ yêu cầu</Title>
              <List
                size="small"
                dataSource={selectedSpecialty.requiredCertifications}
                renderItem={(cert) => (
                  <List.Item>
                    <Text>• {cert}</Text>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorSpecialties;
