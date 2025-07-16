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
import { SearchOutlined, ExperimentOutlined, PlusCircleOutlined, EditOutlined, FileTextOutlined, EyeOutlined, FileSearchOutlined, FileProtectOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { appointmentApi, testResultItemsApi, serviceTestCategoriesApi } from '../../../api/endpoints';
import { useAuth } from '../../../hooks/useAuth';
import { TestResultsForm } from '../../../components/feature/medical/TestResultsForm';
import { getServicePackageById } from '../../../api/endpoints/servicePackageApi';
import { getServiceById } from '../../../api/endpoints/serviceApi';
import { doctorApi } from '../../../api/endpoints/doctorApi';

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
  doctorId?: string | { _id: string };
  packageId?: string | { _id: string; id: string };
  packageName?: string;
  doctorName?: string; // Thêm trường doctorName
}

const TestResultsEntry: React.FC = () => {
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
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create');
  const [testResultModalVisible, setTestResultModalVisible] = useState(false);
  const [testResultModalMode, setTestResultModalMode] = useState<'view' | 'edit'>('view');
  const [testResultModalItems, setTestResultModalItems] = useState<any[]>([]);
  const [testResultModalId, setTestResultModalId] = useState<string | null>(null);
  const [testResultModalTestCategories, setTestResultModalTestCategories] = useState([]);
  // State để theo dõi giá trị input realtime
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user?.role === 'staff' || user?.role === 'doctor') {
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
              statusObj[apt._id] = res.exists || false;
            } catch (e) {
              statusObj[apt._id] = false;
            }
          })
        );
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
      // Lấy tất cả các appointment trong ngày
      const response = await appointmentApi.getAllAppointments({
        page: 1,
        limit: 200,
        startDate: targetDate,
        endDate: targetDate
      });
      const appointmentsRaw = response.data.appointments;
      const filtered: Appointment[] = [];
      for (const appointment of appointmentsRaw) {
        let match = false;
        let packageName = undefined;
        // 1. Nếu có serviceId và serviceType là 'test'
        if (appointment.serviceId?.serviceType === 'test') {
          match = true;
        }
        // 2. Nếu có packageId, kiểm tra các service trong package
        else if (appointment.packageId) {
          try {
            const pkgId = typeof appointment.packageId === 'object'
              ? appointment.packageId._id || appointment.packageId.id
              : appointment.packageId;
            if (!pkgId) continue;
            const pkgRes = await getServicePackageById(pkgId);
            const services = pkgRes.data?.services || [];
            packageName = pkgRes.data?.name || undefined;
            for (const item of services) {
              let serviceTypeToCheck = null;
              if (typeof item.serviceId === 'object' && item.serviceId?.serviceType) {
                serviceTypeToCheck = item.serviceId.serviceType;
              } else if (typeof item.serviceId === 'string') {
                try {
                  const serviceRes = await getServiceById(item.serviceId);
                  serviceTypeToCheck = serviceRes.data?.serviceType;
                } catch (e) {
                  continue;
                }
              }
              if (serviceTypeToCheck === 'test') {
                match = true;
                break;
              }
            }
          } catch (e) {
            // Nếu lỗi lấy package thì bỏ qua
          }
        }
        if (match) {
          // Gán packageName nếu có
          if (packageName) appointment.packageName = packageName;
          filtered.push(appointment);
        }
      }
      const allowedStatuses = ['consulting', 'done_testResultItem', 'done_testResult', 'completed'];
      const filteredByStatus = filtered.filter(apt => allowedStatuses.includes(apt.status));
      setAppointments(filteredByStatus);
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
      render: (_: any, record: Appointment) => {
        const phone = (record.profileId as any).phone || record.profileId.phoneNumber;
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{record.profileId.fullName}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{phone}</div>
          </div>
        );
      },
    },
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (_: any, record: Appointment) => {
        if (record.doctorId && typeof record.doctorId === 'object' && 'userId' in record.doctorId && (record.doctorId as any).userId?.fullName) {
          return (record.doctorId as any).userId.fullName;
        }
        return 'Chưa phân công';
      },
    },
    {
      title: 'Dịch vụ',
      dataIndex: ['serviceId', 'serviceName'],
      key: 'service',
      render: (_: any, record: Appointment) => {
        if (record.serviceId?.serviceName) return record.serviceId.serviceName;
        if ((record as any).packageName) return (record as any).packageName;
        return 'N/A';
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'appointmentDate',
      key: 'datetime',
      render: (_: any, record: Appointment) => (
        <div>
          <div>{dayjs(record.appointmentDate).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: 13, color: '#888' }}>{record.appointmentTime}</div>
        </div>
      ),
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
                testItemForm.resetFields();
                setInputValues({});
                setModalMode('create');
                setTestItemModalVisible(true);
                setTestItemLoading(true);
                try {
                  let serviceIdToUse = record.serviceId?._id;
                  if (record.packageId) {
                    try {
                      const pkgId = typeof record.packageId === 'object'
                        ? record.packageId._id || record.packageId.id
                        : record.packageId;
                      const pkgRes = await getServicePackageById(pkgId);
                      const services = pkgRes.data?.services || [];
                      if (services.length > 0) {
                        serviceIdToUse = typeof services[0].serviceId === 'object' ? services[0].serviceId._id : services[0].serviceId;
                      }
                    } catch {}
                  }
                  setCurrentTestResultId(record._id);
                  setCurrentServiceId(serviceIdToUse);
                  const cats = await serviceTestCategoriesApi.getByService(serviceIdToUse);
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
          <Tooltip title={"Xem chi tiết kết quả xét nghiệm"}>
            <Button
              icon={<EyeOutlined />}
              disabled={!(testResultItemsMap[record._id] && testResultItemsMap[record._id].length > 0)}
              onClick={async () => {
                testItemForm.resetFields();
                setInputValues({});
                setModalMode('view');
                setTestItemModalVisible(true);
                setTestItemLoading(true);
                try {
                  let serviceIdToUse = record.serviceId?._id;
                  if (record.packageId) {
                    try {
                      const pkgId = typeof record.packageId === 'object'
                        ? record.packageId._id || record.packageId.id
                        : record.packageId;
                      const pkgRes = await getServicePackageById(pkgId);
                      const services = pkgRes.data?.services || [];
                      if (services.length > 0) {
                        serviceIdToUse = typeof services[0].serviceId === 'object' ? services[0].serviceId._id : services[0].serviceId;
                      }
                    } catch {}
                  }
                  setCurrentTestResultId(record._id);
                  setCurrentServiceId(serviceIdToUse);
                  const cats = await serviceTestCategoriesApi.getByService(serviceIdToUse);
                  setTestCategories(cats || []);
                  // Lấy dữ liệu testResultItem đã nhập
                  const items: any = await testResultItemsApi.getByAppointment(record._id);
                  const responseData = Array.isArray(items) ? items[0] : items;
                  const itemsData = responseData?.items || [];
                  const initial: any = {};
                  const newInputValues: { [key: string]: string } = {};
                  (itemsData || []).forEach(item => {
                    const key = item.testCategoryId?._id || item.testCategoryId;
                    initial[key] = { value: item.value, flag: item.flag };
                    newInputValues[key] = item.value;
                  });
                  testItemForm.setFieldsValue({ testItemValues: initial });
                  setInputValues(newInputValues);
                } catch (e) {
                  message.error('Không thể tải dữ liệu kết quả xét nghiệm');
                  setTestItemModalVisible(false);
                } finally {
                  setTestItemLoading(false);
                }
              }}
              type="default"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title={"Chỉnh sửa kết quả xét nghiệm"}>
            <Button
              icon={<EditOutlined />}
              disabled={!(testResultItemsMap[record._id] && testResultItemsMap[record._id].length > 0) || record.status === 'completed'}
              onClick={async () => {
                testItemForm.resetFields();
                setInputValues({});
                setModalMode('edit');
                setTestItemModalVisible(true);
                setTestItemLoading(true);
                try {
                  let serviceIdToUse = record.serviceId?._id;
                  if (record.packageId) {
                    try {
                      const pkgId = typeof record.packageId === 'object'
                        ? record.packageId._id || record.packageId.id
                        : record.packageId;
                      const pkgRes = await getServicePackageById(pkgId);
                      const services = pkgRes.data?.services || [];
                      if (services.length > 0) {
                        serviceIdToUse = typeof services[0].serviceId === 'object' ? services[0].serviceId._id : services[0].serviceId;
                      }
                    } catch {}
                  }
                  setCurrentTestResultId(record._id);
                  setCurrentServiceId(serviceIdToUse);
                  const cats = await serviceTestCategoriesApi.getByService(serviceIdToUse);
                  console.log('cats', cats);
                  setTestCategories(cats || []);
                  if (!cats || cats.length === 0) {
                    message.error('Không có chỉ số xét nghiệm nào cho dịch vụ này!');
                    setTestItemModalVisible(false);
                    setTestItemLoading(false);
                    return;
                  }
                  // Lấy dữ liệu testResultItem đã nhập
                  const items: any = await testResultItemsApi.getByAppointment(record._id);
                  const responseData = Array.isArray(items) ? items[0] : items;
                  const itemsData = responseData?.items || [];
                  const initial: any = {};
                  const newInputValues: { [key: string]: string } = {};
                  (itemsData || []).forEach(item => {
                    const key = item.testCategoryId?._id || item.testCategoryId;
                    initial[key] = { value: item.value, flag: item.flag };
                    newInputValues[key] = item.value;
                  });
                  testItemForm.resetFields();
                  testItemForm.setFieldsValue({ testItemValues: initial });
                  setInputValues(newInputValues);
                } catch (e) {
                  message.error('Không thể tải dữ liệu kết quả xét nghiệm');
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
                createForm.resetFields(); // Reset form trước khi mở modal
                setCreateTargetAppointment(record);
                setCreateModalVisible(true);
                // Lấy testResultItems để hiển thị
                const res: any = await testResultItemsApi.getByAppointment(record._id);
                const itemsArr = Array.isArray(res) ? res : (res.data || []);
                setCreateTestResultItems((itemsArr[0]?.items) || []);
                // Lấy serviceId phù hợp
                let serviceIdToUse = record.serviceId?._id;
                if (record.packageId) {
                  try {
                    const pkgId = typeof record.packageId === 'object'
                      ? record.packageId._id || record.packageId.id
                      : record.packageId;
                    const pkgRes = await getServicePackageById(pkgId);
                    const services = pkgRes.data?.services || [];
                    if (services.length > 0) {
                      serviceIdToUse = typeof services[0].serviceId === 'object' ? services[0].serviceId._id : services[0].serviceId;
                    }
                  } catch {}
                }
                const cats = await serviceTestCategoriesApi.getByService(serviceIdToUse);
                setTestCategories(cats || []);
              }}
              type="default"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title={"Xem chi tiết hồ sơ xét nghiệm"}>
            <Button
              icon={<FileSearchOutlined />}
              disabled={!testResultStatus[record._id]}
              onClick={async () => {
                setTestResultModalMode('view');
                setCreateTargetAppointment(record);
                // Lấy testResultItems để hiển thị
                const res: any = await testResultItemsApi.getByAppointment(record._id);
                const itemsArr = Array.isArray(res) ? res : (res.data || []);
                setTestResultModalItems((itemsArr[0]?.items) || []);
                // Lấy serviceId phù hợp
                let serviceIdToUse = record.serviceId?._id;
                if (record.packageId) {
                  try {
                    const pkgId = typeof record.packageId === 'object'
                      ? record.packageId._id || record.packageId.id
                      : record.packageId;
                    const pkgRes = await getServicePackageById(pkgId);
                    const services = pkgRes.data?.services || [];
                    if (services.length > 0) {
                      serviceIdToUse = typeof services[0].serviceId === 'object' ? services[0].serviceId._id : services[0].serviceId;
                    }
                  } catch {}
                }
                const cats = await serviceTestCategoriesApi.getByService(serviceIdToUse);
                setTestResultModalTestCategories(cats || []);
                setTestResultModalVisible(true);
                // Lấy dữ liệu hồ sơ để fill form
                const testResultsRes = await appointmentApi.getTestResultsByAppointment(record._id);
                const testResult = Array.isArray(testResultsRes?.data) ? testResultsRes.data[0] : testResultsRes?.data || {};
                setTestResultModalId(testResult?._id || null);
                createForm.setFieldsValue({
                  diagnosis: testResult?.diagnosis || '',
                  recommendations: testResult?.recommendations || ''
                });
              }}
              type="default"
              shape="circle"
            />
          </Tooltip>
          <Tooltip title={"Chỉnh sửa hồ sơ xét nghiệm"}>
            <Button
              icon={<FileProtectOutlined />}
              disabled={!testResultStatus[record._id] || record.status === 'completed'}
              onClick={async () => {
                setTestResultModalMode('edit');
                setCreateTargetAppointment(record);
                // Lấy testResultItems để hiển thị
                const res: any = await testResultItemsApi.getByAppointment(record._id);
                const itemsArr = Array.isArray(res) ? res : (res.data || []);
                setTestResultModalItems((itemsArr[0]?.items) || []);
                // Lấy serviceId phù hợp
                let serviceIdToUse = record.serviceId?._id;
                if (record.packageId) {
                  try {
                    const pkgId = typeof record.packageId === 'object'
                      ? record.packageId._id || record.packageId.id
                      : record.packageId;
                    const pkgRes = await getServicePackageById(pkgId);
                    const services = pkgRes.data?.services || [];
                    if (services.length > 0) {
                      serviceIdToUse = typeof services[0].serviceId === 'object' ? services[0].serviceId._id : services[0].serviceId;
                    }
                  } catch {}
                }
                const cats = await serviceTestCategoriesApi.getByService(serviceIdToUse);
                setTestResultModalTestCategories(cats || []);
                setTestResultModalVisible(true);
                // Lấy dữ liệu hồ sơ để fill form
                const testResultsRes = await appointmentApi.getTestResultsByAppointment(record._id);
                const testResult = Array.isArray(testResultsRes?.data) ? testResultsRes.data[0] : testResultsRes?.data || {};
                setTestResultModalId(testResult?._id || null);
                createForm.setFieldsValue({
                  diagnosis: testResult?.diagnosis || '',
                  recommendations: testResult?.recommendations || ''
                });
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
    apt.serviceId.serviceName.toLowerCase().includes(searchText.toLowerCase())
  );

  // Hàm xử lý thay đổi input
  const handleInputChange = (key: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Tìm test category để lấy threshold rules
    const testCategory = testCategories.find(cat => 
      String(cat.testCategoryId?._id || cat.testCategoryId) === String(key)
    );
    const thresholdRules = testCategory?.thresholdRules || [];
    
    // Tính toán đánh giá tự động
    const evaluation = getAutoEvaluation(value, thresholdRules);
    
    // Cập nhật form value với cả value, flag và message
    testItemForm.setFieldsValue({
      testItemValues: {
        ...testItemForm.getFieldValue('testItemValues'),
        [key]: { 
          value,
          flag: evaluation.flag,
          message: evaluation.message
        }
      }
    });
  };

  // Hàm đánh giá tự động dựa trên thresholdRules
  const getAutoEvaluation = (value: string, thresholdRules: any[]) => {
    if (!value || !thresholdRules || thresholdRules.length === 0) {
      return { flag: undefined, message: '', color: '#1677ff' };
    }
    
    const num = Number(value);
    if (isNaN(num)) {
      return { flag: undefined, message: '', color: '#1677ff' };
    }

    // Sắp xếp rules theo thứ tự from tăng dần để kiểm tra từ thấp đến cao
    const sortedRules = [...thresholdRules].sort((a, b) => {
      if (a.from === null) return -1;
      if (b.from === null) return 1;
      return a.from - b.from;
    });

    // Hàm so sánh số với tolerance cho floating point
    const isEqual = (a: number, b: number) => Math.abs(a - b) < 0.000001;
    const isGreaterOrEqual = (a: number, b: number) => a > b || isEqual(a, b);
    const isLessOrEqual = (a: number, b: number) => a < b || isEqual(a, b);

    let foundRule = null;
    for (const rule of sortedRules) {
      const ruleMatches = (() => {
        if (rule.from === null && rule.to === null) {
          return true; // Rule mặc định
        } else if (rule.from !== null && rule.to === null) {
          // Rule "từ X trở lên"
          return isGreaterOrEqual(num, rule.from);
        } else if (rule.from === null && rule.to !== null) {
          // Rule "đến X"
          return isLessOrEqual(num, rule.to);
        } else if (rule.from !== null && rule.to !== null) {
          // Rule "từ X đến Y"
          return isGreaterOrEqual(num, rule.from) && isLessOrEqual(num, rule.to);
        }
        return false;
      })();
      
      if (ruleMatches) {
        foundRule = rule;
        // Đối với rule có khoảng cụ thể (from-to), break ngay
        // Đối với rule "từ X trở lên", tiếp tục để tìm rule cao hơn
        if (rule.to !== null) {
          break;
        }
      }
    }

    if (foundRule) {
      let color = '#1677ff';
      if (foundRule.flag === 'normal') color = '#52c41a';
      else if (foundRule.flag === 'low' || foundRule.flag === 'mild_high') color = '#faad14';
      else if (foundRule.flag === 'very_low' || foundRule.flag === 'high' || foundRule.flag === 'critical') color = '#ff4d4f';
      
      const flagTextMap: Record<string, string> = {
        very_low: 'Rất thấp',
        low: 'Thấp',
        normal: 'Bình thường',
        mild_high: 'Hơi cao',
        high: 'Cao',
        critical: 'Nguy kịch'
      };
      
      return {
        flag: foundRule.flag,
        message: foundRule.message,
        color,
        text: flagTextMap[foundRule.flag] || foundRule.flag
      };
    }
    
    return { flag: undefined, message: '', color: '#1677ff' };
  };

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
                diagnosis: values.diagnosis,
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
          <Form.Item name="diagnosis" label="Chẩn đoán" rules={[{ required: false }]}> 
            <Input.TextArea rows={3} placeholder="Nhập chẩn đoán" />
          </Form.Item>
          <Form.Item name="recommendations" label="Khuyến nghị" rules={[{ required: false }]}> 
            <Input.TextArea rows={3} placeholder="Nhập khuyến nghị" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        open={testItemModalVisible}
        onCancel={() => {
          setTestItemModalVisible(false);
          testItemForm.resetFields();
          setInputValues({});
        }}
        onOk={async () => {
          if (modalMode === 'view') {
            setTestItemModalVisible(false);
            return;
          }
          // Nếu không có testCategories thì chỉ đóng modal, không validate/lưu
          if (testCategories.length === 0) {
            setTestItemModalVisible(false);
            return;
          }
          try {
            const values = await testItemForm.validateFields(); // validate toàn bộ form
            const testItemValues = values.testItemValues || {};
            // Đảm bảo tất cả chỉ số đều có giá trị
            const allFilled = testCategories.every(cat => !!testItemValues[(cat.testCategoryId?._id || cat.testCategoryId)]?.value);
            if (!allFilled) {
              // Nếu còn thiếu, không gọi API, không đóng modal
              return;
            }
            setTestItemLoading(true);
            if (modalMode === 'edit') {
              // EDIT: Gọi API update từng item theo appointmentId + testCategoryId
              const updatePromises = testCategories.map(cat => {
                const key = cat.testCategoryId?._id || cat.testCategoryId;
                const v = testItemValues[key]?.value;
                const thresholdRules = cat.thresholdRules || [];
                const evaluation = getAutoEvaluation(v, thresholdRules);
                // Gọi API update theo appointmentId + testCategoryId
                return testResultItemsApi.updateByCategory(currentTestResultId, key, {
                  value: v,
                  unit: cat.customUnit || cat.unit,
                  flag: evaluation.flag,
                  message: evaluation.message
                });
              });
              await Promise.all(updatePromises);
              message.success('Cập nhật kết quả xét nghiệm thành công!');
              setTestItemModalVisible(false);
              loadAppointments();
            } else {
              // CREATE: Gọi API create như cũ, KHÔNG truyền _id cho từng item
             const items = testCategories.map(cat => {
                const key = cat.testCategoryId?._id || cat.testCategoryId;
                const v = testItemValues[key]?.value;
                const thresholdRules = cat.thresholdRules || [];
                const evaluation = getAutoEvaluation(v, thresholdRules);
                // Không có _id
                return {
                  testCategoryId: key,
                  value: v,
                  unit: cat.customUnit || cat.unit,
                  flag: evaluation.flag,
                  message: evaluation.message
                };
              });
              await testResultItemsApi.create({
                appointmentId: currentTestResultId,
                items
              });
              await appointmentApi.updateAppointmentStatus(currentTestResultId, 'done_testResultItem');
              message.success('Lưu kết quả xét nghiệm thành công!');
              setTestItemModalVisible(false);
              loadAppointments();
            }
          } catch (e) {
            // Nếu validate lỗi, không làm gì cả
            if (e && e.errorFields) return;
            message.error('Lưu kết quả xét nghiệm thất bại!');
          } finally {
            setTestItemLoading(false);
          }
        }}
        confirmLoading={testItemLoading}
        title={modalMode === 'view' ? 'Chi tiết kết quả xét nghiệm' : modalMode === 'edit' ? 'Chỉnh sửa kết quả xét nghiệm' : 'Nhập kết quả xét nghiệm'}
        width={800}
        destroyOnClose
        footer={testCategories.length === 0 ? [
          <Button key="ok" type="primary" onClick={() => setTestItemModalVisible(false)}>
            OK
          </Button>
        ] : (modalMode === 'view' ? [
          <Button key="ok" type="primary" onClick={() => setTestItemModalVisible(false)}>
            OK
          </Button>
        ] : undefined)}
      >
        {testItemLoading ? (
          <Spin />
        ) : testCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Dịch vụ này chưa được cấu hình</div>
            <div style={{ color: '#888' }}>Vui lòng liên hệ quản trị viên để cấu hình xét nghiệm cho dịch vụ này.</div>
          </div>
        ) : (
          <Form form={testItemForm} layout="vertical">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {testCategories.map(cat => {
                const testName = cat.testCategoryId?.name || cat.testCategory?.name || cat.name || cat.testCategoryName || cat.label || cat.title || '';
                const unit = cat.unit || cat.testCategory?.unit || cat.testCategoryId?.unit || '';
                const min = cat.minValue;
                const max = cat.maxValue;
                const normal = cat.targetValue || cat.normalRange || '';
                const key = cat.testCategoryId?._id || cat.testCategoryId;
                const thresholdRules = cat.thresholdRules || [];
                const currentValue = inputValues[key] || '';
                const evaluation = getAutoEvaluation(currentValue, thresholdRules);
                return (
                  <Form.Item
                    key={key}
                    required
                    style={{ marginBottom: 0, padding: '18px 0 8px 0', borderBottom: '1px solid #f0f0f0' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', minHeight: 60 }}>
                      {/* Tên chỉ số */}
                      <div style={{
                        flex: 1.5,
                        minWidth: 0,
                        fontWeight: 700,
                        fontSize: 16,
                        color: '#222',
                        lineHeight: '36px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginRight: 0
                      }}>
                        {cat.testCategoryId?.name || cat.name || testName}
                      </div>
                      {/* Min-max + unit nhỏ phía trên input */}
                      <div style={{
                        flex: '0 0 120px',
                        maxWidth: 120,
                        fontSize: 13,
                        color: '#888',
                        fontWeight: 500,
                        textAlign: 'right',
                        marginRight: 18
                      }}>
                        {min !== undefined && max !== undefined ? (
                          <span>{min} - {max}{unit ? ` (${unit})` : ''}</span>
                        ) : normal ? (
                          <span>{normal}{unit ? ` (${unit})` : ''}</span>
                        ) : unit ? (
                          <span>({unit})</span>
                        ) : null}
                      </div>
                      {/* Input kết quả */}
                      <Form.Item
                        name={['testItemValues', key, 'value']}
                        rules={[{ required: true, message: 'Vui lòng nhập kết quả!' }]}
                        noStyle
                      >
                        <Input
                          style={{ width: 90, height: 32, fontSize: 14, borderRadius: 8, border: '1.5px solid #d9d9d9', padding: '2px 8px', marginRight: 0 }}
                          placeholder="Kết quả"
                          readOnly={modalMode === 'view'}
                          type="number"
                          value={testItemForm.getFieldValue(['testItemValues', key, 'value'])}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                        />
                      </Form.Item>
                      {/* Đánh giá text tự động */}
                      <span style={{
                        flex: 1,
                        minWidth: 0,
                        fontWeight: 700,
                        color: evaluation.color,
                        fontSize: 15,
                        lineHeight: '36px',
                        letterSpacing: 0.2,
                        textShadow: evaluation.flag === 'normal' ? '0 1px 0 #e6ffe6' : evaluation.flag ? '0 1px 0 #fff1f0' : undefined,
                        marginRight: 0,
                        marginLeft: 12,
                      }}>
                        {evaluation.text || ''}
                      </span>
                    </div>
                    {/* Message đánh giá nằm bên dưới min-max, kéo dài tới cuối modal */}
                    <div style={{
                      width: '100%',
                      gridColumn: '2 / span 3',
                      fontSize: 14,
                      color: evaluation.color,
                      marginTop: 2,
                      minHeight: 20,
                      fontStyle: evaluation.message ? 'normal' : 'italic',
                      opacity: evaluation.message ? 1 : 0.6,
                      fontWeight: 500,
                      letterSpacing: 0.1,
                      paddingLeft: 1.5 * 160 + 18, // căn lề trái đúng vị trí min-max
                      boxSizing: 'border-box',
                      wordBreak: 'break-word'
                    }}>
                      {evaluation.message || ''}
                    </div>
                  </Form.Item>
                );
              })}
            </div>
          </Form>
        )}
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
              doctorId: typeof createTargetAppointment.doctorId === 'object'
                ? createTargetAppointment.doctorId._id
                : createTargetAppointment.doctorId || '',
              diagnosis: values.diagnosis,
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
        width={700}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="diagnosis" label="Chẩn đoán" rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán!' }]}> 
            <Input.TextArea rows={3} placeholder="Nhập chẩn đoán" />
          </Form.Item>
          <Form.Item name="recommendations" label="Khuyến nghị" rules={[{ required: true, message: 'Vui lòng nhập khuyến nghị!' }]}> 
            <Input.TextArea rows={3} placeholder="Nhập khuyến nghị" />
          </Form.Item>
          {createTestResultItems && createTestResultItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Kết quả chỉ số đã nhập:</div>
              <div>
                {createTestResultItems.map((item, idx) => {
                  const cat = testCategories.find(tc =>
                    String(tc.testCategoryId?._id || tc.testCategoryId) === String(item.testCategoryId?._id || item.testCategoryId || item.itemNameId?._id || item.itemNameId)
                  );
                  if (!item || !cat) return null;
                  let color = '#1677ff';
                  if (item.flag === 'normal') color = '#52c41a';
                  else if (item.flag === 'low' || item.flag === 'mild_high') color = '#faad14';
                  else if (item.flag === 'very_low' || item.flag === 'high' || item.flag === 'critical') color = '#ff4d4f';
                  const flagTextMap = {
                    very_low: 'Rất thấp',
                    low: 'Thấp',
                    normal: 'Bình thường',
                    mild_high: 'Hơi cao',
                    high: 'Cao',
                    critical: 'Nguy kịch'
                  };
                  return (
                    <div key={item._id || idx} style={{ marginBottom: 18 }}>
                      {/* Dòng 1: flex row */}
                      <div style={{ display: 'flex', alignItems: 'center', minHeight: 36 }}>
                        {/* Tên chỉ số */}
                        <div style={{ width: 220, fontWeight: 700, fontSize: 14, color: '#222', marginRight: 0 }}>{cat.testCategoryId?.name || cat.name || item.testCategoryId?.name || item.itemNameId?.name || 'Chỉ số'}</div>
                        {/* Min-max + đơn vị */}
                        <div style={{ width: 120, fontSize: 13, color: '#888', fontWeight: 500, marginLeft: 0, marginRight: 18, textAlign: 'right' }}>
                          {cat && cat.minValue !== undefined && cat.maxValue !== undefined ? (
                            <span>{cat.minValue} - {cat.maxValue}{cat.unit ? ` (${cat.unit})` : ''}</span>
                          ) : cat && cat.targetValue ? (
                            <span>{cat.targetValue}{cat.unit ? ` (${cat.unit})` : ''}</span>
                          ) : (item.unit ? <span>({item.unit})</span> : null)}
                        </div>
                        {/* Value */}
                        <input
                          style={{ width: 80, textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#222', background: '#f5f5f5', borderRadius: 8, border: '1.5px solid #d9d9d9', padding: '4px 0', margin: '0 0 0 0' }}
                          value={item.value}
                          readOnly
                          type="number"
                        />
                        {/* Đánh giá */}
                        <span style={{ width: 100, minWidth: 100, fontWeight: 700, color, fontSize: 14, lineHeight: '36px', letterSpacing: 0.2, textAlign: 'left', marginLeft: 18, marginRight: 0, display: 'inline-block' }}>
                          {flagTextMap[item.flag] || item.flag || ''}
                        </span>
                      </div>
                      {/* Vạch kẻ giữa các chỉ số */}
                      <div style={{ borderBottom: '1px solid #f0f0f0', margin: '8px 0 0 0' }} />
                      {/* Message cảnh báo nằm dưới vạch kẻ, thẳng hàng với min-max */}
                      <div style={{ marginLeft: 340, width: 'calc(100% - 340px)', fontSize: 12, color, marginTop: 6, minHeight: 20, fontStyle: item.message ? 'normal' : 'italic', opacity: item.message ? 1 : 0.6, fontWeight: 500, letterSpacing: 0.1, wordBreak: 'break-word', textAlign: 'left' }}>
                        {item.message || ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Form>
      </Modal>
      <Modal
        open={testResultModalVisible}
        onCancel={() => setTestResultModalVisible(false)}
        onOk={async () => {
          if (testResultModalMode === 'view') {
            setTestResultModalVisible(false);
            return;
          }
          try {
            const values = await createForm.validateFields();
            if (!testResultModalId) return;
            await appointmentApi.updateTestResult(testResultModalId, {
              diagnosis: values.diagnosis,
              recommendations: values.recommendations
            });
            message.success('Cập nhật hồ sơ xét nghiệm thành công!');
            setTestResultModalVisible(false);
            loadAppointments();
          } catch (e) {
            message.error('Cập nhật hồ sơ xét nghiệm thất bại!');
          }
        }}
        title={testResultModalMode === 'view' ? 'Chi tiết hồ sơ xét nghiệm' : 'Chỉnh sửa hồ sơ xét nghiệm'}
        width={600}
        destroyOnClose
        footer={testResultModalMode === 'view' ? [
          <Button key="ok" type="primary" onClick={() => setTestResultModalVisible(false)}>
            OK
          </Button>
        ] : undefined}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="diagnosis" label="Chẩn đoán" rules={[{ required: false }]}> 
            <Input.TextArea rows={3} placeholder="Nhập chẩn đoán" readOnly={testResultModalMode === 'view'} />
          </Form.Item>
          <Form.Item name="recommendations" label="Khuyến nghị" rules={[{ required: false }]}> 
            <Input.TextArea rows={3} placeholder="Nhập khuyến nghị" readOnly={testResultModalMode === 'view'} />
          </Form.Item>
          {testResultModalItems && testResultModalItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Kết quả chỉ số đã nhập:</div>
              <div>
                {testResultModalTestCategories.map((cat, idx) => {
                  const item = testResultModalItems.find(i => String(i.testCategoryId?._id || i.testCategoryId || i.itemNameId?._id || i.itemNameId) === String(cat.testCategoryId?._id || cat.testCategoryId || cat._id));
                  if (!item) return null;
                  const minValue = cat.minValue;
                  const maxValue = cat.maxValue;
                  const unit = cat.customUnit || cat.unit || '';
                  let color = '#1677ff';
                  if (item.flag === 'normal') color = '#52c41a';
                  else if (item.flag === 'low' || item.flag === 'mild_high') color = '#faad14';
                  else if (item.flag === 'very_low' || item.flag === 'high' || item.flag === 'critical') color = '#ff4d4f';
                  const flagTextMap = {
                    very_low: 'Rất thấp',
                    low: 'Thấp',
                    normal: 'Bình thường',
                    mild_high: 'Hơi cao',
                    high: 'Cao',
                    critical: 'Nguy kịch'
                  };
                  return (
                    <React.Fragment key={cat._id || idx}>
                      <div style={{
                        borderBottom: '1px solid #f0f0f0',
                        padding: '14px 0 6px 0',
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: 44,
                        height: 'auto',
                        fontSize: 13
                      }}>
                        {/* Tên chỉ số */}
                        <div style={{ width: 260, fontWeight: 700, fontSize: 14, color: '#222', marginRight: 0, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'unset' }}>{cat.testCategoryId?.name || cat.name || item.testCategoryId?.name || item.itemNameId?.name || 'Chỉ số'}</div>
                        {/* Các cột còn lại */}
                        <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* min-max (unit) */}
                          <div style={{ width: 110, fontSize: 13, color: '#888', fontWeight: 500, marginLeft: 0, marginRight: 18, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cat && cat.minValue !== undefined && cat.maxValue !== undefined ? (
                              <span>{cat.minValue} - {cat.maxValue}{cat.unit ? ` (${cat.unit})` : ''}</span>
                            ) : cat && cat.targetValue ? (
                              <span>{cat.targetValue}{cat.unit ? ` (${cat.unit})` : ''}</span>
                            ) : (item.unit ? <span>({item.unit})</span> : null)}
                          </div>
                          {/* value */}
                          <div style={{ width: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input
                              style={{
                                width: 48,
                                height: 32,
                                textAlign: 'center',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#222',
                                background: '#f5f5f5',
                                borderRadius: 8,
                                border: '1.5px solid #d9d9d9',
                                padding: 0,
                                margin: 0,
                                boxSizing: 'border-box',
                                display: 'block',
                                lineHeight: '32px',
                              }}
                              value={item.value}
                              readOnly={testResultModalMode !== 'edit'}
                              type="number"
                            />
                          </div>
                          {/* đánh giá */}
                          <div style={{ width: 80, flexShrink: 0, fontWeight: 700, color, fontSize: 13, textAlign: 'left', paddingLeft: 8, display: 'flex', alignItems: 'center' }}>
                            {flagTextMap[item.flag] || item.flag || ''}
                          </div>
                        </div>
                      </div>
                      {/* message kéo dài toàn bộ phần còn lại, bắt đầu từ min-max */}
                      {item.message && (
                        <div style={{ marginLeft: 260, width: 'calc(100% - 260px)', fontSize: 12, color, marginTop: 2, textAlign: 'left', wordBreak: 'break-word' }}>{item.message}</div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default TestResultsEntry; 