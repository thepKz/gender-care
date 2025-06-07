import { Form, Input, message, Spin } from 'antd';
import axios from 'axios';
import {
    Activity,
    Calendar,
    Heart,
    Home,
    People
} from 'iconsax-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentApi, servicesApi } from '../../api/endpoints';
import axiosInstance from '../../api/axiosConfig';
import userProfileApi from '../../api/endpoints/userProfileApi';
import Image1 from '../../assets/images/image1.jpg';
import Image2 from '../../assets/images/image2.jpg';
import Image3 from '../../assets/images/image3.jpg';
import Image4 from '../../assets/images/image4.jpg';
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
  email: string;
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
      // Kiểm tra trước khi chuyển từ bước chọn hồ sơ sang bước thông tin chi tiết
      if (currentStep === 4 && !selectedProfile) {
        message.error('Vui lòng chọn hồ sơ bệnh nhân');
        return;
      }
      
      // Kiểm tra trước khi chuyển từ bước thông tin chi tiết sang bước xác nhận
      if (currentStep === 5) {
        form.validateFields().then(() => {
          setCurrentStep(currentStep + 1);
        }).catch(err => {
          console.log('Validation failed:', err);
        });
        return;
      }
      
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
    console.log('Selected profile ID:', profileId);
    if (profileId === 'new') {
      setSelectedProfile('new');
    } else {
      setSelectedProfile(profileId);
      const profile = userProfiles.find(p => p.id === profileId);
      console.log('Found profile:', profile);
      if (profile) {
        form.setFieldsValue({
          fullName: profile.fullName,
          phone: profile.phone,
          email: profile.email,
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
      // Log URL đang gọi
      console.log('Đang gọi API services từ URL:', axiosInstance.defaults.baseURL + '/services');
      
      // Gọi API thật từ servicesApi
      const response = await servicesApi.getServices();
      console.log('Services API response FULL:', JSON.stringify(response, null, 2));
      
      if (response) {
        // Kiểm tra cấu trúc phản hồi đầy đủ
        console.log('Cấu trúc response đầy đủ:', {
          responseType: typeof response,
          hasData: !!response.data,
          dataType: typeof response.data,
          isDataArray: Array.isArray(response.data),
          dataLength: Array.isArray(response.data) ? response.data.length : 'not an array'
        });
        
        // Xử lý nhiều cấu trúc dữ liệu khác nhau từ API
        let servicesData: any[] = [];
        
        // Xử lý cấu trúc response đã biết từ backend:
        // {"success":true,"data":{"services":[],"pagination":{"total":0,"page":1,"limit":10,"totalPages":0}}}
        if (response.data && response.data.success === true && response.data.data && response.data.data.services) {
          servicesData = response.data.data.services;
          console.log('Tìm thấy services từ cấu trúc chuẩn: data.data.services');
        } else if (Array.isArray(response.data)) {
          // Trường hợp API trả về mảng trực tiếp
          servicesData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Kiểm tra các cấu trúc phổ biến
          if (Array.isArray(response.data.data)) {
            servicesData = response.data.data;
          } else if (Array.isArray(response.data.services)) {
            servicesData = response.data.services;
          } else if (response.data.result && Array.isArray(response.data.result)) {
            servicesData = response.data.result;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            servicesData = response.data.results;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            servicesData = response.data.items;
          } else {
            // Nếu không có cấu trúc tiêu chuẩn, tìm mảng đầu tiên trong object
            const firstArrayProperty = Object.keys(response.data).find(key => 
              Array.isArray(response.data[key]) && response.data[key].length > 0
            );
            
            if (firstArrayProperty) {
              servicesData = response.data[firstArrayProperty];
              console.log(`Tìm thấy mảng dữ liệu trong thuộc tính: ${firstArrayProperty}`);
            }
          }
        }
        
        console.log('Services data after parsing:', servicesData);
        console.log('Services data length:', servicesData.length);
        
        if (servicesData && servicesData.length > 0) {
          // Kiểm tra cấu trúc dữ liệu của item đầu tiên
          const firstItem = servicesData[0];
          console.log('Mẫu dữ liệu đầu tiên:', firstItem);
          
          // Chuyển đổi dữ liệu từ API để phù hợp với cấu trúc interface
          const mappedServices = servicesData.map((service: any) => {
            // Xác định các trường dữ liệu dựa trên cấu trúc thực tế
            const id = service._id || service.id || '';
            const name = service.serviceName || service.name || service.title || '';
            const description = service.description || service.desc || service.serviceDescription || '';
            const price = service.price || service.servicePrice || 0;
            
            // Xác định nơi dịch vụ có sẵn
            const availableAt = service.availableAt || service.locations || [];
            const isAvailableOnline = Array.isArray(availableAt) 
              ? availableAt.includes('Online') 
              : String(availableAt).includes('Online');
            const isAvailableClinic = Array.isArray(availableAt) 
              ? availableAt.includes('Center') 
              : String(availableAt).includes('Center');
            const isAvailableHome = Array.isArray(availableAt) 
              ? availableAt.includes('Athome') 
              : String(availableAt).includes('Athome');
            
            // Các thông tin khác
            const serviceType = service.serviceType || service.category || service.type || 'consultation';
            const duration = service.duration || service.serviceDuration || '45-60 phút';
            
            return {
              id,
              name,
              description,
              price: {
                online: isAvailableOnline ? price : 0,
                clinic: isAvailableClinic ? price : 0,
                home: isAvailableHome ? price * 1.5 : 0,
              },
              duration,
              icon: getIconForServiceType(serviceType),
              image: getImageForServiceType(serviceType),
              gradient: getGradientForServiceType(serviceType),
              category: serviceType,
            };
          }).filter(service => service.id && service.name); // Lọc bỏ các dịch vụ không có id hoặc name
          
          console.log('Mapped services:', mappedServices);
          
          if (mappedServices.length > 0) {
            setServices(mappedServices);
            return;
          } else {
            console.error('Sau khi map và lọc, không còn dịch vụ nào hợp lệ');
            message.info('Không tìm thấy dịch vụ hợp lệ từ server');
          }
        } else {
          console.error('Không tìm thấy dịch vụ nào từ server. ServicesData rỗng:', servicesData);
          message.info('Không có dịch vụ nào trên hệ thống. Hiển thị dữ liệu mẫu...');
          
          // Tạo dữ liệu mẫu khi API trả về rỗng
          const demoServices: ServiceOption[] = [
            {
              id: 'demo-service-1',
              name: 'Tư vấn tâm lý cá nhân',
              description: 'Tư vấn 1-1 với chuyên gia tâm lý về các vấn đề cá nhân',
              price: {
                online: 300000,
                clinic: 400000,
                home: 600000
              },
              duration: '45-60 phút',
              icon: getIconForServiceType('consultation'),
              image: getImageForServiceType('consultation'),
              gradient: getGradientForServiceType('consultation'),
              category: 'consultation'
            },
            {
              id: 'demo-service-2',
              name: 'Kiểm tra sức khỏe tổng quát',
              description: 'Kiểm tra sức khỏe toàn diện với các chỉ số cơ bản',
              price: {
                online: 0,
                clinic: 500000,
                home: 750000
              },
              duration: '60-90 phút',
              icon: getIconForServiceType('test'),
              image: getImageForServiceType('test'),
              gradient: getGradientForServiceType('test'),
              category: 'test'
            },
            {
              id: 'demo-service-3',
              name: 'Tư vấn tâm lý theo nhóm',
              description: 'Tư vấn nhóm với chuyên gia tâm lý về các vấn đề chung',
              price: {
                online: 200000,
                clinic: 250000,
                home: 0
              },
              duration: '90-120 phút',
              icon: getIconForServiceType('consultation'),
              image: getImageForServiceType('consultation'),
              gradient: getGradientForServiceType('consultation'),
              category: 'consultation'
            }
          ];
          
          setServices(demoServices);
          return;
        }
      } else {
        console.error('Không tìm thấy dữ liệu phản hồi từ API');
        message.info('Không thể tải dữ liệu dịch vụ');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          config: error.config,
          message: error.message,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        });
      }
      message.error('Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      console.log('Đang gọi API lấy danh sách bác sĩ...');
      // Gọi API từ endpoint được định nghĩa trong backend
      const response = await axiosInstance.get('/doctors');
      
      console.log('Phản hồi API bác sĩ:', response);
      
      if (response && response.data) {
        // Chuyển đổi dữ liệu từ API để phù hợp với cấu trúc interface
        // API doctorController.getAll() có thể trả về mảng trực tiếp hoặc object { data: [...] }
        const doctorsData = Array.isArray(response.data) ? response.data : 
                        (response.data.data || []);
        
        console.log('Dữ liệu bác sĩ sau khi phân tích:', doctorsData);
        
        if (doctorsData.length > 0) {
          const mappedDoctors = doctorsData.map((doctor: any) => ({
            id: doctor._id || doctor.id,
            name: doctor.userId?.fullName || doctor.user?.fullName || doctor.fullName || 'Bác sĩ',
            specialization: doctor.specialization || 'Chuyên khoa',
            experience: doctor.experience || 0,
            rating: doctor.rating || 4.5,
            reviewCount: doctor.reviewCount || 0,
            avatar: doctor.userId?.avatar || doctor.user?.avatar || doctor.avatar || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
            workload: doctor.workload || 10,
            isAvailable: doctor.isAvailable !== undefined ? doctor.isAvailable : true,
            bio: doctor.bio || 'Bác sĩ chuyên khoa'
          }));
          
          console.log('Dữ liệu bác sĩ đã chuyển đổi:', mappedDoctors);
          
          if (mappedDoctors.length > 0) {
            setDoctors(mappedDoctors);
            return;
          } else {
            message.info('Không tìm thấy bác sĩ nào từ server');
          }
        } else {
          message.info('Không tìm thấy bác sĩ nào từ server');
        }
      } else {
        message.info('Không tìm thấy dữ liệu bác sĩ');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          config: error.config
        });
      }
      
      message.info('Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      console.log('Đang gọi API lấy danh sách hồ sơ...');
      // Gọi API trực tiếp từ userProfileApi
      const profiles = await userProfileApi.getMyProfiles();
      console.log('Profile API response:', profiles);
      
      if (profiles && profiles.length > 0) {
        // Chuyển đổi dữ liệu từ API để phù hợp với cấu trúc interface
        const mappedProfiles = profiles.map(profile => ({
          id: profile._id || profile.id,
          fullName: profile.fullName || '',
          phone: profile.phone || '',
          email: profile.email || '',
          birthDate: profile.year || profile.birthDate || new Date().toISOString(),
          gender: profile.gender || 'other',
          relationship: profile.relationship || 'self',
          isDefault: profile.isDefault || false
        }));
        
        console.log('Mapped profiles:', mappedProfiles);
        setUserProfiles(mappedProfiles);
        
        // Nếu chưa chọn profile và có ít nhất một profile, tự động chọn profile đầu tiên
        if (!selectedProfile && mappedProfiles.length > 0) {
          setSelectedProfile(mappedProfiles[0].id);
        }
      } else {
        message.info('Không tìm thấy hồ sơ nào. Vui lòng tạo hồ sơ trước khi đặt lịch.');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      
      message.info('Không thể tải danh sách hồ sơ. Vui lòng thử lại sau.');
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedDate) {
      console.warn('Không thể tải time slots: Chưa chọn ngày');
      return;
    }
    
    setLoadingTimeSlots(true);
    try {
      console.log('Đang gọi API lấy danh sách slots với:', {
        date: selectedDate,
        doctorId: selectedDoctor || undefined
      });
      
      // URL endpoint được cập nhật theo cấu trúc API trong doctorRoutes.ts
      let apiUrl = '/doctors/available-slots';
      
      // Nếu có chọn doctor cụ thể, sử dụng endpoint lấy slots của doctor đó
      if (selectedDoctor) {
        apiUrl = `/doctors/${selectedDoctor}/available-slots`;
      }
      
      console.log('Gọi API URL:', apiUrl);
      
      // Gọi API từ backend
      const response = await axiosInstance.get(apiUrl, {
        params: {
          date: selectedDate
        }
      });
      
      console.log('TimeSlots API response:', response);
      
      if (response && response.data) {
        // Xử lý dữ liệu trả về từ API
        // Kiểm tra cấu trúc dữ liệu từ API
        let slotsData: any[] = [];
        
        if (response.data.data) {
          // Cấu trúc { data: [...] }
          slotsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Cấu trúc trả về trực tiếp là mảng
          slotsData = response.data;
        } else if (typeof response.data === 'object' && response.data.availableSlots) {
          // Cấu trúc trả về có thể là object với availableSlots
          slotsData = response.data.availableSlots;
        } else if (response.data.availableDoctors && Array.isArray(response.data.availableDoctors)) {
          // Cấu trúc từ endpoint /doctors/available
          const firstDoctor = response.data.availableDoctors[0];
          if (firstDoctor && firstDoctor.availableSlots) {
            slotsData = firstDoctor.availableSlots;
          }
        }
        
        console.log('Extracted slots data:', slotsData);
        
        if (slotsData && slotsData.length > 0) {
          // Map dữ liệu từ API sang cấu trúc của interface TimeSlot
          const mappedTimeSlots = slotsData.map((slot: any) => ({
            id: slot.slotId || slot._id || slot.id,
            time: slot.slotTime || slot.time,
            isAvailable: slot.status === "Free" || (!slot.isBooked && slot.isAvailable !== false)
          }));
          
          console.log('Mapped time slots:', mappedTimeSlots);
          setTimeSlots(mappedTimeSlots);
          
          // Nếu có slot khả dụng và chưa chọn slot nào, tự động chọn slot đầu tiên khả dụng
          const availableSlot = mappedTimeSlots.find(slot => slot.isAvailable);
          if (availableSlot && !selectedTimeSlot) {
            setSelectedTimeSlot(availableSlot.id);
          }
          
          return;
        } else {
          message.info('Không tìm thấy thời gian trống nào cho ngày này');
        }
      } else {
        message.info('Không tìm thấy dữ liệu thời gian');
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          config: error.config
        });
      }
      
      message.info('Không thể tải danh sách thời gian. Vui lòng thử lại sau.');
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
      console.log('Starting submission with values:', { 
        selectedService, 
        selectedPackage, 
        selectedProfile, 
        selectedTimeSlot 
      });
      
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
      
      // Create appointment using API
      const appointmentData = {
        profileId: selectedProfile,
        packageId: selectedPackage || undefined,
        serviceId: selectedService || undefined,
        slotId: selectedTimeSlot,
        appointmentDate: selectedDate,
        appointmentTime: timeSlots.find(slot => slot.id === selectedTimeSlot)?.time || '',
        appointmentType: getSelectedService()?.category as 'consultation' | 'test' | 'other' || 'other',
        typeLocation: typeLocation,
        address: values.address,
        description: values.description,
        notes: values.notes
      };
      
      console.log('Dữ liệu gửi đi:', JSON.stringify(appointmentData, null, 2));
      
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
    }
  }, [selectedDate, selectedDoctor]);

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
                  onClick={() => {
                    // Chỉ cho phép chuyển đến các bước đã đi qua
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    } else if (index === 4) {
                      // Trường hợp đặc biệt cho bước 5 (chọn hồ sơ bệnh nhân)
                      message.info('Vui lòng hoàn thành các bước trước');
                    }
                  }}
                  className={`flex flex-col items-center ${index <= currentStep ? 'text-blue-600 cursor-pointer' : 'text-gray-400'}`}
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
                
                {loadingServices ? (
                  <div className="flex justify-center py-10">
                    <Spin size="large" tip="Đang tải dịch vụ..." />
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-gray-500 mb-4">Không tìm thấy dịch vụ nào</div>
                    <button 
                      onClick={() => fetchServices()}
                      className="px-6 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
                    >
                      Tải lại
                    </button>
                  </div>
                ) : (
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
                
                {loadingDoctors ? (
                  <div className="flex justify-center py-10">
                    <Spin size="large" tip="Đang tải danh sách bác sĩ..." />
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-gray-500 mb-4">Không tìm thấy bác sĩ nào</div>
                    <button 
                      onClick={() => fetchDoctors()}
                      className="px-6 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
                    >
                      Tải lại
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map(doctor => (
                      <div 
                        key={doctor.id}
                        onClick={() => {
                          setSelectedDoctor(doctor.id);
                          handleNext();
                        }}
                        className="border border-gray-200 hover:border-blue-300 rounded-xl p-5 cursor-pointer transform transition hover:scale-105 hover:shadow-md"
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
                          <span className={`px-3 py-1 rounded-full text-xs ${doctor.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {doctor.isAvailable ? 'Có sẵn' : 'Không có sẵn'}
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
                )}
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
                    
                    {loadingTimeSlots ? (
                      <div className="flex justify-center py-5">
                        <Spin size="default" tip="Đang tải thời gian trống..." />
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <div className="text-center py-5">
                        <div className="text-gray-500 mb-2">Không tìm thấy thời gian trống</div>
                        <button 
                          onClick={() => fetchTimeSlots()}
                          className="px-4 py-1 bg-blue-600 rounded-md text-white hover:bg-blue-700 text-sm"
                        >
                          Tải lại
                        </button>
                      </div>
                    ) : (
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
                    )}
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
                
                {loadingProfiles ? (
                  <div className="flex justify-center py-10">
                    <Spin size="large" tip="Đang tải hồ sơ..." />
                  </div>
                ) : userProfiles.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-gray-500 mb-4">Không có hồ sơ bệnh nhân nào</div>
                    <button 
                      onClick={() => handleProfileSelect('new')}
                      className="px-6 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
                    >
                      Tạo hồ sơ mới
                    </button>
                  </div>
                ) : (
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
                          <p>Email: {profile.email || 'Chưa có'}</p>
                          <p>Ngày sinh: {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('vi-VN') : 'Chưa có'}</p>
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
                )}
              </div>
            )}
            
            {/* Step 6: Thông tin chi tiết */}
            {currentStep === 5 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Thông tin chi tiết</h2>
                
                {/* Hiển thị thông tin profile đã chọn */}
                {selectedProfile && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-2">Thông tin bệnh nhân:</h3>
                    {userProfiles.map(profile => profile.id === selectedProfile && (
                      <div key={profile.id} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <p><span className="font-medium">Họ tên:</span> {profile.fullName}</p>
                        <p><span className="font-medium">Số điện thoại:</span> {profile.phone || 'Chưa có'}</p>
                        <p><span className="font-medium">Email:</span> {profile.email || 'Chưa có'}</p>
                        <p><span className="font-medium">Ngày sinh:</span> {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('vi-VN') : 'Chưa có'}</p>
                        <p><span className="font-medium">Giới tính:</span> {profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}</p>
                      </div>
                    ))}
                  </div>
                )}
                
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
                  >
                    <TextArea 
                      placeholder="Mô tả ngắn gọn về triệu chứng hoặc vấn đề bạn đang gặp phải" 
                      rows={4}
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
                      onClick={handleNext}
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

                    {/* Thêm thông tin hồ sơ bệnh nhân */}
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <h4 className="font-semibold mb-2">Thông tin bệnh nhân:</h4>
                      {selectedProfile && (
                        <div className="space-y-2">
                          {userProfiles.map(profile => profile.id === selectedProfile && (
                            <React.Fragment key={profile.id}>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Họ tên:</span>
                                <span className="font-medium">{profile.fullName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Số điện thoại:</span>
                                <span className="font-medium">{profile.phone || 'Chưa có'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{profile.email || 'Chưa có'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Ngày sinh:</span>
                                <span className="font-medium">{profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('vi-VN') : 'Chưa có'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Giới tính:</span>
                                <span className="font-medium">{profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}</span>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
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
    </BookingLayout>
  );
};

export default Booking; 