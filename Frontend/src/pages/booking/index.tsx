import { Form, Input, message } from 'antd';
import axios from 'axios';
import {
  Activity,
  Heart,
  People
} from 'iconsax-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentApi } from '../../api/endpoints';
import { doctorApi } from '../../api/endpoints/doctorApi';
import doctorScheduleApi from '../../api/endpoints/doctorSchedule';
import servicesApi from '../../api/endpoints/services';
import userProfileApiInstance from '../../api/endpoints/userProfileApi';
import packagePurchaseApi from '../../api/endpoints/packagePurchaseApi';
import useAuth from '../../hooks/useAuth';

import Image1 from '../../assets/images/image1.jpg';
import Image2 from '../../assets/images/image2.jpg';
import Image3 from '../../assets/images/image3.jpg';
import BookingLayout from '../../layouts/BookingLayout';

const { TextArea } = Input;

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: {
    online: number;
    clinic: number;
    home?: number;
  };
  duration: string;
  icon: React.ReactNode;
  image: string;
  gradient: string;
  category: string;
  packages?: ServicePackage[];
}

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: {
    online: number;
    clinic: number;
    home?: number;
  };
  tests: string[];
  duration: string;
  isPopular?: boolean;
  gradient: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: string | number;
  rating: number;
  reviewCount: number;
  avatar: string;
  workload: number;
  isAvailable: boolean;
  bio: string;
}

interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  birthDate: string;
  gender: string;
  relationship: string; // 'self' | 'family'
  isDefault: boolean;
}

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

interface BookingFormData {
  serviceId: string;
  packageId?: string;
  doctorId?: string;
  typeLocation: 'online' | 'clinic' | 'home';
  appointmentDate: string;
  appointmentTime: string;
  profileId: string;
  fullName: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: string;
  address?: string;
  description?: string;
  notes?: string;
  agreement: boolean;
}

// Thêm interfaces để tránh linter errors
interface DoctorScheduleResponse {
  doctorId: string;
  doctorInfo: {
    fullName: string;
    email: string;
    avatar: string;
    specialization: string;
    experience: number;
    rating: number;
  };
  availableSlots: AvailableSlot[];
  totalAvailableSlots: number;
}

interface AvailableSlot {
  slotId: string;
  slotTime: string;
  status: 'Free' | 'Booked' | 'Absent';
}

// Type cho response structure từ API
// interface APIResponse {
//   data?: DoctorScheduleResponse[];
// }

