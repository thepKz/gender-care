import { Button, Calendar, Form, Input, message, Modal, notification, Select, Alert } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// APIs
import { appointmentApi } from '../../api/endpoints';
import { doctorApi } from '../../api/endpoints/doctorApi';
import doctorScheduleApi from '../../api/endpoints/doctorSchedule';
import packagePurchaseApi from '../../api/endpoints/packagePurchaseApi';
import servicePackageApi from '../../api/endpoints/servicePackageApi';
import servicesApi from '../../api/endpoints/services';
import userProfileApiInstance from '../../api/endpoints/userProfileApi';

// Hooks
import useAuth from '../../hooks/useAuth';

// Utils

// const { TextArea } = Input; // Commented out as not used
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
  id: string; // userId
  doctorId: string; // id của bảng Doctor
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  reviewCount: number;
  avatar: string;
  isAvailable: boolean;
  bio?: string;
  availableSlots?: any[];
  totalAvailableSlots?: number;
}

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
  availableDoctors?: number;
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

interface ServicePackage {
  _id: string;
  name: string;
  description: string;
  price: number;
  priceBeforeDiscount: number;
  services: Array<{
    serviceId: string;
    serviceName: string;
    quantity: number;
  }>;
  durationInDays: number;
  maxUsages: number;
  isActive: boolean;
}

interface PurchasedPackage {
  _id: string;
  servicePackage: {
    _id: string;
    name: string;
    description: string;
    services: Array<{
      serviceId: string;
      serviceName: string;
      quantity: number;
    }>;
  };
  usedServices: Array<{
    serviceId: string;
    usedCount: number;
    usedQuantity?: number; // Backend compatibility
    maxQuantity?: number;  // Backend compatibility
  }>;
  totalAmount: number;
  status: 'active' | 'expired' | 'used_up' | 'pending_payment';
  expiresAt: string;
}

