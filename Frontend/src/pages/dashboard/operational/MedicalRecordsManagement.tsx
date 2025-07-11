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
  Tabs,
  Row,
  Col
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
import { testResultItemsApi, serviceTestCategoriesApi, testCategoriesApi } from '../../../api/endpoints/testManagementApi';
import servicePackageApi from '../../../api/endpoints/servicePackageApi';
// import './medical-records-view.css';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface AppointmentTableItem {
  key: string;
  id: string;
  appointmentId?: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  serviceId?: any;
  packageId?: any; // Thêm dòng này
  packageName?: string; // Thêm dòng này
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
  const [testResultItems, setTestResultItems] = useState<any[]>([]);
  const [testCategories, setTestCategories] = useState<any[]>([]);
  const [activeTabKey, setActiveTabKey] = useState('1');
  const [serviceTestCategoriesMap, setServiceTestCategoriesMap] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.getAllAppointments({});
      const data: ApiAppointment[] = response.data.appointments;
      const mapped = data.map((item) => ({
        ...item,
        key: item._id,
        id: item._id,
        appointmentId: item._id,
        patientName: item.profileId?.fullName || 'N/A',
        patientPhone: item.profileId?.phone || 'N/A',
        doctorName: item.doctorId?.userId?.fullName || 'N/A',
        serviceName: item.serviceId?.serviceName || '',
        serviceId: item.serviceId,
        packageId: item.packageId || undefined, // Thêm dòng này
        packageName: item.packageId?.name || '', // Thêm dòng này
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

  // Thêm hàm fetch serviceTestCategories cho package
  const fetchServiceTestCategoriesForPackage = async (packageId) => {
    try {
      const pkgRes = await servicePackageApi.getServicePackageById(packageId);
      // ServicePackageResponse: { success, data: { ...ServicePackage } }
      const services = pkgRes.data?.services || [];
      let allCats = [];
      for (const s of services) {
        const sid = typeof s.serviceId === 'object' ? s.serviceId._id : s.serviceId;
        if (!sid) continue;
        const res = await serviceTestCategoriesApi.getByService(sid);
        if (Array.isArray(res)) allCats = allCats.concat(res);
      }
      return allCats;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (medicalModalOpen && selectedAppointment && activeTabKey === '2') {
      testCategoriesApi.getAll().then(cats => setTestCategories(cats || []));
      appointmentApi.getTestResultsByAppointment(selectedAppointment.appointmentId || selectedAppointment.id).then(res => {
        const testResult = Array.isArray(res?.data) ? res.data[0] : res?.data;
        setCurrentMedicalRecord(testResult); // Lưu testResult để lấy diagnosis, recommendations
        const testResultItemsId = testResult?.testResultItemsId || [];
        if (!testResultItemsId || testResultItemsId.length === 0) {
          setTestResultItems([]);
          return;
        }
        testResultItemsApi.getByAppointment(selectedAppointment.appointmentId || selectedAppointment.id)
          .then(itemsArr => {
            const allItems = Array.isArray(itemsArr)
              ? itemsArr.flatMap(item => item.items || [])
              : [];
            setTestResultItems(allItems);
          });
    });
    // Nếu là package, fetch tất cả serviceTestCategories của các service trong package
    if (selectedAppointment.packageId?._id || selectedAppointment.packageId?.id) {
      const pkgId = selectedAppointment.packageId._id || selectedAppointment.packageId.id;
      fetchServiceTestCategoriesForPackage(pkgId).then(allCats => {
        setServiceTestCategoriesMap(prev => ({ ...prev, [pkgId]: allCats }));
      });
    } else {
      // Nếu là dịch vụ lẻ
      const serviceId = selectedAppointment?.serviceId?._id || selectedAppointment?.serviceId;
      if (serviceId && !serviceTestCategoriesMap[serviceId]) {
        fetchServiceTestCategoriesByServiceId(serviceId).then(cats => {
          setServiceTestCategoriesMap(prev => ({ ...prev, [serviceId]: cats }));
        });
      }
    }
  }
}, [medicalModalOpen, selectedAppointment, activeTabKey]);

  // Tự động fetch serviceTestCategories cho tất cả serviceId khi load appointments
  useEffect(() => {
    const fetchAllServiceTestCategories = async () => {
      const uniqueServiceIds = Array.from(new Set(appointments.map(a => a.serviceId?._id || a.serviceId).filter(Boolean)));
      const map = {};
      for (const serviceId of uniqueServiceIds) {
        if (!serviceId) continue;
        const cats = await fetchServiceTestCategoriesByServiceId(serviceId);
        map[serviceId] = cats;
      }
      setServiceTestCategoriesMap(map);
    };
    if (appointments.length) fetchAllServiceTestCategories();
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
      render: (text: string, record: AppointmentTableItem) => <Text>{record.packageName || text}</Text>
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
        await appointmentApi.updateAppointmentStatus(selectedAppointment.id, 'completed');
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
      <div style={{ marginBottom: 16 }}>
        <b>Chẩn đoán:</b>
        <div style={{ width: '100%', minHeight: 32, border: '1px solid #d9d9d9', borderRadius: 4, padding: 8, background: '#fafafa', marginBottom: 8 }}>
          {currentMedicalRecord?.diagnosis || 'Chưa có'}
        </div>
        <b>Khuyến nghị:</b>
        <div style={{ width: '100%', minHeight: 32, border: '1px solid #d9d9d9', borderRadius: 4, padding: 8, background: '#fafafa' }}>
          {currentMedicalRecord?.recommendations || 'Chưa có'}
        </div>
      </div>
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <b>Kết quả chỉ số đã nhập:</b>
        <div>
          {testResultItems && testResultItems.length > 0 ? (
            testResultItems.map((item, idx) => {
              const pkgId = selectedAppointment?.packageId?._id || selectedAppointment?.packageId?.id;
              const serviceId = selectedAppointment?.serviceId?._id || selectedAppointment?.serviceId;
              const serviceCats = pkgId ? (serviceTestCategoriesMap[pkgId] || []) : (serviceTestCategoriesMap[serviceId] || []);
              const cat = serviceCats.find(sc => sc.testCategoryId === item.testCategoryId) ||
                          serviceCats.find(sc => sc.testCategoryId?._id === item.testCategoryId) ||
                          serviceCats.find(sc => sc.testCategoryId === item.testCategoryId?._id) ||
                          serviceCats.find(sc => String(sc.testCategoryId) === String(item.testCategoryId)); 
              const testCat = testCategories.find(tc => tc._id === cat?.testCategoryId || tc._id === item.testCategoryId);
              const displayName = testCat?.name || item.testCategoryId;
              
              // Debug log để kiểm tra min-max data
              console.log('=== MIN-MAX DEBUG ===');
              console.log('Item:', item);
              console.log('Item.testCategoryId:', item.testCategoryId, 'Type:', typeof item.testCategoryId);
              console.log('ServiceId:', serviceId);
              console.log('ServiceCats:', serviceCats);
              console.log('ServiceCats testCategoryIds:', serviceCats.map(sc => ({ id: sc.testCategoryId, type: typeof sc.testCategoryId })));
              console.log('ServiceTestCategoriesMap:', serviceTestCategoriesMap);
              console.log('Cat found:', cat);
              console.log('MinValue:', cat?.minValue, 'MaxValue:', cat?.maxValue);
              console.log('Unit:', cat?.unit);
              console.log('TestCat name:', testCat?.name);
              console.log('SelectedAppointment:', selectedAppointment);
              console.log('========================');
              
              const flagTextMap = {
                very_low: 'Rất thấp',
                low: 'Thấp',
                normal: 'Bình thường',
                mild_high: 'Hơi cao',
                high: 'Cao',
                critical: 'Nguy kịch'
              };
              const flagColor = {
                normal: '#52c41a',
                mild_high: '#faad14',
                high: '#ff4d4f',
                very_low: '#ff4d4f',
                low: '#faad14',
                critical: '#d32029'
              }[item.flag] || '#1677ff';
              return (
                <>
                  <div key={idx} style={{
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
                    <div style={{ width: 320, flexShrink: 0, fontWeight: 700, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
                    {/* Các cột còn lại */}
                    <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {/* min-max (unit) */}
                      <div style={{ width: 120, flexShrink: 0, color: '#888', fontWeight: 500, fontSize: 12, textAlign: 'center' }}>
                        {cat && (cat.minValue != null || cat.maxValue != null) ? (
                          <span>
                            {cat.minValue != null && cat.maxValue != null ? 
                              `${cat.minValue} - ${cat.maxValue}` :
                              cat.minValue != null ? `≥${cat.minValue}` :
                              cat.maxValue != null ? `≤${cat.maxValue}` : ''
                            }
                            {(cat.unit || testCat?.unit || item.unit) ? ` (${cat.unit || testCat?.unit || item.unit})` : ''}
                          </span>
                        ) : (
                          <span>
                            {(cat?.unit || testCat?.unit || item.unit) ? `(${cat?.unit || testCat?.unit || item.unit})` : 
                             <span style={{ color: '#ccc', fontSize: '8px' }}>Chưa có ngưỡng</span>}
                          </span>
                        )}
                      </div>
                      {/* Value */}
                      <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <input
                          style={{
                            width: 60,
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
                          readOnly
                          type="number"
                        />
                      </div>
                      {/* Đánh giá */}
                      <div style={{ width: 110, flexShrink: 0, fontWeight: 700, color: flagColor, fontSize: 13, textAlign: 'left', paddingLeft: 8, display: 'flex', alignItems: 'center' }}>
                        {flagTextMap[item.flag] || item.flag || ''}
                      </div>
                    </div>
                  </div>
                  {/* Message kéo dài toàn bộ phần còn lại, bắt đầu từ min-max */}
                  {item.message && (
                    <div style={{ marginLeft: 320, width: 'calc(100% - 320px)', fontSize: 12, color: flagColor, marginTop: 2, textAlign: 'left', wordBreak: 'break-word' }}>{item.message}</div>
                  )}
                </>
              );
            })
          ) : (
            <div>Không có dữ liệu chỉ số!</div>
          )}
        </div>
      </div>
    </div>
  );

  // Hàm lấy serviceTestCategories theo serviceId
  const fetchServiceTestCategoriesByServiceId = async (serviceId) => {
    if (!serviceId) return [];
    try {
      const res = await serviceTestCategoriesApi.getByService(serviceId);
      return res || [];
    } catch (err) {
      console.error('Lỗi khi fetch serviceTestCategories:', err);
      return [];
    }
  };

  const isFinalStatus = (status: string) => ['completed', 'done_testResult'].includes(status);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ marginBottom: 24 }}>Quản lý hồ sơ bệnh án</Title>
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
        <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
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
              {medicineList.map((med, idx) => {
                // Lọc các thuốc đã chọn ở dòng khác
                const selectedNames = medicineList.map((m, i) => i !== idx && m.name).filter(Boolean);
                const availableOptions = medicinesOptions.filter(opt => !selectedNames.includes(opt.name));
                return (
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
                      options={availableOptions.map(m => ({ label: m.name, value: m.name }))}
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
              );
            })}
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