// Type cho appointment object trong crosscheck
interface AppointmentForCrossCheck {
  doctorId?: string | { _id?: string };
  appointmentTime?: string;
}

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  
  // Authentication hook
  const { user, isAuthenticated } = useAuth();

  // Thêm các states cho data từ API
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Form state theo unified flow
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedPurchasedPackage, setSelectedPurchasedPackage] = useState<string>('');
  const [usingPurchasedPackage, setUsingPurchasedPackage] = useState<boolean>(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [typeLocation, setTypeLocation] = useState<'online' | 'clinic' | 'home'>('clinic');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');

  // State cho data từ API
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [purchasedPackages, setPurchasedPackages] = useState<any[]>([]);
  const [activeServicePackages, setActiveServicePackages] = useState<any[]>([]);
  
  // ✅ ADD: Loading states
  const [loadingPurchasedPackages, setLoadingPurchasedPackages] = useState(false);
  const [loadingActivePackages, setLoadingActivePackages] = useState(false);

  // State cho modal tạo profile mới
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [createProfileForm] = Form.useForm();

  // State để lưu availability của doctors theo ngày
  const [doctorAvailability, setDoctorAvailability] = useState<string[]>([]);



  // State for calendar - Set to June 2025 to match backend data
  const [calendarDate, setCalendarDate] = useState(new Date('2025-06-01'));

  // State để lưu doctor schedule mapping (doctorId -> availableSlots)
  const [, setDoctorScheduleMap] = useState<Map<string, AvailableSlot[]>>(new Map());

  // 🆕 Function để cross-check với appointments thực tế
  const crossCheckWithAppointments = async (
    doctorSchedules: DoctorScheduleResponse[], 
    targetDate: string, 
    targetTimeSlot?: string
  ) => {
    try {
      console.log('🔍 [Debug] Cross-checking with existing appointments for date:', targetDate);
      
      // Fetch tất cả appointments cho ngày đó
      const appointmentsResponse = await appointmentApi.getAllAppointments({
        startDate: targetDate,
        endDate: targetDate,
        status: 'pending,confirmed,in_progress' // Chỉ lấy appointment chưa cancel/complete
      });
      
      const existingAppointments = appointmentsResponse?.data?.data?.appointments || 
                                 appointmentsResponse?.data?.appointments || [];
      
      console.log('✅ [Debug] Existing appointments:', existingAppointments);
      
      // Tạo map: doctorId -> [occupied time slots]
      const doctorOccupiedSlots = new Map<string, string[]>();
      
      existingAppointments.forEach((appointment: AppointmentForCrossCheck) => {
        const doctorId = typeof appointment.doctorId === 'string' 
          ? appointment.doctorId 
          : appointment.doctorId?._id;
        const timeSlot = appointment.appointmentTime;
        
        if (doctorId && timeSlot) {
          if (!doctorOccupiedSlots.has(doctorId)) {
            doctorOccupiedSlots.set(doctorId, []);
          }
          doctorOccupiedSlots.get(doctorId)!.push(timeSlot);
          console.log(`🔒 [Debug] Doctor ${doctorId} is OCCUPIED at ${timeSlot}`);
        }
      });
      
      // Filter doctor schedules based on real appointments
      const availableDoctorIds: string[] = [];
      const newDoctorScheduleMap = new Map<string, AvailableSlot[]>();
      
      doctorSchedules.forEach((doctorSchedule: DoctorScheduleResponse) => {
        const doctorId = doctorSchedule.doctorId;
        
        if (!doctorId || !doctorSchedule.availableSlots) return;
        
        // Lấy list time slots bác sĩ này đã bị book
        const occupiedSlots = doctorOccupiedSlots.get(doctorId) || [];
        
        // Filter ra những slot thực sự available (Free + không có appointment)
        const reallyAvailableSlots = doctorSchedule.availableSlots.filter((slot: AvailableSlot) => {
          const isFreeInSchedule = slot.status === 'Free';
          const notOccupiedByAppointment = !occupiedSlots.includes(slot.slotTime);
          
          console.log(`🔍 [Debug] Doctor ${doctorId} Slot ${slot.slotTime}: scheduleStatus=${slot.status}, hasAppointment=${occupiedSlots.includes(slot.slotTime)}, reallyAvailable=${isFreeInSchedule && notOccupiedByAppointment}`);
          
          return isFreeInSchedule && notOccupiedByAppointment;
        });
        
        // Lưu mapping với slots thực sự available
        newDoctorScheduleMap.set(doctorId, reallyAvailableSlots);
        
        if (targetTimeSlot) {
          // Kiểm tra bác sĩ có thực sự available tại time slot cụ thể không
          const hasReallyFreeSlot = reallyAvailableSlots.some((slot: AvailableSlot) => 
            slot.slotTime === targetTimeSlot
          );
          
          if (hasReallyFreeSlot) {
            availableDoctorIds.push(doctorId);
            console.log(`✅ [Debug] Doctor ${doctorId} is REALLY AVAILABLE at ${targetTimeSlot}`);
          } else {
            console.log(`❌ [Debug] Doctor ${doctorId} is BUSY at ${targetTimeSlot} (has appointment or not free)`);
          }
        } else {
          // Nếu chưa chọn time slot, kiểm tra có ít nhất 1 slot thực sự available
          if (reallyAvailableSlots.length > 0) {
            availableDoctorIds.push(doctorId);
            console.log(`✅ [Debug] Doctor ${doctorId} has ${reallyAvailableSlots.length} really available slots`);
          }
        }
      });
      
      return { availableDoctorIds, doctorScheduleMap: newDoctorScheduleMap };
      
    } catch (error) {
      console.error('❌ [Debug] Error cross-checking appointments:', error);
      // Fallback to schedule-only check nếu lỗi
      return { availableDoctorIds: [], doctorScheduleMap: new Map() };
    }
  };

  // Fetch doctors available for selected date and time slot
  const fetchAvailableDoctors = useCallback(async () => {
    if (!selectedDate) {
      setDoctorAvailability([]);
      setDoctorScheduleMap(new Map());
      return;
    }
    
    try {
      console.log('🔍 [Debug] Fetching available doctors for date:', selectedDate, 'timeSlot:', selectedTimeSlot);
      
      // ✅ Sử dụng API đúng để lấy doctor schedules
      const response = await doctorScheduleApi.getAvailableDoctors(selectedDate);
      console.log('🔍 [Debug] Raw response for time slots:', response);
      
      // ✅ FIX: Kiểm tra cấu trúc response trước khi truy cập
      let availableDoctorsData: any[] = [];
      if (Array.isArray(response)) {
        availableDoctorsData = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        availableDoctorsData = (response as any).data || [];
      } else {
        availableDoctorsData = [];
      }
      
      if (!Array.isArray(availableDoctorsData)) {
        console.log('⚠️ [Debug] availableDoctorsData is not an array');
        setTimeSlots([]);
        return;
      }
      
      console.log('✅ [Debug] Available doctor schedules count:', availableDoctorsData.length);
      
      // 🆕 CROSS-CHECK VỚI APPOINTMENTS THỰC TẾ
      const { availableDoctorIds, doctorScheduleMap: realScheduleMap } = await crossCheckWithAppointments(
        availableDoctorsData, 
        selectedDate, 
        selectedTimeSlot
      );
      
      // 🆕 Cập nhật với data đã được cross-check
      setDoctorScheduleMap(realScheduleMap);
      setDoctorAvailability(availableDoctorIds);
      
      console.log('✅ [Debug] Final REALLY available doctor IDs:', availableDoctorIds);
      console.log('✅ [Debug] Real doctor schedule map:', realScheduleMap);
      
    } catch (error) {
      console.error('❌ [Debug] Error fetching available doctors:', error);
      setDoctorAvailability([]);
      setDoctorScheduleMap(new Map());
    }
  }, [selectedDate, selectedTimeSlot]);

  // Computed doctors với availability
  const doctorsWithAvailability = useMemo(() => {
    console.log('🔍 [Debug] Computing doctorsWithAvailability...');
    console.log('🔍 [Debug] doctors.length:', doctors.length);
    console.log('🔍 [Debug] doctorAvailability:', doctorAvailability);
    console.log('🔍 [Debug] selectedDate:', selectedDate);
    
    const result = doctors.map((doctor: Doctor) => {
      const isAvailableBySchedule = selectedDate ? 
        doctorAvailability.includes(doctor.id) : 
        true; // Nếu chưa chọn ngày thì hiển thị tất cả
      
      const finalAvailability = isAvailableBySchedule && doctor.isAvailable;
      
      console.log(`🔍 [Debug] Doctor ${doctor.name} (${doctor.id}):`, {
        originalAvailable: doctor.isAvailable,
        inAvailabilityList: doctorAvailability.includes(doctor.id),
        finalAvailability: finalAvailability
      });
      
      return {
        ...doctor,
        isAvailable: finalAvailability
      };
    });
    
    const availableDoctors = result.filter(d => d.isAvailable);
    console.log('✅ [Debug] Final available doctors count:', availableDoctors.length);
    console.log('✅ [Debug] Available doctors:', availableDoctors.map(d => ({name: d.name, id: d.id})));
    
    return result;
  }, [doctors, doctorAvailability, selectedDate]);

  const steps = [
    { title: 'Chọn dịch vụ', description: 'Lựa chọn dịch vụ phù hợp' },
    { title: 'Thông tin đặt lịch', description: 'Nhập đầy đủ thông tin yêu cầu' },
    { title: 'Xác nhận', description: 'Xem lại và xác nhận thông tin' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getSelectedService = () => services.find(s => s.id === selectedService);
  const getSelectedPackage = () => {
    const service = getSelectedService();
    return service?.packages?.find(p => p.id === selectedPackage);
  };
  const getSelectedDoctor = () => doctorsWithAvailability.find((d: Doctor) => d.id === selectedDoctor);
  const getCurrentPrice = () => {
    const service = getSelectedService();
    const pkg = getSelectedPackage();
    
    if (pkg) {
      return pkg.price[typeLocation] || 0;
    }
    
    if (service) {
      return service.price[typeLocation] || 0;
    }
    
    return 0;
  };



  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setSelectedPackage(''); // Reset package khi đổi service
    handleNext();
  };

  // Validate bước 2 trước khi chuyển sang bước 3
  const handleStep2Continue = () => {
    if (!typeLocation) {
      message.error('Vui lòng chọn hình thức khám');
      return;
    }
    if (!selectedDate) {
      message.error('Vui lòng chọn ngày hẹn');
      return;
    }
    if (!selectedTimeSlot) {
      message.error('Vui lòng chọn giờ hẹn');
      return;
    }
    if (!selectedProfile) {
      message.error('Vui lòng chọn hồ sơ bệnh nhân');
      return;
    }
    handleNext();
  };

  const handleProfileSelect = (profileId: string) => {
    if (profileId === 'new') {
      // Mở modal tạo profile mới
      setShowCreateProfileModal(true);
      createProfileForm.resetFields();
    } else {
      setSelectedProfile(profileId);
      const profile = userProfiles.find(p => p.id === profileId);
      if (profile) {
        form.setFieldsValue({
          fullName: profile.fullName,
          phone: profile.phone,
          birthDate: profile.birthDate,
          gender: profile.gender
        });
      }
      handleNext();
    }
  };

  // Hàm tạo profile mới
  const handleCreateProfile = async (values: {
    fullName: string;
    phone: string;
    birthDate: string;
    gender: string;
  }) => {
    try {
      console.log('🔍 [Debug] Creating new profile:', values);
      
      // Gọi API tạo profile mới
      const newProfile = await userProfileApiInstance.createProfile({
        fullName: values.fullName,
        phone: values.phone,
        year: values.birthDate,
        gender: values.gender as 'male' | 'female' | 'other'
      });
      
      console.log('✅ [Debug] Created profile:', newProfile);
      
      // Thêm profile mới vào danh sách
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
      
      // Set form values với profile mới
      form.setFieldsValue({
        fullName: mappedNewProfile.fullName,
        phone: mappedNewProfile.phone,
        birthDate: mappedNewProfile.birthDate,
        gender: mappedNewProfile.gender
      });
      
      // Đóng modal và chuyển step
      setShowCreateProfileModal(false);
      handleNext();
      
      message.success('Tạo hồ sơ thành công!');
    } catch (error) {
      console.error('❌ [Debug] Error creating profile:', error);
      message.error('Không thể tạo hồ sơ. Vui lòng thử lại!');
    }
  };

  // Fetch purchased packages
  const fetchPurchasedPackages = async () => {
    setLoadingPurchasedPackages(true);
    try {
      console.log('🔍 [Frontend] Starting fetchPurchasedPackages...');
      console.log('🔍 [Frontend] Current auth state:', {
        isAuthenticated,
        hasUser: !!user,
        userId: user?._id,
        userEmail: user?.email,
        userRole: user?.role
      });
      
      // ✅ Enhanced authentication check with detailed logging
      if (!isAuthenticated) {
        console.warn('⚠️ [Frontend] User not authenticated (isAuthenticated=false), clearing packages');
        setPurchasedPackages([]);
        return;
      }

      if (!user?._id) {
        console.warn('⚠️ [Frontend] User ID not available (user._id=null), clearing packages');
        setPurchasedPackages([]);
        return;
      }

      console.log('✅ [Frontend] Authentication verified, making API call...');

      const response = await packagePurchaseApi.getUserPurchasedPackages();
      
      console.log('✅ [Frontend] Raw API Response:', {
        success: response.success,
        hasData: !!response.data,
        responseKeys: response.data ? Object.keys(response.data) : [],
        packageCount: response.data?.packagePurchases?.length || 0,
        fullResponse: response
      });
      
      if (response.success && response.data?.packagePurchases) {
        const packages = response.data.packagePurchases;
        console.log('✅ [Frontend] Raw packages from API:', {
          count: packages.length,
          packageIds: packages.map(p => p._id),
          packageStructure: packages.length > 0 ? Object.keys(packages[0]) : []
        });
        // ✅ IMPROVED: Logic filter với kiểm tra expiry chính xác hơn
        const now = new Date();
        const activePackages = packages.filter((pkg, index) => {
          const isNotDisabled = pkg.isActive !== false;
          const hasUsagesLeft = (pkg.remainingUsages || 0) > 0;
          
          // ✅ IMPROVED: Kiểm tra expiry với validation chính xác
          let isNotExpired = true;
          const expiry = pkg.expiryDate || pkg.expiredAt;
          
          if (expiry) {
            const expiryDate = new Date(expiry);
            if (!isNaN(expiryDate.getTime())) {
              isNotExpired = now <= expiryDate;
            }
          }
          
          // ✅ LOGIC: Chỉ hiển thị gói còn hiệu lực (chưa hết hạn) và có lượt
          const isActive = isNotDisabled && hasUsagesLeft && isNotExpired;
          
          console.log(`[Filter] Package ${index + 1}/${packages.length} (${pkg._id}):`, {
            isActive,
            isNotDisabled,
            hasUsagesLeft,
            isNotExpired,
            expiry,
            expiryDate: expiry ? new Date(expiry).toISOString() : 'No expiry',
            packageName: pkg.packageId?.name || 'No name',
            packageData: pkg.packageId ? 'Has packageId' : 'Missing packageId'
          });
          return isActive;
        });
        console.log('✅ [Frontend] Final filtered packages:', {
          activeCount: activePackages.length,
          totalCount: packages.length,
          filteredOut: packages.length - activePackages.length
        });
        setPurchasedPackages(activePackages);
        
        // ✅ Success notification for debugging
        if (activePackages.length > 0) {
          console.log('🎉 [Frontend] Successfully loaded purchased packages!');
          console.log('🎉 [Frontend] Packages available for booking:', activePackages.map(p => ({
            id: p._id,
            name: p.packageId?.name || 'Unknown',
            usages: `${p.remainingUsages}/${p.totalAllowedUses}`,
            expires: p.expiredAt
          })));
        } else {
          console.log('ℹ️ [Frontend] No active packages available for booking');
          if (packages.length > 0) {
            console.log('ℹ️ [Frontend] Total packages found but filtered out:', packages.length);
          }
        }
      } else {
        console.log('⚠️ [Frontend] API returned no packages:', {
          success: response.success,
          hasData: !!response.data,
          message: response.message || 'No message',
          dataStructure: response.data ? Object.keys(response.data) : 'No data'
        });
        setPurchasedPackages([]);
      }
    } catch (error: any) {
      console.error('❌ [Frontend] Error in fetchPurchasedPackages:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        apiError: error.response?.data,
        requestConfig: error.config ? {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers ? Object.keys(error.config.headers) : 'No headers'
        } : 'No config'
      });
      
      // ✅ Enhanced error handling with specific actions
      if (error.response?.status === 401) {
        console.error('❌ [Frontend] Authentication failed - user may need to re-login');
        // TODO: Trigger re-authentication flow
      } else if (error.response?.status === 403) {
        console.error('❌ [Frontend] Access forbidden - insufficient permissions');
      } else if (error.response?.status >= 500) {
        console.error('❌ [Frontend] Server error - backend issue');
      } else if (error.code === 'NETWORK_ERROR') {
        console.error('❌ [Frontend] Network connectivity issue');
      } else {
        console.error('❌ [Frontend] Client error or unknown issue');
      }
      
      setPurchasedPackages([]);
    } finally {
      setLoadingPurchasedPackages(false);
      console.log('🏁 [Frontend] fetchPurchasedPackages completed');
    }
  };

  // Fetch active service packages (available for booking)
  const fetchActiveServicePackages = async () => {
    setLoadingActivePackages(true);
    try {
      console.log('🔍 [Frontend] Fetching active service packages...');
      
      // Import servicePackageApi
      const { getServicePackages } = await import('../../api/endpoints/servicePackageApi');
      
      const response = await getServicePackages({
        isActive: true,
        page: 1,
        limit: 50 // Get enough packages
      });
      
      console.log('✅ [Frontend] Active packages response:', response);
      
      if (response.success && response.data?.packages) {
        const packages = response.data.packages;
        console.log('✅ [Frontend] Active service packages:', packages.length);
        setActiveServicePackages(packages);
      } else {
        console.log('⚠️ [Frontend] No active packages found');
        setActiveServicePackages([]);
      }
    } catch (error: any) {
      console.error('❌ [Frontend] Error fetching active service packages:', error);
      setActiveServicePackages([]);
    } finally {
      setLoadingActivePackages(false);
    }
  };

  // Fetch data from API
  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      console.log('🔍 [Debug] Fetching services from API...');
      
      // Gọi API lấy danh sách dịch vụ thật
      const response = await servicesApi.getServices();
      console.log('✅ [Debug] Full API response:', response);
      console.log('✅ [Debug] Response data:', response.data);
      console.log('✅ [Debug] Response status:', response.status);
      
      // Backend trả về: { success: true, data: { services: [...], pagination: {...} } }
      const servicesData = response.data?.data?.services || response.data?.services || response.data;
      console.log('✅ [Debug] Extracted services data:', servicesData);
      console.log('✅ [Debug] Services data type:', typeof servicesData);
      console.log('✅ [Debug] Is array?', Array.isArray(servicesData));
      
      if (servicesData && Array.isArray(servicesData)) {
        const mappedServices: ServiceOption[] = servicesData.map(service => ({
          id: service._id,
          name: service.serviceName,
          description: service.description,
          price: {
            online: service.availableAt.includes('Online') ? service.price : 0,
            clinic: service.availableAt.includes('Center') ? service.price : 0,
            home: service.availableAt.includes('Athome') ? service.price * 1.5 : 0,
          },
          duration: '45-60 phút',
          icon: getIconForServiceType(service.serviceType),
          image: getImageForServiceType(service.serviceType),
          gradient: getGradientForServiceType(service.serviceType),
          category: service.serviceType,
        }));
        
        console.log('✅ [Debug] Mapped services:', mappedServices);
        setServices(mappedServices);
        
        // Kiểm tra xem có dịch vụ nào không
        if (mappedServices.length === 0) {
          console.log('⚠️ [Debug] No services from API');
          message.warning('Không có dịch vụ nào khả dụng');
        }
      } else {
        console.log('⚠️ [Debug] Invalid API response format');
        message.error('Dữ liệu dịch vụ không hợp lệ');
      }
    } catch (error) {
      console.error('❌ [Debug] Error fetching services:', error);
      message.error('Không thể tải danh sách dịch vụ từ server');
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      console.log('🔍 [Debug] Fetching doctors from API...');
      
      // Gọi API lấy danh sách bác sĩ cơ bản (endpoint có sẵn)
      const apiDoctors = await doctorApi.getAll();
      console.log('✅ [Debug] API doctors response:', apiDoctors);
      
      // Map dữ liệu từ API sang interface Doctor của booking
      const mappedDoctors: Doctor[] = apiDoctors.map(doctor => ({
        id: doctor._id,
        name: doctor.userId.fullName,
        specialization: doctor.specialization || 'Chưa xác định',
        experience: doctor.experience || 0,
        rating: doctor.rating || 4.5, // Sử dụng rating từ doctor object
        reviewCount: 0, // Tạm thời set 0, có thể fetch riêng sau
        avatar: doctor.userId.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
        workload: Math.floor(Math.random() * 20) + 5, // Random workload for now
        isAvailable: doctor.userId?.isActive !== false, // ✅ FIX: Default true, chỉ false nếu explicitly false
        bio: doctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm'
      }));
      
      console.log('✅ [Debug] Mapped doctors:', mappedDoctors);
      setDoctors(mappedDoctors);
      
      // Kiểm tra xem có bác sĩ nào không
      if (mappedDoctors.length === 0) {
        console.log('⚠️ [Debug] No doctors from API');
        message.warning('Không có bác sĩ nào khả dụng');
      }
    } catch (error) {
      console.error('❌ [Debug] Error fetching doctors:', error);
      message.error('Không thể tải danh sách bác sĩ từ server');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      console.log('🔍 [Debug] Fetching user profiles...');
      
      // Gọi API lấy profiles của user đăng nhập
      const response = await userProfileApiInstance.getMyProfiles();
      console.log('✅ [Debug] User profiles response:', response);
      
      if (response && Array.isArray(response)) {
        // Map từ backend structure sang frontend interface
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
          email: profile.email || '',
          birthDate: profile.year ? (typeof profile.year === 'string' ? profile.year : new Date(profile.year).toISOString().split('T')[0]) : '',
          gender: profile.gender,
          relationship: 'self', // Default relationship
          isDefault: false // Có thể thêm logic để determine default profile
        }));
        
        console.log('✅ [Debug] Mapped profiles:', mappedProfiles);
        setUserProfiles(mappedProfiles);
        
        if (mappedProfiles.length === 0) {
          console.log('ℹ️ [Debug] No existing profiles found - user will need to create new profile');
        }
      } else {
        console.log('⚠️ [Debug] Invalid profiles response structure');
        setUserProfiles([]);
      }
    } catch (error) {
      console.error('❌ [Debug] Error fetching profiles:', error);
      console.log('ℹ️ [Debug] User may not be authenticated or no profiles exist - allowing manual profile creation');
      // Không show error message vì user có thể chưa đăng nhập hoặc chưa có profile
      setUserProfiles([]);
    }
  };

  // Fetch time slots for selected date
  const fetchTimeSlots = async () => {
    if (!selectedDate) return;
    
    setLoadingTimeSlots(true);
    try {
      console.log('🔍 [Debug] Fetching time slots for date:', selectedDate);
      
      // ✅ Sử dụng API đúng để lấy doctor schedules
      const response = await doctorScheduleApi.getAvailableDoctors(selectedDate);
      console.log('🔍 [Debug] Raw response for time slots:', response);
      
      // ✅ FIX: Kiểm tra cấu trúc response trước khi truy cập
      let availableDoctorsData: any[] = [];
      if (Array.isArray(response)) {
        availableDoctorsData = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        availableDoctorsData = (response as any).data || [];
      } else {
        availableDoctorsData = [];
      }
      
      if (!Array.isArray(availableDoctorsData)) {
        console.log('⚠️ [Debug] availableDoctorsData is not an array');
        setTimeSlots([]);
        return;
      }
      
      // 🆕 CROSS-CHECK VỚI APPOINTMENTS THỰC TẾ TRƯỚC KHI TẠO TIME SLOTS
      const { doctorScheduleMap: realScheduleMap } = await crossCheckWithAppointments(
        availableDoctorsData, 
        selectedDate
      );
      
      // 🆕 CHỈ HIỂN THỊ TIME SLOT CÓ ÍT NHẤT 1 BÁC SĨ THỰC SỰ AVAILABLE
      const timeSlotAvailabilityMap = new Map<string, { doctorCount: number; hasReallyFreeSlot: boolean }>();
      
      realScheduleMap.forEach((reallyAvailableSlots, doctorId) => {
        console.log(`🔍 [Debug] Processing REAL available slots for doctor ${doctorId}:`, reallyAvailableSlots);
        
        reallyAvailableSlots.forEach((slot: AvailableSlot) => {
          const slotTime = slot.slotTime;
          
          if (!timeSlotAvailabilityMap.has(slotTime)) {
            timeSlotAvailabilityMap.set(slotTime, { doctorCount: 0, hasReallyFreeSlot: false });
          }
          
          const current = timeSlotAvailabilityMap.get(slotTime)!;
          
          // Đếm số bác sĩ thực sự có slot này available
          current.doctorCount++;
          current.hasReallyFreeSlot = true; // Vì đã filter qua crossCheck rồi
          
          console.log(`🔍 [Debug] Slot ${slotTime}: realDoctorCount=${current.doctorCount}, hasReallyFreeSlot=${current.hasReallyFreeSlot}`);
        });
      });
      
      // 🔒 CHỈ HIỂN THỊ TIME SLOT CÓ ÍT NHẤT 1 BÁC SĨ THỰC SỰ FREE (không có appointment)
      const mappedTimeSlots: TimeSlot[] = Array.from(timeSlotAvailabilityMap.entries())
        .filter(([, availability]) => availability.hasReallyFreeSlot) // 🔒 KEY FILTER: chỉ slot có bác sĩ thực sự free
        .map(([slotTime, availability]) => ({
          id: slotTime,
          time: slotTime,
          isAvailable: availability.hasReallyFreeSlot
        }))
        .sort((a, b) => a.time.localeCompare(b.time));
      
      console.log('✅ [Debug] Available time slots (with at least 1 REALLY free doctor):', mappedTimeSlots);
      setTimeSlots(mappedTimeSlots);
      
    } catch (error) {
      console.error('❌ [Debug] Error fetching time slots:', error);
      message.error('Không thể tải danh sách slot thời gian');
      setTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Helper functions for icon, image and gradient (will be used with real API)
  const getIconForServiceType = (type: string) => {
    switch (type) {
      case 'consultation': return <People size={32} variant="Bold" />;
      case 'test': return <Activity size={32} variant="Bold" />;
      default: return <Heart size={32} variant="Bold" />;
    }
  };

  const getImageForServiceType = (type: string) => {
    switch (type) {
      case 'consultation': return Image1;
      case 'test': return Image2;
      default: return Image3;
    }
  };

  const getGradientForServiceType = (type: string) => {
    switch (type) {
      case 'consultation': return 'from-blue-500 via-purple-500 to-pink-500';
      case 'test': return 'from-green-500 via-teal-500 to-blue-500';
      default: return 'from-pink-500 via-rose-500 to-red-500';
    }
  };

  // Cải thiện hàm handleSubmit với validation tốt hơn
  const handleSubmit = async (values: BookingFormData) => {
    try {
      // Bắt đầu validation theo thứ tự các bước
      // Bước 1: Dịch vụ hoặc gói dịch vụ
      if (!usingPurchasedPackage && !selectedService && !selectedPackage) {
        throw new Error('Vui lòng chọn dịch vụ hoặc gói dịch vụ');
      }
      
      if (usingPurchasedPackage && !selectedPurchasedPackage) {
        throw new Error('Vui lòng chọn gói dịch vụ đã mua');
      }
      
      // Bước 2: Ngày và giờ
      if (!selectedDate) {
        throw new Error('Vui lòng chọn ngày hẹn');
      }
      
      if (!selectedTimeSlot) {
        throw new Error('Vui lòng chọn giờ hẹn');
      }
      
      // Bước 3: Hồ sơ bệnh nhân - chỉ kiểm tra khi đã qua 2 bước trước
      if (!selectedProfile) {
        throw new Error('Vui lòng chọn hồ sơ bệnh nhân');
      }
      
      
      // Kiểm tra định dạng ID
      const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);
      
      if (!isValidObjectId(selectedProfile)) {
        throw new Error('ID hồ sơ không hợp lệ');
      }
      
      if (selectedService && !isValidObjectId(selectedService)) {
        throw new Error('ID dịch vụ không hợp lệ');
      }
      
      if (selectedPackage && !isValidObjectId(selectedPackage)) {
        throw new Error('ID gói dịch vụ không hợp lệ');
      }
      
      // 🆕 KIỂM TRA CUỐI CÙNG: BÁC SĨ THỰC SỰ CÓ SLOT AVAILABLE KHÔNG
      let actualSlotId = selectedTimeSlot;
      let actualDoctorId = selectedDoctor;
      
      // Kiểm tra cuối cùng bằng cách cross-check với appointments
      console.log('🔒 [Debug] Final validation - cross-checking with real appointments...');
      
      try {
        const response = await doctorScheduleApi.getAvailableDoctors(selectedDate);
        let availableDoctorsData: any[] = [];
        if (Array.isArray(response)) {
          availableDoctorsData = response;
        } else if (response && typeof response === 'object' && 'data' in response) {
          availableDoctorsData = (response as any).data || [];
        } else {
          availableDoctorsData = [];
        }
        
        const { availableDoctorIds, doctorScheduleMap: finalScheduleMap } = await crossCheckWithAppointments(
          availableDoctorsData, 
          selectedDate, 
          selectedTimeSlot
        );
        
        if (selectedDoctor) {
          // Kiểm tra bác sĩ đã chọn có thực sự available không
          if (!availableDoctorIds.includes(selectedDoctor)) {
            throw new Error(`Bác sĩ đã chọn không còn trống tại ${selectedTimeSlot}. Có thể đã bị đặt bởi khách hàng khác.`);
          }
          
          const doctorSlots = finalScheduleMap.get(selectedDoctor);
          const matchingSlot = doctorSlots?.find(slot => slot.slotTime === selectedTimeSlot);
          
          if (matchingSlot) {
            actualSlotId = matchingSlot.slotId;
            actualDoctorId = selectedDoctor;
            console.log('✅ [Debug] Final validation PASSED - Doctor is really available:', selectedDoctor);
          } else {
            throw new Error(`Không tìm thấy slot trống cho bác sĩ đã chọn tại ${selectedTimeSlot}`);
          }

          // 🚨 CRITICAL: Check patient double booking
          console.log('🔒 [Patient Check] Checking for existing appointments...');
          const existingAppointmentsResponse = await appointmentApi.getAllAppointments({
            profileId: selectedProfile,
            startDate: selectedDate,
            endDate: selectedDate,
            status: 'pending_payment,pending,confirmed,scheduled,consulting'
          });

          if (existingAppointmentsResponse.success && existingAppointmentsResponse.data?.appointments) {
            const conflictingAppointment = existingAppointmentsResponse.data.appointments.find((apt: any) =>
              apt.appointmentTime === selectedTimeSlot
            );

            if (conflictingAppointment) {
              throw new Error(`Bệnh nhân đã có lịch hẹn vào ${selectedTimeSlot} ngày ${selectedDate}. Một bệnh nhân không thể có 2 lịch hẹn cùng thời gian.`);
            }
          }

          console.log('✅ [Patient Check] No conflicting appointments found');
        } else {
          // Hệ thống tự chọn - lấy bác sĩ đầu tiên available
          if (availableDoctorIds.length === 0) {
            throw new Error(`Không có bác sĩ nào trống tại ${selectedTimeSlot}. Vui lòng chọn khung giờ khác.`);
          }
          
          const firstAvailableDoctorId = availableDoctorIds[0];
          const doctorSlots = finalScheduleMap.get(firstAvailableDoctorId);
          const matchingSlot = doctorSlots?.find(slot => slot.slotTime === selectedTimeSlot);
          
          if (matchingSlot) {
            actualSlotId = matchingSlot.slotId;
            actualDoctorId = firstAvailableDoctorId;
            console.log('✅ [Debug] Auto-selected available doctor:', firstAvailableDoctorId);
          } else {
            throw new Error('Không thể tìm thấy slot phù hợp');
          }
        }
      } catch (validationError) {
        console.error('❌ [Debug] Final validation failed:', validationError);
        throw validationError;
      }
      
      // 🎯 NEW DUAL FLOW LOGIC: Determine booking type and prepare data accordingly
      let appointmentData: any = {};
      
      if (usingPurchasedPackage && selectedPurchasedPackage) {
        // 🔗 LUỒNG 2: Gói dịch vụ đã mua (purchased_package)
        const purchasedPackageRecord = purchasedPackages.find(pp => pp._id === selectedPurchasedPackage);
        if (!purchasedPackageRecord?.packageId?._id) {
          throw new Error('Không tìm thấy thông tin gói dịch vụ đã mua');
        }

        appointmentData = {
          profileId: selectedProfile,
          packageId: purchasedPackageRecord.packageId._id,
          serviceId: selectedService, // Dịch vụ cụ thể trong gói
          doctorId: actualDoctorId || undefined,
          slotId: actualSlotId,
          appointmentDate: selectedDate,
          appointmentTime: selectedTimeSlot,
          appointmentType: getSelectedService()?.category as 'consultation' | 'test' | 'other' || 'other',
          typeLocation: typeLocation,
          address: values.address,
          description: values.description,
          notes: values.notes,
          bookingType: 'purchased_package',
          packagePurchaseId: selectedPurchasedPackage
        };

        console.log('🔗 [Flow 2] Purchased package booking data:', appointmentData);

      } else if (!usingPurchasedPackage && selectedPackage) {
        // 🔗 LUỒNG 1: Gói dịch vụ chưa thanh toán (new_package)
        appointmentData = {
          profileId: selectedProfile,
          packageId: selectedPackage,
          doctorId: actualDoctorId || undefined,
          slotId: actualSlotId,
          appointmentDate: selectedDate,
          appointmentTime: selectedTimeSlot,
          appointmentType: 'other', // Package type
          typeLocation: typeLocation,
          address: values.address,
          description: values.description,
          notes: values.notes,
          bookingType: 'new_package'
        };

        console.log('🔗 [Flow 1] New package booking data:', appointmentData);

      } else if (!usingPurchasedPackage && selectedService) {
        // 🔗 LUỒNG 3: Dịch vụ đơn lẻ (service_only) - GIỮ NGUYÊN
        appointmentData = {
          profileId: selectedProfile,
          serviceId: selectedService,
          doctorId: actualDoctorId || undefined,
          slotId: actualSlotId,
          appointmentDate: selectedDate,
          appointmentTime: selectedTimeSlot,
          appointmentType: getSelectedService()?.category as 'consultation' | 'test' | 'other' || 'other',
          typeLocation: typeLocation,
          address: values.address,
          description: values.description,
          notes: values.notes,
          bookingType: 'service_only'
        };

        console.log('🔗 [Flow 3] Service-only booking data:', appointmentData);

      } else {
        throw new Error('Vui lòng chọn dịch vụ hoặc gói dịch vụ');
      }
      
      console.log('🔍 [Debug] Appointment data being sent:', JSON.stringify(appointmentData, null, 2));
      
      const response = await appointmentApi.createAppointment(appointmentData);
      
      console.log('Booking response:', response);
      
      // 🎯 NEW DUAL FLOW RESPONSE HANDLING
      console.log('📋 [Response] Booking response:', response);
      
      const appointment = response?.data;
      
      if (appointment?.status === 'pending_payment' && appointmentData?.bookingType === 'new_package') {
        // LUỒNG 1: Gói dịch vụ chưa thanh toán - chuyển đến lịch sử đặt lịch, có nút thanh toán ở đó
        message.success('Đặt lịch thành công! Vào lịch sử đặt lịch để thanh toán.');
        navigate('/booking-history');
        
      } else if (appointment?.status === 'completed') {
        // LUỒNG 2: Gói dịch vụ đã mua - hoàn thành ngay lập tức
        message.success('Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
        navigate('/booking-history');
        
      } else if (appointment?.status === 'pending_payment') {
        // LUỒNG 3: Dịch vụ đơn lẻ - cần thanh toán thông thường
        message.success('Đặt lịch thành công! Chuyển đến trang thanh toán...');
        const appointmentId = appointment.id || appointment._id;
        navigate(`/payment/process?appointmentId=${appointmentId}`);
        
      } else {
        // Fallback cho các trường hợp khác
        message.success('Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
        navigate('/booking-history');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      if (error instanceof Error) {
        message.error(error.message);
      } else if (axios.isAxiosError(error)) {
        // Handle specific error codes
        if (error.response?.status === 409) {
          const errorMessage = error.response?.data?.message || 'Có xung đột trong việc đặt lịch.';
          message.error(errorMessage);
        } else {
          const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
          message.error(errorMessage);
        }
      } else {
        message.error('Có lỗi xảy ra. Vui lòng thử lại!');
      }
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchServices();
    fetchDoctors();
    fetchProfiles();
    // ❌ REMOVE: fetchPurchasedPackages(); - Moved to separate useEffect with auth dependency
  }, []);

  // ✅ ADD: Separate useEffect for authentication-dependent data
  useEffect(() => {
    console.log('🔄 [Auth Effect] Authentication state changed:', {
      isAuthenticated,
      userId: user?._id,
      hasUser: !!user
    });
    
    if (isAuthenticated && user?._id) {
      console.log('✅ [Auth Effect] User authenticated, fetching purchased packages...');
      // ✅ Add small delay to ensure auth is fully settled
      const timer = setTimeout(() => {
        fetchPurchasedPackages();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      console.log('⚠️ [Auth Effect] User not authenticated, clearing purchased packages');
      setPurchasedPackages([]);
    }
  }, [isAuthenticated, user?._id]);

  // ✅ Fetch active service packages when switching to packages tab
  useEffect(() => {
    if (usingPurchasedPackage) {
      console.log('🔄 [Package Tab] Switched to packages tab, fetching data...');
      // Fetch both purchased packages (if authenticated) and active packages
      if (isAuthenticated && user?._id) {
        fetchPurchasedPackages();
      }
      fetchActiveServicePackages();
    }
  }, [usingPurchasedPackage, isAuthenticated, user?._id]);

  // Load time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
      // Reset time slot và doctor khi đổi ngày
      setSelectedTimeSlot('');
      setSelectedDoctor('');
    }
  }, [selectedDate]);

  // Refresh available doctors when timeSlot changes - CHỈ KHI ĐÃ CHỌN TIME SLOT
  useEffect(() => {
    if (selectedDate && selectedTimeSlot) {
      console.log('🔄 [Debug] Time slot changed - refreshing available doctors...');
      fetchAvailableDoctors();
      // Reset doctor selection khi đổi time slot
      setSelectedDoctor('');
    }
  }, [selectedTimeSlot, fetchAvailableDoctors]);

  // 🆕 Validate khi chọn doctor - đảm bảo doctor vẫn available
  useEffect(() => {
    if (selectedDate && selectedTimeSlot && selectedDoctor) {
      console.log('🔄 [Debug] Doctor selected - validating availability...');
      // Validate doctor có thực sự available không
      const isDocStillAvailable = doctorAvailability.includes(selectedDoctor);
      if (!isDocStillAvailable) {
        console.log('⚠️ [Debug] Selected doctor is no longer available, resetting...');
        setSelectedDoctor('');
        message.warning('Bác sĩ đã chọn không còn trống. Vui lòng chọn bác sĩ khác.');
      }
    }
  }, [selectedDoctor, doctorAvailability, selectedDate, selectedTimeSlot]);

  // 🚨 Real-time conflict checking when profile, date, or time changes
  useEffect(() => {
    const checkConflicts = async () => {
      if (selectedProfile && selectedDate && selectedTimeSlot) {
        console.log('🔍 [Conflict Check] Checking for existing appointments...');
        try {
          const existingAppointmentsResponse = await appointmentApi.getAllAppointments({
            profileId: selectedProfile,
            startDate: selectedDate,
            endDate: selectedDate,
            status: 'pending_payment,pending,confirmed,scheduled,consulting'
          });

          if (existingAppointmentsResponse.success && existingAppointmentsResponse.data?.appointments) {
            const conflictingAppointment = existingAppointmentsResponse.data.appointments.find((apt: any) =>
              apt.appointmentTime === selectedTimeSlot
            );

            if (conflictingAppointment) {
              message.warning({
                content: `⚠️ Bệnh nhân đã có lịch hẹn vào ${selectedTimeSlot} ngày ${selectedDate}. Vui lòng chọn khung giờ khác.`,
                duration: 5,
                key: 'conflict-warning'
              });
            } else {
              // Clear warning if no conflict
              message.destroy('conflict-warning');
            }
          }
        } catch (error) {
          console.error('❌ [Conflict Check] Error:', error);
        }
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedProfile, selectedDate, selectedTimeSlot]);

  // Auto-select service or package from URL params
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    const packageParam = searchParams.get('packageId');
    const typeParam = searchParams.get('type');
    
    if (packageParam && typeParam === 'package') {
      // Coming from ServicePackageDisplayCard
      console.log('🔗 [URL Param] Auto-selecting package from URL:', packageParam);
      setUsingPurchasedPackage(true); // Switch to packages tab
      setSelectedPackage(packageParam);
      setSelectedService('');
      // Don't auto-advance, let user see package selection first
    } else if (serviceParam && services.find(s => s.id === serviceParam)) {
      setSelectedService(serviceParam);
      setCurrentStep(1); // Skip to doctor selection
    }
  }, [searchParams, services, activeServicePackages]);

  // Helper function to get calendar days
  const getCalendarDays = () => {
    const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
    const days: { day: number; dateString: string; isCurrentMonth: boolean }[] = [];

    // Fill in the days of the previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 0);
      date.setDate(date.getDate() - i);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      days.push({ day: date.getDate(), dateString, isCurrentMonth: false });
    }

    // Fill in the days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth() + 1; // getMonth() trả về 0-11, cần +1
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      console.log(`🔍 [Calendar] Day ${i}: dateString = ${dateString}`);
      days.push({ day: i, dateString, isCurrentMonth: true });
    }

    // Fill in the days of the next month
    for (let i = 1; i <= 7 - ((firstDay + daysInMonth) % 7) % 7; i++) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 2, i);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      days.push({ day: i, dateString, isCurrentMonth: false });
    }

    return days;
  };

  // Helper function to check if a date is today
  const isDateToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-full">
        {/* Header with Navigation */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            {currentStep > 0 ? (
              <button
                onClick={handlePrev}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors mr-6"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
              </button>
            ) : (
              <div className="w-24"></div>
            )}
            <h1 className="text-3xl font-bold text-gray-800">Đặt lịch hẹn</h1>
          </div>
          
          <div>
            {currentStep === 0 && (
              <button
                onClick={() => selectedService && handleNext()}
                disabled={!selectedService}
                className={`inline-flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedService 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Tiếp tục
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            {/* Các nút khác... */}
          </div>
        </div>
        
        {/* Nội dung khác... */}
      </div>
    </div>
  );
};

export default Booking;
