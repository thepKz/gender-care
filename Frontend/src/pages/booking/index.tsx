import { Form, Input, message } from 'antd';
import axios from 'axios';
import {
    Activity,
    Heart,
    People
} from 'iconsax-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentApi } from '../../api/endpoints';
import doctorApi from '../../api/endpoints/doctor';
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

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Thêm các states cho data từ API
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
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

  // Mock data với ID đúng định dạng MongoDB ObjectId
  // Mock data đã được loại bỏ - chỉ sử dụng API thật

  // Mock doctors đã được loại bỏ - chỉ sử dụng API thật

  // Mock user profiles đã được loại bỏ - chỉ sử dụng API thật

  // Mock time slots đã được loại bỏ - chỉ sử dụng API thật

  const steps = [
    { title: 'Chọn dịch vụ', description: 'Lựa chọn dịch vụ phù hợp' },
    { title: 'Chọn bác sĩ', description: 'Chọn bác sĩ hoặc để hệ thống chọn' },
    { title: 'Vị trí thực hiện', description: 'Online, phòng khám hoặc tại nhà' },
    { title: 'Chọn lịch hẹn', description: 'Ngày và giờ phù hợp' },
    { title: 'Chọn hồ sơ', description: 'Hồ sơ bệnh nhân' },
    { title: 'Thông tin chi tiết', description: 'Điền thông tin bổ sung' },
    { title: 'Xác nhận', description: 'Xem lại và xác nhận đặt lịch' }
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
  const getSelectedDoctor = () => doctors.find(d => d.id === selectedDoctor);
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

  const handleLocationSelect = (location: 'online' | 'clinic' | 'home') => {
    setTypeLocation(location);
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
        isAvailable: doctor.userId.isActive, // Chỉ check user active status
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
    setLoadingProfiles(true);
    try {
      console.log('🔍 [Debug] Fetching user profiles...');
      
      // Gọi API lấy profiles của user đăng nhập
      const response = await userProfileApiInstance.getMyProfiles();
      console.log('✅ [Debug] User profiles response:', response);
      
      if (response && Array.isArray(response)) {
        // Map từ backend structure sang frontend interface
        const mappedProfiles: UserProfile[] = response.map((profile: any) => ({
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
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedDate) return;
    
    setLoadingTimeSlots(true);
    try {
      console.log('🔍 [Debug] Fetching time slots for date:', selectedDate, 'doctor:', selectedDoctor);
      
      if (selectedDoctor) {
        // Lấy available slots cho doctor cụ thể
        const response = await doctorApi.getAvailable(selectedDate);
        console.log('🔍 [Debug] Raw response structure:', response);
        
        // Backend trả về: {message, data: [...], searchCriteria}
        const availableDoctorsData = (response as any).data || response;
        console.log('🔍 [Debug] Extracted data:', availableDoctorsData);
        
        const doctorSlots = availableDoctorsData.find((doc: any) => doc.doctorId === selectedDoctor || doc._id === selectedDoctor);
        
        if (doctorSlots && doctorSlots.availableSlots) {
          const mappedTimeSlots: TimeSlot[] = doctorSlots.availableSlots.map((slot: any) => ({
            id: slot.slotId,
            time: slot.slotTime,
            isAvailable: slot.status === 'Free'
          }));
          
          console.log('✅ [Debug] Mapped time slots for doctor:', mappedTimeSlots);
          setTimeSlots(mappedTimeSlots);
        } else {
          console.log('⚠️ [Debug] No slots found for selected doctor');
          setTimeSlots([]);
        }
      } else {
        // Lấy tất cả available slots trong ngày (tổng hợp từ tất cả doctors)
        const response = await doctorApi.getAvailable(selectedDate);
        console.log('🔍 [Debug] Raw response for all slots:', response);
        
        // Backend trả về: {message, data: [...], searchCriteria}
        const availableDoctorsData = (response as any).data || response;
        const allSlots: TimeSlot[] = [];
        
        availableDoctorsData.forEach((doctor: any) => {
          if (doctor.availableSlots) {
            doctor.availableSlots.forEach((slot: any) => {
              // Tránh duplicate slots
              if (!allSlots.find(s => s.time === slot.slotTime)) {
                allSlots.push({
                  id: slot.slotId,
                  time: slot.slotTime,
                  isAvailable: slot.status === 'Free'
                });
              }
            });
          }
        });
        
        console.log('✅ [Debug] All available time slots:', allSlots);
        setTimeSlots(allSlots);
      }
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
    setLoading(true);
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
      
      if (selectedTimeSlot && !isValidObjectId(selectedTimeSlot)) {
        throw new Error('ID slot thời gian không hợp lệ');
      }
      
      // Create appointment using API
      const appointmentData = {
        profileId: selectedProfile,
        packageId: selectedPackage || undefined,
        serviceId: selectedService || undefined,
        doctorId: selectedDoctor || undefined, // Thêm doctorId vào request
        slotId: selectedTimeSlot,
        appointmentDate: selectedDate,
        appointmentTime: timeSlots.find(slot => slot.id === selectedTimeSlot)?.time || '',
        appointmentType: getSelectedService()?.category as 'consultation' | 'test' | 'other' || 'other',
        typeLocation: typeLocation,
        address: values.address,
        description: values.description,
        notes: values.notes
      };
      
      console.log('🔍 [Debug] Appointment data being sent:', JSON.stringify(appointmentData, null, 2));
      console.log('🔍 [Debug] Selected time slot details:', {
        selectedTimeSlot,
        slotFromArray: timeSlots.find(slot => slot.id === selectedTimeSlot),
        allTimeSlots: timeSlots
      });
      
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
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchServices();
    fetchDoctors();
    fetchProfiles();
  }, []);

  // Load time slots when date or doctor changes
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
      // Cập nhật danh sách bác sĩ có sẵn lịch theo ngày được chọn
      fetchAvailableDoctors();
    }
  }, [selectedDate, selectedDoctor]);
  
  // Fetch doctors available for selected date
  const fetchAvailableDoctors = async () => {
    if (!selectedDate) return;
    
    try {
      console.log('🔍 [Debug] Fetching available doctors for date:', selectedDate);
      const response = await doctorApi.getAvailable(selectedDate);
      console.log('✅ [Debug] Available doctors response:', response);
      
      // Backend trả về: {message, data: [...], searchCriteria}
      const availableDoctors = (response as any).data || response;
      console.log('✅ [Debug] Available doctors count:', availableDoctors.length);
      
      // Debug: Log structure của available doctors
      if (availableDoctors.length > 0) {
        console.log('✅ [Debug] First available doctor structure:', availableDoctors[0]);
      }
      
      // Debug: Log current doctors list
      console.log('🔍 [Debug] Current doctors list:', doctors.length);
      
      // Update doctor availability based on API response
      setDoctors(prevDoctors => {
        const updatedDoctors = prevDoctors.map(doctor => {
          // Check if this doctor is in available list
                     const isInAvailableList = availableDoctors.some((available: any) => {
             // Try different possible ID fields from API response
             const availableId = available._id || available.doctorId || available.id;
             const match = availableId === doctor.id;
            
            if (match) {
              console.log('✅ [Debug] Found match for doctor:', doctor.name, 'ID:', doctor.id);
            }
            
            return match;
          });
          
          console.log(`🔍 [Debug] Doctor ${doctor.name} (${doctor.id}): isInAvailableList=${isInAvailableList}, originalAvailable=${doctor.isAvailable}`);
          
          return {
            ...doctor,
            isAvailable: isInAvailableList && doctor.isAvailable
          };
        });
        
        console.log('✅ [Debug] Updated doctors availability:', updatedDoctors.map(d => ({name: d.name, isAvailable: d.isAvailable})));
        return updatedDoctors;
      });
    } catch (error) {
      console.error('❌ [Debug] Error fetching available doctors:', error);
      console.log('⚠️ [Debug] Keeping original availability state');
      // Don't show error message as this is optional enhancement
    }
  };

  // Hàm validate và chuyển từ step 6 sang step 7
  const handleStep6Continue = async () => {
    try {
      // Validate form trước khi chuyển step
      await form.validateFields(['description', 'agreement']);
      
      // Nếu là dịch vụ tại nhà, validate địa chỉ
      if (typeLocation === 'home') {
        await form.validateFields(['address']);
      }
      
      // Validation thành công, chuyển sang step tiếp theo
      handleNext();
    } catch (error) {
      console.log('❌ [Debug] Validation failed:', error);
      // Form sẽ tự động hiển thị lỗi validation
    }
  };

  // Hàm tạo profile mới
  const handleCreateProfile = async (values: any) => {
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

  // Auto-select service from URL params
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam && services.find(s => s.id === serviceParam)) {
      setSelectedService(serviceParam);
      setCurrentStep(1); // Skip to doctor selection
    }
  }, [searchParams, services]);

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
            {/* Step 1: Chọn dịch vụ */}
            {currentStep === 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Chọn dịch vụ</h2>
                
                {/* Debug info cho services */}
                <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
                  <p><strong>Debug Services:</strong></p>
                  <p><strong>Tổng số dịch vụ:</strong> {services.length}</p>
                  <p><strong>Trạng thái loading:</strong> {loadingServices ? 'Đang tải...' : 'Đã tải xong'}</p>
                  <p><strong>Nguồn dữ liệu:</strong> API từ Backend</p>
                  {services.length > 0 && (
                    <p><strong>Dịch vụ đầu tiên:</strong> {services[0].name} - {services[0].category}</p>
                  )}
                </div>
                
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
                
                {/* Services grid */}
                {!loadingServices && services.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(service => (
                      <div 
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className="bg-gradient-to-br border border-gray-100 hover:border-blue-300 rounded-xl p-5 cursor-pointer transform transition hover:scale-105 hover:shadow-md"
                      >
                        <div className="flex items-center mb-4">
                          <div className={`p-3 rounded-full bg-gradient-to-r ${service.gradient} text-white mr-4`}>
                            {service.icon}
                          </div>
                          <h3 className="text-xl font-semibold">{service.name}</h3>
                        </div>
                        <p className="text-gray-600 mb-4">{service.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">{service.duration}</span>
                          <span className="font-bold text-blue-600">{formatPrice(service.price.clinic)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Step 2: Chọn bác sĩ */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Chọn bác sĩ</h2>
                
                {/* Debug info */}
                <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
                  <p><strong>Debug:</strong> Ngày đã chọn: {selectedDate || 'Chưa chọn'}</p>
                  <p><strong>Tổng số bác sĩ:</strong> {doctors.length}</p>
                  <p><strong>Bác sĩ có sẵn:</strong> {doctors.filter(d => d.isAvailable).length}</p>
                  <p><strong>Bác sĩ không có sẵn:</strong> {doctors.filter(d => !d.isAvailable).length}</p>
                  {!selectedDate && (
                    <p className="text-orange-600 mt-2">
                      <strong>Lưu ý:</strong> Chưa chọn ngày nên hiển thị tất cả bác sĩ. Chọn ngày ở bước tiếp theo để lọc bác sĩ có lịch trống.
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {doctors.map(doctor => (
                    <div 
                      key={doctor.id}
                      onClick={() => {
                        // Nếu chưa chọn ngày thì cho phép chọn bất kỳ bác sĩ nào
                        if (selectedDate && !doctor.isAvailable) {
                          message.warning('Bác sĩ này hiện không có sẵn cho ngày đã chọn');
                          return;
                        }
                        console.log('🔍 [Debug] Selected doctor:', doctor);
                        setSelectedDoctor(doctor.id);
                        handleNext();
                      }}
                      className={`border rounded-xl p-5 cursor-pointer transform transition hover:scale-105 hover:shadow-md ${
                        selectedDoctor === doctor.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : (selectedDate && !doctor.isAvailable)
                            ? 'border-gray-200 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center mb-4">
                        <img 
                          src={doctor.avatar} 
                          alt={doctor.name} 
                          className="w-16 h-16 rounded-full object-cover mr-4"
                        />
                        <div>
                          <h3 className="text-xl font-semibold">{doctor.name}</h3>
                          <p className="text-gray-600">{doctor.specialization}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <span className="text-yellow-400 mr-1">★</span>
                          <span className="font-medium">{doctor.rating}</span>
                          <span className="text-gray-500 text-sm ml-2">({doctor.reviewCount} đánh giá)</span>
                        </div>
                        <p className="text-gray-600 text-sm">{doctor.bio}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{doctor.experience} năm kinh nghiệm</span>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          !selectedDate 
                            ? 'bg-blue-100 text-blue-800' 
                            : doctor.isAvailable 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {!selectedDate 
                            ? 'Sẵn sàng' 
                            : doctor.isAvailable 
                              ? 'Có lịch trống' 
                              : 'Không có lịch'
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Option to let system choose */}
                  <div 
                    onClick={() => {
                      setSelectedDoctor('');
                      handleNext();
                    }}
                    className="border-2 border-dashed border-gray-300 hover:border-blue-300 rounded-xl p-5 cursor-pointer transform transition hover:scale-105 hover:shadow-md flex flex-col items-center justify-center"
                  >
                    <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-center">Để hệ thống chọn</h3>
                    <p className="text-gray-600 text-center mt-2">Chúng tôi sẽ chọn bác sĩ phù hợp nhất với nhu cầu của bạn</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: Vị trí thực hiện */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Chọn vị trí thực hiện</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                    onClick={() => handleLocationSelect('online')}
                    className={`border rounded-xl p-6 cursor-pointer transform transition hover:scale-105 hover:shadow-md ${typeLocation === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold">Online</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Tư vấn trực tuyến qua video call</p>
                    <div className="text-lg font-bold text-blue-600">
                      {formatPrice(getSelectedService()?.price.online || getSelectedPackage()?.price.online || 0)}
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => handleLocationSelect('clinic')}
                    className={`border rounded-xl p-6 cursor-pointer transform transition hover:scale-105 hover:shadow-md ${typeLocation === 'clinic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold">Phòng khám</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Đến trực tiếp phòng khám của chúng tôi</p>
                    <div className="text-lg font-bold text-blue-600">
                      {formatPrice(getSelectedService()?.price.clinic || getSelectedPackage()?.price.clinic || 0)}
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => handleLocationSelect('home')}
                    className={`border rounded-xl p-6 cursor-pointer transform transition hover:scale-105 hover:shadow-md ${typeLocation === 'home' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold">Tại nhà</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Bác sĩ/nhân viên y tế đến tận nhà bạn</p>
                    <div className="text-lg font-bold text-blue-600">
                      {formatPrice(getSelectedService()?.price.home || getSelectedPackage()?.price.home || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Chọn lịch hẹn */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Chọn lịch hẹn</h2>
                
                {/* Date picker */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Chọn ngày</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 14 }).map((_, index) => {
                      const date = new Date();
                      date.setDate(date.getDate() + index);
                      const dateString = date.toISOString().split('T')[0];
                      const dayOfWeek = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date);
                      const dayOfMonth = date.getDate();
                      
                      return (
                        <div 
                          key={dateString}
                          onClick={() => setSelectedDate(dateString)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition
                            ${selectedDate === dateString 
                              ? 'bg-blue-600 text-white' 
                              : 'hover:bg-blue-50 border border-gray-200'}`}
                        >
                          <span className="text-sm font-medium">{dayOfWeek}</span>
                          <span className="text-lg font-bold">{dayOfMonth}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Time slots */}
                {selectedDate && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Chọn giờ</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {timeSlots.map(slot => (
                        <div 
                          key={slot.id}
                          onClick={() => slot.isAvailable && setSelectedTimeSlot(slot.id)}
                          className={`text-center py-2 px-3 rounded-lg cursor-pointer transition
                            ${selectedTimeSlot === slot.id 
                              ? 'bg-blue-600 text-white' 
                              : slot.isAvailable 
                                ? 'hover:bg-blue-50 border border-gray-200' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                          {slot.time}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next button */}
                {selectedDate && selectedTimeSlot && (
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleNext}
                      className="px-6 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
                    >
                      Tiếp tục
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 5: Chọn hồ sơ */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Chọn hồ sơ bệnh nhân</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userProfiles.map(profile => (
                    <div 
                      key={profile.id}
                      onClick={() => handleProfileSelect(profile.id)}
                      className="border border-gray-200 hover:border-blue-300 rounded-xl p-5 cursor-pointer transform transition hover:scale-105 hover:shadow-md"
                    >
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{profile.fullName}</h3>
                          <p className="text-gray-600">{profile.relationship === 'self' ? 'Bản thân' : 'Người thân'}</p>
                        </div>
                        {profile.isDefault && (
                          <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">Mặc định</span>
                        )}
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>SĐT: {profile.phone || 'Chưa có'}</p>
                        <p>Năm sinh: {typeof profile.birthDate === 'string' ? profile.birthDate : (profile.birthDate instanceof Date ? profile.birthDate.getFullYear().toString() : 'Chưa có')}</p>
                        <p>Giới tính: {profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Create new profile */}
                  <div 
                    onClick={() => handleProfileSelect('new')}
                    className="border-2 border-dashed border-gray-300 hover:border-blue-300 rounded-xl p-5 cursor-pointer transform transition hover:scale-105 hover:shadow-md flex flex-col items-center justify-center"
                  >
                    <div className="p-4 rounded-full bg-green-100 text-green-600 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-center">Tạo hồ sơ mới</h3>
                    <p className="text-gray-600 text-center mt-2">Thêm thông tin cho người thân hoặc bản thân</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 6: Thông tin chi tiết */}
            {currentStep === 5 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Thông tin chi tiết</h2>
                
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    agreement: false
                  }}
                >
                  {typeLocation === 'home' && (
                    <Form.Item
                      name="address"
                      label="Địa chỉ"
                      rules={[{ required: true, message: 'Vui lòng nhập địa chỉ của bạn' }]}
                    >
                      <Input placeholder="Nhập địa chỉ đầy đủ của bạn" />
                    </Form.Item>
                  )}
                  
                  <Form.Item
                    name="description"
                    label="Mô tả triệu chứng/vấn đề"
                    rules={[
                      { required: true, message: 'Vui lòng mô tả triệu chứng hoặc vấn đề bạn đang gặp phải' },
                      { min: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
                      { max: 500, message: 'Mô tả không được vượt quá 500 ký tự' }
                    ]}
                  >
                    <TextArea 
                      placeholder="Mô tả chi tiết về triệu chứng, vấn đề sức khỏe hoặc lý do cần tư vấn (tối thiểu 10 ký tự)" 
                      rows={4}
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="notes"
                    label="Ghi chú bổ sung"
                  >
                    <TextArea 
                      placeholder="Thông tin bổ sung hoặc yêu cầu đặc biệt" 
                      rows={2}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="agreement"
                    valuePropName="checked"
                    rules={[{ 
                      validator: (_, value) => 
                        value ? Promise.resolve() : Promise.reject(new Error('Vui lòng đồng ý với điều khoản')) 
                    }]}
                  >
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 mr-2" 
                        onChange={e => form.setFieldsValue({ agreement: e.target.checked })}
                      />
                      <span className="text-sm text-gray-600">
                        Tôi đồng ý với các điều khoản và điều kiện
                      </span>
                    </div>
                  </Form.Item>
                  
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleStep6Continue}
                      className="px-6 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
                    >
                      Tiếp tục
                    </button>
                  </div>
                </Form>
              </div>
            )}
            
            {/* Step 7: Xác nhận */}
            {currentStep === 6 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Xác nhận đặt lịch</h2>
                
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Thông tin đặt lịch</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dịch vụ:</span>
                      <span className="font-medium">{getSelectedService()?.name}</span>
                    </div>
                    
                    {selectedPackage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gói dịch vụ:</span>
                        <span className="font-medium">{getSelectedPackage()?.name}</span>
                      </div>
                    )}
                    
                    {selectedDoctor && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bác sĩ:</span>
                        <span className="font-medium">{getSelectedDoctor()?.name}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hình thức:</span>
                      <span className="font-medium">
                        {typeLocation === 'online' ? 'Online' : 
                         typeLocation === 'clinic' ? 'Tại phòng khám' : 'Tại nhà'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày hẹn:</span>
                      <span className="font-medium">{new Date(selectedDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giờ hẹn:</span>
                      <span className="font-medium">{timeSlots.find(slot => slot.id === selectedTimeSlot)?.time}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá dịch vụ:</span>
                      <span className="font-medium text-blue-600">{formatPrice(getCurrentPrice())}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <button
                    onClick={handlePrev}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Quay lại
                  </button>
                  
                  <button
                    onClick={() => form.submit()}
                    className="px-6 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Quay lại
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal tạo profile mới */}
      {showCreateProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-6">Tạo hồ sơ mới</h3>
            
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
                <Input placeholder="Nhập họ và tên đầy đủ" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>



              <Form.Item
                name="birthDate"
                label="Năm sinh"
                rules={[{ required: true, message: 'Vui lòng nhập năm sinh' }]}
              >
                <Input placeholder="Ví dụ: 1990" />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Giới tính"
                rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
              >
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </Form.Item>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateProfileModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Tạo hồ sơ
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </BookingLayout>
  );
};

export default Booking; 