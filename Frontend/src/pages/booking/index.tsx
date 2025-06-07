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
import { appointmentApi } from '../../api/endpoints';
import axiosInstance from '../../api/axiosConfig';
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

  // Mock data với ID đúng định dạng MongoDB ObjectId
  const mockServices: ServiceOption[] = [
    {
      id: '507f1f77bcf86cd799439011',
      name: 'Tư vấn sức khỏe',
      description: 'Tư vấn chuyên sâu với bác sĩ chuyên khoa về sức khỏe sinh sản và tình dục',
      price: { online: 300000, clinic: 500000, home: 800000 },
      duration: '45-60 phút',
      icon: <People size={32} variant="Bold" />,
      image: Image1,
      gradient: 'from-blue-500 via-purple-500 to-pink-500',
      category: 'consultation'
    },
    {
      id: '507f1f77bcf86cd799439012',
      name: 'Xét nghiệm STI/STD',
      description: 'Gói xét nghiệm toàn diện các bệnh lây truyền qua đường tình dục',
      price: { online: 0, clinic: 1200000, home: 1500000 },
      duration: '30-45 phút',
      icon: <Activity size={32} variant="Bold" />,
      image: Image2,
      gradient: 'from-green-500 via-teal-500 to-blue-500',
      category: 'test',
      packages: [
        {
          id: '507f1f77bcf86cd799439021',
          name: 'Gói Cơ bản',
          description: 'Xét nghiệm các STI phổ biến nhất',
          price: { online: 0, clinic: 800000, home: 1000000 },
          tests: ['HIV', 'Giang mai', 'Lậu', 'Chlamydia'],
          duration: '30 phút',
          gradient: 'from-blue-500 to-blue-600'
        },
        {
          id: '507f1f77bcf86cd799439022',
          name: 'Gói Tiêu chuẩn',
          description: 'Xét nghiệm toàn diện các STI thường gặp',
          price: { online: 0, clinic: 1200000, home: 1500000 },
          tests: ['HIV', 'Giang mai', 'Lậu', 'Chlamydia', 'Herpes', 'HPV'],
          duration: '45 phút',
          isPopular: true,
          gradient: 'from-green-500 to-green-600'
        },
        {
          id: '507f1f77bcf86cd799439023',
          name: 'Gói Cao cấp',
          description: 'Xét nghiệm đầy đủ tất cả các STI và tư vấn chuyên sâu',
          price: { online: 0, clinic: 1800000, home: 2200000 },
          tests: ['HIV', 'Giang mai', 'Lậu', 'Chlamydia', 'Herpes', 'HPV', 'Hepatitis B', 'Hepatitis C', 'Trichomonas'],
          duration: '60 phút',
          gradient: 'from-purple-500 to-purple-600'
        }
      ]
    },
    {
      id: 'health-checkup',
      name: 'Khám sức khỏe tổng quát',
      description: 'Khám sức khỏe định kỳ và tư vấn chăm sóc sức khỏe toàn diện',
      price: { online: 0, clinic: 800000, home: 1200000 },
      duration: '60-90 phút',
      icon: <Heart size={32} variant="Bold" />,
      image: Image3,
      gradient: 'from-pink-500 via-rose-500 to-red-500',
      category: 'test'
    },
    {
      id: 'home-sampling',
      name: 'Lấy mẫu tại nhà',
      description: 'Dịch vụ lấy mẫu xét nghiệm tại nhà với đội ngũ y tế chuyên nghiệp',
      price: { online: 0, clinic: 0, home: 800000 },
      duration: '30-45 phút',
      icon: <Home size={32} variant="Bold" />,
      image: Image4,
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      category: 'test'
    },
    {
      id: 'cycle-tracking',
      name: 'Theo dõi chu kỳ kinh nguyệt',
      description: 'Tư vấn và hướng dẫn theo dõi chu kỳ kinh nguyệt hiệu quả',
      price: { online: 200000, clinic: 400000, home: 600000 },
      duration: '30-45 phút',
      icon: <Calendar size={32} variant="Bold" />,
      image: Image1,
      gradient: 'from-purple-500 via-pink-500 to-red-500',
      category: 'consultation'
    }
  ];

  const mockDoctors: Doctor[] = [
    {
      id: '507f1f77bcf86cd799439031',
      name: 'BS. Nguyễn Thị Hương',
      specialization: 'Sản phụ khoa',
      experience: 8,
      rating: 4.9,
      reviewCount: 156,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
      workload: 12,
      isAvailable: true,
      bio: 'Chuyên gia về sức khỏe sinh sản phụ nữ với hơn 8 năm kinh nghiệm'
    },
    {
      id: 'dr2',
      name: 'BS. Trần Văn Minh',
      specialization: 'Nam khoa',
      experience: 10,
      rating: 4.8,
      reviewCount: 203,
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
      workload: 8,
      isAvailable: true,
      bio: 'Bác sĩ nam khoa giàu kinh nghiệm, chuyên điều trị các vấn đề sức khỏe nam giới'
    },
    {
      id: 'dr3',
      name: 'BS. Lê Thị Mai',
      specialization: 'Tâm lý học',
      experience: 6,
      rating: 4.7,
      reviewCount: 89,
      avatar: 'https://images.unsplash.com/photo-1594824388853-d0c2b7b5e6b7?w=150',
      workload: 15,
      isAvailable: true,
      bio: 'Chuyên gia tâm lý tình dục và tư vấn các vấn đề tâm lý liên quan đến giới tính'
    }
  ];

  const mockUserProfiles: UserProfile[] = [
    {
      id: '507f1f77bcf86cd799439051',
      fullName: 'Nguyễn Văn A',
      phone: '0123456789',
      email: 'nguyenvana@email.com',
      birthDate: '1990-01-01',
      gender: 'male',
      relationship: 'self',
      isDefault: true
    },
    {
      id: '507f1f77bcf86cd799439052',
      fullName: 'Nguyễn Thị B',
      phone: '0987654321',
      email: 'nguyenthib@email.com',
      birthDate: '1992-05-15',
      gender: 'female',
      relationship: 'family',
      isDefault: false
    }
  ];

  const mockTimeSlots: TimeSlot[] = [
    { id: '507f1f77bcf86cd799439061', time: '08:00', isAvailable: true },
    { id: '507f1f77bcf86cd799439062', time: '08:30', isAvailable: true },
    { id: '507f1f77bcf86cd799439063', time: '09:00', isAvailable: false },
    { id: '507f1f77bcf86cd799439064', time: '09:30', isAvailable: true },
    { id: '507f1f77bcf86cd799439065', time: '10:00', isAvailable: true },
    { id: '507f1f77bcf86cd799439066', time: '10:30', isAvailable: false },
    { id: '507f1f77bcf86cd799439067', time: '11:00', isAvailable: true },
    { id: '507f1f77bcf86cd799439068', time: '14:00', isAvailable: true },
    { id: '507f1f77bcf86cd799439069', time: '14:30', isAvailable: true },
    { id: '507f1f77bcf86cd79943906a', time: '15:00', isAvailable: true },
    { id: '507f1f77bcf86cd79943906b', time: '15:30', isAvailable: false },
    { id: '507f1f77bcf86cd79943906c', time: '16:00', isAvailable: true }
  ];

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
      setSelectedProfile('new');
    } else {
      setSelectedProfile(profileId);
      const profile = userProfiles.find(p => p.id === profileId);
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
      // Trong môi trường thực tế, gọi API
      // const response = await axiosInstance.get('/services');
      // if (response.data.success) {
      //   const mappedServices = response.data.data.map(service => ({
      //     id: service._id,
      //     name: service.serviceName,
      //     description: service.description,
      //     price: {
      //       online: service.availableAt.includes('Online') ? service.price : 0,
      //       clinic: service.availableAt.includes('Center') ? service.price : 0,
      //       home: service.availableAt.includes('Athome') ? service.price * 1.5 : 0,
      //     },
      //     duration: '45-60 phút',
      //     icon: getIconForServiceType(service.serviceType),
      //     image: getImageForServiceType(service.serviceType),
      //     gradient: getGradientForServiceType(service.serviceType),
      //     category: service.serviceType,
      //   }));
      //   setServices(mappedServices);
      // }
      
      // Sử dụng mock data cho development
      setServices(mockServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      message.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      // Trong môi trường thực tế, gọi API
      // const response = await axiosInstance.get('/doctors');
      // if (response.data.success) {
      //   setDoctors(response.data.data);
      // }
      
      // Sử dụng mock data cho development
      setDoctors(mockDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      message.error('Không thể tải danh sách bác sĩ');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      // Trong môi trường thực tế, gọi API
      // const response = await axiosInstance.get('/users/profiles');
      // if (response.data.success) {
      //   setUserProfiles(response.data.data);
      // }
      
      // Sử dụng mock data cho development
      setUserProfiles(mockUserProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      message.error('Không thể tải danh sách hồ sơ');
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedDate) return;
    
    setLoadingTimeSlots(true);
    try {
      // Trong môi trường thực tế, gọi API
      // const response = await axiosInstance.get('/doctor-schedules/available-slots', {
      //   params: {
      //     date: selectedDate,
      //     doctorId: selectedDoctor || undefined
      //   }
      // });
      // if (response.data.success) {
      //   setTimeSlots(response.data.data.map(slot => ({
      //     id: slot._id,
      //     time: slot.slotTime,
      //     isAvailable: !slot.isBooked
      //   })));
      // }
      
      // Sử dụng mock data cho development
      setTimeSlots(mockTimeSlots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      message.error('Không thể tải danh sách slot thời gian');
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
              </div>
            )}
            
            {/* Step 2: Chọn bác sĩ */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Chọn bác sĩ</h2>
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
                        <p>SĐT: {profile.phone}</p>
                        <p>Email: {profile.email}</p>
                        <p>Ngày sinh: {new Date(profile.birthDate).toLocaleDateString('vi-VN')}</p>
                        <p>Giới tính: {profile.gender === 'male' ? 'Nam' : 'Nữ'}</p>
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