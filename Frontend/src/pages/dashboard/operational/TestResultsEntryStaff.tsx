import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  DatePicker,
  message,
  Typography,
  Tooltip,
  Modal,
  Form,
  Select,
  Spin
} from 'antd';
import { SearchOutlined, ExperimentOutlined, PlusCircleOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { appointmentApi, testResultItemsApi, serviceTestCategoriesApi } from '../../../api/endpoints';
import { useAuth } from '../../../hooks/useAuth';
import { TestResultsForm } from '../../../components/feature/medical/TestResultsForm';

const { Title } = Typography;
const { Search } = Input;

interface Appointment {
  _id: string;
  profileId: {
    _id: string;
    fullName: string;
    phoneNumber: string;
  };
  serviceId: {
    _id: string;
    serviceName: string;
    serviceType: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

const TestResultsEntryStaff: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showTestForm, setShowTestForm] = useState(false);
  const [testResultStatus, setTestResultStatus] = useState<{ [appointmentId: string]: boolean }>({});
  const [creatingTestResultId, setCreatingTestResultId] = useState<string | null>(null);
  const [editTestResultId, setEditTestResultId] = useState<string | null>(null);
  const [testItemModalVisible, setTestItemModalVisible] = useState(false);
  const [testItemLoading, setTestItemLoading] = useState(false);
  const [testCategories, setTestCategories] = useState<any[]>([]);
  const [testItemValues, setTestItemValues] = useState<any>({});
  const [currentTestResultId, setCurrentTestResultId] = useState<string | null>(null);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [editTestResultData, setEditTestResultData] = useState<any>(null);
  const [testItemForm] = Form.useForm();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [createTargetAppointment, setCreateTargetAppointment] = useState<Appointment | null>(null);
  const [testResultItemsMap, setTestResultItemsMap] = useState<{ [appointmentId: string]: string[] }>({});
  const [createTestResultItems, setCreateTestResultItems] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'staff') {
      loadAppointments();
    }
  }, [selectedDate, user]);

  // Kiểm tra trạng thái testResult cho từng appointment
  useEffect(() => {
    if (appointments.length > 0) {
      const checkAll = async () => {
        const statusObj: { [appointmentId: string]: boolean } = {};
        await Promise.all(
          appointments.map(async (apt) => {
            try {
              const res = await appointmentApi.checkTestResultsByAppointment(apt._id);
              console.log('[DEBUG] checkTestResultsByAppointment FULL RESPONSE', res);
              statusObj[apt._id] = res.exists || false;
            } catch (e) {
              console.log('[DEBUG] checkTestResultsByAppointment ERROR', apt._id, e);
              statusObj[apt._id] = false;
            }
          })
        );
        console.log('[DEBUG] setTestResultStatus', statusObj);
        setTestResultStatus(statusObj);
      };
      checkAll();
    }
  }, [appointments]);

  useEffect(() => {
    if (appointments.length > 0) {
      const fetchTestResultItems = async () => {
        const map: { [appointmentId: string]: string[] } = {};
        await Promise.all(
          appointments.map(async (apt) => {
            try {
              const items = await testResultItemsApi.getByAppointment(apt._id);
              map[apt._id] = (items || []).map((item: any) => item._id);
            } catch (e) {
              map[apt._id] = [];
            }
          })
        );
        setTestResultItemsMap(map);
      };
      fetchTestResultItems();
    }
  }, [appointments]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const targetDate = selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : undefined;
      // Lấy tất cả các trạng thái liên quan
      const statuses = ['consulting', 'done_testResultItem', 'done_testResult'];
      let allAppointments: any[] = [];
      for (const status of statuses) {
        const response = await appointmentApi.getAllAppointments({
          page: 1,
          limit: 100,
          status,
          startDate: targetDate,
          endDate: targetDate
        });
        allAppointments = allAppointments.concat(response.data.appointments);
      }
      // Chỉ lấy các lịch có serviceType là 'test' (xét nghiệm)
      const filtered = allAppointments.filter((apt: any) => apt.serviceId?.serviceType === 'test');
      setAppointments(filtered);
    } catch (err) {
      message.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_: any, record: Appointment) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.profileId.fullName}</div>
          <div style={{ color: '#888', fontSize: 12 }}>{record.profileId.phoneNumber}</div>
        </div>
      ),
    },
    {
      title: 'Dịch vụ',
      dataIndex: ['serviceId', 'serviceName'],
      key: 'service',
      render: (_: any, record: Appointment) => record.serviceId.serviceName,
    },
    {
      title: 'Ngày',
      dataIndex: 'appointmentDate',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Giờ',
      dataIndex: 'appointmentTime',
      key: 'time',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = '';
        switch (status) {
          case 'consulting':
            color = 'lime';
            text = 'Đang khám';
            break;
          case 'done_testResultItem':
            color = 'blue';
            text = 'Hoàn thành kết quả';
            break;
          case 'done_testResult':
            color = 'cyan';
            text = 'Hoàn thành hồ sơ';
            break;
          case 'completed':
            color = 'green';
            text = 'Hoàn thành';
            break;
          default:
            text = status;
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: Appointment) => (
        <Space>
          <Tooltip title={
            record.status === 'consulting'
              ? 'Nhập kết quả xét nghiệm'
              : 'Chỉ nhập khi lịch đang khám'
          }>
            <Button
              icon={<ExperimentOutlined />}
              disabled={record.status !== 'consulting' || (testResultItemsMap[record._id] && testResultItemsMap[record._id].length > 0)}
              onClick={async () => {
                setTestItemModalVisible(true);
                setTestItemLoading(true);
                try {
                  setCurrentTestResultId(record._id);
                  setCurrentServiceId(record.serviceId._id);
                  const cats = await serviceTestCategoriesApi.getByService(record.serviceId._id);
                  setTestCategories(cats || []);
                  // Khởi tạo giá trị form
                  const initial: any = {};
                  (cats || []).forEach(cat => {
                    initial[cat._id] = { value: '', flag: 'normal' };
                  });
                  testItemForm.setFieldsValue({ testItemValues: initial });
                } catch (e) {
                  message.error('Không thể tải danh sách chỉ số xét nghiệm');
                  setTestItemModalVisible(false);
                } finally {
                  setTestItemLoading(false);
                }
              }}
              type="default"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title={"Tạo hồ sơ xét nghiệm"}>
            <Button
              icon={<FileTextOutlined />}
              disabled={
                testResultStatus[record._id] === true ||
                !(testResultItemsMap[record._id] && testResultItemsMap[record._id].length > 0 && record.status === 'done_testResultItem')
              }
              onClick={async () => {
                setCreateTargetAppointment(record);
                setCreateModalVisible(true);
                testResultItemsApi.getByAppointment(record._id).then(items => setCreateTestResultItems(items || []));
              }}
              type="default"
              shape="circle"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredAppointments = appointments.filter(apt =>
    apt.profileId.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
    apt.profileId.phoneNumber.includes(searchText) ||
    apt.serviceId.serviceName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>Nhập kết quả xét nghiệm</Title>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            style={{ width: 180 }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
          />
          <Search
            placeholder="Tìm kiếm bệnh nhân, dịch vụ..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </div>
      </Card>
      <Card>
        <Table
          columns={columns}
          dataSource={filteredAppointments}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: filteredAppointments.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} lịch hẹn`,
          }}
        />
      </Card>
      <Modal
        open={showTestForm}
        onCancel={() => setShowTestForm(false)}
        footer={null}
        width={900}
        destroyOnClose
        title="Nhập kết quả xét nghiệm"
      >
        {selectedAppointment && (
          <TestResultsForm
            serviceId={selectedAppointment.serviceId._id}
            testResultId={selectedAppointment._id}
            patientName={selectedAppointment.profileId.fullName}
            onSuccess={() => {
              setShowTestForm(false);
              loadAppointments();
            }}
            onCancel={() => setShowTestForm(false)}
          />
        )}
      </Modal>
      <Modal
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={async () => {
          try {
            setEditLoading(true);
            const values = await editForm.validateFields();
            if (editTestResultId) {
              await appointmentApi.updateTestResult(editTestResultId, {
                conclusion: values.conclusion,
                recommendations: values.recommendations
              });
              message.success('Cập nhật hồ sơ xét nghiệm thành công!');
              setEditModalVisible(false);
              loadAppointments();
            }
          } catch (e) {
            message.error('Cập nhật hồ sơ xét nghiệm thất bại!');
          } finally {
            setEditLoading(false);
          }
        }}
        confirmLoading={editLoading}
        title="Chỉnh sửa hồ sơ xét nghiệm"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="conclusion" label="Kết luận" rules={[{ required: false }]}> 
            <Input.TextArea rows={3} placeholder="Nhập kết luận" />
          </Form.Item>
          <Form.Item name="recommendations" label="Khuyến nghị" rules={[{ required: false }]}> 
            <Input.TextArea rows={3} placeholder="Nhập khuyến nghị" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        open={testItemModalVisible}
        onCancel={() => setTestItemModalVisible(false)}
        onOk={async () => {
          try {
            const values = await testItemForm.validateFields(); // validate toàn bộ form
            const testItemValues = values.testItemValues || {};
            // Đảm bảo tất cả chỉ số đều có giá trị
            const allFilled = testCategories.every(cat => !!testItemValues[cat._id]?.value);
            if (!allFilled) {
              // Nếu còn thiếu, không gọi API, không đóng modal
              return;
            }
            setTestItemLoading(true);
            for (const cat of testCategories) {
              const v = testItemValues[cat._id]?.value;
              const flag = testItemValues[cat._id]?.flag;
              await testResultItemsApi.create({
                appointmentId: selectedAppointment?._id || currentTestResultId,
                itemNameId: cat.testCategoryId?._id || cat.testCategoryId || cat._id,
                value: v,
                unit: cat.customUnit || cat.unit,
                flag: flag
              });
            }
            // Sau khi nhập xong, chuyển trạng thái appointment sang done_testResultItem
            await appointmentApi.updateAppointmentStatus(selectedAppointment?._id || currentTestResultId, 'done_testResultItem');
            message.success('Lưu kết quả xét nghiệm thành công!');
            setTestItemModalVisible(false);
            loadAppointments();
          } catch (e) {
            // Nếu validate lỗi, không làm gì cả
            if (e && e.errorFields) return;
            message.error('Lưu kết quả xét nghiệm thất bại!');
          } finally {
            setTestItemLoading(false);
          }
        }}
        confirmLoading={testItemLoading}
        title="Nhập kết quả xét nghiệm"
        width={800}
        destroyOnClose
      >
        <Form form={testItemForm} layout="vertical">
          {testCategories.map(cat => {
            const testName = cat.testCategoryId?.name || cat.testCategory?.name || cat.name || cat.testCategoryName || cat.label || cat.title || '';
            const unit = cat.customUnit || cat.unit || '';
            const normal = cat.targetValue || cat.customNormalRange || cat.normalRange || '';
            const label = `${testName}${unit ? ` (${unit})` : ''}${(cat.minValue !== undefined && cat.maxValue !== undefined) ? `, giá trị dao động: ${cat.minValue} - ${cat.maxValue}` : (normal ? `, Bình thường: ${normal}` : '')}`;
            return (
              <Form.Item
                key={cat._id}
                label={label}
                required
                style={{ marginBottom: 16 }}
              >
                <Form.Item
                  name={['testItemValues', cat._id, 'value']}
                  rules={[{ required: true, message: 'Vui lòng nhập giá trị!' }]}
                  noStyle
                >
                  <Input
                    style={{ width: 120, marginRight: 8 }}
                    placeholder="Giá trị"
                  />
                </Form.Item>
                <Form.Item
                  name={['testItemValues', cat._id, 'flag']}
                  initialValue="normal"
                  noStyle
                >
                  <Select style={{ width: 120 }}>
                    <Select.Option value="low">Thấp</Select.Option>
                    <Select.Option value="normal">Bình thường</Select.Option>
                    <Select.Option value="high">Cao</Select.Option>
                  </Select>
                </Form.Item>
              </Form.Item>
            );
          })}
        </Form>
      </Modal>
      <Modal
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={async () => {
          try {
            const values = await createForm.validateFields();
            if (!createTargetAppointment) return;
            setCreatingTestResultId(createTargetAppointment._id);
            await appointmentApi.createTestResult({
              appointmentId: createTargetAppointment._id,
              profileId: createTargetAppointment.profileId._id,
              doctorId: user?._id || '',
              conclusion: values.conclusion,
              recommendations: values.recommendations,
              testResultItemsId: []
            });
            // Chuyển trạng thái sang done_testResult
            await appointmentApi.updateAppointmentStatus(createTargetAppointment._id, 'done_testResult');
            message.success('Tạo hồ sơ xét nghiệm thành công!');
            setTestResultStatus((prev) => ({ ...prev, [createTargetAppointment._id]: true }));
            setCreateModalVisible(false);
            createForm.resetFields();
            loadAppointments();
          } catch (e) {
            message.error('Tạo hồ sơ xét nghiệm thất bại!');
          } finally {
            setCreatingTestResultId(null);
          }
        }}
        confirmLoading={!!creatingTestResultId}
        title="Tạo hồ sơ xét nghiệm"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="conclusion" label="Kết luận" rules={[{ required: false }]}> 
            <Input.TextArea rows={3} placeholder="Nhập kết luận" />
          </Form.Item>
          <Form.Item name="recommendations" label="Khuyến nghị" rules={[{ required: false }]}> 
            <Input.TextArea rows={3} placeholder="Nhập khuyến nghị" />
          </Form.Item>
          {createTestResultItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Kết quả chỉ số đã nhập:</div>
              <div>
                {createTestResultItems.map((item, idx) => (
                  <div key={item._id} style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 500 }}>{item.itemNameId?.name}</div>
                    <div style={{ marginLeft: 16, fontSize: 14 }}>
                      <span>{item.itemNameId?.unit ? `(${item.itemNameId.unit})` : ''}</span>
                      {item.itemNameId?.normalRange && (
                        <span style={{ marginLeft: 8 }}>
                          Bình thường: <span style={{ fontWeight: 400 }}>{item.itemNameId.normalRange}</span>
                        </span>
                      )}
                      <span style={{ marginLeft: 16 }}>Giá trị: <b>{item.value}</b></span>
                      <span style={{ marginLeft: 16 }}>Đánh giá: <b>{item.flag === 'normal' ? 'Bình thường' : item.flag === 'high' ? 'Cao' : item.flag === 'low' ? 'Thấp' : item.flag}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default TestResultsEntryStaff; 