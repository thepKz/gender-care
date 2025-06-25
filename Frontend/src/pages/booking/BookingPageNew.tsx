import { Badge, Calendar, Form, Input, message, Modal, Select, Tabs } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components

// APIs
import { appointmentApi } from '../../api/endpoints';
import { doctorApi } from '../../api/endpoints/doctorApi';
import doctorScheduleApi from '../../api/endpoints/doctorSchedule';
import servicesApi from '../../api/endpoints/services';
import userProfileApiInstance from '../../api/endpoints/userProfileApi';

// Hooks
import useAuth from '../../hooks/useAuth';

const { TextArea } = Input;

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

  // Current step (0: service, 1: datetime+doctor, 2: profile+details, 3: confirm)
  const [currentStep, setCurrentStep] = useState(0);

  // Form states
  const [selectedService, setSelectedService] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [typeLocation, setTypeLocation] = useState<'online' | 'clinic' | 'home'>('clinic');
  const [serviceType, setServiceType] = useState<'single' | 'package'>('single');

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);

  // Loading states
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingAvailableDates, setLoadingAvailableDates] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Profile modal
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [createProfileForm] = Form.useForm();

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      const response = await servicesApi.getServices();
      
      // Backend trả về: { success: true, data: { services: [...], pagination: {...} } }
      const servicesData = response.data?.data?.services || response.data?.services || response.data;
      
      if (!servicesData || !Array.isArray(servicesData)) {
        console.error('❌ [Debug] Invalid services data format:', servicesData);
        throw new Error('Invalid services data format');
      }
      
      const mappedServices: Service[] = servicesData.map((service: any) => ({
        id: service._id || service.id,
        serviceName: service.serviceName,
        description: service.description || '',
        price: service.price || 0,
        serviceType: service.serviceType || 'consultation',
        availableAt: service.availableAt || [],
        isDeleted: service.isDeleted || 0,
      }));

      setServices(mappedServices);
      
      // Kiểm tra xem có dịch vụ nào không
      if (mappedServices.length === 0) {
        message.warning('Không có dịch vụ nào khả dụng');
      }
    } catch (error) {
      console.error('❌ [Debug] Error fetching services:', error);
      message.error('Không thể tải danh sách dịch vụ từ server');
      setServices([]); // Set empty array as fallback
    } finally {
      // Loading complete
    }
  }, []);

  // Define interfaces for better type safety
  interface DoctorApiResponse {
    _id: string;
    userId?: {
      fullName?: string;
      avatar?: string;
      isActive?: boolean;
    };
    fullName?: string;
    name?: string;
    specialization?: string;
    experience?: number;
    rating?: number;
    avatar?: string;
    bio?: string;
  }

  // Fetch doctors
  const fetchDoctors = useCallback(async () => {
    try {
      // Gọi API lấy danh sách bác sĩ cơ bản (endpoint có sẵn)
      const apiDoctors = await doctorApi.getAll();
      
      // Map dữ liệu từ API sang interface Doctor của booking
      const mappedDoctors: Doctor[] = apiDoctors.map((doctor: DoctorApiResponse) => ({
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
      
      if (mappedDoctors.length === 0) {
        message.warning('Không có bác sĩ nào khả dụng');
      }
    } catch (error) {
      console.error('❌ [Debug] Error fetching doctors:', error);
      message.error('Không thể tải danh sách bác sĩ từ server');
    }
  }, []);

  // Define interfaces for API responses
  interface ScheduleSlot {
    slotTime: string;
    status: 'Free' | 'Booked' | 'Blocked';
  }

  interface DoctorSchedule {
    doctorId: string;
    doctorName?: string;
    date: string;
    availableSlots: ScheduleSlot[];
  }

  // Fetch time slots based on selected date
  const fetchTimeSlots = useCallback(async (date: Dayjs) => {
    if (!date) return;
    
    const dateString = date.format('YYYY-MM-DD');
    console.log('🔍 [fetchTimeSlots] Fetching slots for date:', dateString);
    
    // Don't fetch if date is not available
    if (!availableDates.includes(dateString)) {
      console.log('⚠️ [fetchTimeSlots] Date not in available dates, skipping');
      setTimeSlots([]);
      return;
    }
    
    try {
      setLoadingTimeSlots(true);
      const response = await doctorScheduleApi.getAvailableDoctors(dateString);
      
      console.log('📊 [fetchTimeSlots] Raw API response:', response);
      
      // Log detailed structure of first item to understand actual format
      if (Array.isArray(response) && response.length > 0) {
        console.log('🔍 [fetchTimeSlots] Detailed first item structure:', {
          fullObject: response[0],
          keys: Object.keys(response[0]),
          availableSlots: response[0].availableSlots,
          sampleSlot: response[0].availableSlots?.[0]
        });
      }
      
      // Extract unique time slots from all doctors
      const allSlots = new Set<string>();
      const doctorSchedules = Array.isArray(response) ? response : [];
      
      console.log('📋 [fetchTimeSlots] Doctor schedules found:', doctorSchedules.length);
      
      doctorSchedules.forEach((schedule: any) => {
        console.log('👨‍⚕️ [fetchTimeSlots] Processing doctor schedule:', {
          fullSchedule: schedule,
          doctorId: schedule.doctorId,
          doctorName: schedule.doctorName,
          date: schedule.date,
          availableSlots: schedule.availableSlots,
          slotsCount: schedule.availableSlots?.length || 0
        });
        
        // Since date might be undefined in response, check if slots exist and process them
        // The date validation was already done when fetching available dates
        if (schedule.availableSlots && Array.isArray(schedule.availableSlots)) {
          schedule.availableSlots.forEach((slot: any) => {
            console.log('🕐 [fetchTimeSlots] Processing slot:', slot);
            if (slot.status === 'Free') {
              allSlots.add(slot.slotTime);
              console.log('✅ [fetchTimeSlots] Added free slot:', slot.slotTime);
            }
          });
        } else {
          console.log('⚠️ [fetchTimeSlots] No availableSlots found or not an array');
        }
      });

      console.log('🎯 [fetchTimeSlots] All free slots found:', Array.from(allSlots));

      const mappedTimeSlots: TimeSlot[] = Array.from(allSlots).map((time) => ({
        id: time,
        time: time,
        isAvailable: true,
      })).sort((a, b) => a.time.localeCompare(b.time));

      console.log('📅 [fetchTimeSlots] Final mapped time slots:', mappedTimeSlots);
      setTimeSlots(mappedTimeSlots);
      
      if (mappedTimeSlots.length === 0) {
        console.log('⚠️ [fetchTimeSlots] No free slots found for date:', dateString);
      }
      
    } catch (error) {
      console.error('❌ Error fetching time slots:', error);
      setTimeSlots([]);
      message.error('Không thể tải danh sách giờ khám cho ngày này');
    } finally {
      setLoadingTimeSlots(false);
    }
  }, [availableDates]);

  // Fetch user profiles
  const fetchUserProfiles = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await userProfileApiInstance.getMyProfiles();
      
      if (response && Array.isArray(response)) {
        const mappedProfiles: UserProfile[] = response.map((profile: {
          _id: string;
          fullName: string;
          phone?: string;
          email?: string;
          year?: string | Date;
          gender: string;
        }) => ({
          id: profile._id,
          fullName: profile.fullName,
          phone: profile.phone || '',
          birthDate: profile.year ? (typeof profile.year === 'string' ? profile.year : new Date(profile.year).toISOString().split('T')[0]) : '',
          gender: profile.gender,
          relationship: 'self',
          isDefault: false
        }));
        
        setUserProfiles(mappedProfiles);
      } else {
        setUserProfiles([]);
      }
    } catch (error) {
      console.error('❌ [Debug] Error fetching profiles:', error);
      setUserProfiles([]);
    }
  }, [isAuthenticated, user]);

  // Initial data fetch - FIX: Remove dependencies to prevent infinite render
  useEffect(() => {
    fetchServices();
    fetchDoctors();
    fetchAvailableDates();
  }, []); // Remove dependencies to prevent infinite re-render

  // Separate effect for user profiles when auth state changes
  useEffect(() => {
    if (isAuthenticated && userProfiles.length === 0) {
      fetchUserProfiles();
    }
  }, [isAuthenticated, fetchUserProfiles]); // Only depend on auth state

  // Fetch time slots when date changes - Only if availableDates is loaded
  useEffect(() => {
    if (selectedDate && availableDates.length > 0) {
      fetchTimeSlots(selectedDate);
    } else if (selectedDate && availableDates.length === 0) {
      // If no available dates loaded yet, don't show empty state
      setTimeSlots([]);
    }
  }, [selectedDate, availableDates, fetchTimeSlots]);

  // Navigation functions
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step handlers
  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleConfirmService = () => {
    if (!selectedService) {
      message.error('Vui lòng chọn dịch vụ');
      return;
    }
    handleNext();
  };

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setSelectedTimeSlot(''); // Reset time slot when date changes
    setSelectedDoctor(''); // Reset doctor when date changes
  };

  const handleProfileSelect = (profileId: string) => {
    if (profileId === 'new') {
      setShowCreateProfileModal(true);
      createProfileForm.resetFields();
    } else {
      setSelectedProfile(profileId);
    }
  };

  interface CreateProfileFormValues {
    fullName: string;
    phone: string;
    birthDate: string;
    gender: string;
  }

  const handleCreateProfile = async (values: CreateProfileFormValues) => {
    try {
      const newProfile = await userProfileApiInstance.createProfile({
        fullName: values.fullName,
        phone: values.phone,
        year: values.birthDate,
        gender: values.gender
      });
      
      const mappedNewProfile: UserProfile = {
        id: newProfile._id,
        fullName: newProfile.fullName,
        phone: newProfile.phone || '',
        birthDate: typeof newProfile.year === 'string' ? newProfile.year : String(newProfile.year || ''),
        gender: newProfile.gender,
        relationship: 'self',
        isDefault: false
      };
      
      setUserProfiles(prev => [...prev, mappedNewProfile]);
      setSelectedProfile(mappedNewProfile.id);
      setShowCreateProfileModal(false);
      
      message.success('Tạo hồ sơ thành công');
    } catch (error) {
      console.error('Error creating profile:', error);
      message.error('Không thể tạo hồ sơ');
    }
  };

  interface SubmitFormValues {
    description: string;
    notes?: string;
    address?: string;
  }

  // Submit booking
  const handleSubmit = async (values: SubmitFormValues) => {
    if (!selectedService || !selectedDate || !selectedTimeSlot || !selectedProfile) {
      message.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSubmitting(true);
      
      const bookingData = {
        serviceId: selectedService,
        doctorId: selectedDoctor || undefined,
        appointmentDate: selectedDate.format('YYYY-MM-DD'),
        appointmentTime: selectedTimeSlot,
        appointmentType: 'consultation' as const,
        typeLocation,
        profileId: selectedProfile,
        description: values.description,
        notes: values.notes,
        address: typeLocation === 'home' ? values.address : undefined,
      };

      const response = await appointmentApi.createAppointment(bookingData);
      
      if (response.success || response.data) {
        const appointmentId = response.data?._id || response.data?.id;
        message.success('Đặt lịch thành công!');
        
        // Navigate to payment/success
        navigate(`/payment/success?appointmentId=${appointmentId}`, { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('Error submitting booking:', error);
      message.error('Có lỗi xảy ra khi đặt lịch');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper functions
  const getSelectedService = () => services.find(s => s.id === selectedService);
  const getSelectedDoctor = () => doctors.find(d => d.id === selectedDoctor);
  const getSelectedProfile = () => userProfiles.find(p => p.id === selectedProfile);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getCurrentPrice = () => {
    if (selectedService === 'package-basic') return 1200000;
    if (selectedService === 'package-advanced') return 2000000;
    
    const service = getSelectedService();
    return service?.price || 0;
  };

  // Test API call to understand response format
  const testApiCall = useCallback(async () => {
    try {
      const testDate = dayjs().format('YYYY-MM-DD');
      console.log('🧪 [TEST] Testing API call for date:', testDate);
      const testResponse = await doctorScheduleApi.getAvailableDoctors(testDate);
      console.log('🧪 [TEST] Raw API response structure:', {
        response: testResponse,
        isArray: Array.isArray(testResponse),
        length: Array.isArray(testResponse) ? testResponse.length : 'N/A',
        firstItem: Array.isArray(testResponse) && testResponse.length > 0 ? testResponse[0] : null
      });
    } catch (error) {
      console.log('🧪 [TEST] API test error:', error);
    }
  }, []);

  // Fetch available dates when component mounts
  const fetchAvailableDates = useCallback(async () => {
    if (loadingAvailableDates) return; // Prevent multiple calls
    
    try {
      setLoadingAvailableDates(true);
      console.log('🔍 [Debug] Fetching available dates...');
      
      // Test API call first to understand format
      await testApiCall();
      
      const currentMonth = dayjs();
      const nextMonth = currentMonth.add(1, 'month');
      
      // Generate all dates for current and next month
      const allDatesToCheck: string[] = [];
      
      // Current month dates (từ hôm nay)
      const today = dayjs();
      const endOfCurrentMonth = currentMonth.endOf('month');
      let checkDate = today;
      while (checkDate.isBefore(endOfCurrentMonth) || checkDate.isSame(endOfCurrentMonth, 'day')) {
        allDatesToCheck.push(checkDate.format('YYYY-MM-DD'));
        checkDate = checkDate.add(1, 'day');
      }
      
      // Next month dates (tất cả ngày)
      const startOfNextMonth = nextMonth.startOf('month');
      const endOfNextMonth = nextMonth.endOf('month');
      checkDate = startOfNextMonth;
      while (checkDate.isBefore(endOfNextMonth) || checkDate.isSame(endOfNextMonth, 'day')) {
        allDatesToCheck.push(checkDate.format('YYYY-MM-DD'));
        checkDate = checkDate.add(1, 'day');
      }
      
      console.log('📅 [Debug] Checking dates:', allDatesToCheck.length, 'days');
      
      // Check each date for available doctors
      const availableDatesSet = new Set<string>();
      
      // Process in batches of 10 to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < allDatesToCheck.length; i += batchSize) {
        const batch = allDatesToCheck.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (dateStr) => {
          try {
            const response = await doctorScheduleApi.getAvailableDoctors(dateStr);
            const doctorsData = Array.isArray(response) ? response : [];
            
            // DEBUG: Log response structure for the first few calls
            if (dateStr.endsWith('26') || dateStr.endsWith('27') || dateStr.endsWith('28')) {
              console.log(`🔍 [Debug] API Response for ${dateStr}:`, {
                responseType: typeof response,
                isArray: Array.isArray(response),
                dataLength: doctorsData.length,
                sampleData: doctorsData.slice(0, 1),
                fullResponse: response
              });
            }
            
            // Check if any doctor has available slots for this date
            const hasAvailableSlots = doctorsData.some((doctor: any) => {
              if (doctor.availableSlots && Array.isArray(doctor.availableSlots)) {
                const freeSlots = doctor.availableSlots.filter((slot: any) => slot.status === 'Free');
                
                // DEBUG: Log doctor with slots
                if (freeSlots.length > 0 && (dateStr.endsWith('26') || dateStr.endsWith('27'))) {
                  console.log(`✅ [Debug] Found doctor with Free slots on ${dateStr}:`, {
                    fullDoctor: doctor,
                    doctorId: doctor.doctorId,
                    doctorName: doctor.doctorName,
                    totalSlots: doctor.availableSlots.length,
                    freeSlots: freeSlots.length,
                    freeSlotsDetails: freeSlots.map((s: any) => s.slotTime)
                  });
                }
                
                return freeSlots.length > 0;
              }
              return false;
            });
            
            if (hasAvailableSlots) {
              console.log(`✅ [Debug] Date ${dateStr} has available slots!`);
              return dateStr;
            }
            return null;
          } catch (error) {
            console.error(`❌ Error checking date ${dateStr}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(date => {
          if (date) availableDatesSet.add(date);
        });
        
        // Small delay between batches to be nice to the server
        if (i + batchSize < allDatesToCheck.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const finalAvailableDates = Array.from(availableDatesSet).sort();
      setAvailableDates(finalAvailableDates);
      
      console.log('✅ [Debug] Available dates found:', finalAvailableDates.length, 'days');
      console.log('📋 [Debug] Dates list:', finalAvailableDates);
      
      if (finalAvailableDates.length === 0) {
        message.warning('Hiện tại không có lịch khám nào khả dụng. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('❌ Error fetching available dates:', error);
      setAvailableDates([]);
      message.error('Không thể tải lịch khám. Vui lòng thử lại sau.');
    } finally {
      setLoadingAvailableDates(false);
    }
  }, [loadingAvailableDates]);

  // Calendar cell render for available dates
  const dateCellRender = useCallback((value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const isAvailable = availableDates.includes(dateStr);
    
    if (isAvailable) {
      return (
        <Badge
          status="success"
          text=""
          style={{ fontSize: '8px' }}
        />
      );
    }
    return null;
  }, [availableDates]);

  // Disable dates that don't have available slots
  const disabledDate = useCallback((current: Dayjs) => {
    if (!current) return true;
    
    // If no available dates loaded yet or empty, disable all dates
    if (availableDates.length === 0) return true;
    
    // Disable past dates
    if (current.isBefore(dayjs(), 'day')) return true;
    
    // Disable dates more than 2 months in future
    if (current.isAfter(dayjs().add(2, 'month'), 'day')) return true;
    
    // Disable dates that don't have available slots
    const dateStr = current.format('YYYY-MM-DD');
    return !availableDates.includes(dateStr);
  }, [availableDates]);

  // Steps for reference (currently hardcoded in JSX)
  // const steps = [
  //   { title: 'Dịch vụ', icon: '🏥' },
  //   { title: 'Thời gian', icon: '📅' },
  //   { title: 'Thông tin', icon: '👤' },
  //   { title: 'Xác nhận', icon: '✅' }
  // ];

  return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50">
        <style>{`
          .custom-tabs .ant-tabs-nav-wrap {
            justify-content: center;
          }
          .custom-tabs .ant-tabs-tab {
            margin: 0 8px;
            padding: 8px 16px;
            font-weight: 500;
            border-radius: 6px;
            transition: all 0.2s ease;
            font-size: 14px;
          }
          .custom-tabs .ant-tabs-tab:hover {
            background-color: #f8fafc;
          }
          .custom-tabs .ant-tabs-tab-active {
            background-color: #2563eb;
            color: white !important;
          }
          .custom-tabs .ant-tabs-tab-active:hover {
            background-color: #1d4ed8;
          }
          .custom-tabs .ant-tabs-ink-bar {
            display: none;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .service-card {
            cursor: pointer;
            background: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            padding: 16px;
            transition: all 0.2s ease;
            height: fit-content;
          }
          
          .service-card:hover {
            border-color: #3b82f6;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
          }
          
          .service-card.selected {
            border-color: #2563eb;
            background-color: #f8faff;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
          }
          
          .service-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            padding: 16px 0;
          }
          
          @media (max-width: 768px) {
            .service-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            .service-card {
              padding: 12px;
            }
          }
          
          .tabs-container {
            background: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            padding: 20px;
            margin: 0 16px 16px;
            flex: 1;
            overflow-y: auto;
          }
          
          .custom-tabs .ant-tabs-content-holder {
            padding: 16px 0;
          }
          
          .custom-tabs .ant-tabs-tabpane {
            padding: 0;
          }
          
          .nav-buttons {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            gap: 12px;
            background: white;
            border-top: 1px solid #e2e8f0;
          }
          
          .nav-button {
            padding: 10px 20px;
            border-radius: 6px;
            border: none;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 100px;
            font-size: 14px;
          }
          
          .nav-button.primary {
            background-color: #2563eb;
            color: white;
          }
          
          .nav-button.primary:hover {
            background-color: #1d4ed8;
          }
          
          .nav-button.primary:disabled {
            background-color: #94a3b8;
            cursor: not-allowed;
          }
          
          .nav-button.secondary {
            background-color: #f1f5f9;
            color: #475569;
            border: 1px solid #cbd5e1;
          }
          
          .nav-button.secondary:hover {
            background-color: #e2e8f0;
          }
          
          .step-indicator {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            padding: 12px 0;
            margin: 0;
          }
          
          .step-item {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          
          .step-item.active {
            background-color: #2563eb;
            color: white;
          }
          
          .step-item.completed {
            background-color: #10b981;
            color: white;
          }
          
          .step-item.inactive {
            background-color: #f1f5f9;
            color: #64748b;
          }
          
          .step-arrow {
            color: #cbd5e1;
            font-size: 12px;
          }
        `}</style>
        {/* Progress Steps */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="step-indicator">
              {[
                { title: 'Dịch vụ' },
                { title: 'Thời gian' },
                { title: 'Thông tin' },
                { title: 'Xác nhận' }
              ].map((step, index) => (
                <React.Fragment key={index}>
                  <div className={`step-item ${
                    index === currentStep 
                      ? 'active' 
                      : index < currentStep 
                        ? 'completed' 
                        : 'inactive'
                  }`}>
                    {step.title}
                  </div>
                  {index < 3 && (
                    <span className="step-arrow">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-4 max-w-6xl">
            {/* Step 0: Service Selection */}
            {currentStep === 0 && (
              <div className="h-full flex flex-col">


                {/* Service Type Tabs */}
                <div className="tabs-container flex-1">
                  <Tabs 
                    activeKey={serviceType} 
                    onChange={(key) => setServiceType(key as 'single' | 'package')}
                    size="small"
                    centered
                    className="custom-tabs"
                    items={[
                      {
                        key: 'single',
                        label: 'Dịch vụ đơn lẻ',
                        children: (
                          <div className="service-grid">
                            {services.map((service) => (
                              <div
                                key={service.id}
                                onClick={() => handleServiceSelect(service.id)}
                                className={`service-card ${selectedService === service.id ? 'selected' : ''}`}
                              >
                                <div>
                                  <h3 style={{ 
                                    fontSize: '15px', 
                                    fontWeight: '600', 
                                    color: '#1f2937', 
                                    marginBottom: '6px',
                                    lineHeight: '1.3'
                                  }}>{service.serviceName}</h3>
                                  <p style={{ 
                                    color: '#6b7280', 
                                    fontSize: '13px', 
                                    lineHeight: '1.4',
                                    marginBottom: '12px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>{service.description}</p>

                                  <div style={{ 
                                    paddingTop: '12px', 
                                    borderTop: '1px solid #f1f5f9',
                                    textAlign: 'center'
                                  }}>
                                    <div style={{ 
                                      fontSize: '16px', 
                                      fontWeight: '700', 
                                      color: '#2563eb',
                                      marginBottom: '4px'
                                    }}>
                                      {formatPrice(service.price)}
                                    </div>
                                    <div style={{ 
                                      fontSize: '11px', 
                                      color: '#94a3b8' 
                                    }}>
                                      {service.availableAt && service.availableAt.includes('Center') && 'Tại trung tâm'}
                                      {service.availableAt && service.availableAt.includes('Online') && service.availableAt.includes('Center') && ' • '}
                                      {service.availableAt && service.availableAt.includes('Online') && 'Tư vấn online'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      },
                      {
                        key: 'package',
                        label: 'Gói dịch vụ',
                        children: (
                          <div className="service-grid">
                            {/* Gói cơ bản */}
                            <div
                              onClick={() => handleServiceSelect('package-basic')}
                              className={`service-card ${selectedService === 'package-basic' ? 'selected' : ''}`}
                            >
                              <div>
                                <h3 style={{ 
                                  fontSize: '15px', 
                                  fontWeight: '600', 
                                  color: '#1f2937', 
                                  marginBottom: '6px' 
                                }}>Gói tư vấn cơ bản</h3>
                                <p style={{ 
                                  color: '#6b7280', 
                                  fontSize: '13px',
                                  marginBottom: '12px'
                                }}>3 buổi tư vấn + xét nghiệm cơ bản</p>
                                <div style={{ 
                                  paddingTop: '12px', 
                                  borderTop: '1px solid #f1f5f9',
                                  textAlign: 'center'
                                }}>
                                  <div style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '700', 
                                    color: '#2563eb',
                                    marginBottom: '4px'
                                  }}>
                                    {formatPrice(1200000)}
                                  </div>
                                  <div style={{ 
                                    fontSize: '11px', 
                                    color: '#94a3b8' 
                                  }}>
                                    Tiết kiệm 20%
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Gói nâng cao */}
                            <div
                              onClick={() => handleServiceSelect('package-advanced')}
                              className={`service-card ${selectedService === 'package-advanced' ? 'selected' : ''}`}
                            >
                              <div>
                                <h3 style={{ 
                                  fontSize: '15px', 
                                  fontWeight: '600', 
                                  color: '#1f2937', 
                                  marginBottom: '6px' 
                                }}>Gói tư vấn nâng cao</h3>
                                <p style={{ 
                                  color: '#6b7280', 
                                  fontSize: '13px',
                                  marginBottom: '12px'
                                }}>5 buổi tư vấn + xét nghiệm toàn diện</p>
                                <div style={{ 
                                  paddingTop: '12px', 
                                  borderTop: '1px solid #f1f5f9',
                                  textAlign: 'center'
                                }}>
                                  <div style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '700', 
                                    color: '#2563eb',
                                    marginBottom: '4px'
                                  }}>
                                    {formatPrice(2000000)}
                                  </div>
                                  <div style={{ 
                                    fontSize: '11px', 
                                    color: '#94a3b8' 
                                  }}>
                                    Tiết kiệm 25%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                    ]}
                  />
                </div>

                {/* Confirm Button */}
                <div className="nav-buttons">
                  <div></div>
                  <button
                    onClick={handleConfirmService}
                    disabled={!selectedService}
                    className="nav-button primary"
                  >
                    {selectedService ? 'Tiếp tục' : 'Chọn dịch vụ'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Date Time & Doctor Selection */}
            {currentStep === 1 && (
              <div style={{ 
                maxWidth: '1200px', 
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h1 style={{ 
                    fontSize: '28px', 
                    fontWeight: '700', 
                    color: '#111827', 
                    marginBottom: '8px' 
                  }}>Chọn thời gian và bác sĩ</h1>
                  <p style={{ color: '#6b7280' }}>Chọn ngày, giờ khám và bác sĩ phù hợp</p>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
                  gap: '24px',
                  padding: '0 16px'
                }}>
                  {/* Left: Calendar */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      marginBottom: '16px' 
                    }}>Chọn ngày khám</h3>
                    
                    {loadingAvailableDates ? (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        padding: '32px 0',
                        textAlign: 'center'
                      }}>
                        <div>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            border: '2px solid #e5e7eb',
                            borderTop: '2px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 8px'
                          }}></div>
                          <p style={{ color: '#6b7280', fontSize: '14px' }}>Đang tải lịch khám...</p>
                        </div>
                      </div>
                    ) : availableDates.length === 0 ? (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        padding: '32px 0',
                        textAlign: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
                          <h4 style={{ 
                            color: '#374151', 
                            fontSize: '16px', 
                            fontWeight: '600',
                            marginBottom: '8px'
                          }}>Chưa có lịch khám khả dụng</h4>
                          <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', marginBottom: '12px' }}>
                            Hiện tại chưa có bác sĩ nào có lịch làm việc.<br/>
                            Vui lòng thử lại sau hoặc liên hệ trung tâm.
                          </p>
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#dc2626',
                            background: '#fef2f2',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca'
                          }}>
                            <strong>💡 Lưu ý:</strong> Quản trị viên cần tạo lịch làm việc cho bác sĩ
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Calendar
                          fullscreen={false}
                          value={selectedDate}
                          onSelect={handleDateSelect}
                          cellRender={dateCellRender}
                          disabledDate={disabledDate}
                          className="border-0"
                        />
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '8px 12px', 
                          backgroundColor: '#f0f9ff', 
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#0369a1'
                        }}>
                          💡 Những ngày có dấu xanh là ngày có lịch trống
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right: Time & Doctor */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Time Slots */}
                    {selectedDate && (
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e5e7eb'
                      }}>
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: '#111827', 
                          marginBottom: '16px' 
                        }}>Chọn giờ khám</h3>
                        
                        {loadingTimeSlots ? (
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            padding: '32px 0' 
                          }}>
                            <div style={{ 
                              width: '32px', 
                              height: '32px', 
                              border: '2px solid #e5e7eb',
                              borderTop: '2px solid #3b82f6',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                          </div>
                        ) : timeSlots.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                            <p style={{ color: '#6b7280' }}>Không có lịch trống cho ngày này</p>
                            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>Vui lòng chọn ngày khác</p>
                          </div>
                        ) : (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(3, 1fr)', 
                            gap: '12px' 
                          }}>
                            {timeSlots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => setSelectedTimeSlot(slot.id)}
                                style={{
                                  padding: '12px',
                                  fontSize: '14px',
                                  borderRadius: '8px',
                                  border: selectedTimeSlot === slot.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                  backgroundColor: selectedTimeSlot === slot.id ? '#eff6ff' : 'white',
                                  color: selectedTimeSlot === slot.id ? '#1d4ed8' : '#374151',
                                  fontWeight: selectedTimeSlot === slot.id ? '500' : '400',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedTimeSlot !== slot.id) {
                                    e.currentTarget.style.borderColor = '#60a5fa';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedTimeSlot !== slot.id) {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                  }
                                }}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Doctor Selection */}
                    {selectedDate && selectedTimeSlot && (
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e5e7eb'
                      }}>
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: '#111827', 
                          marginBottom: '16px' 
                        }}>Chọn bác sĩ</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {/* Auto Selection */}
                          <div
                            onClick={() => setSelectedDoctor('')}
                            style={{
                              padding: '16px',
                              borderRadius: '8px',
                              border: selectedDoctor === '' ? '2px solid #3b82f6' : '2px dashed #d1d5db',
                              backgroundColor: selectedDoctor === '' ? '#eff6ff' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedDoctor !== '') {
                                e.currentTarget.style.borderColor = '#60a5fa';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedDoctor !== '') {
                                e.currentTarget.style.borderColor = '#d1d5db';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: '#dbeafe',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <span style={{ color: '#2563eb', fontWeight: '700' }}>AI</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>Hệ thống tự chọn</h4>
                                <p style={{ fontSize: '14px', color: '#6b7280' }}>Gợi ý bác sĩ phù hợp nhất</p>
                              </div>
                            </div>
                          </div>

                          {/* Doctor List */}
                          {doctors.filter(d => d.isAvailable).map((doctor) => (
                            <div
                              key={doctor.id}
                              onClick={() => setSelectedDoctor(doctor.id)}
                              style={{
                                padding: '16px',
                                borderRadius: '8px',
                                border: selectedDoctor === doctor.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                backgroundColor: selectedDoctor === doctor.id ? '#eff6ff' : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedDoctor !== doctor.id) {
                                  e.currentTarget.style.borderColor = '#60a5fa';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedDoctor !== doctor.id) {
                                  e.currentTarget.style.borderColor = '#e5e7eb';
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                  src={doctor.avatar}
                                  alt={doctor.name}
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                  }}
                                />
                                
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h4 style={{ 
                                    fontWeight: '500', 
                                    color: '#111827', 
                                    marginBottom: '4px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>{doctor.name}</h4>
                                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>{doctor.specialization}</p>
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    fontSize: '14px', 
                                    color: '#6b7280' 
                                  }}>
                                    <span>⭐ {doctor.rating}</span>
                                    <span>•</span>
                                    <span>{doctor.experience} năm</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="nav-buttons">
                  <button
                    onClick={handlePrev}
                    className="nav-button secondary"
                  >
                    Trước
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!selectedDate || !selectedTimeSlot}
                    className="nav-button primary"
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Profile & Details */}
            {currentStep === 2 && (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Thông tin bệnh nhân</h1>
                  <p className="text-gray-600">Chọn hồ sơ và điền thông tin chi tiết</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 px-4">
                  {/* Left: Profile Selection */}
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Chọn hồ sơ bệnh nhân</h3>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userProfiles.map(profile => (
                        <div
                          key={profile.id}
                          onClick={() => handleProfileSelect(profile.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedProfile === profile.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">
                                {profile.fullName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{profile.fullName}</h4>
                              <p className="text-sm text-gray-500">
                                {profile.gender === 'male' ? 'Nam' : 'Nữ'} • {profile.birthDate}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Create New Profile */}
                      <div
                        onClick={() => handleProfileSelect('new')}
                        className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-300 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-bold text-lg">+</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Tạo hồ sơ mới</h4>
                            <p className="text-sm text-gray-500">Thêm thông tin mới</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Form Details */}
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin chi tiết</h3>
                    
                    {selectedProfile ? (
                      <Form
                        form={form}
                        layout="vertical"
                        className="space-y-4"
                      >
                        {/* Location Type */}
                        <Form.Item label="Hình thức khám" required>
                          <Select
                            value={typeLocation}
                            onChange={setTypeLocation}
                            size="large"
                            options={[
                              { label: 'Tại phòng khám', value: 'clinic' },
                              { label: 'Tư vấn online', value: 'online' },
                            ]}
                          />
                        </Form.Item>

                        {typeLocation === 'home' && (
                          <Form.Item
                            name="address"
                            label="Địa chỉ"
                            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                          >
                            <Input size="large" placeholder="Nhập địa chỉ đầy đủ" />
                          </Form.Item>
                        )}

                        <Form.Item
                          name="description"
                          label="Mô tả triệu chứng"
                          rules={[
                            { required: true, message: 'Vui lòng mô tả triệu chứng' },
                            { min: 10, message: 'Tối thiểu 10 ký tự' }
                          ]}
                        >
                          <TextArea 
                            placeholder="Mô tả triệu chứng hoặc lý do khám" 
                            rows={4}
                            showCount
                            maxLength={300}
                          />
                        </Form.Item>

                        <Form.Item name="notes" label="Ghi chú">
                          <TextArea 
                            placeholder="Ghi chú bổ sung (không bắt buộc)" 
                            rows={3}
                          />
                        </Form.Item>
                      </Form>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">👈</div>
                        <p className="text-gray-500">Vui lòng chọn hồ sơ bệnh nhân</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="nav-buttons">
                  <button
                    onClick={handlePrev}
                    className="nav-button secondary"
                  >
                    Trước
                  </button>
                  
                  <button
                    onClick={handleNext}
                    disabled={!selectedProfile}
                    className="nav-button primary"
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận thông tin</h1>
                  <p className="text-gray-600">Kiểm tra lại thông tin trước khi đặt lịch</p>
                </div>

                <div className="mx-4">
                  {/* Summary Card */}
                  <div className="bg-white rounded-lg p-6 shadow-md border border-blue-200">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">Tóm tắt lịch hẹn</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-base">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dịch vụ:</span>
                          <span className="font-medium text-right">
                            {selectedService === 'package-basic' ? 'Gói tư vấn cơ bản' :
                             selectedService === 'package-advanced' ? 'Gói tư vấn nâng cao' :
                             getSelectedService()?.serviceName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hình thức:</span>
                          <span className="font-medium">
                            {typeLocation === 'online' ? 'Online' : 'Phòng khám'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ngày:</span>
                          <span className="font-medium">
                            {selectedDate?.format('DD/MM/YYYY')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Giờ:</span>
                          <span className="font-medium">{selectedTimeSlot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bác sĩ:</span>
                          <span className="font-medium text-right">
                            {selectedDoctor ? getSelectedDoctor()?.name : 'Hệ thống chọn'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bệnh nhân:</span>
                          <span className="font-medium text-right">{getSelectedProfile()?.fullName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg text-gray-600">Tổng chi phí:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPrice(getCurrentPrice())}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2 text-base">Lưu ý quan trọng:</h4>
                    <ul className="text-yellow-700 space-y-1 text-sm">
                      <li>• Vui lòng có mặt đúng giờ hẹn</li>
                      <li>• Mang theo giấy tờ tùy thân khi đến khám</li>
                      <li>• Chuẩn bị danh sách thuốc đang sử dụng (nếu có)</li>
                      <li>• Có thể hủy lịch trước 24h</li>
                    </ul>
                  </div>
                </div>

                {/* Final Actions */}
                <div className="nav-buttons">
                  <button
                    onClick={handlePrev}
                    className="nav-button secondary"
                  >
                    Trước
                  </button>
                  
                  <button
                    onClick={() => form.validateFields().then(handleSubmit)}
                    disabled={submitting}
                    className="nav-button primary"
                    style={{ backgroundColor: submitting ? '#94a3b8' : '#059669' }}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      'Xác nhận đặt lịch'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Profile Modal */}
        <Modal
          title="Tạo hồ sơ mới"
          open={showCreateProfileModal}
          onOk={() => createProfileForm.submit()}
          onCancel={() => setShowCreateProfileModal(false)}
          okText="Tạo hồ sơ"
          cancelText="Hủy"
          width={500}
        >
          <Form
            form={createProfileForm}
            layout="vertical"
            onFinish={handleCreateProfile}
          >
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input size="large" placeholder="Nhập họ và tên" />
            </Form.Item>
            
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input size="large" placeholder="Nhập số điện thoại" />
            </Form.Item>
            
            <Form.Item
              name="birthDate"
              label="Năm sinh"
              rules={[{ required: true, message: 'Vui lòng nhập năm sinh' }]}
            >
              <Input size="large" placeholder="VD: 1990" />
            </Form.Item>
            
            <Form.Item
              name="gender"
              label="Giới tính"
              rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
            >
              <Select size="large" placeholder="Chọn giới tính">
                <Select.Option value="male">Nam</Select.Option>
                <Select.Option value="female">Nữ</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
  );
};

export default BookingPageNew; 