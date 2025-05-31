import { Form, Input, message } from 'antd';
import {
    Activity,
    Calendar,
    Heart,
    Home,
    People
} from 'iconsax-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

  // Form state theo unified flow
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [typeLocation, setTypeLocation] = useState<'online' | 'clinic' | 'home'>('clinic');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');

  // Mock data - trong thực tế sẽ fetch từ API
  const services: ServiceOption[] = [
    {
      id: 'consultation',
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
      id: 'sti-testing',
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
          id: 'basic',
          name: 'Gói Cơ bản',
          description: 'Xét nghiệm các STI phổ biến nhất',
          price: { online: 0, clinic: 800000, home: 1000000 },
          tests: ['HIV', 'Giang mai', 'Lậu', 'Chlamydia'],
          duration: '30 phút',
          gradient: 'from-blue-500 to-blue-600'
        },
        {
          id: 'standard',
          name: 'Gói Tiêu chuẩn',
          description: 'Xét nghiệm toàn diện các STI thường gặp',
          price: { online: 0, clinic: 1200000, home: 1500000 },
          tests: ['HIV', 'Giang mai', 'Lậu', 'Chlamydia', 'Herpes', 'HPV'],
          duration: '45 phút',
          isPopular: true,
          gradient: 'from-green-500 to-green-600'
        },
        {
          id: 'premium',
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

  const doctors: Doctor[] = [
    {
      id: 'dr1',
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

  const userProfiles: UserProfile[] = [
    {
      id: 'profile1',
      fullName: 'Nguyễn Văn A',
      phone: '0123456789',
      email: 'nguyenvana@email.com',
      birthDate: '1990-01-01',
      gender: 'male',
      relationship: 'self',
      isDefault: true
    },
    {
      id: 'profile2',
      fullName: 'Nguyễn Thị B',
      phone: '0987654321',
      email: 'nguyenthib@email.com',
      birthDate: '1992-05-15',
      gender: 'female',
      relationship: 'family',
      isDefault: false
    }
  ];

  const timeSlots: TimeSlot[] = [
    { id: 'slot1', time: '08:00', isAvailable: true },
    { id: 'slot2', time: '08:30', isAvailable: true },
    { id: 'slot3', time: '09:00', isAvailable: false },
    { id: 'slot4', time: '09:30', isAvailable: true },
    { id: 'slot5', time: '10:00', isAvailable: true },
    { id: 'slot6', time: '10:30', isAvailable: false },
    { id: 'slot7', time: '11:00', isAvailable: true },
    { id: 'slot8', time: '14:00', isAvailable: true },
    { id: 'slot9', time: '14:30', isAvailable: true },
    { id: 'slot10', time: '15:00', isAvailable: true },
    { id: 'slot11', time: '15:30', isAvailable: false },
    { id: 'slot12', time: '16:00', isAvailable: true }
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

  const handleSubmit = async (values: BookingFormData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const bookingData = {
        ...values,
        serviceId: selectedService,
        packageId: selectedPackage || undefined,
        doctorId: selectedDoctor || undefined,
        typeLocation,
        appointmentDate: selectedDate,
        appointmentTime: selectedTimeSlot,
        profileId: selectedProfile
      };
      
      console.log('Booking data:', bookingData);
      message.success('Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
      
      // Navigate to booking confirmation or history
      navigate('/booking-history');
    } catch {
      message.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Auto-select service from URL params
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam && services.find(s => s.id === serviceParam)) {
      setSelectedService(serviceParam);
      setCurrentStep(1); // Skip to doctor selection
    }
  }, [searchParams]);

  return (
    <BookingLayout>
      {/* Toàn bộ nội dung booking form, stepper, chọn thời gian, xác nhận, KHÔNG render hình ảnh bác sĩ/dịch vụ */}
      {/* ... giữ lại các step, form, button, thông báo ... */}
    </BookingLayout>
  );
};

export default Booking; 