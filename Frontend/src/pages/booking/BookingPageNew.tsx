import { Calendar, Form, Input, message, Modal, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// APIs
import { appointmentApi } from '../../api/endpoints';
import { doctorApi } from '../../api/endpoints/doctorApi';
import doctorScheduleApi from '../../api/endpoints/doctorSchedule';
import servicesApi from '../../api/endpoints/services';
import userProfileApiInstance from '../../api/endpoints/userProfileApi';

// Hooks
import useAuth from '../../hooks/useAuth';

const { TextArea } = Input;
const { Option } = Select;

interface Service {
  id: string;
  serviceName: string;
  description: string;
  price: number;
  serviceType: string;
  availableAt: string[];
  isDeleted: number;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  reviewCount: number;
  avatar: string;
  isAvailable: boolean;
  bio?: string;
}

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  birthDate: string;
  gender: string;
  relationship: string;
  isDefault: boolean;
}

const BookingPageNew: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [form] = Form.useForm();

  // Form states
  const [selectedService, setSelectedService] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [typeLocation, setTypeLocation] = useState<'online' | 'clinic' | 'home'>('clinic');

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);

  // Loading states
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingAvailableDates, setLoadingAvailableDates] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile modal
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [createProfileForm] = Form.useForm();

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setNetworkError(false);
      const response = await servicesApi.getServices();
      const servicesData = response.data?.data?.services || response.data?.services || response.data;
      
      if (!servicesData || !Array.isArray(servicesData)) {
        throw new Error('Invalid services data format');
      }
      
      const mappedServices: Service[] = servicesData.map((service: any) => ({
        id: service._id || service.id || '',
        serviceName: service.serviceName,
        description: service.description || '',
        price: service.price || 0,
        serviceType: service.serviceType || 'consultation',
        availableAt: service.availableAt || [],
        isDeleted: service.isDeleted || 0,
      }));

      setServices(mappedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setNetworkError(true);
      setServices([]);
    }
  }, []);

  // Fetch doctors
  const fetchDoctors = useCallback(async () => {
    try {
      setNetworkError(false);
      const apiDoctors = await doctorApi.getAll();
      
      const mappedDoctors: Doctor[] = apiDoctors.map((doctor: any) => ({
        id: doctor._id,
        name: doctor.userId?.fullName || doctor.fullName || doctor.name || 'Chưa có tên',
        specialization: doctor.specialization || 'Chưa xác định',
        experience: doctor.experience || 0,
        rating: doctor.rating || 4.5,
        reviewCount: 0,
        avatar: doctor.userId?.avatar || doctor.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
        isAvailable: doctor.userId?.isActive !== false,
        bio: doctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm'
      }));
      
      setDoctors(mappedDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setNetworkError(true);
    }
  }, []);

  // Fetch time slots based on selected date
  const fetchTimeSlots = useCallback(async (date: Dayjs) => {
    if (!date) return;
    
    setLoadingTimeSlots(true);
    try {
      const dateStr = date.format('YYYY-MM-DD');
      const response = await doctorScheduleApi.getAvailableDoctors(dateStr);
      const doctorsData = Array.isArray(response) ? response : [];
      
      const allSlots = new Set<string>();
      doctorsData.forEach((doctor: any) => {
        if (doctor.availableSlots && Array.isArray(doctor.availableSlots)) {
          doctor.availableSlots.forEach((slot: any) => {
            if (slot.status === 'Free') {
              allSlots.add(slot.slotTime);
            }
          });
        }
      });
      
      const slotsArray: TimeSlot[] = Array.from(allSlots).sort().map(time => ({
        id: time,
        time: time,
        isAvailable: true
      }));
      
      setTimeSlots(slotsArray);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  }, []);

  // Fetch available dates
  const fetchAvailableDates = useCallback(async () => {
    if (loadingAvailableDates) return;
    
    try {
      setLoadingAvailableDates(true);
      const currentMonth = dayjs();
      const nextMonth = currentMonth.add(1, 'month');
      
      const allDatesToCheck: string[] = [];
      const today = dayjs();
      const endOfNextMonth = nextMonth.endOf('month');
      
      let checkDate = today;
      while (checkDate.isBefore(endOfNextMonth) || checkDate.isSame(endOfNextMonth, 'day')) {
        allDatesToCheck.push(checkDate.format('YYYY-MM-DD'));
        checkDate = checkDate.add(1, 'day');
      }
      
      const availableDatesSet = new Set<string>();
      const batchSize = 10;
      
      for (let i = 0; i < allDatesToCheck.length; i += batchSize) {
        const batch = allDatesToCheck.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (dateStr) => {
          try {
            const response = await doctorScheduleApi.getAvailableDoctors(dateStr);
            const doctorsData = Array.isArray(response) ? response : [];
            
            const hasAvailableSlots = doctorsData.some((doctor: any) => {
              if (doctor.availableSlots && Array.isArray(doctor.availableSlots)) {
                const freeSlots = doctor.availableSlots.filter((slot: any) => slot.status === 'Free');
                return freeSlots.length > 0;
              }
              return false;
            });
            
            if (hasAvailableSlots) {
              return dateStr;
            }
            return null;
          } catch (error) {
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(date => {
          if (date) availableDatesSet.add(date);
        });
        
        if (i + batchSize < allDatesToCheck.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const finalAvailableDates = Array.from(availableDatesSet).sort();
      setAvailableDates(finalAvailableDates);
      
    } catch (error) {
      console.error('Error fetching available dates:', error);
      setAvailableDates([]);
    } finally {
      setLoadingAvailableDates(false);
    }
  }, [loadingAvailableDates]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchServices(),
        fetchDoctors(),
        fetchAvailableDates()
      ]);
    };
    
    initializeData();
  }, [fetchServices, fetchDoctors, fetchAvailableDates]);

  // Handle date selection
  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
    fetchTimeSlots(date);
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    if (!selectedService || !selectedDate || !selectedTimeSlot || !selectedProfile) {
      message.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const bookingData = {
        serviceId: selectedService,
        doctorId: selectedDoctor || undefined,
        appointmentDate: selectedDate.format('YYYY-MM-DD'),
        appointmentTime: selectedTimeSlot,
        appointmentType: 'consultation' as const,
        typeLocation: (typeLocation === 'online' ? 'Online' : typeLocation) as 'clinic' | 'home' | 'Online',
        profileId: selectedProfile,
        description: values.description,
        notes: values.notes,
        address: typeLocation === 'home' ? values.address : undefined,
      };

      const response = await appointmentApi.createAppointment(bookingData as any);
      
      if (response.success || response.data) {
        const appointmentId = response.data?._id || response.data?.id;
        message.success('Đặt lịch thành công!');
        navigate(`/payment/success?appointmentId=${appointmentId}`, { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('Error submitting booking:', error);
      message.error('Có lỗi xảy ra khi đặt lịch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const getSelectedService = () => services.find(s => s.id === selectedService);
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getCurrentPrice = () => {
    const service = getSelectedService();
    return service?.price || 0;
  };

  // Calendar cell render
  const dateCellRender = useMemo(() => (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const isAvailable = availableDates.includes(dateStr);
    
    return isAvailable ? (
      <div style={{
        position: 'absolute',
        bottom: '1px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '2px',
        height: '2px',
        backgroundColor: '#10b981',
        borderRadius: '50%'
      }} />
    ) : null;
  }, [availableDates]);

  const disabledDate = useMemo(() => (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return !availableDates.includes(dateStr) || date.isBefore(dayjs(), 'day');
  }, [availableDates]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      maxHeight: '100vh', 
      backgroundColor: '#f8fafc',
      overflow: 'auto'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '8px 12px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '12px',
          flexShrink: 0
        }}>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827', 
            margin: '0 0 4px 0'
          }}>Đặt lịch khám</h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '13px',
            margin: '0'
          }}>Chọn dịch vụ, thời gian và bác sĩ</p>
        </div>

        {/* Main Form */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '16px',
          minHeight: 0
        }}>
          {/* Left Column - Calendar */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '6px',
            padding: '12px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#111827', 
              margin: '0 0 8px 0'
            }}>Chọn ngày khám</h3>
            
            <div style={{ flex: 1, transform: 'scale(0.75)', transformOrigin: 'top left' }}>
              <Calendar
                fullscreen={false}
                value={selectedDate}
                onSelect={handleDateSelect}
                cellRender={dateCellRender}
                disabledDate={disabledDate}
                className="compact-calendar"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div style={{ marginTop: '8px' }}>
                <h4 style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#111827', 
                  margin: '0 0 6px 0'
                }}>Giờ khám</h4>
                
                {loadingTimeSlots ? (
                  <div style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid #e5e7eb',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto'
                    }}></div>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: '8px 0' }}>
                    Không có lịch trống
                  </p>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '4px' 
                  }}>
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        style={{
                          padding: '4px 2px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: selectedTimeSlot === slot.time ? '1px solid #3b82f6' : '1px solid #d1d5db',
                          backgroundColor: selectedTimeSlot === slot.time ? '#eff6ff' : 'white',
                          color: selectedTimeSlot === slot.time ? '#1d4ed8' : '#374151',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Form */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '6px',
            padding: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'auto'
          }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="small"
            >
              {/* Service Selection */}
              <Form.Item
                label={<span style={{ fontSize: '12px', fontWeight: '600' }}>Dịch vụ</span>}
                required
                style={{ marginBottom: '12px' }}
              >
                <Select
                  value={selectedService}
                  onChange={setSelectedService}
                  placeholder="Chọn dịch vụ"
                  style={{ fontSize: '12px' }}
                >
                  {services.map(service => (
                    <Option key={service.id} value={service.id}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '500' }}>
                          {service.serviceName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {formatPrice(service.price)}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Doctor Selection */}
              <Form.Item
                label={<span style={{ fontSize: '12px', fontWeight: '600' }}>Bác sĩ</span>}
                style={{ marginBottom: '12px' }}
              >
                <Select
                  value={selectedDoctor}
                  onChange={setSelectedDoctor}
                  placeholder="Hệ thống tự chọn"
                  allowClear
                  style={{ fontSize: '12px' }}
                >
                  {doctors.filter(d => d.isAvailable).map(doctor => (
                    <Option key={doctor.id} value={doctor.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img
                          src={doctor.avatar}
                          alt={doctor.name}
                          style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                        />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '500' }}>
                            {doctor.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#6b7280' }}>
                            {doctor.specialization}
                          </div>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Profile Selection */}
              <Form.Item
                label={<span style={{ fontSize: '12px', fontWeight: '600' }}>Bệnh nhân</span>}
                required
                style={{ marginBottom: '12px' }}
              >
                <Select
                  value={selectedProfile}
                  onChange={setSelectedProfile}
                  placeholder="Chọn hồ sơ"
                  style={{ fontSize: '12px' }}
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                      <div style={{ padding: '4px 8px', borderTop: '1px solid #e5e7eb' }}>
                        <button
                          type="button"
                          onClick={() => setShowCreateProfileModal(true)}
                          style={{
                            width: '100%',
                            padding: '4px',
                            fontSize: '11px',
                            border: '1px dashed #d1d5db',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                        >
                          + Tạo hồ sơ mới
                        </button>
                      </div>
                    </div>
                  )}
                >
                  {userProfiles.map(profile => (
                    <Option key={profile.id} value={profile.id}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '500' }}>
                          {profile.fullName}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>
                          {profile.gender === 'male' ? 'Nam' : 'Nữ'} • {profile.birthDate}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Location Type */}
              <Form.Item
                label={<span style={{ fontSize: '12px', fontWeight: '600' }}>Hình thức</span>}
                style={{ marginBottom: '12px' }}
              >
                <Select
                  value={typeLocation}
                  onChange={setTypeLocation}
                  style={{ fontSize: '12px' }}
                >
                  <Option value="clinic">Tại phòng khám</Option>
                  <Option value="online">Tư vấn online</Option>
                </Select>
              </Form.Item>

              {/* Description */}
              <Form.Item
                name="description"
                label={<span style={{ fontSize: '12px', fontWeight: '600' }}>Triệu chứng</span>}
                rules={[
                  { required: true, message: 'Vui lòng mô tả triệu chứng' },
                  { min: 10, message: 'Tối thiểu 10 ký tự' }
                ]}
                style={{ marginBottom: '12px' }}
              >
                <TextArea 
                  placeholder="Mô tả triệu chứng" 
                  rows={3}
                  showCount
                  maxLength={200}
                  style={{ fontSize: '12px' }}
                />
              </Form.Item>

              {/* Notes */}
              <Form.Item
                name="notes"
                label={<span style={{ fontSize: '12px', fontWeight: '600' }}>Ghi chú</span>}
                style={{ marginBottom: '12px' }}
              >
                <TextArea 
                  placeholder="Ghi chú bổ sung" 
                  rows={2}
                  style={{ fontSize: '12px' }}
                />
              </Form.Item>

              {/* Price Display */}
              {selectedService && (
                <div style={{
                  padding: '8px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '4px',
                  marginBottom: '12px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '12px', color: '#0369a1' }}>Chi phí:</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
                      {formatPrice(getCurrentPrice())}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Form.Item style={{ marginBottom: '0' }}>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedService || !selectedDate || !selectedTimeSlot || !selectedProfile}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: isSubmitting || !selectedService || !selectedDate || !selectedTimeSlot || !selectedProfile 
                      ? '#94a3b8' : '#059669',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isSubmitting || !selectedService || !selectedDate || !selectedTimeSlot || !selectedProfile 
                      ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Đặt lịch ngay'}
                </button>
              </Form.Item>
            </Form>
          </div>
        </div>

        {/* Create Profile Modal */}
        <Modal
          title={<span style={{ fontSize: '14px' }}>Tạo hồ sơ mới</span>}
          open={showCreateProfileModal}
          onOk={() => createProfileForm.submit()}
          onCancel={() => setShowCreateProfileModal(false)}
          okText="Tạo hồ sơ"
          cancelText="Hủy"
          width={400}
        >
          <Form
            form={createProfileForm}
            layout="vertical"
            size="small"
          >
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>
            
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
            
            <Form.Item
              name="birthDate"
              label="Năm sinh"
              rules={[{ required: true, message: 'Vui lòng nhập năm sinh' }]}
            >
              <Input placeholder="VD: 1990" />
            </Form.Item>
            
            <Form.Item
              name="gender"
              label="Giới tính"
              rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
            >
              <Select placeholder="Chọn giới tính">
                <Option value="male">Nam</Option>
                <Option value="female">Nữ</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>

      <style>{`
        .compact-calendar .ant-picker-calendar-header {
          padding: 4px 8px;
        }
        
        .compact-calendar .ant-picker-content {
          height: auto;
        }
        
        .compact-calendar .ant-picker-calendar-date-value {
          font-size: 11px;
          line-height: 16px;
          height: 16px;
        }
        
        .compact-calendar .ant-picker-cell {
          padding: 1px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BookingPageNew; 