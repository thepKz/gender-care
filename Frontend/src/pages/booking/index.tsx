import { Avatar, Badge, Button, Checkbox, DatePicker, Form, Input, message, Select, Steps } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AddCircle,
  ArrowRight,
  Award,
  Calendar,
  Clock,
  Heart,
  Home,
  Location,
  MonitorMobbile,
  People,
  Star,
  TickCircle,
  User
} from 'iconsax-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Image1 from '../../assets/images/image1.jpg';
import Image2 from '../../assets/images/image2.jpg';
import Image3 from '../../assets/images/image3.jpg';
import Image4 from '../../assets/images/image4.jpg';
import ModernButton from '../../components/ui/ModernButton';
import ModernCard from '../../components/ui/ModernCard';

const { Option } = Select;
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
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);

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
      setShowNewProfileForm(true);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Đặt lịch Dịch vụ
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Luồng đặt lịch thống nhất cho tất cả dịch vụ chăm sóc sức khỏe
            </p>
          </motion.div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Steps
            current={currentStep}
            items={steps}
            className="custom-steps"
            size="small"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Chọn dịch vụ */}
          {currentStep === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Chọn dịch vụ bạn cần
                </h2>
                <p className="text-lg text-gray-600">
                  Tất cả dịch vụ đều sử dụng luồng đặt lịch thống nhất
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="h-full"
                  >
                    <ModernCard
                      variant="default"
                      className="h-full cursor-pointer group flex flex-col"
                      onClick={() => handleServiceSelect(service.id)}
                    >
                      <div className="relative h-48 mb-6 rounded-xl overflow-hidden">
                        <img
                          src={service.image}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-80`} />
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          {service.icon}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col space-y-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {service.name}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {service.description}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Từ</span>
                            <span className="text-lg font-bold text-blue-600">
                              {service.price.online > 0 
                                ? formatPrice(Math.min(service.price.online, service.price.clinic))
                                : formatPrice(service.price.clinic)
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock size={16} />
                            <span>{service.duration}</span>
                          </div>
                        </div>

                        <ModernButton
                          variant="primary"
                          fullWidth
                          icon={<ArrowRight size={20} />}
                          iconPosition="right"
                        >
                          Chọn dịch vụ này
                        </ModernButton>
                      </div>
                    </ModernCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Chọn bác sĩ */}
          {currentStep === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Chọn bác sĩ
                  </h2>
                  <p className="text-lg text-gray-600">
                    Chọn bác sĩ phù hợp hoặc để hệ thống tự động chọn bác sĩ tốt nhất
                  </p>
                </div>

                {/* Package selection for STI testing */}
                {selectedService === 'sti-testing' && (
                  <div className="mb-12">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                      Chọn gói xét nghiệm
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {getSelectedService()?.packages?.map((pkg) => (
                        <motion.div
                          key={pkg.id}
                          whileHover={{ y: -5 }}
                          className="relative"
                        >
                          {pkg.isPopular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                              <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                                Phổ biến nhất
                              </span>
                            </div>
                          )}
                          
                          <ModernCard
                            variant={selectedPackage === pkg.id ? "bordered" : "default"}
                            className={`cursor-pointer transition-all duration-300 h-full ${
                              selectedPackage === pkg.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                            }`}
                            onClick={() => setSelectedPackage(pkg.id)}
                          >
                            <div className={`h-20 bg-gradient-to-r ${pkg.gradient} rounded-xl mb-4 flex items-center justify-center`}>
                              <Activity size={32} className="text-white" variant="Bold" />
                            </div>

                            <div className="space-y-4">
                              <div className="text-center">
                                <h4 className="text-lg font-bold text-gray-900 mb-2">
                                  {pkg.name}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  {pkg.description}
                                </p>
                              </div>

                              <div className="text-center py-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                  {formatPrice(pkg.price.clinic)}
                                </div>
                                <div className="text-sm text-gray-500">{pkg.duration}</div>
                              </div>

                              <div className="space-y-2">
                                <div className="text-sm font-semibold text-gray-700">Bao gồm:</div>
                                {pkg.tests.map((test, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <TickCircle size={16} className="text-green-500 flex-shrink-0" />
                                    <span>{test}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </ModernCard>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-assign option */}
                <div className="mb-8">
                  <ModernCard
                    variant={!selectedDoctor ? "bordered" : "default"}
                    className={`cursor-pointer transition-all duration-300 ${
                      !selectedDoctor ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedDoctor('')}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Award size={32} className="text-white" variant="Bold" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          Để hệ thống chọn bác sĩ phù hợp
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Hệ thống sẽ tự động chọn bác sĩ có ít lịch hẹn nhất và phù hợp với dịch vụ bạn chọn
                        </p>
                      </div>
                      <div className="text-blue-600 font-semibold">
                        Khuyến nghị
                      </div>
                    </div>
                  </ModernCard>
                </div>

                {/* Doctor list */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 text-center">
                    Hoặc chọn bác sĩ cụ thể
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {doctors.map((doctor) => (
                      <motion.div
                        key={doctor.id}
                        whileHover={{ y: -3 }}
                      >
                        <ModernCard
                          variant={selectedDoctor === doctor.id ? "bordered" : "default"}
                          className={`cursor-pointer transition-all duration-300 ${
                            selectedDoctor === doctor.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                          }`}
                          onClick={() => setSelectedDoctor(doctor.id)}
                        >
                          <div className="flex items-start gap-4 p-4">
                            <Avatar
                              size={64}
                              src={doctor.avatar}
                              className="flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900 truncate">
                                    {doctor.name}
                                  </h4>
                                  <p className="text-blue-600 text-sm font-medium">
                                    {doctor.specialization}
                                  </p>
                                </div>
                                <Badge
                                  count={doctor.workload}
                                  style={{ backgroundColor: doctor.workload < 10 ? '#52c41a' : doctor.workload < 15 ? '#faad14' : '#f5222d' }}
                                  title="Số lịch hẹn hiện tại"
                                />
                              </div>
                              
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {doctor.bio}
                              </p>
                              
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <Star size={16} className="text-yellow-400" variant="Bold" />
                                    <span className="font-medium">{doctor.rating}</span>
                                    <span className="text-gray-500">({doctor.reviewCount})</span>
                                  </div>
                                  <div className="text-gray-500">
                                    {doctor.experience} năm KN
                                  </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  doctor.isAvailable 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {doctor.isAvailable ? 'Có thể đặt lịch' : 'Bận'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </ModernCard>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-12">
                  <ModernButton
                    variant="outline"
                    onClick={handlePrev}
                    icon={<ArrowRight size={20} className="rotate-180" />}
                  >
                    Quay lại
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    onClick={handleNext}
                    disabled={selectedService === 'sti-testing' && !selectedPackage}
                    icon={<ArrowRight size={20} />}
                    iconPosition="right"
                  >
                    Tiếp tục
                  </ModernButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Chọn vị trí thực hiện */}
          {currentStep === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Chọn vị trí thực hiện
                  </h2>
                  <p className="text-lg text-gray-600">
                    Lựa chọn hình thức phù hợp với nhu cầu của bạn
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      id: 'online' as const,
                      name: 'Tư vấn Online',
                      icon: <MonitorMobbile size={32} variant="Bold" />,
                      description: 'Video call với bác sĩ qua ứng dụng',
                      features: ['Tiện lợi, tiết kiệm thời gian', 'Bảo mật thông tin', 'Ghi lại cuộc hẹn'],
                      gradient: 'from-blue-500 to-cyan-500'
                    },
                    {
                      id: 'clinic' as const,
                      name: 'Tại phòng khám',
                      icon: <Location size={32} variant="Bold" />,
                      description: 'Đến trực tiếp cơ sở y tế',
                      features: ['Khám trực tiếp', 'Thiết bị hiện đại', 'Đội ngũ y tế chuyên nghiệp'],
                      gradient: 'from-green-500 to-emerald-500'
                    },
                    {
                      id: 'home' as const,
                      name: 'Tại nhà',
                      icon: <Home size={32} variant="Bold" />,
                      description: 'Bác sĩ/y tá đến tận nơi',
                      features: ['Riêng tư, thoải mái', 'Tiết kiệm thời gian di chuyển', 'Phù hợp người bận rộn'],
                      gradient: 'from-purple-500 to-pink-500'
                    }
                  ].map((option) => {
                    const service = getSelectedService();
                    const pkg = getSelectedPackage();
                    const price = pkg ? pkg.price[option.id] : service?.price[option.id];
                    const isAvailable = price && price > 0;

                    if (!isAvailable) return null;

                    return (
                      <motion.div
                        key={option.id}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ModernCard
                          variant={typeLocation === option.id ? "bordered" : "default"}
                          className={`cursor-pointer transition-all duration-300 h-full ${
                            typeLocation === option.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                          }`}
                          onClick={() => handleLocationSelect(option.id)}
                        >
                          <div className="text-center space-y-6 p-6">
                            <div className={`w-20 h-20 bg-gradient-to-br ${option.gradient} rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg`}>
                              {option.icon}
                            </div>
                            
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {option.name}
                              </h3>
                              <p className="text-gray-600 text-sm mb-4">
                                {option.description}
                              </p>
                            </div>

                            <div className="text-center py-4 bg-gray-50 rounded-xl">
                              <div className="text-2xl font-bold text-blue-600 mb-1">
                                {formatPrice(price)}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {option.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                                  <TickCircle size={16} className="text-green-500 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </ModernCard>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-12">
                  <ModernButton
                    variant="outline"
                    onClick={handlePrev}
                    icon={<ArrowRight size={20} className="rotate-180" />}
                  >
                    Quay lại
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    onClick={handleNext}
                    disabled={!typeLocation}
                    icon={<ArrowRight size={20} />}
                    iconPosition="right"
                  >
                    Tiếp tục
                  </ModernButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Chọn lịch hẹn */}
          {currentStep === 3 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Chọn ngày và giờ hẹn
                  </h2>
                  <p className="text-lg text-gray-600">
                    Lựa chọn thời gian phù hợp với lịch trình của bạn
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Calendar */}
                  <ModernCard variant="default" size="large">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar size={24} className="text-blue-500" />
                      Chọn ngày
                    </h3>
                    <DatePicker
                      size="large"
                      className="w-full"
                      placeholder="Chọn ngày hẹn"
                      disabledDate={(current) => current && current.valueOf() < Date.now() - 86400000}
                      onChange={(date) => {
                        if (date) {
                          setSelectedDate(date.format('YYYY-MM-DD'));
                        }
                      }}
                    />
                    
                    {selectedDate && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">
                          Ngày đã chọn: {new Date(selectedDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}
                  </ModernCard>

                  {/* Time slots */}
                  <ModernCard variant="default" size="large">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock size={24} className="text-green-500" />
                      Chọn giờ
                    </h3>
                    
                    {!selectedDate ? (
                      <div className="text-center py-8 text-gray-500">
                        Vui lòng chọn ngày trước
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot.id}
                            type={selectedTimeSlot === slot.time ? "primary" : "default"}
                            disabled={!slot.isAvailable}
                            className={`h-12 ${
                              selectedTimeSlot === slot.time 
                                ? 'bg-blue-500 border-blue-500' 
                                : slot.isAvailable 
                                  ? 'hover:border-blue-500 hover:text-blue-500' 
                                  : ''
                            }`}
                            onClick={() => setSelectedTimeSlot(slot.time)}
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    {selectedTimeSlot && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">
                          Giờ đã chọn: {selectedTimeSlot}
                        </div>
                      </div>
                    )}
                  </ModernCard>
                </div>

                {/* Selected doctor info */}
                {selectedDoctor && (
                  <div className="mt-8">
                    <ModernCard variant="glass" className="bg-blue-50/50">
                      <div className="flex items-center gap-4">
                        <Avatar size={48} src={getSelectedDoctor()?.avatar} />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Bác sĩ: {getSelectedDoctor()?.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {getSelectedDoctor()?.specialization}
                          </p>
                        </div>
                      </div>
                    </ModernCard>
                  </div>
                )}

                <div className="flex justify-between mt-12">
                  <ModernButton
                    variant="outline"
                    onClick={handlePrev}
                    icon={<ArrowRight size={20} className="rotate-180" />}
                  >
                    Quay lại
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    onClick={handleNext}
                    disabled={!selectedDate || !selectedTimeSlot}
                    icon={<ArrowRight size={20} />}
                    iconPosition="right"
                  >
                    Tiếp tục
                  </ModernButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Chọn hồ sơ */}
          {currentStep === 4 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Chọn hồ sơ bệnh nhân
                  </h2>
                  <p className="text-lg text-gray-600">
                    Chọn hồ sơ có sẵn hoặc tạo hồ sơ mới
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Existing profiles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userProfiles.map((profile) => (
                      <motion.div
                        key={profile.id}
                        whileHover={{ y: -3 }}
                      >
                        <ModernCard
                          variant={selectedProfile === profile.id ? "bordered" : "default"}
                          className={`cursor-pointer transition-all duration-300 ${
                            selectedProfile === profile.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                          }`}
                          onClick={() => handleProfileSelect(profile.id)}
                        >
                          <div className="flex items-start gap-4 p-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {profile.fullName.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">
                                  {profile.fullName}
                                </h4>
                                {profile.isDefault && (
                                  <Badge count="Mặc định" style={{ backgroundColor: '#52c41a' }} />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {profile.relationship === 'self' ? 'Bản thân' : 'Người thân'}
                              </p>
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>📞 {profile.phone}</div>
                                <div>📧 {profile.email}</div>
                                <div>🎂 {new Date(profile.birthDate).toLocaleDateString('vi-VN')}</div>
                              </div>
                            </div>
                          </div>
                        </ModernCard>
                      </motion.div>
                    ))}
                  </div>

                  {/* Create new profile */}
                  <motion.div whileHover={{ y: -3 }}>
                    <ModernCard
                      variant={showNewProfileForm ? "bordered" : "default"}
                      className={`cursor-pointer transition-all duration-300 border-dashed ${
                        showNewProfileForm ? 'ring-2 ring-blue-500 shadow-lg' : 'border-gray-300'
                      }`}
                      onClick={() => handleProfileSelect('new')}
                    >
                      <div className="flex items-center justify-center gap-4 p-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white">
                          <AddCircle size={32} variant="Bold" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            Tạo hồ sơ mới
                          </h4>
                          <p className="text-gray-600 text-sm">
                            Tạo hồ sơ mới cho bản thân hoặc người thân
                          </p>
                        </div>
                      </div>
                    </ModernCard>
                  </motion.div>
                </div>

                <div className="flex justify-between mt-12">
                  <ModernButton
                    variant="outline"
                    onClick={handlePrev}
                    icon={<ArrowRight size={20} className="rotate-180" />}
                  >
                    Quay lại
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    onClick={handleNext}
                    disabled={!selectedProfile && !showNewProfileForm}
                    icon={<ArrowRight size={20} />}
                    iconPosition="right"
                  >
                    Tiếp tục
                  </ModernButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 6: Thông tin chi tiết */}
          {currentStep === 5 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Thông tin chi tiết
                  </h2>
                  <p className="text-lg text-gray-600">
                    Điền thông tin bổ sung để hoàn tất đặt lịch
                  </p>
                </div>

                <ModernCard variant="default" size="large">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="space-y-6"
                  >
                    {/* Personal info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Form.Item
                        label="Họ và tên"
                        name="fullName"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                      >
                        <Input size="large" placeholder="Nhập họ và tên" />
                      </Form.Item>

                      <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                      >
                        <Input size="large" placeholder="Nhập số điện thoại" />
                      </Form.Item>

                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: 'Vui lòng nhập email!' },
                          { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                      >
                        <Input size="large" placeholder="Nhập email" />
                      </Form.Item>

                      <Form.Item
                        label="Ngày sinh"
                        name="birthDate"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
                      >
                        <DatePicker size="large" className="w-full" placeholder="Chọn ngày sinh" />
                      </Form.Item>

                      <Form.Item
                        label="Giới tính"
                        name="gender"
                        rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                      >
                        <Select size="large" placeholder="Chọn giới tính">
                          <Option value="male">Nam</Option>
                          <Option value="female">Nữ</Option>
                          <Option value="other">Khác</Option>
                        </Select>
                      </Form.Item>
                    </div>

                    {/* Address for home service */}
                    {typeLocation === 'home' && (
                      <Form.Item
                        label="Địa chỉ chi tiết"
                        name="address"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                      >
                        <Input.TextArea
                          size="large"
                          rows={3}
                          placeholder="Nhập địa chỉ chi tiết (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                        />
                      </Form.Item>
                    )}

                    {/* Description */}
                    <Form.Item
                      label="Mô tả tình trạng sức khỏe (tùy chọn)"
                      name="description"
                    >
                      <TextArea
                        rows={4}
                        placeholder="Mô tả ngắn gọn về tình trạng sức khỏe, triệu chứng hoặc mục đích khám..."
                      />
                    </Form.Item>

                    {/* Notes */}
                    <Form.Item
                      label="Ghi chú thêm (tùy chọn)"
                      name="notes"
                    >
                      <TextArea
                        rows={3}
                        placeholder="Ghi chú thêm về yêu cầu đặc biệt, thời gian liên hệ..."
                      />
                    </Form.Item>

                    {/* Agreement */}
                    <Form.Item
                      name="agreement"
                      valuePropName="checked"
                      rules={[{ required: true, message: 'Vui lòng đồng ý với điều khoản!' }]}
                    >
                      <Checkbox>
                        Tôi đồng ý với{' '}
                        <a href="#" className="text-blue-600 hover:underline">
                          điều khoản sử dụng
                        </a>{' '}
                        và{' '}
                        <a href="#" className="text-blue-600 hover:underline">
                          chính sách bảo mật
                        </a>
                      </Checkbox>
                    </Form.Item>

                    <div className="flex justify-between pt-6">
                      <ModernButton
                        variant="outline"
                        onClick={handlePrev}
                        icon={<ArrowRight size={20} className="rotate-180" />}
                      >
                        Quay lại
                      </ModernButton>
                      <ModernButton
                        variant="primary"
                        onClick={handleNext}
                        icon={<ArrowRight size={20} />}
                        iconPosition="right"
                      >
                        Xem lại thông tin
                      </ModernButton>
                    </div>
                  </Form>
                </ModernCard>
              </div>
            </motion.div>
          )}

          {/* Step 7: Xác nhận */}
          {currentStep === 6 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Xác nhận đặt lịch
                  </h2>
                  <p className="text-lg text-gray-600">
                    Vui lòng kiểm tra lại thông tin trước khi xác nhận
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Booking summary */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Service info */}
                    <ModernCard variant="default" size="large">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Heart size={24} className="text-blue-500" />
                        Thông tin dịch vụ
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dịch vụ:</span>
                          <span className="font-medium">{getSelectedService()?.name}</span>
                        </div>
                        {selectedPackage && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gói:</span>
                            <span className="font-medium">{getSelectedPackage()?.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hình thức:</span>
                          <span className="font-medium">
                            {typeLocation === 'online' ? 'Tư vấn Online' : 
                             typeLocation === 'clinic' ? 'Tại phòng khám' : 'Tại nhà'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Thời gian:</span>
                          <span className="font-medium">
                            {selectedDate && new Date(selectedDate).toLocaleDateString('vi-VN')} - {selectedTimeSlot}
                          </span>
                        </div>
                        {selectedDoctor ? (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bác sĩ:</span>
                            <span className="font-medium">{getSelectedDoctor()?.name}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bác sĩ:</span>
                            <span className="font-medium text-blue-600">Hệ thống sẽ chọn</span>
                          </div>
                        )}
                      </div>
                    </ModernCard>

                    {/* Patient info */}
                    <ModernCard variant="default" size="large">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User size={24} className="text-green-500" />
                        Thông tin bệnh nhân
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Họ tên:</span>
                          <span className="font-medium">{form.getFieldValue('fullName')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Điện thoại:</span>
                          <span className="font-medium">{form.getFieldValue('phone')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{form.getFieldValue('email')}</span>
                        </div>
                        {typeLocation === 'home' && form.getFieldValue('address') && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Địa chỉ:</span>
                            <span className="font-medium">{form.getFieldValue('address')}</span>
                          </div>
                        )}
                      </div>
                    </ModernCard>
                  </div>

                  {/* Price summary */}
                  <div>
                    <ModernCard variant="bordered" size="large" className="sticky top-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Tổng chi phí
                      </h3>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dịch vụ:</span>
                          <span className="font-medium">{formatPrice(getCurrentPrice())}</span>
                        </div>
                        {typeLocation === 'home' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phí di chuyển:</span>
                            <span className="font-medium">Miễn phí</span>
                          </div>
                        )}
                        <div className="border-t pt-3">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Tổng cộng:</span>
                            <span className="text-blue-600">{formatPrice(getCurrentPrice())}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <ModernButton
                          variant="primary"
                          fullWidth
                          size="large"
                          loading={loading}
                          onClick={() => form.submit()}
                          icon={<TickCircle size={20} />}
                          iconPosition="right"
                        >
                          Xác nhận đặt lịch
                        </ModernButton>
                        
                        <ModernButton
                          variant="outline"
                          fullWidth
                          onClick={handlePrev}
                          icon={<ArrowRight size={20} className="rotate-180" />}
                        >
                          Quay lại chỉnh sửa
                        </ModernButton>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-700">
                          <div className="font-medium mb-2">Lưu ý:</div>
                          <ul className="space-y-1 text-xs">
                            <li>• Chúng tôi sẽ gọi xác nhận trong 30 phút</li>
                            <li>• Có thể hủy/đổi lịch trước 24h</li>
                            <li>• Thanh toán sau khi hoàn thành dịch vụ</li>
                          </ul>
                        </div>
                      </div>
                    </ModernCard>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Booking; 