const BookingPageNew: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [form] = Form.useForm();

  // Form states
  const [selectedService, setSelectedService] = useState('');
  const [selectedServicePackage, setSelectedServicePackage] = useState('');
  const [selectedPurchasedPackage, setSelectedPurchasedPackage] = useState('');
  const [selectedServiceFromPackage, setSelectedServiceFromPackage] = useState('');
  const [bookingType, setBookingType] = useState<'service' | 'package' | 'purchased_package'>('service');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [typeLocation, setTypeLocation] = useState<'Online' | 'clinic' | 'home'>('clinic');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [appointmentType, setAppointmentType] = useState<'consultation' | 'test' | 'treatment' | 'other'>('consultation');

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [purchasedPackages, setPurchasedPackages] = useState<PurchasedPackage[]>([]);
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

  const [showPackageWarning, setShowPackageWarning] = useState(false);

  // Thêm hàm refetch purchased packages
  const refetchPurchasedPackages = useCallback(async () => {
    try {
      const response = await packagePurchaseApi.getUserPurchasedPackages();
      if (response.success && response.data?.packagePurchases) {
        setPurchasedPackages(response.data.packagePurchases);
      }
    } catch (err) {
      // Không cần báo lỗi UI
    }
  }, []);

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

  // Fetch service packages
  const fetchServicePackages = useCallback(async () => {
    try {
      setNetworkError(false);
      console.log('🔄 [ServicePackages] Starting fetch with services count:', services.length);
      
      const response = await servicePackageApi.getServicePackages({ 
        isActive: true,
        limit: 100 
      });
      
      console.log('📦 [ServicePackages] Raw API response:', response);
      
      // Check response structure - API returns { success: boolean, data: { packages: ServicePackage[] } }
      if (!response.data || !response.data.packages) {
        console.error('❌ [ServicePackages] Invalid API response structure:', response);
        throw new Error('Invalid API response structure: missing data.packages');
      }
      
      const packagesData = response.data.packages;
      console.log('📦 [ServicePackages] Packages data:', packagesData);
      
      const mappedPackages: ServicePackage[] = packagesData.map((pkg: any) => {
        console.log('🔍 [PackageProcessing] Processing package:', pkg.name, 'with services:', pkg.services);
        
        // Map services and populate service names from services state
        const packageServices = (pkg.services || []).map((service: any) => {
          console.log('🔍 [ServiceMapping] Processing service:', service);
          
          // ServiceId có thể là object hoặc string
          let serviceName = 'Dịch vụ không xác định';
          let serviceId = '';
          
          if (service.serviceId) {
            if (typeof service.serviceId === 'object' && service.serviceId.serviceName) {
              // ServiceId là object với serviceName
              serviceName = service.serviceId.serviceName;
              serviceId = service.serviceId._id || service.serviceId.id;
              console.log('✅ [ServiceMapping] Found service object:', { serviceId, serviceName });
            } else if (typeof service.serviceId === 'string') {
              // ServiceId là string, tìm trong services state
              serviceId = service.serviceId;
              const foundService = services.find(s => s.id === serviceId);
              serviceName = foundService?.serviceName || 'Dịch vụ không xác định';
              console.log('✅ [ServiceMapping] Found service by ID:', { serviceId, serviceName, foundService: !!foundService });
            }
          } else {
            console.warn('⚠️ [ServiceMapping] No serviceId found in service:', service);
          }
          
          console.log('✅ [ServiceMapping] Final mapped:', { serviceId, serviceName, quantity: service.quantity });
          
          return {
            serviceId: serviceId,
            serviceName: serviceName,
            quantity: service.quantity || 1
          };
        });

        console.log('📦 [PackageMapping] Package services for', pkg.name, ':', packageServices);

        return {
          _id: pkg._id || pkg.id,
          name: pkg.name || pkg.packageName,
          description: pkg.description || '',
          price: pkg.price || 0,
          priceBeforeDiscount: pkg.priceBeforeDiscount || pkg.price || 0,
          services: packageServices,
          durationInDays: pkg.durationInDays || 30,
          maxUsages: pkg.maxUsages || 1,
          isActive: pkg.isActive !== false,
        };
      });

      console.log('✅ [ServicePackages] Final mapped packages:', mappedPackages);
      setServicePackages(mappedPackages);
    } catch (error) {
      console.error('Error fetching service packages:', error);
      setNetworkError(true);
      setServicePackages([]);
    }
  }, [services]);

  // 🆕 Fetch purchased packages
  const fetchPurchasedPackages = useCallback(async () => {
    if (!isAuthenticated || !user?._id) return;
    
    try {
      setNetworkError(false);
      const response = await packagePurchaseApi.getUserPurchasedPackages({ 
        isActive: true 
      });
      
      if (response.success && response.data?.packagePurchases) {
        const mappedPurchases: PurchasedPackage[] = response.data.packagePurchases
          .filter((purchase: any) => {
            // Chỉ lấy packages có status active và chưa sử dụng hết
            if (purchase.status !== 'active') return false;
            
            // Kiểm tra xem có service nào còn có thể sử dụng không
            const hasAvailableServices = purchase.usedServices?.some((usedService: any) => {
              const usedQuantity = usedService.usedQuantity || usedService.usedCount || 0;
              const maxQuantity = usedService.maxQuantity || 1;
              return usedQuantity < maxQuantity;
            });
            
            return hasAvailableServices;
          })
          .map((purchase: any) => ({
            _id: purchase._id,
            servicePackage: purchase.servicePackage,
            usedServices: purchase.usedServices || [],
            totalAmount: purchase.totalAmount,
            status: purchase.status,
            expiresAt: purchase.expiresAt,
          }));

        setPurchasedPackages(mappedPurchases);
      } else {
        setPurchasedPackages([]);
      }
    } catch (error) {
      console.error('Error fetching purchased packages:', error);
      setNetworkError(true);
      setPurchasedPackages([]);
    }
  }, [isAuthenticated, user?._id]);

  // Fetch available doctors based on selected date and time
  const fetchAvailableDoctors = useCallback(async (date?: Dayjs, timeSlot?: string) => {
    if (!date || !timeSlot) {
      // If no date/time selected, fetch all doctors
      try {
        setNetworkError(false);
        const apiDoctors = await doctorApi.getAll();
        
        const mappedDoctors: Doctor[] = apiDoctors
          .filter((doctor: any) => {
            // Filter out doctors without proper user info or inactive
            return doctor.userId && 
                   doctor.userId.fullName && 
                   doctor.userId.isActive !== false;
          })
          .map((doctor: any) => ({
            id: doctor.userId._id, // Use userId as primary ID
            doctorId: doctor._id, // Keep doctorId for reference
            name: doctor.userId.fullName,
            specialization: doctor.specialization || 'Chuyên khoa tổng quát',
            experience: doctor.experience || 0,
            rating: doctor.rating || 4.5,
            reviewCount: 0,
            avatar: doctor.userId.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
            isAvailable: doctor.userId.isActive !== false,
            bio: doctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm'
          }));
        
        console.log('🔍 [Doctor Debug] All available doctors:', mappedDoctors.length);
        setDoctors(mappedDoctors);
        return;
      } catch (error) {
        console.error('Error fetching all doctors:', error);
        setNetworkError(true);
        return;
      }
    }

    // Fetch doctors available for specific date/time
    try {
      setNetworkError(false);
      const dateStr = date.format('YYYY-MM-DD');
      console.log('🔍 [Doctor Debug] Fetching available doctors for date:', dateStr, 'timeSlot:', timeSlot);

      const response = await doctorScheduleApi.getAvailableDoctors(dateStr, timeSlot);
      const availableDoctorsData = Array.isArray(response) ? response : [];
      
      console.log('🔍 [Doctor Debug] Raw response:', availableDoctorsData.length, 'doctors');

      // Use improved backend response format
      const mappedDoctors: Doctor[] = availableDoctorsData
        .filter((doctorSchedule: any) => {
          // Only include doctors with valid info and available slots for the specific time
          const hasValidDoctor = doctorSchedule.doctorInfo && 
                                doctorSchedule.doctorInfo.fullName && 
                                doctorSchedule.doctorInfo.isActive !== false;
          const hasSlotForTime = doctorSchedule.availableSlots && 
                               doctorSchedule.availableSlots.some((slot: any) => 
                                 slot.slotTime === timeSlot && slot.status === 'Free'
                               );
          
          return hasValidDoctor && hasSlotForTime;
        })
        .map((doctorSchedule: any) => ({
          id: doctorSchedule.userId || doctorSchedule.doctorId, // Prefer userId
          doctorId: doctorSchedule.doctorId, // Keep doctorId for reference
          name: doctorSchedule.doctorInfo.fullName,
          specialization: doctorSchedule.doctorInfo.specialization || 'Chuyên khoa tổng quát',
          experience: doctorSchedule.doctorInfo.experience || 0,
          rating: doctorSchedule.doctorInfo.rating || 4.5,
          reviewCount: 0,
          avatar: doctorSchedule.doctorInfo.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
          isAvailable: true, // These doctors are confirmed available for the selected time
          bio: 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm',
          availableSlots: doctorSchedule.availableSlots,
          totalAvailableSlots: doctorSchedule.totalAvailableSlots
        }));

      console.log('🔍 [Doctor Debug] Available doctors for', dateStr, timeSlot, ':', mappedDoctors.length);
      setDoctors(mappedDoctors);
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      setNetworkError(true);
      setDoctors([]);
    }
  }, []);

  // Authentication check - redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      notification.warning({
        message: 'Yêu cầu đăng nhập',
        description: 'Bạn cần đăng nhập để đặt lịch hẹn. Đang chuyển hướng...',
        placement: 'topRight',
        duration: 3
      });
      
      setTimeout(() => {
        navigate('/login?returnUrl=/booking');
      }, 1500);
    }
  }, [isAuthenticated, navigate]);

  // Show loading state while redirecting if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Đang chuyển hướng đến trang đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  // Fetch user profiles
  const fetchUserProfiles = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Try the new API method first, fallback to old method if needed
      let profiles;
      try {
        profiles = await userProfileApiInstance.getMyProfiles();
      } catch (e) {
        // Fallback to alternative method name if exists
        profiles = await userProfileApiInstance.getMyProfiles();
      }
      setUserProfiles(profiles || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setUserProfiles([]);
    }
  }, [isAuthenticated, user]);

  // Fetch time slots based on selected date with availability check
  const fetchTimeSlots = useCallback(async (date: Dayjs) => {
    if (!date) return;
    
    setLoadingTimeSlots(true);
    try {
      const dateStr = date.format('YYYY-MM-DD');
      const response = await doctorScheduleApi.getAvailableDoctors(dateStr);
      const doctorsData = Array.isArray(response) ? response : [];
      
      // Count available doctors per time slot
      const slotAvailability: { [key: string]: number } = {};
      
      doctorsData.forEach((doctor: any) => {
        if (doctor.availableSlots && Array.isArray(doctor.availableSlots)) {
          doctor.availableSlots.forEach((slot: any) => {
            if (slot.status === 'Free') {
              slotAvailability[slot.slotTime] = (slotAvailability[slot.slotTime] || 0) + 1;
            }
          });
        }
      });
      
      // Create time slots with availability count
      const slotsArray: TimeSlot[] = Object.entries(slotAvailability)
        .filter(([time, count]) => count > 0) // Only show slots with available doctors
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, count]) => ({
        id: time,
        time: time,
          isAvailable: count > 0,
          availableDoctors: count
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
      // Fetch services first, then packages will auto-fetch via dependency
      await fetchServices();
      
      // Fetch other data in parallel
      await Promise.all([
        fetchPurchasedPackages(), // 🆕 Fetch purchased packages
        fetchAvailableDoctors(), // Fetch all doctors initially
        fetchUserProfiles(),
        fetchAvailableDates()
      ]);
      
      // Check if user just came back from payment
      const pendingBooking = localStorage.getItem('pendingBooking');
      if (pendingBooking) {
        try {
          const booking = JSON.parse(pendingBooking);
          console.log('🔄 Refreshing availability after payment for:', booking);
          
          // Refresh available dates
          await fetchAvailableDates();
          
          // Clear the pending booking flag
          localStorage.removeItem('pendingBooking');
        } catch (error) {
          console.error('Error parsing pending booking:', error);
          localStorage.removeItem('pendingBooking');
        }
      }
    };
    
    initializeData();
  }, []); // Empty dependency array to run only once

  // 🆕 Separate useEffect to fetch service packages when services are ready
  useEffect(() => {
    if (services.length > 0) {
      console.log('🔄 [ServicePackages] Services loaded, fetching service packages...');
      fetchServicePackages();
    }
  }, [services, fetchServicePackages]);

  // 🆕 Add debugging for servicePackages state
  useEffect(() => {
    console.log('🔍 [Debug] ServicePackages state updated:', {
      count: servicePackages.length,
      packages: servicePackages.map(p => ({ id: p._id, name: p.name }))
    });
  }, [servicePackages]);

  // Handle date selection
  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
    setSelectedDoctor('');
    fetchTimeSlots(date);
    // Reset doctors when date changes
    setDoctors([]);
  };

  // Handle time slot selection with refresh logic
  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setSelectedDoctor('');
    
    // Fetch available doctors for selected date and time
    if (selectedDate) {
      fetchAvailableDoctors(selectedDate, timeSlot);
    }
  };

  // Handle service change - refresh everything
  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    setSelectedServicePackage(''); // Clear package selection
    
    // Update available locations based on service availableAt
    const service = services.find(s => s.id === serviceId);
    if (service) {
      // Map backend availableAt values to frontend typeLocation enum
      const locations: ('Online' | 'clinic' | 'home')[] = service.availableAt.map(location => {
        switch (location) {
          case 'Online': return 'Online';
          case 'Center': return 'clinic';
          case 'Athome': return 'home';
          default: return 'clinic';
        }
      }).filter((loc, index, arr) => arr.indexOf(loc) === index); // Remove duplicates
      
      setAvailableLocations(locations);
      
      // Reset location if current selection is not available
      if (!locations.includes(typeLocation)) {
        setTypeLocation(locations[0]);
      }
    }
    
    // Reset form state
    setSelectedDate(null);
    setSelectedTimeSlot('');
    setSelectedDoctor('');
    setTimeSlots([]);
    setDoctors([]);
  };

  // Handle service package change
  const handleServicePackageChange = (packageId: string) => {
    // Kiểm tra purchasedPackages
    const hasActive = purchasedPackages.some(
      (pkg) => pkg.servicePackage._id === packageId && pkg.status === 'active'
    );
    if (hasActive) {
      setShowPackageWarning(true);
    } else {
      setShowPackageWarning(false);
    }
    setSelectedServicePackage(packageId);
  };

  // Handle booking type change
  const handleBookingTypeChange = (type: 'service' | 'package' | 'purchased_package') => {
    setBookingType(type);
    setSelectedService('');
    setSelectedServicePackage('');
    setSelectedPurchasedPackage('');
    setSelectedServiceFromPackage('');
    setSelectedDate(null);
    setSelectedTimeSlot('');
    setSelectedDoctor('');
    setTimeSlots([]);
    setDoctors([]);
  };

  // 🆕 Handle purchased package change
  const handlePurchasedPackageChange = (purchaseId: string) => {
    setSelectedPurchasedPackage(purchaseId);
    setSelectedServiceFromPackage(''); // Reset service selection
    setSelectedService(''); // Clear service selection
    setSelectedServicePackage(''); // Clear package selection
    
    // Set default location for packages (typically clinic)
    setAvailableLocations(['clinic']);
    setTypeLocation('clinic');
    
    // Reset form state
    setSelectedDate(null);
    setSelectedTimeSlot('');
    setSelectedDoctor('');
    setTimeSlots([]);
    setDoctors([]);
  };

  // 🆕 Handle service from package change
  const handleServiceFromPackageChange = (serviceId: string) => {
    // Check if the service is already selected, if so, deselect it
    if (selectedServiceFromPackage === serviceId) {
      setSelectedServiceFromPackage('');
    } else {
      // Only allow single selection - clear previous and set new
      setSelectedServiceFromPackage(serviceId);
    }
    
    // Reset form state for new service selection
    setSelectedDate(null);
    setSelectedTimeSlot('');
    setSelectedDoctor('');
    setTimeSlots([]);
    setDoctors([]);
    
    console.log('🔄 Service selection changed:', {
      previousSelection: selectedServiceFromPackage,
      newSelection: selectedServiceFromPackage === serviceId ? '' : serviceId
    });
  };

  // Handle date change - refresh time slots and doctors
  const handleDateChange = (date: Dayjs) => {
    handleDateSelect(date);
  };

  // Handle profile creation
  const handleCreateProfile = async (values: any) => {
    try {
      const profileData = {
        fullName: values.fullName,
        phone: values.phone,
        birthDate: dayjs(values.birthDate).format('YYYY-MM-DD'),
        gender: values.gender,
        relationship: values.relationship || 'self',
        address: values.address || '',
        isDefault: userProfiles.length === 0
      };

      console.log('Creating profile with data:', profileData);
      
      // Try the correct API method
      const newProfile = await userProfileApiInstance.createProfile(profileData);
      
      console.log('Profile created successfully:', newProfile);
      
      if (newProfile) {
        // Wait a bit then refresh profiles list
        setTimeout(async () => {
        await fetchUserProfiles();
          
          // Set the new profile as selected
          const profileId = (newProfile as any).id || (newProfile as any)._id;
          if (profileId) {
            setSelectedProfile(profileId);
          }
          
        setShowCreateProfileModal(false);
        createProfileForm.resetFields();
        }, 800);
        
        notification.success({
          message: 'Thành công',
          description: 'Tạo hồ sơ thành công!',
          placement: 'topRight'
        });
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      notification.error({
        message: 'Lỗi tạo hồ sơ',
        description: 'Không thể tạo hồ sơ. Vui lòng thử lại!',
        placement: 'topRight'
      });
    }
  };

  // Debug: Log để hiển thị service được chọn
  const logSelectedServiceInfo = () => {
    const service = getSelectedService();
    if (service) {
      console.log('📋 [Debug] Selected Service:', {
        id: service.id,
        serviceName: service.serviceName,
        serviceType: service.serviceType,
        price: service.price,
        availableAt: service.availableAt
      });
    }
  };

  // Helper function to map service types to valid appointment types
  const mapToValidAppointmentType = (serviceType: string | undefined): 'consultation' | 'test' | 'treatment' | 'other' => {
    if (!serviceType) return 'consultation';
    
    const type = serviceType.toLowerCase();
    
    // Map known service types to appointment types
    if (type.includes('consultation') || type.includes('tư vấn')) return 'consultation';
    if (type.includes('test') || type.includes('xét nghiệm') || type.includes('analysis')) return 'test';
    if (type.includes('treatment') || type.includes('điều trị') || type.includes('therapy')) return 'treatment';
    
    // Default to consultation for unknown types
    return 'consultation';
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      // Log thông tin service đang được chọn
      logSelectedServiceInfo();
      
      // Bắt đầu validation theo thứ tự các bước
      // Bước 1: Dịch vụ
      if (!(selectedService || selectedServicePackage || (selectedPurchasedPackage && selectedServiceFromPackage))) {
        message.error('Vui lòng chọn dịch vụ hoặc gói dịch vụ');
        return;
      }

      // Bước 2: Ngày và giờ
      if (!selectedDate || !selectedTimeSlot) {
        message.error('Vui lòng chọn ngày và giờ khám');
        return;
      }

      // Bước 3: Hồ sơ bệnh nhân - chỉ kiểm tra khi đã qua 2 bước trước
      if (!selectedProfile) {
        // message.error('Vui lòng chọn hồ sơ bệnh nhân');
        return;
      }

      // Validate description length
      if (values.description && values.description.length > 200) {
        message.error('Mô tả không được vượt quá 200 ký tự');
        return;
      }

      // 🎯 FIX: Determine bookingType based on selection
      let backendBookingType: 'service_only' | 'new_package' | 'purchased_package';
      let packagePurchaseId: string | undefined;

      if (bookingType === 'service' && selectedService) {
        backendBookingType = 'service_only';
      } else if (bookingType === 'package' && selectedServicePackage) {
        backendBookingType = 'new_package';
      } else if (bookingType === 'purchased_package' && selectedPurchasedPackage && selectedServiceFromPackage) {
        backendBookingType = 'purchased_package';
        packagePurchaseId = selectedPurchasedPackage;
      } else {
        message.error('Vui lòng chọn dịch vụ hoặc gói dịch vụ');
        return;
      }

      console.log('🔍 [Booking Debug] Booking type determined:', {
        backendBookingType,
        bookingType,
        selectedService,
        selectedServicePackage,
        selectedPurchasedPackage,
        selectedServiceFromPackage,
        packagePurchaseId
      });

      // Auto-assign doctor if not selected
      let assignedDoctorId = selectedDoctor;
      let assignedDoctorName = '';

      if (!assignedDoctorId) {
        // Try to find available doctor from current context
        const availableDoctor = doctors.find(doctor => doctor.isAvailable);
        if (availableDoctor) {
          assignedDoctorId = availableDoctor.id;
          assignedDoctorName = availableDoctor.name;
          console.log('🤖 Auto-assigned doctor from current context:', availableDoctor.name, 'ID:', availableDoctor.id);
        } else {
          // Fetch available doctors for the selected time slot
          try {
            const dateStr = selectedDate.format('YYYY-MM-DD');
            const response = await doctorScheduleApi.getAvailableDoctors(dateStr);
            const doctorsData = Array.isArray(response) ? response : [];

            // Find doctors available for the selected time slot
            const availableDoctorSchedule = doctorsData.find((doctorSchedule: any) => {
              if (!doctorSchedule.availableSlots) return false;
              return doctorSchedule.availableSlots.some((slot: any) =>
                slot.slotTime === selectedTimeSlot && slot.status === 'Free'
              );
            });

            if (availableDoctorSchedule) {
              assignedDoctorId = availableDoctorSchedule.doctorId;
              assignedDoctorName = availableDoctorSchedule.doctorInfo.fullName;
              console.log('🤖 Auto-assigned doctor from API:', assignedDoctorName, 'ID:', assignedDoctorId);
            }
          } catch (error) {
            console.error('Error fetching available doctors for auto-assignment:', error);
          }
        }
      }

      // Prepare appointment data
      const appointmentData: any = {
        profileId: selectedProfile,
        appointmentDate: selectedDate.format('YYYY-MM-DD'),
        appointmentTime: selectedTimeSlot,
        // Ánh xạ serviceType sang appointmentType hợp lệ cho API
        appointmentType: appointmentType,
        typeLocation,
        description: values.description || '',
        notes: values.notes || '',
        bookingType: backendBookingType,
        packagePurchaseId
      };

      // Add service/package specific data
      if (backendBookingType === 'service_only' && selectedService) {
        appointmentData.serviceId = selectedService;
      } else if (backendBookingType === 'new_package' && selectedServicePackage) {
        appointmentData.packageId = selectedServicePackage;
      } else if (backendBookingType === 'purchased_package' && selectedServiceFromPackage) {
        appointmentData.serviceId = selectedServiceFromPackage;
      }

      // Add doctor and address if available
      if (assignedDoctorId) {
        appointmentData.doctorId = assignedDoctorId;
        console.log('👨‍⚕️ [Booking Debug] Doctor assigned to appointment:', {
          doctorId: assignedDoctorId,
          doctorName: assignedDoctorName
        });
      } else {
        console.log('⚠️ [Booking Debug] No doctor assigned to appointment');
      }

      if (typeLocation === 'home' && values.address) {
        appointmentData.address = values.address;
      }

      console.log('🔍 [Booking Debug] Final appointment data:', JSON.stringify(appointmentData, null, 2));

      try {
        setIsSubmitting(true);
        // Directly call the creation API
        const response = await appointmentApi.createAppointment(appointmentData);

        console.log('✅ [Booking Success] API Response:', response);

        if (response.success && response.data) {
            // Case 1: Payment is required - redirect to payment URL
            if (response.data.paymentUrl) {
                console.log('🚀 [Redirecting] Found payment URL. Preparing to redirect...');
                message.success('Đặt lịch thành công! Đang chuyển hướng đến trang thanh toán...', 2);
                
                // Refetch purchased packages trước khi redirect
                await refetchPurchasedPackages();
                refetchSlotsAfterBooking();
                
                // Use setTimeout to ensure the redirect happens in a new execution context
                setTimeout(() => {
                    console.log(`🚀 [Redirecting] Executing redirect to: ${response.data.paymentUrl}`);
                    window.location.href = response.data.paymentUrl;
                }, 500); // 0.5-second delay to allow messages to show

            } 
            // Case 2: No payment required (Free service or completed)
            else {
                // Refetch purchased packages trước khi reset/redirect
                await refetchPurchasedPackages();
                refetchSlotsAfterBooking();
                Modal.success({
                    title: 'Đặt lịch thành công!',
                    content: 'Lịch hẹn của bạn đã được xác nhận. Vui lòng kiểm tra email hoặc trang Lịch sử đặt lịch.',
                    onOk: () => {
                        navigate('/booking-history');
                    },
                });
            }
        } else {
            // Handle API errors that are returned with success: false
            message.error(response.message || 'Có lỗi xảy ra khi đặt lịch.');
        }
      } catch (error: any) {
        console.error('❌ [Booking Error]', error);
        const errorMessage = error.response?.data?.message || 'Lỗi hệ thống, vui lòng thử lại sau.';
        message.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error handling form submission:', error);
      message.error('Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại sau.');
    }
  };

  // Sau khi đặt lịch thành công hoặc bị hủy, refetch lại slot
  const refetchSlotsAfterBooking = () => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  };

  // Helper functions
  const getSelectedService = () => services.find(s => s.id === selectedService);
  const getSelectedServicePackage = () => servicePackages.find(p => p._id === selectedServicePackage);
  const getSelectedPurchasedPackage = () => purchasedPackages.find(p => p._id === selectedPurchasedPackage);
  
  // 🆕 Get available services from purchased package with remaining quantities
  const getAvailableServicesFromPackage = () => {
    const purchasedPackage = getSelectedPurchasedPackage();
    if (!purchasedPackage || !purchasedPackage.servicePackage) {
      console.log('❌ No purchased package or servicePackage:', purchasedPackage);
      return [];
    }
    
    console.log('🔍 Processing package services:', purchasedPackage.servicePackage.services);
    console.log('🔍 Used services:', purchasedPackage.usedServices);
    
    let availableServices = [];
    
    // Primary method: Use servicePackage.services if available
    if (Array.isArray(purchasedPackage.servicePackage.services) && purchasedPackage.servicePackage.services.length > 0) {
      availableServices = purchasedPackage.servicePackage.services.map(service => {
        // Tìm thông tin sử dụng của service này
        const usedService = purchasedPackage.usedServices.find(used => 
          used.serviceId === service.serviceId || used.serviceId === (service.serviceId as any)?._id
        );
        
        const usedCount = usedService ? usedService.usedCount : 0;
        const maxQuantity = service.quantity || 1;
        const remainingQuantity = maxQuantity - usedCount;
        
        console.log(`🔍 Service ${service.serviceName}: used=${usedCount}, max=${maxQuantity}, remaining=${remainingQuantity}`);
        
        return {
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          quantity: maxQuantity,
          usedCount,
          remainingQuantity,
          canUse: remainingQuantity > 0,
          price: 0, // Default price for package services
          description: 'Dịch vụ từ gói đã mua'
        };
      });
    } 
    // Fallback method: Reconstruct từ usedServices
    else if (Array.isArray(purchasedPackage.usedServices) && purchasedPackage.usedServices.length > 0) {
      console.log('🔄 Using fallback method: reconstructing from usedServices');
      
      availableServices = purchasedPackage.usedServices.map(usedService => {
        const usedCount = usedService.usedCount || usedService.usedQuantity || 0;
        const maxQuantity = usedService.maxQuantity || 1;
        const remainingQuantity = maxQuantity - usedCount;
        
        // Try to find service name from existing services list
        const existingService = services.find(s => s.id === usedService.serviceId);
        const serviceName = existingService?.serviceName || `Dịch vụ ${usedService.serviceId.slice(-6)}`;
        const price = existingService?.price || 0;
        
        console.log(`🔄 Fallback service ${serviceName}: used=${usedCount}, max=${maxQuantity}, remaining=${remainingQuantity}`);
        
        return {
          serviceId: usedService.serviceId,
          serviceName: serviceName,
          quantity: maxQuantity,
          usedCount,
          remainingQuantity,
          canUse: remainingQuantity > 0,
          price: price,
          description: existingService?.description || 'Dịch vụ từ gói đã mua'
        };
      });
    }
    
    // Filter only services that can still be used
    const filteredServices = availableServices.filter(service => service.canUse);
    
    console.log('✅ Available services:', filteredServices);
    return filteredServices;
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getCurrentPrice = () => {
    if (bookingType === 'service' && selectedService) {
    const service = getSelectedService();
    return service?.price || 0;
    } else if (bookingType === 'package' && selectedServicePackage) {
      const servicePackage = getSelectedServicePackage();
      return servicePackage?.price || 0;
    } else if (bookingType === 'purchased_package') {
      // Purchased package services are free (already paid)
      return 0;
    }
    return 0;
  };

  const getDiscountPercentage = () => {
    if (bookingType === 'package' && selectedServicePackage) {
      const servicePackage = getSelectedServicePackage();
      if (servicePackage && servicePackage.priceBeforeDiscount > servicePackage.price) {
        return Math.round(((servicePackage.priceBeforeDiscount - servicePackage.price) / servicePackage.priceBeforeDiscount) * 100);
      }
    }
    return 0;
  };



  // Get location label for display
  const getLocationLabel = (location: string) => {
    switch (location) {
      case 'Online': return 'Tư vấn online';
      case 'online': return 'Tư vấn online';
      case 'clinic': return 'Tại phòng khám';
      case 'home': return 'Tại nhà';
      default: return location;
    }
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
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');
    return !availableDates.includes(dateStr) || date.isBefore(tomorrow, 'day');
  }, [availableDates]);

  // Helper function to get actual service count for a package
  const getPackageServiceCount = (purchase: PurchasedPackage) => {
    // Primary method: Use servicePackage.services if available
    if (Array.isArray(purchase.servicePackage.services) && purchase.servicePackage.services.length > 0) {
      return purchase.servicePackage.services.length;
    }
    // Fallback method: Count from usedServices
    else if (Array.isArray(purchase.usedServices) && purchase.usedServices.length > 0) {
      return purchase.usedServices.length;
    }
    return 0;
  };

  // Auto-set appointmentType when bookingType changes
  useEffect(() => {
    if (bookingType === 'package') {
      setAppointmentType('other');
    } else if (selectedService && services.length > 0) {
      const service = services.find(s => s.id === selectedService);
      setAppointmentType(mapToValidAppointmentType(service?.serviceType));
    } else {
      setAppointmentType('consultation');
    }
  }, [bookingType, selectedService, services]);

  // Auto-select tab và gói dịch vụ khi điều hướng từ modal chi tiết gói
  React.useEffect(() => {
    if (location.state?.bookingType === 'package') {
      setBookingType('package');
      if (location.state.selectedPackage?._id) {
        setSelectedServicePackage(location.state.selectedPackage._id);
      }
    }
    if (location.state?.bookingType === 'service') {
      setBookingType('service');
      if (location.state.selectedService?.id || location.state.selectedService?._id) {
        setSelectedService(location.state.selectedService.id || location.state.selectedService._id);
      }
    }
  }, [location.state]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '20px 0'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 20px'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '30px'
        }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#1f2937', 
            margin: '0 0 8px 0'
          }}>Đặt lịch khám</h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '16px',
            margin: '0'
          }}>Chọn dịch vụ, thời gian và thông tin bệnh nhân</p>
        </div>

        {/* Main Form - Responsive Single Column */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: 'clamp(16px, 4vw, 32px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb'
        }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            {/* Step 1: Service/Package Selection */}
            <div style={{
              marginBottom: 'clamp(16px, 3vw, 32px)',
              padding: 'clamp(12px, 3vw, 24px)',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1f2937', 
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ 
                  background: '#3b82f6', 
                  color: 'white', 
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>1</span>
                Chọn dịch vụ hoặc gói dịch vụ
              </h3>

              {/* Booking Type Tabs - 3 tabs: dịch vụ đơn lẻ, gói dịch vụ mới, gói đã mua */}
              <div style={{ 
                display: 'flex', 
                marginBottom: '20px',
                gap: '4px',
                backgroundColor: '#f1f5f9',
                padding: '4px',
                borderRadius: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => handleBookingTypeChange('service')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: bookingType === 'service' ? 'white' : 'transparent',
                    color: bookingType === 'service' ? '#3b82f6' : '#64748b',
                    boxShadow: bookingType === 'service' ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none'
                  }}
                >
                  Dịch vụ đơn lẻ
                </button>
                <button
                  type="button"
                  onClick={() => handleBookingTypeChange('package')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: bookingType === 'package' ? 'white' : 'transparent',
                    color: bookingType === 'package' ? '#7c3aed' : '#64748b',
                    boxShadow: bookingType === 'package' ? '0 2px 8px rgba(124, 58, 237, 0.15)' : 'none'
                  }}
                >
                  Gói dịch vụ
                </button>
                {/* Tab "Gói đã mua" cho user đã login */}
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => handleBookingTypeChange('purchased_package')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: bookingType === 'purchased_package' ? 'white' : 'transparent',
                      color: bookingType === 'purchased_package' ? '#059669' : '#64748b',
                      boxShadow: bookingType === 'purchased_package' ? '0 2px 8px rgba(5, 150, 105, 0.15)' : 'none'
                    }}
                  >
                    Gói đã mua
                  </button>
                )}
              </div>

              {/* Service Selection */}
              {bookingType === 'service' && (
                <>
                  <Form.Item
                    label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Dịch vụ khám</span>}
                    required
                    style={{ marginBottom: '16px' }}
                  >
                    <Select
                      value={selectedService}
                      onChange={handleServiceChange}
                      placeholder="Chọn dịch vụ cần khám"
                      style={{ fontSize: '14px' }}
                      size="large"
                    >
                      {services.filter(service => service.id).map(service => (
                        <Option key={service.id} value={service.id}>
                          <div style={{ padding: '4px 0' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                              {service.serviceName}
                            </div>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* Location Type - Dynamic based on selected service */}
                  {selectedService && availableLocations.length > 0 && (
                    <Form.Item
                      label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Hình thức khám</span>}
                      style={{ marginBottom: '16px' }}
                    >
                      <Select
                        value={typeLocation}
                        onChange={setTypeLocation}
                        style={{ fontSize: '14px' }}
                        disabled={!selectedService}
                        size="large"
                      >
                        {availableLocations.filter(location => location).map(location => (
                          <Option key={location} value={location}>
                            {getLocationLabel(location)}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}
                </>
              )}

              {/* 🆕 New Package Selection */}
              {bookingType === 'package' && (
                <>
                  <Form.Item
                    label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Gói dịch vụ</span>}
                    required
                    style={{ marginBottom: '16px' }}
                  >
                    <Select
                      value={selectedServicePackage}
                      onChange={handleServicePackageChange}
                      placeholder="Chọn gói dịch vụ"
                      style={{ fontSize: '14px' }}
                      size="large"
                    >
                      {servicePackages.filter(pkg => pkg._id && pkg.isActive).map(pkg => (
                        <Option key={pkg._id} value={pkg._id}>
                          {pkg.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* Render Alert dưới dropdown nếu có cảnh báo */}
                  {showPackageWarning && (
                    <Alert
                      type="warning"
                      showIcon
                      message="Bạn đã có gói này đang hoạt động, vui lòng sử dụng trước khi mua mới."
                      style={{ margin: '12px 0' }}
                    />
                  )}

                  {/* Package Details Display */}
                  {selectedServicePackage && getSelectedServicePackage() && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #c4b5fd',
                      marginBottom: '16px',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#6b21a8',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        📦 {getSelectedServicePackage()?.name}
                      </h4>
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#6b21a8',
                        marginBottom: '16px',
                        lineHeight: '1.5',
                        wordBreak: 'break-word'
                      }}>
                        {getSelectedServicePackage()?.description}
                      </p>
                      
                      {/* Services in Package */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b21a8', marginBottom: '8px' }}>
                          Dịch vụ bao gồm:
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '8px',
                          maxHeight: '120px',
                          overflowY: 'auto'
                        }}>
                          {getSelectedServicePackage()?.services?.map((service, index) => (
                            <span 
                              key={index}
                              style={{
                                background: 'white',
                                color: '#6b21a8',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: '1px solid #c4b5fd',
                                whiteSpace: 'nowrap',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={`${service.serviceName} (${service.quantity} lượt)`}
                            >
                              {service.serviceName}
                              <span style={{
                                background: '#6b21a8',
                                color: 'white',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontWeight: '600',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {service.quantity}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Package Price */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid #c4b5fd',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '14px', color: '#6b21a8', fontWeight: '500' }}>
                          Thời hạn: {getSelectedServicePackage()?.durationInDays} ngày
                        </span>
                        <span style={{ fontSize: '18px', color: '#6b21a8', fontWeight: '700' }}>
                          {formatPrice(getSelectedServicePackage()?.price || 0)} VNĐ
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 🎨 Purchased Package Selection - Enhanced UI */}
              {bookingType === 'purchased_package' && (
                <>
                  {!Array.isArray(purchasedPackages) || purchasedPackages.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '50px 24px',
                      background: 'linear-gradient(135deg, #fef3cd 0%, #fde68a 100%)',
                      borderRadius: '16px',
                      border: '2px dashed #f59e0b',
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)'
                    }}>
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          backgroundColor: '#f59e0b',
                          borderRadius: '50%',
                          margin: '0 auto 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '32px',
                          color: 'white'
                        }}>
                          📦
                        </div>
                      </div>
                      <h3 style={{ 
                        fontSize: '20px', 
                        color: '#92400e', 
                        margin: '0 0 8px 0',
                        fontWeight: '700'
                      }}>
                        Chưa có gói dịch vụ nào
                      </h3>
                      <p style={{ 
                        fontSize: '15px', 
                        color: '#b45309', 
                        margin: '0 0 24px 0',
                        lineHeight: '1.5'
                      }}>
                        Hãy khám phá và mua gói dịch vụ để trải nghiệm<br />
                        những dịch vụ chăm sóc sức khỏe tuyệt vời
                      </p>
                      <button
                        type="button"
                        onClick={() => window.location.href = '/services'}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '10px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                        }}
                      >
                        🔍 Khám phá gói dịch vụ
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#065f46',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🎁 Gói dịch vụ đã mua ({Array.isArray(purchasedPackages) ? purchasedPackages.length : 0})
                      </h4>
                      
                      {/* Cards Grid for Purchased Packages */}
                      <div style={{
          display: 'grid',
          gap: '16px',
                        marginBottom: '24px'
                      }}>
                        {(Array.isArray(purchasedPackages) ? purchasedPackages : []).map(purchase => {
                          const isSelected = selectedPurchasedPackage === purchase._id;
                          const daysUntilExpiry = dayjs(purchase.expiresAt).diff(dayjs(), 'days');
                          const isExpiringSoon = daysUntilExpiry <= 30;
                          
                          return (
                            <div
                              key={purchase._id}
                              onClick={() => handlePurchasedPackageChange(purchase._id)}
                              style={{
                                padding: '20px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid #059669' : '1px solid #d1d5db',
                                backgroundColor: isSelected ? '#ecfdf5' : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: isSelected ? '0 4px 15px rgba(5, 150, 105, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                              onMouseOver={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#6b7280';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#d1d5db';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                }
                              }}
                            >
                              {/* Selected Indicator */}
                              {isSelected && (
          <div style={{
                                  position: 'absolute',
                                  top: '0',
                                  right: '0',
                                  backgroundColor: '#059669',
                                  color: 'white',
                                  padding: '6px 12px',
                                  borderBottomLeftRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  ✓ Đã chọn
                                </div>
                              )}
                              
                              {/* Package Header */}
                              <div style={{ marginBottom: '12px' }}>
                                <h5 style={{
                                  fontSize: '18px',
                                  fontWeight: '700',
                                  color: '#1f2937',
                                  margin: '0 0 8px 0',
                                  lineHeight: '1.3'
                                }}>
                                  {purchase.servicePackage.name}
                                </h5>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '16px',
                                  flexWrap: 'wrap'
                                }}>
                                  <span style={{
                                    fontSize: '13px',
                                    color: '#6b7280',
                                    backgroundColor: '#f3f4f6',
                                    padding: '4px 8px',
            borderRadius: '6px',
                                    fontWeight: '500'
                                  }}>
                                    {purchase.usedServices?.length || 0} dịch vụ
                                  </span>
                                  <span style={{
                                    fontSize: '13px',
                                    color: isExpiringSoon ? '#dc2626' : '#6b7280',
                                    backgroundColor: isExpiringSoon ? '#fee2e2' : '#f3f4f6',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: '500'
                                  }}>
                                    {isExpiringSoon ? '⚠️ ' : '📅 '}
                                    Hết hạn: {dayjs(purchase.expiresAt).format('DD/MM/YYYY')}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Package Info */}
                              <div style={{
                                fontSize: '14px',
                                color: '#4b5563',
                                lineHeight: '1.5'
                              }}>
                                {purchase.servicePackage.description || 'Gói dịch vụ chăm sóc sức khỏe toàn diện'}
                              </div>
                              
                              {/* Status Badge */}
                              <div style={{
                                marginTop: '12px',
                                display: 'inline-block'
                              }}>
                                {(() => {
                                  // Kiểm tra xem gói có còn service nào có thể sử dụng không
                                  const hasAvailableServices = purchase.usedServices?.some((usedService: any) => {
                                    const usedQuantity = usedService.usedQuantity || usedService.usedCount || 0;
                                    const maxQuantity = usedService.maxQuantity || 1;
                                    return usedQuantity < maxQuantity;
                                  });
                                  
                                  if (!hasAvailableServices) {
                                    return (
                                      <span style={{
                                        fontSize: '12px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontWeight: '600'
                                      }}>
                                        ❌ ĐÃ SỬ DỤNG HẾT
                                      </span>
                                    );
                                  }
                                  
                                  // Kiểm tra xem có service nào sắp hết không
                                  const hasLowQuantity = purchase.usedServices?.some((usedService: any) => {
                                    const usedQuantity = usedService.usedQuantity || usedService.usedCount || 0;
                                    const maxQuantity = usedService.maxQuantity || 1;
                                    const remaining = maxQuantity - usedQuantity;
                                    return remaining <= 1 && remaining > 0;
                                  });
                                  
                                  if (hasLowQuantity) {
                                    return (
                                      <span style={{
                                        fontSize: '12px',
                                        backgroundColor: '#f59e0b',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontWeight: '600'
                                      }}>
                                        ⚠️ SẮP HẾT
                                      </span>
                                    );
                                  }
                                  
                                  return (
                                    <span style={{
                                      fontSize: '12px',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      padding: '4px 12px',
                                      borderRadius: '20px',
                                      fontWeight: '600'
                                    }}>
                                      ✨ ĐANG SỬ DỤNG
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Service selection from purchased package */}
                      {selectedPurchasedPackage && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '20px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <h5 style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            🎯 Chọn dịch vụ muốn sử dụng
                          </h5>
                          
                          <div style={{
                            display: 'grid',
                            gap: '12px'
                          }}>
                            {getAvailableServicesFromPackage().map((service, index) => {
                              const isServiceSelected = selectedServiceFromPackage === service.serviceId;
                              const usagePercent = (service.usedCount / service.quantity) * 100;
                              // Ensure unique key for each service
                              const uniqueKey = service.serviceId || `service-${index}`;
                              
                              return (
                                <div
                                  key={uniqueKey}
                                  onClick={() => handleServiceFromPackageChange(service.serviceId)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === 'Enter' && handleServiceFromPackageChange(service.serviceId)}
                                  style={{
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: isServiceSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                                    backgroundColor: isServiceSelected ? '#ecfdf5' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                  }}
                                >
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '8px'
                                  }}>
                                    <h6 style={{
                                      fontSize: '15px',
                                      fontWeight: '600',
                                      color: '#1f2937',
                                      margin: '0',
                                      flex: 1
                                    }}>
                                      {service.serviceName}
                                    </h6>
                                    <span style={{
                                      fontSize: '12px',
                                      backgroundColor: service.remainingQuantity > service.quantity / 2 ? '#10b981' : '#f59e0b',
                                      color: 'white',
                                      padding: '4px 8px',
                                      borderRadius: '12px',
                                      fontWeight: '600',
                                      whiteSpace: 'nowrap',
                                      marginLeft: '12px'
                                    }}>
                                      Còn {service.remainingQuantity}
                                    </span>
                                  </div>
                                  
                                  {/* Usage Progress */}
                                  <div style={{ marginBottom: '8px' }}>
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      fontSize: '12px',
                                      color: '#6b7280',
                                      marginBottom: '4px'
                                    }}>
                                      <span>Đã sử dụng: {service.usedCount}/{service.quantity}</span>
                                      <span>{usagePercent.toFixed(0)}%</span>
                                    </div>
                                    <div style={{
                                      width: '100%',
                                      height: '6px',
                                      backgroundColor: '#e5e7eb',
                                      borderRadius: '3px',
                                      overflow: 'hidden'
                                    }}>
                                      <div style={{
                                        width: `${usagePercent}%`,
                                        height: '100%',
                                        backgroundColor: usagePercent > 80 ? '#ef4444' : usagePercent > 50 ? '#f59e0b' : '#10b981',
                                        transition: 'width 0.3s ease'
                                      }} />
                                    </div>
                                  </div>
                                  
                                  {isServiceSelected && (
                                    <div style={{
                                      fontSize: '12px',
                                      color: '#059669',
                                      fontWeight: '600',
                                      marginTop: '8px'
                                    }}>
                                      ✓ Đã chọn dịch vụ này
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}



              {/* Selected Item Info */}
              {(selectedService || (selectedPurchasedPackage && selectedServiceFromPackage)) && (
                <div style={{ 
                  marginTop: '16px', 
            padding: '12px',
                  backgroundColor: bookingType === 'purchased_package' ? '#e0f2fe' : '#f0fdf4', 
                  borderRadius: '6px',
                  border: `1px solid ${bookingType === 'purchased_package' ? '#0284c7' : '#10b981'}`
                }}>
                  {bookingType === 'service' ? (
                    <>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Giá dịch vụ:</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                        {formatPrice(getCurrentPrice())}
                      </div>
                    </>
                  ) : bookingType === 'purchased_package' ? (
                    <>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Sử dụng từ gói đã mua:</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#0284c7' }}>
                        MIỄN PHÍ
                      </div>
                      {selectedPurchasedPackage && selectedServiceFromPackage && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280', 
                          marginTop: '4px' 
                        }}>
                          {(() => {
                            const availableServices = getAvailableServicesFromPackage();
                            const selectedService = availableServices.find(s => s.serviceId === selectedServiceFromPackage);
                            return selectedService ? 
                              `${selectedService.serviceName} - Còn lại: ${selectedService.remainingQuantity}/${selectedService.quantity}` : 
                              '';
                          })()}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Giá gói dịch vụ:</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getDiscountPercentage() > 0 && (
                          <span style={{ 
                            fontSize: '14px', 
                            color: '#6b7280', 
                            textDecoration: 'line-through' 
                          }}>
                            {formatPrice(getSelectedServicePackage()?.priceBeforeDiscount || 0)}
                          </span>
                        )}
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                          {formatPrice(getCurrentPrice())}
                        </div>
                        {getDiscountPercentage() > 0 && (
                          <span style={{ 
                            fontSize: '12px', 
                            backgroundColor: '#ef4444', 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            -{getDiscountPercentage()}%
                          </span>
                        )}
                      </div>
                      {selectedServicePackage && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280', 
                          marginTop: '4px' 
                        }}>
                          Bao gồm: {getSelectedServicePackage()?.services.map(s => s.serviceName).join(', ')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Date & Time Selection */}
            <div style={{
              marginBottom: '32px',
              padding: '24px',
              backgroundColor: (selectedService || selectedServicePackage) ? '#f9fafb' : '#f3f4f6',
              borderRadius: '8px',
            border: '1px solid #e5e7eb',
              opacity: (selectedService || selectedServicePackage || (selectedPurchasedPackage && selectedServiceFromPackage)) ? 1 : 0.6
          }}>
            <h3 style={{ 
                fontSize: '18px', 
              fontWeight: '600', 
                color: '#1f2937', 
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ 
                  background: (selectedService || selectedServicePackage || (selectedPurchasedPackage && selectedServiceFromPackage)) ? '#3b82f6' : '#9ca3af', 
                  color: 'white', 
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>2</span>
                Chọn ngày và giờ khám
              </h3>

              {!(selectedService || selectedServicePackage || (selectedPurchasedPackage && selectedServiceFromPackage)) ? (
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                  Vui lòng chọn dịch vụ hoặc gói dịch vụ trước
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* Calendar */}
                  <div>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      margin: '0 0 12px 0'
                    }}>Chọn ngày</h4>
                    <div style={{ 
                      transform: 'scale(1)', 
                      transformOrigin: 'top left',
                      height: '300px',
                      overflow: 'hidden'
                    }}>
              <Calendar
                fullscreen={false}
                value={selectedDate}
                        defaultValue={dayjs()}
                        onSelect={handleDateChange}
                cellRender={dateCellRender}
                disabledDate={disabledDate}
                className="compact-calendar"
              />
                    </div>
            </div>

            {/* Time Slots */}
                  <div>
                <h4 style={{ 
                      fontSize: '14px', 
                  fontWeight: '600', 
                      color: '#1f2937', 
                      margin: '0 0 12px 0'
                    }}>Chọn giờ</h4>
                    
                    {!selectedDate ? (
                    <div style={{ 
                        textAlign: 'center', 
                        color: '#6b7280', 
                        fontSize: '13px',
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px dashed #d1d5db'
                      }}>
                        Chọn ngày trước
                      </div>
                    ) : loadingTimeSlots ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                      border: '2px solid #e5e7eb',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto'
                    }}></div>
                  </div>
                ) : timeSlots.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#ef4444', 
                        fontSize: '13px',
                        padding: '20px',
                        backgroundColor: '#fef2f2',
                        borderRadius: '6px',
                        border: '1px solid #fecaca'
                      }}>
                    Không có lịch trống
                      </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                        gap: 'clamp(4px, 1vw, 8px)',
                        maxHeight: '300px',
                        overflowY: 'auto'
                  }}>
                    {timeSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot.id}
                            onClick={() => handleTimeSlotSelect(slot.time)}
                            disabled={!slot.isAvailable}
                        style={{
                              padding: '12px 8px',
                              fontSize: '13px',
                              borderRadius: '6px',
                              border: selectedTimeSlot === slot.time ? '2px solid #3b82f6' : '1px solid #d1d5db',
                              backgroundColor: !slot.isAvailable ? '#f3f4f6' : 
                                             selectedTimeSlot === slot.time ? '#eff6ff' : 'white',
                              color: !slot.isAvailable ? '#9ca3af' :
                                    selectedTimeSlot === slot.time ? '#1d4ed8' : '#374151',
                              cursor: slot.isAvailable ? 'pointer' : 'not-allowed',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            title={`${slot.availableDoctors || 0} bác sĩ có sẵn`}
                          >
                            <span style={{ fontWeight: '600' }}>{slot.time}</span>
                            {slot.availableDoctors && (
                              <span style={{ 
                                fontSize: '10px', 
                                color: '#10b981',
                                fontWeight: '500'
                              }}>
                                {slot.availableDoctors} bác sĩ
                              </span>
                            )}
                      </button>
                    ))}
                  </div>
                )}
                  </div>
              </div>
            )}
          </div>

            {/* Step 3: Profile Selection */}
            {(selectedDate && selectedTimeSlot) && (
          <div style={{
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    background: '#3b82f6', 
                    color: 'white', 
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>3</span>
                  Thông tin bệnh nhân
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: 'clamp(12px, 3vw, 24px)' 
                }}>
                  {/* Profile Selection */}
                      <div>
              <Form.Item
                      label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Hồ sơ bệnh nhân</span>}
                required
                      style={{ marginBottom: '16px' }}
              >
                <Select
                  value={selectedProfile}
                  onChange={setSelectedProfile}
                        placeholder="Chọn hoặc tạo hồ sơ"
                        style={{ fontSize: '14px' }}
                        size="large"
                        optionLabelProp="label"
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                            <div style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>
                        <button
                          type="button"
                          onClick={() => setShowCreateProfileModal(true)}
                          style={{
                            width: '100%',
                                  padding: '8px',
                                  fontSize: '13px',
                                  border: '1px dashed #3b82f6',
                            backgroundColor: 'transparent',
                                  color: '#3b82f6',
                            cursor: 'pointer',
                                  borderRadius: '6px'
                          }}
                        >
                          + Tạo hồ sơ mới
                        </button>
                      </div>
                    </div>
                  )}
                >
                        {userProfiles.filter(profile => profile.id || (profile as any)._id).map((profile, index) => {
                          const profileKey = profile.id || (profile as any)._id || `profile-${index}`;
                          return (
                            <Option 
                              key={profileKey} 
                              value={profile.id || (profile as any)._id}
                              label={profile.fullName}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                  {profile.fullName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#6b7280', opacity: 0.8 }}>
                                  {profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'} • {profile.phone}
                                </div>
                              </div>
                            </Option>
                          );
                        })}
                </Select>
              </Form.Item>

                    {/* Doctor Selection - Only show after date/time selected */}
                    {selectedDate && selectedTimeSlot && (
              <Form.Item
                        label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Bác sĩ (tùy chọn)</span>}
                        style={{ marginBottom: '16px' }}
              >
                <Select
                          value={selectedDoctor}
                          onChange={setSelectedDoctor}
                          placeholder={doctors.length === 0 ? "Không có bác sĩ rảnh" : "Hệ thống tự chọn"}
                          allowClear
                          style={{ fontSize: '14px' }}
                          size="large"
                          disabled={doctors.length === 0}
                        >
                          {doctors.filter(d => d.isAvailable && d.doctorId).map((doctor, index) => (
                            <Option key={doctor.doctorId} value={doctor.doctorId}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <img
                                  src={doctor.avatar}
                                  alt={doctor.name}
                                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                />
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                    {doctor.name}
                                  </div>
                                </div>
                              </div>
                            </Option>
                          ))}
                </Select>
                        {doctors.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#10b981', marginBottom: '4px', fontWeight: '500' }}>
                              ✓ {doctors.length} bác sĩ có sẵn cho thời gian này
                            </div>
                            {(() => {
                              console.log('🔍 [Doctor Count Debug] Current doctors state:', {
                                totalDoctors: doctors.length,
                                availableDoctors: doctors.filter(d => d.isAvailable).length,
                                selectedTimeSlot,
                                selectedDate: selectedDate?.format('YYYY-MM-DD')
                              });
                              return null;
                            })()}
                            {selectedDoctor && (
                              <div style={{ 
                                padding: '8px', 
                                backgroundColor: '#f8fafc', 
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: '#6b7280'
                              }}>
                                {(() => {
                                  const doctor = doctors.find(d => d.id === selectedDoctor);
                                  return doctor ? `${doctor.specialization} • ${doctor.experience || 0} năm kinh nghiệm` : '';
                                })()}
                              </div>
                            )}
                          </div>
                        )}
              </Form.Item>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div>
                    <Form.Item
                      label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Triệu chứng</span>}
                      name="description"
                      style={{ marginBottom: '16px' }}
                      rules={[
                        { max: 200, message: 'Mô tả không được vượt quá 200 ký tự' }
                      ]}
                    >
                      <Input.TextArea
                        placeholder="Mô tả triệu chứng hoặc lý do khám (tối đa 200 ký tự)"
                        rows={3}
                        maxLength={200}
                        showCount
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Ghi chú</span>}
                      name="notes"
                      style={{ marginBottom: '0' }}
                    >
                      <Input.TextArea
                        placeholder="Ghi chú thêm cho bác sĩ (tùy chọn)"
                        rows={3}
                        maxLength={200}
                        showCount
                        size="large"
                      />
                    </Form.Item>
                  </div>
                </div>
              </div>
            )}

            {/* Home Address for home visits */}
            {typeLocation === 'home' && (
                <div style={{
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: '#fef7f0',
                borderRadius: '8px',
                border: '1px solid #fdba74'
              }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#ea580c', 
                  margin: '0 0 12px 0'
                }}>📍 Địa chỉ khám tại nhà</h4>
                <Form.Item
                  name="address"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ chi tiết' }]}
                  style={{ marginBottom: '0' }}
                >
                  <Input.TextArea 
                    placeholder="Nhập địa chỉ chi tiết để bác sĩ có thể đến khám (bao gồm số nhà, tên đường, quận/huyện, thành phố)"
                    rows={3}
                    style={{ fontSize: '14px' }}
                    size="large"
                  />
                </Form.Item>
              </div>
            )}

            {/* Step 4: Summary & Submit */}
                  <div style={{ 
              padding: '24px',
              backgroundColor: ((selectedService || selectedServicePackage || (selectedPurchasedPackage && selectedServiceFromPackage)) && selectedDate && selectedTimeSlot && selectedProfile) ? '#f0fdf4' : '#f3f4f6',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              opacity: ((selectedService || selectedServicePackage || (selectedPurchasedPackage && selectedServiceFromPackage)) && selectedDate && selectedTimeSlot && selectedProfile) ? 1 : 0.6
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1f2937', 
                margin: '0 0 16px 0',
                    display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ 
                  background: ((selectedService || selectedServicePackage || (selectedPurchasedPackage && selectedServiceFromPackage)) && selectedDate && selectedTimeSlot && selectedProfile) ? '#10b981' : '#9ca3af', 
                  color: 'white', 
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>4</span>
                Xác nhận đặt lịch
              </h3>

              {!((selectedService || selectedServicePackage || (selectedPurchasedPackage && selectedServiceFromPackage)) && selectedDate && selectedTimeSlot && selectedProfile) ? (
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                  Vui lòng hoàn tất các bước trên
                  </div>
              ) : (
                <div>
                  {/* Summary */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #d1fae5',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                      Thông tin đặt lịch:
                </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                      • Dịch vụ: {
                        bookingType === 'service' ? getSelectedService()?.serviceName :
                        bookingType === 'package' ? getSelectedServicePackage()?.name :
                        (() => {
                          const availableServices = getAvailableServicesFromPackage();
                          const selectedService = availableServices.find(s => s.serviceId === selectedServiceFromPackage);
                          return selectedService?.serviceName || '';
                        })()
                      }<br/>
                      • Ngày khám: {selectedDate?.format('DD/MM/YYYY')}<br/>
                      • Giờ khám: {selectedTimeSlot}<br/>
                      • Hình thức: {getLocationLabel(typeLocation)}<br/>
                      {bookingType === 'purchased_package' && (
                        <>• Gói: {getSelectedPurchasedPackage()?.servicePackage.name}<br/></>
                      )}
                      {selectedDoctor && doctors.find(d => d.id === selectedDoctor) && 
                        `• Bác sĩ: ${doctors.find(d => d.id === selectedDoctor)?.name}`
                      }
                    </div>
                                      <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: '#ecfdf5',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#10b981'
                  }}>
                    💰 Chi phí: {formatPrice(getCurrentPrice())}
                  </div>
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#fff7ed',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#c2410c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '16px' }}>⏱️</span>
                    <span>Chỗ đặt sẽ được giữ trong 10 phút để thanh toán</span>
                  </div>
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#fff7ed',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#c2410c'
                  }}>
                    ⏱️ Lưu ý: Sau khi đặt lịch, bạn có 10 phút để hoàn tất thanh toán. Sau thời gian này, lịch hẹn sẽ tự động hủy và trả lại khung giờ cho người khác.
                  </div>
                  </div>

              {/* Submit Button */}
                  <div style={{ textAlign: 'center' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSubmitting}
                      disabled={
                        !(
                          selectedService ||
                          selectedServicePackage ||
                          (selectedPurchasedPackage && selectedServiceFromPackage)
                        )
                        || !selectedDate
                        || !selectedTimeSlot
                        || !selectedProfile
                      }
                      style={{
                        backgroundColor: '#10b981',
                        borderColor: '#10b981',
                        fontSize: '16px',
                        fontWeight: '600',
                        height: '48px',
                        padding: '0 40px',
                        borderRadius: '8px'
                      }}
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Đặt lịch và thanh toán'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            </Form>
          </div>
        </div>

        {/* Create Profile Modal */}
        <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600'
            }}>+</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Tạo hồ sơ mới</span>
          </div>
        }
          open={showCreateProfileModal}
        onCancel={() => {
          setShowCreateProfileModal(false);
          createProfileForm.resetFields();
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setShowCreateProfileModal(false);
              createProfileForm.resetFields();
            }}
            style={{ fontSize: '14px' }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmitting}
            onClick={() => createProfileForm.submit()}
            style={{
              backgroundColor: '#10b981',
              borderColor: '#10b981',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Tạo hồ sơ
          </Button>
        ]}
        width={480}
        maskClosable={false}
      >
        <div style={{ padding: '8px 0' }}>
          <Form
            form={createProfileForm}
            layout="vertical"
            onFinish={handleCreateProfile}
            size="large"
          >
            <Form.Item
              name="fullName"
              label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Họ và tên</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập họ và tên' },
                { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                { max: 50, message: 'Họ tên không được quá 50 ký tự' },
                { 
                  pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
                  message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng'
                }
              ]}
              style={{ marginBottom: '16px' }}
            >
              <Input 
                placeholder="Nhập họ và tên đầy đủ"
                style={{ fontSize: '14px' }}
              />
            </Form.Item>
            
            <Form.Item
              name="phone"
              label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Số điện thoại</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại' },
                { 
                  pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
                  message: 'Số điện thoại không đúng định dạng'
                }
              ]}
              style={{ marginBottom: '16px' }}
            >
              <Input 
                placeholder="Nhập số điện thoại (VD: 0912345678)"
                style={{ fontSize: '14px' }}
              />
            </Form.Item>
            
            <Form.Item
              name="birthDate"
              label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Năm sinh</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập năm sinh' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const year = parseInt(value);
                    const currentYear = new Date().getFullYear();
                    if (year < 1920 || year > currentYear) {
                      return Promise.reject(new Error(`Năm sinh phải từ 1920 đến ${currentYear}`));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
              style={{ marginBottom: '16px' }}
            >
              <Input 
                placeholder="Nhập năm sinh (VD: 1990)"
                style={{ fontSize: '14px' }}
                maxLength={4}
              />
            </Form.Item>
            
            <Form.Item
              name="gender"
              label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Giới tính</span>}
              rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
              style={{ marginBottom: '16px' }}
            >
              <Select 
                placeholder="Chọn giới tính"
                style={{ fontSize: '14px' }}
              >
                <Option value="male">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👨</span>
                    <span>Nam</span>
                  </div>
                </Option>
                <Option value="female">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👩</span>
                    <span>Nữ</span>
                  </div>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="relationship"
              label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Mối quan hệ</span>}
              rules={[{ required: true, message: 'Vui lòng chọn mối quan hệ' }]}
              style={{ marginBottom: '0' }}
            >
              <Select 
                placeholder="Chọn mối quan hệ với bạn"
                style={{ fontSize: '14px' }}
              >
                <Option value="self">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👤</span>
                    <span>Bản thân</span>
                  </div>
                </Option>
                <Option value="family">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👨‍👩‍👧‍👦</span>
                    <span>Gia đình</span>
                  </div>
                </Option>
                <Option value="relative">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👥</span>
                    <span>Họ hàng</span>
                  </div>
                </Option>
                <Option value="friend">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🤝</span>
                    <span>Bạn bè</span>
                  </div>
                </Option>
              </Select>
            </Form.Item>
          </Form>
      </div>
      </Modal>

      <style>{`
        /* Compact Calendar Styles */
        .compact-calendar {
          width: 100%;
        }
                  .compact-calendar .ant-picker-content th{
            padding: 0px;
            height: 30px;
          }
          
          /* Mobile responsive adjustments */
          @media (max-width: 768px) {
            .compact-calendar .ant-picker-calendar-date-value {
              font-size: 11px !important;
            }
            
            .compact-calendar .ant-picker-cell {
              height: 25px !important;
            }
            
        .compact-calendar .ant-picker-calendar-header {
              padding: 2px 6px !important;
              font-size: 12px !important;
            }
          }
        .compact-calendar .ant-picker-calendar-header {
          padding: 4px 10px;
        }
        
        .compact-calendar .ant-picker-content {
          height: auto;
        }
        
        .compact-calendar .ant-picker-calendar-date-value {
          font-size: 13px;
          line-height: 16px;
          height: 16px;
        }
        
        .compact-calendar .ant-picker-cell {
          padding: 2px;
        }
        
        .compact-calendar .ant-picker-content {
          height: auto;
        }
        
        .compact-calendar .ant-picker-calendar-date-value {
          font-size: 13px;
          line-height: 20px;
          height: 20px;
          margin: 2px 0;
        }
        
        .compact-calendar .ant-picker-cell {
          padding: 0px;
          height: 30px;
        }
        
        .compact-calendar .ant-picker-cell-inner {
          padding: 0px;
          border-radius: 4px;
          min-height: 10px;
        }
        

        
        /* Time slot styling improvements */
        .time-slot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          margin-top: 12px;
        }
        
        .time-slot-button {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          font-size: 13px;
        }
        
        .time-slot-button:hover {
          border-color: #10b981;
          background-color: #f0fdf4;
        }
        
        .time-slot-button.selected {
          border-color: #10b981;
          background-color: #10b981;
          color: white;
        }
        
        .time-slot-button:disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }
        
        /* Form responsive improvements */
        @media (max-width: 768px) {
          .booking-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          .compact-calendar {
            transform: scale(0.9);
          }
          
          .time-slot-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        /* Loading animation */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
        
        /* Step indicator improvements */
        .step-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .step-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }
        
        .step-number.active {
          background-color: #10b981;
        }
        
        .step-number.inactive {
          background-color: #9ca3af;
        }
        
        .step-number.completed {
          background-color: #10b981;
        }
      `}</style>
    </div>
  );
};

export default BookingPageNew; 