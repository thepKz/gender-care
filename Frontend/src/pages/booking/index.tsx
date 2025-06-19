import { Form, Input, message, Modal, Select } from 'antd';
import axios from 'axios';
import {
  Activity,
  Heart,
  People
} from 'iconsax-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentApi } from '../../api/endpoints';
import doctorApi from '../../api/endpoints/doctor';
import doctorScheduleApi from '../../api/endpoints/doctorSchedule';
import servicesApi from '../../api/endpoints/services';
import userProfileApiInstance from '../../api/endpoints/userProfileApi';

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
  experience: number;
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
  birthDate: string | Date;
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

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  // Thêm các states cho data từ API
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Form state theo unified flow
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
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

  // State cho modal tạo profile mới
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [createProfileForm] = Form.useForm();

  // State để lưu availability của doctors theo ngày
  const [doctorAvailability, setDoctorAvailability] = useState<string[]>([]);



  // State for calendar
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Fetch doctors available for selected date and time slot
  const fetchAvailableDoctors = useCallback(async () => {
    if (!selectedDate) {
      setDoctorAvailability([]);
      return;
    }
    
    try {
      console.log('🔍 [Debug] Fetching available doctors for date:', selectedDate, 'timeSlot:', selectedTimeSlot);
      console.log('🔍 [Debug] Selected date as Date object:', new Date(selectedDate));
      console.log('🔍 [Debug] Selected date toString:', new Date(selectedDate).toString());
      console.log('🔍 [Debug] Selected date toDateString:', new Date(selectedDate).toDateString());
      
      // ✅ Sử dụng API đúng để lấy doctor schedules
      const response = await doctorScheduleApi.getAvailableDoctors(selectedDate);
      console.log('✅ [Debug] Raw API response:', response);
      console.log('✅ [Debug] API Response Type:', typeof response);
      console.log('✅ [Debug] API Response Keys:', Object.keys(response || {}));
      
      // ✅ FIX: Truy cập response.data thay vì response trực tiếp
      const availableDoctorsData = response.data || response;
      
      if (!Array.isArray(availableDoctorsData)) {
        console.log('⚠️ [Debug] availableDoctorsData is not an array, using empty array');
        setDoctorAvailability([]);
        return;
      }
      
      console.log('✅ [Debug] Available doctor schedules count:', availableDoctorsData.length);
      
      // Extract available doctor IDs và filter theo selectedTimeSlot
      const availableIds: string[] = [];
      
      availableDoctorsData.forEach((doctorSchedule: DoctorScheduleResponse, index: number) => {
        console.log(`🔍 [Debug] Processing doctor schedule ${index}:`, doctorSchedule);
        
        const doctorId = doctorSchedule.doctorId;
        console.log(`🔍 [Debug] Doctor ${index} ID:`, doctorId);
        
        if (!doctorId) return;
        
        // ✅ Sử dụng availableSlots thay vì weekSchedule
        console.log(`🔍 [Debug] Doctor ${index} availableSlots:`, doctorSchedule.availableSlots);
        console.log(`🔍 [Debug] Doctor ${index} availableSlots length:`, doctorSchedule.availableSlots?.length);
        
        if (doctorSchedule.availableSlots && Array.isArray(doctorSchedule.availableSlots)) {
          // ✅ Debug từng slot
          doctorSchedule.availableSlots.forEach((slot: AvailableSlot, slotIndex: number) => {
            console.log(`🔍 [Debug] Doctor ${index} Slot ${slotIndex}:`, {
              slotTime: slot.slotTime,
              status: slot.status,
              slotId: slot.slotId
            });
          });
          
          if (selectedTimeSlot) {
            console.log(`🔍 [Debug] Filtering for selectedTimeSlot: "${selectedTimeSlot}"`);
            
            // Nếu đã chọn time slot, chỉ kiểm tra slot đó
            const hasAvailableSlot = doctorSchedule.availableSlots.some((slot: AvailableSlot) => {
              const isMatchingTime = slot.slotTime === selectedTimeSlot;
              const isFree = slot.status === 'Free';
              console.log(`🔍 [Debug] Doctor ${index} Slot ${slot.slotTime}: matching=${isMatchingTime}, free=${isFree}`);
              return isMatchingTime && isFree;
            });
            
            console.log(`🔍 [Debug] Doctor ${index} has available slot for "${selectedTimeSlot}":`, hasAvailableSlot);
            
            if (hasAvailableSlot) {
              availableIds.push(doctorId);
              console.log(`✅ [Debug] Added doctor ${doctorId} to available list`);
            }
          } else {
            console.log(`🔍 [Debug] No timeSlot selected, checking if doctor has any free slots`);
            
            // Nếu chưa chọn time slot, kiểm tra có ít nhất 1 slot free
            const hasFreeSlots = doctorSchedule.availableSlots.some((slot: AvailableSlot) => slot.status === 'Free');
            console.log(`🔍 [Debug] Doctor ${index} has free slots:`, hasFreeSlots);
            
            if (hasFreeSlots) {
              availableIds.push(doctorId);
              console.log(`✅ [Debug] Added doctor ${doctorId} to available list (has free slots)`);
            }
          }
        } else {
          console.log(`⚠️ [Debug] Doctor ${index} has no availableSlots or invalid availableSlots`);
        }
      });
      
      console.log('✅ [Debug] Final available doctor IDs:', availableIds);
      console.log('✅ [Debug] Setting doctorAvailability to:', availableIds);
      setDoctorAvailability(availableIds);
      
    } catch (error) {
      console.error('❌ [Debug] Error fetching available doctors:', error);
      setDoctorAvailability([]);
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
        gender: values.gender
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
          year?: string | number;
          gender: string;
        }) => ({
          id: profile._id,
          fullName: profile.fullName,
          phone: profile.phone || '',
          email: profile.email || '',
          birthDate: typeof profile.year === 'string' ? profile.year : (profile.year ? String(profile.year) : ''),
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
      
      // ✅ FIX: Truy cập response.data thay vì response trực tiếp  
      const availableDoctorsData = Array.isArray(response) ? response : ((response as any)?.data || []);
      
      if (!Array.isArray(availableDoctorsData)) {
        console.log('⚠️ [Debug] availableDoctorsData is not an array');
        setTimeSlots([]);
        return;
      }
      
      // ✅ Tổng hợp tất cả time slots từ availableSlots của tất cả doctors
      const allSlotsMap = new Map<string, { time: string; isAvailable: boolean }>();
      
      availableDoctorsData.forEach((doctorSchedule: DoctorScheduleResponse) => {
        console.log('🔍 [Debug] Processing doctor schedule for slots:', doctorSchedule);
        
        // ✅ Sử dụng availableSlots thay vì weekSchedule
        if (doctorSchedule.availableSlots && Array.isArray(doctorSchedule.availableSlots)) {
          doctorSchedule.availableSlots.forEach((slot: any) => {
            const slotTime = slot.slotTime;
            
            // Nếu slot chưa tồn tại hoặc slot hiện tại có status tốt hơn
            if (!allSlotsMap.has(slotTime) || slot.status === 'Free') {
              allSlotsMap.set(slotTime, {
                time: slotTime,
                isAvailable: slot.status === 'Free'
              });
            }
          });
        }
      });
      
      // Convert Map to Array và sort theo thời gian
      const mappedTimeSlots: TimeSlot[] = Array.from(allSlotsMap.values())
        .map((slot) => ({
          id: slot.time, // Sử dụng time làm ID cho dễ filter
          time: slot.time,
          isAvailable: slot.isAvailable
        }))
        .sort((a, b) => a.time.localeCompare(b.time));
      
      console.log('✅ [Debug] All available time slots:', mappedTimeSlots);
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
      // Kiểm tra các trường bắt buộc
      if (!selectedService && !selectedPackage) {
        throw new Error('Vui lòng chọn dịch vụ hoặc gói dịch vụ');
      }
      
      if (!selectedDate) {
        throw new Error('Vui lòng chọn ngày hẹn');
      }
      
      if (!selectedTimeSlot) {
        throw new Error('Vui lòng chọn giờ hẹn');
      }
      
      if (!selectedProfile) {
        throw new Error('Vui lòng chọn hồ sơ bệnh nhân');
      }
      
      if (typeLocation === 'home' && !values.address) {
        throw new Error('Vui lòng nhập địa chỉ khi chọn dịch vụ tại nhà');
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
      
      // ✅ Tìm slot ID từ time slot đã chọn
      let actualSlotId = selectedTimeSlot;
      
      // Nếu selectedTimeSlot là time string (VD: "08:00-09:00"), 
      // cần tìm slot ID tương ứng từ API
      try {
        const response = await doctorScheduleApi.getAvailableDoctors(selectedDate);
        const availableDoctorsData = (response as any).data || response;
        
        // Tìm slot ID từ time string
        for (const doctorSchedule of availableDoctorsData) {
          if (doctorSchedule.availableSlots && Array.isArray(doctorSchedule.availableSlots)) {
            const matchingSlot = doctorSchedule.availableSlots.find((slot: any) => 
              slot.slotTime === selectedTimeSlot && slot.status === 'Free'
            );
            
            if (matchingSlot) {
              actualSlotId = matchingSlot._id;
              console.log('✅ [Debug] Found slot ID:', actualSlotId, 'for time:', selectedTimeSlot);
              break;
            }
          }
        }
      } catch (slotError) {
        console.error('❌ [Debug] Error finding slot ID:', slotError);
        // Nếu không tìm được slot ID, vẫn dùng time string
      }
      
      // Create appointment using API
      const appointmentData = {
        profileId: selectedProfile,
        packageId: selectedPackage || undefined,
        serviceId: selectedService || undefined,
        doctorId: selectedDoctor || undefined,
        slotId: actualSlotId, // Sử dụng slot ID thật hoặc time string
        appointmentDate: selectedDate,
        appointmentTime: selectedTimeSlot, // Luôn gửi time string
        appointmentType: getSelectedService()?.category as 'consultation' | 'test' | 'other' || 'other',
        typeLocation: typeLocation,
        address: values.address,
        description: values.description,
        notes: values.notes
      };
      
      console.log('🔍 [Debug] Appointment data being sent:', JSON.stringify(appointmentData, null, 2));
      
      const response = await appointmentApi.createAppointment(appointmentData);
      
      console.log('Booking response:', response);
      message.success('Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
      
      // Navigate to booking confirmation or history
      navigate('/booking-history');
    } catch (error) {
      console.error('Error creating appointment:', error);
      if (error instanceof Error) {
        message.error(error.message);
      } else if (axios.isAxiosError(error) && error.response?.data?.message) {
        message.error(error.response.data.message);
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
  }, []);

  // Load time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
      // Cập nhật danh sách bác sĩ có sẵn lịch theo ngày được chọn
      fetchAvailableDoctors();
    }
  }, [selectedDate]);

  // Refresh available doctors when timeSlot changes
  useEffect(() => {
    if (selectedDate && selectedTimeSlot) {
      fetchAvailableDoctors();
    }
  }, [selectedTimeSlot, fetchAvailableDoctors]);

  // Auto-select service from URL params
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam && services.find(s => s.id === serviceParam)) {
      setSelectedService(serviceParam);
      setCurrentStep(1); // Skip to doctor selection
    }
  }, [searchParams, services]);

  // Helper function to get calendar days
  const getCalendarDays = () => {
    const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
    const days: { day: number; dateString: string; isCurrentMonth: boolean }[] = [];

    // Fill in the days of the previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 0);
      date.setDate(date.getDate() - i);
      days.push({ day: date.getDate(), dateString: date.toISOString().split('T')[0], isCurrentMonth: false });
    }

    // Fill in the days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, i);
      days.push({ day: i, dateString: date.toISOString().split('T')[0], isCurrentMonth: true });
    }

    // Fill in the days of the next month
    for (let i = 1; i <= 7 - ((firstDay + daysInMonth) % 7) % 7; i++) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 2, i);
      days.push({ day: i, dateString: date.toISOString().split('T')[0], isCurrentMonth: false });
    }

    return days;
  };

  // Helper function to check if a date is today
  const isDateToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  return (
    <BookingLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto px-4 py-8 max-w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Đặt lịch hẹn</h1>
          
          {/* Step indicator */}
          <div className="mb-10">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col items-center ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
                    ${index < currentStep ? 'bg-blue-600 text-white' : 
                      index === currentStep ? 'border-2 border-blue-600 text-blue-600' : 
                      'border-2 border-gray-300 text-gray-400'}`}
                  >
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <div className="text-sm hidden md:block">{step.title}</div>
                </div>
              ))}
            </div>
            <div className="relative mt-2">
              <div className="absolute h-1 bg-gray-200 w-full"></div>
              <div 
                className="absolute h-1 bg-blue-600 transition-all" 
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Step content */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            {/* Bước 1: Chọn dịch vụ */}
            {currentStep === 0 && (
              <div className="h-[70vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">Chọn dịch vụ</h2>
                
                {/* Loading state */}
                {loadingServices && (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải danh sách dịch vụ...</span>
                  </div>
                )}
                
                {/* Empty state */}
                {!loadingServices && services.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🏥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dịch vụ nào</h3>
                    <p className="text-gray-500">Hiện tại không có dịch vụ nào khả dụng. Vui lòng thử lại sau.</p>
                    <button 
                      onClick={fetchServices}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Tải lại
                    </button>
                  </div>
                )}
                
                {/* Services grid - Compact */}
                {!loadingServices && services.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {services.map(service => (
                      <div 
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`border rounded-lg p-4 cursor-pointer transition ${
                          selectedService === service.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center mb-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${service.gradient} text-white mr-3`}>
                            {service.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{service.name}</h3>
                            <p className="text-sm text-gray-500">{service.duration}</p>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Từ</span>
                          <span className="font-bold text-blue-600">{formatPrice(service.price.clinic)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <button
                    onClick={() => selectedService && handleNext()}
                    disabled={!selectedService}
                    className={`px-6 py-2 rounded-md font-medium ${
                      selectedService 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            )}
            
            {/* Bước 2: Thông tin đặt lịch (All-in-one) */}
            {currentStep === 1 && (
              <div className="h-[70vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">Thông tin đặt lịch</h2>
                
                {/* Layout 2 cột */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Cột trái: Hình thức + Thời gian */}
                  <div className="space-y-6">
                    
                    {/* 1. Hình thức khám */}
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3">1. Hình thức khám</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { key: 'online', label: 'Online', icon: '💻', desc: 'Video call' },
                          { key: 'clinic', label: 'Phòng khám', icon: '🏥', desc: 'Trực tiếp' },
                          { key: 'home', label: 'Tại nhà', icon: '🏠', desc: 'Bác sĩ đến tận nơi' }
                        ].map(location => (
                          <div 
                            key={location.key}
                            onClick={() => setTypeLocation(location.key as any)}
                            className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition ${
                              typeLocation === location.key 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-xl mr-3">{location.icon}</span>
                              <div>
                                <div className="font-medium">{location.label}</div>
                                <div className="text-sm text-gray-500">{location.desc}</div>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-blue-600">
                              {formatPrice(getSelectedService()?.price?.[location.key as 'online' | 'clinic' | 'home'] || 0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Chọn ngày - CALENDAR COMPONENT */}
                    {typeLocation && (
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3">2. Chọn ngày</h3>
                        <div className="bg-white">
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between mb-4">
                            <button
                              type="button"
                              onClick={() => {
                                const currentDate = calendarDate;
                                const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                                setCalendarDate(prevMonth);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-md"
                            >
                              ←
                            </button>
                            <h4 className="text-lg font-semibold">
                              Tháng {calendarDate.getMonth() + 1} năm {calendarDate.getFullYear()}
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                const currentDate = calendarDate;
                                const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                                setCalendarDate(nextMonth);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-md"
                            >
                              →
                            </button>
                          </div>

                          {/* Calendar Days Header */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Calendar Grid */}
                          <div className="grid grid-cols-7 gap-1">
                            {getCalendarDays().map((dayInfo, index) => {
                              const dayDate = new Date(dayInfo.dateString);
                              const isToday = isDateToday(dayInfo.dateString);
                              const isSelected = selectedDate === dayInfo.dateString;
                              const isPast = dayDate.getTime() < new Date().setHours(0, 0, 0, 0);
                              const isCurrentMonth = dayInfo.isCurrentMonth;
                              
                              return (
                                <div 
                                  key={index}
                                  onClick={() => {
                                    if (!isPast && isCurrentMonth) {
                                      console.log(`🔍 [Calendar] Selected date: ${dayInfo.dateString} (${dayDate.toString()})`);
                                      setSelectedDate(dayInfo.dateString);
                                    }
                                  }}
                                  className={`
                                    flex items-center justify-center p-2 text-sm rounded-md cursor-pointer transition
                                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                                    ${isPast && isCurrentMonth ? 'text-gray-400 cursor-not-allowed' : ''}
                                    ${isSelected ? 'bg-blue-600 text-white' : ''}
                                    ${isToday && !isSelected ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                                    ${!isPast && isCurrentMonth && !isSelected ? 'hover:bg-blue-50' : ''}
                                    ${!isCurrentMonth || isPast ? 'cursor-not-allowed' : ''}
                                  `}
                                >
                                  {dayInfo.day}
                                </div>
                              );
                            })}
                          </div>

                          {/* Calendar Legend */}
                          <div className="flex justify-center mt-3 text-xs text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-blue-100 rounded mr-1"></div>
                              <span>Hôm nay</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-blue-600 rounded mr-1"></div>
                              <span>Đã chọn</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Chọn giờ */}
                    {selectedDate && (
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3">3. Chọn giờ</h3>
                        {loadingTimeSlots ? (
                          <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Đang tải...</span>
                          </div>
                        ) : timeSlots.length === 0 ? (
                          <div className="text-center py-4">
                            <div className="text-gray-400 text-2xl mb-2">🕒</div>
                            <p className="text-sm text-gray-500">Không có lịch trống</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {timeSlots.map(slot => (
                              <div 
                                key={slot.id}
                                onClick={() => slot.isAvailable && setSelectedTimeSlot(slot.id)}
                                className={`text-center py-2 px-2 rounded-md cursor-pointer transition text-sm ${
                                  selectedTimeSlot === slot.id 
                                    ? 'bg-blue-600 text-white' 
                                    : slot.isAvailable 
                                      ? 'hover:bg-blue-50 border border-gray-200' 
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {slot.time}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cột phải: Bác sĩ + Hồ sơ + Chi tiết */}
                  <div className="space-y-6">
                    
                    {/* 4. Chọn bác sĩ - CHỈ HIỂN THỊ SAU KHI CHỌN TIME SLOT */}
                    {selectedDate && selectedTimeSlot && (
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3">4. Chọn bác sĩ có sẵn</h3>
                        {loadingDoctors ? (
                          <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Đang tải...</span>
                          </div>
                        ) : doctorsWithAvailability.filter((d: Doctor) => d.isAvailable).length === 0 ? (
                          <div className="text-center py-4">
                            <div className="text-gray-400 text-2xl mb-2">👨‍⚕️</div>
                            <p className="text-sm text-gray-500">Không có bác sĩ nào có sẵn</p>
                            <p className="text-xs text-gray-400 mt-1">Vào lúc {selectedTimeSlot} ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {doctorsWithAvailability
                              .filter((doctor: Doctor) => doctor.isAvailable)
                              .map((doctor: Doctor) => (
                                <div 
                                  key={doctor.id}
                                  onClick={() => setSelectedDoctor(doctor.id)}
                                  className={`flex items-center p-3 rounded-md border cursor-pointer transition ${
                                    selectedDoctor === doctor.id 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 hover:border-blue-300'
                                  }`}
                                >
                                  <img 
                                    src={doctor.avatar} 
                                    alt={doctor.name} 
                                    className="w-10 h-10 rounded-full object-cover mr-3"
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{doctor.name}</h4>
                                    <p className="text-xs text-gray-500">{doctor.specialization}</p>
                                    <div className="flex items-center text-xs text-gray-400">
                                      <span className="text-yellow-400 mr-1">★</span>
                                      <span>{doctor.rating}</span>
                                      <span className="mx-1">•</span>
                                      <span>{doctor.experience} năm</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-green-600 font-medium">
                                    Có sẵn
                                  </div>
                                </div>
                              ))}
                            
                            {/* Auto choice */}
                            <div 
                              onClick={() => setSelectedDoctor('')}
                              className={`flex items-center p-3 rounded-md border cursor-pointer transition ${
                                selectedDoctor === '' 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-300 border-dashed hover:border-blue-300'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <span className="text-blue-600 text-sm">🎯</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">Hệ thống chọn</h4>
                                <p className="text-xs text-gray-500">Tự động gợi ý bác sĩ phù hợp</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. Hồ sơ bệnh nhân - CHỈ HIỂN THỊ SAU KHI CHỌN DOCTOR HOẶC AUTO */}
                    {selectedDate && selectedTimeSlot && (selectedDoctor !== null) && (
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3">5. Hồ sơ bệnh nhân</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {userProfiles.map(profile => (
                            <div 
                              key={profile.id}
                              onClick={() => handleProfileSelect(profile.id)}
                              className={`flex items-center p-2 rounded-md border cursor-pointer transition ${
                                selectedProfile === profile.id 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <span className="text-blue-600 text-xs">👤</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{profile.fullName}</h4>
                                <p className="text-xs text-gray-500">
                                  {profile.gender === 'male' ? 'Nam' : 'Nữ'} • {
                                    typeof profile.birthDate === 'string' 
                                      ? profile.birthDate 
                                      : profile.birthDate instanceof Date 
                                        ? profile.birthDate.getFullYear() 
                                        : 'N/A'
                                  }
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Create new */}
                          <div 
                            onClick={() => handleProfileSelect('new')}
                            className="flex items-center p-2 rounded-md border border-dashed border-gray-300 hover:border-blue-300 cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <span className="text-green-600 text-xs">+</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">Tạo hồ sơ mới</h4>
                              <p className="text-xs text-gray-500">Thêm thông tin mới</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form chi tiết */}
                {selectedProfile && (
                  <div className="mt-6 border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">6. Thông tin chi tiết</h3>

                    {/* Hiển thị thông tin đã chọn */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-blue-800">📋 Tóm tắt lịch hẹn</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Dịch vụ:</span>
                          <span className="ml-1 font-medium">{getSelectedService()?.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Hình thức:</span>
                          <span className="ml-1 font-medium">
                            {typeLocation === 'online' ? 'Online' : 
                             typeLocation === 'clinic' ? 'Phòng khám' : 'Tại nhà'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Ngày:</span>
                          <span className="ml-1 font-medium">{new Date(selectedDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Giờ:</span>
                          <span className="ml-1 font-medium">{selectedTimeSlot}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Bác sĩ:</span>
                          <span className="ml-1 font-medium">
                            {selectedDoctor === '' ? 'Hệ thống chọn' : getSelectedDoctor()?.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Giá:</span>
                          <span className="ml-1 font-medium text-blue-600">{formatPrice(getCurrentPrice())}</span>
                        </div>
                      </div>
                    </div>

                    <Form
                      form={form}
                      layout="vertical"
                      size="small"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {typeLocation === 'home' && (
                          <Form.Item
                            name="address"
                            label="Địa chỉ"
                            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                            className="md:col-span-2"
                          >
                            <Input placeholder="Nhập địa chỉ đầy đủ" size="small" />
                          </Form.Item>
                        )}
                        
                        <Form.Item
                          name="description"
                          label="Mô tả triệu chứng"
                          rules={[
                            { required: true, message: 'Vui lòng mô tả triệu chứng' },
                            { min: 10, message: 'Tối thiểu 10 ký tự' }
                          ]}
                          className="md:col-span-2"
                        >
                          <TextArea 
                            placeholder="Mô tả triệu chứng hoặc lý do khám" 
                            rows={3}
                            showCount
                            maxLength={300}
                            size="small"
                          />
                        </Form.Item>
                        
                        <Form.Item
                          name="notes"
                          label="Ghi chú"
                          className="md:col-span-2"
                        >
                          <TextArea 
                            placeholder="Ghi chú bổ sung (không bắt buộc)" 
                            rows={2}
                            size="small"
                          />
                        </Form.Item>
                        
                        <Form.Item
                          name="agreement"
                          valuePropName="checked"
                          rules={[{ 
                            validator: (_, value) => 
                              value ? Promise.resolve() : Promise.reject(new Error('Vui lòng đồng ý')) 
                          }]}
                          className="md:col-span-2"
                        >
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-blue-600 mr-2" 
                              onChange={e => form.setFieldsValue({ agreement: e.target.checked })}
                            />
                            <span className="text-sm text-gray-600">
                              Tôi đồng ý với điều khoản sử dụng
                            </span>
                          </div>
                        </Form.Item>
                      </div>
                    </Form>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <button
                    onClick={handlePrev}
                    className="px-6 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                  >
                    ← Quay lại
                  </button>
                  <button
                    onClick={handleStep2Continue}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                  >
                    Tiếp tục →
                  </button>
                </div>
              </div>
            )}
            
            {/* Bước 3: Xác nhận thông tin */}
            {currentStep === 2 && (
              <div className="h-[70vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">Xác nhận thông tin đặt lịch</h2>
                
                <div className="space-y-6">
                  {/* Thông tin dịch vụ */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Dịch vụ đã chọn</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{getSelectedService()?.name}</p>
                        <p className="text-sm text-gray-500">{getSelectedService()?.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{formatPrice(getCurrentPrice())}</p>
                        <p className="text-sm text-gray-500">
                          {typeLocation === 'online' ? 'Online' : 
                           typeLocation === 'clinic' ? 'Tại phòng khám' : 
                           'Tại nhà'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin lịch hẹn */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Thông tin lịch hẹn</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Ngày hẹn</p>
                        <p className="font-medium">{selectedDate && new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Giờ hẹn</p>
                        <p className="font-medium">{selectedTimeSlot}</p>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin bác sĩ */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Bác sĩ phụ trách</h3>
                    {selectedDoctor === '' ? (
                      <p className="text-gray-600">Hệ thống sẽ tự động chọn bác sĩ phù hợp</p>
                    ) : (
                      <div className="flex items-center">
                        <img 
                          src={getSelectedDoctor()?.avatar} 
                          alt={getSelectedDoctor()?.name} 
                          className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                        <div>
                          <p className="font-medium">{getSelectedDoctor()?.name}</p>
                          <p className="text-sm text-gray-500">{getSelectedDoctor()?.specialization}</p>
                          <div className="flex items-center text-sm text-gray-400">
                            <span className="text-yellow-400 mr-1">★</span>
                            <span>{getSelectedDoctor()?.rating}</span>
                            <span className="mx-1">•</span>
                            <span>{getSelectedDoctor()?.experience} năm kinh nghiệm</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thông tin bệnh nhân */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Thông tin bệnh nhân</h3>
                    {userProfiles.find(p => p.id === selectedProfile) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Họ và tên</p>
                          <p className="font-medium">{userProfiles.find(p => p.id === selectedProfile)?.fullName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Giới tính</p>
                          <p className="font-medium">
                            {userProfiles.find(p => p.id === selectedProfile)?.gender === 'male' ? 'Nam' : 'Nữ'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Năm sinh</p>
                          <p className="font-medium">
                            {(() => {
                              const profile = userProfiles.find(p => p.id === selectedProfile);
                              const birthDate = profile?.birthDate;
                              
                              if (typeof birthDate === 'string') {
                                return birthDate;
                              } else if (birthDate instanceof Date) {
                                return birthDate.getFullYear().toString();
                              } else {
                                return 'N/A';
                              }
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Số điện thoại</p>
                          <p className="font-medium">{userProfiles.find(p => p.id === selectedProfile)?.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <button
                    onClick={handlePrev}
                    className="px-6 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                  >
                    ← Quay lại
                  </button>
                  <button
                    onClick={() => handleSubmit(form.getFieldsValue() as BookingFormData)}
                    className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
                  >
                    Xác nhận đặt lịch
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal tạo profile mới */}
          <Modal
            title="Tạo hồ sơ mới"
            open={showCreateProfileModal}
            onOk={() => createProfileForm.submit()}
            onCancel={() => setShowCreateProfileModal(false)}
            okText="Tạo hồ sơ"
            cancelText="Hủy"
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
                  <Select.Option value="male">Nam</Select.Option>
                  <Select.Option value="female">Nữ</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </div>
    </BookingLayout>
  );
};

export default Booking; 