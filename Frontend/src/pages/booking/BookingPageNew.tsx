import { Button, Calendar, Form, Input, message, Modal, Select, notification } from 'antd';
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
import servicePackageApi from '../../api/endpoints/servicePackageApi';
import packagePurchaseApi from '../../api/endpoints/packagePurchaseApi';

// Hooks
import useAuth from '../../hooks/useAuth';

// Utils
import { getValidTokenFromStorage } from '../../utils/helpers';

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
  }>;
  totalAmount: number;
  status: 'active' | 'expired' | 'used_up';
  expiresAt: string;
}

const BookingPageNew: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [form] = Form.useForm();

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
  const [typeLocation, setTypeLocation] = useState<'online' | 'clinic' | 'home'>('clinic');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

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
      const response = await servicePackageApi.getServicePackages({ 
        isActive: true,
        limit: 100 
      });
      
      // Check response structure - API returns { success: boolean, data: { packages: ServicePackage[] } }
      if (!response.data || !response.data.packages) {
        throw new Error('Invalid API response structure: missing data.packages');
      }
      
      const packagesData = response.data.packages || [];
      
      if (!Array.isArray(packagesData)) {
        throw new Error('Invalid service packages data format: packages should be an array');
      }
      
      const mappedPackages: ServicePackage[] = packagesData.map((pkg: any) => ({
        _id: pkg._id || pkg.id,
        name: pkg.name || pkg.packageName,
        description: pkg.description || '',
        price: pkg.price || 0,
        priceBeforeDiscount: pkg.priceBeforeDiscount || pkg.price || 0,
        services: pkg.services || [],
        durationInDays: pkg.durationInDays || 30,
        maxUsages: pkg.maxUsages || 1,
        isActive: pkg.isActive !== false,
      }));

      setServicePackages(mappedPackages);
    } catch (error) {
      console.error('Error fetching service packages:', error);
      setNetworkError(true);
      setServicePackages([]);
    }
  }, []);

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
          .filter((purchase: any) => purchase.status === 'active')
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
        
        const mappedDoctors: Doctor[] = apiDoctors.map((doctor: any) => ({
          id: doctor._id,
          name: doctor.userId?.fullName || doctor.name || 'Chưa có tên',
          specialization: doctor.specialization || 'Chưa xác định',
          experience: doctor.experience || 0,
          rating: doctor.rating || 4.5,
          reviewCount: 0,
          avatar: doctor.userId?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
          isAvailable: doctor.userId?.isActive !== false,
          bio: doctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm'
        }));
        
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
      const response = await doctorScheduleApi.getAvailableDoctors(dateStr);
      const availableDoctorsData = Array.isArray(response) ? response : [];
      
      // Filter doctors who have the specific time slot available
      const filteredDoctors = availableDoctorsData.filter((doctorSchedule: any) => {
        if (!doctorSchedule.availableSlots) return false;
        return doctorSchedule.availableSlots.some((slot: any) => 
          slot.slotTime === timeSlot && slot.status === 'Free'
        );
      });

      // Get doctor details for filtered doctors
      const allDoctors = await doctorApi.getAll();
      const mappedDoctors: Doctor[] = filteredDoctors
        .map((doctorSchedule: any) => {
          const doctorData = allDoctors.find((d: any) => d._id === doctorSchedule.doctorId);
          if (!doctorData) return null;
          
          return {
            id: doctorData._id,
            name: doctorData.userId?.fullName || 'Chưa có tên',
            specialization: doctorData.specialization || 'Chưa xác định',
            experience: doctorData.experience || 0,
            rating: doctorData.rating || 4.5,
            reviewCount: 0,
            avatar: doctorData.userId?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
            isAvailable: true, // They are available for this time slot
            bio: doctorData.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm'
          };
        })
        .filter(Boolean) as Doctor[];
      
      setDoctors(mappedDoctors);
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      setNetworkError(true);
      setDoctors([]);
    }
  }, []);

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
      await Promise.all([
        fetchServices(),
        fetchServicePackages(),
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
      const locations = service.availableAt.map(location => {
        switch (location.toLowerCase()) {
          case 'online': return 'online';
          case 'center': return 'clinic';
          case 'athome': return 'home';
          default: return 'clinic';
        }
      });
      
      setAvailableLocations(locations);
      
      // Reset location if current selection is not available
      if (!locations.includes(typeLocation)) {
        setTypeLocation(locations[0] as 'online' | 'clinic' | 'home');
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
    setSelectedServicePackage(packageId);
    setSelectedService(''); // Clear service selection
    
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
    setSelectedServiceFromPackage(serviceId);
    
    // Reset form state for new service selection
    setSelectedDate(null);
    setSelectedTimeSlot('');
    setSelectedDoctor('');
    setTimeSlots([]);
    setDoctors([]);
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

  // Handle form submission
  const handleSubmit = async (values: any) => {
    // Prevent form submission if not ready (should not happen due to disabled button, but safety check)
    const isReadyForSubmission = (
      (selectedService || selectedServicePackage || (selectedPurchasedPackage && selectedServiceFromPackage)) && 
      selectedDate && 
      selectedTimeSlot && 
      selectedProfile
    );
    
    if (!isReadyForSubmission) {
      return; // Silently block - user shouldn't be able to submit anyway due to disabled button
    }

    try {
      setIsSubmitting(true);
      
      // Auto-assign available doctor if not selected
      let assignedDoctorId = selectedDoctor;
      let assignedDoctorName = '';
      
      if (!assignedDoctorId) {
        if (doctors.length > 0) {
          // Find first available doctor for this time slot
          const availableDoctor = doctors.find(doctor => doctor.isAvailable);
          if (availableDoctor) {
            assignedDoctorId = availableDoctor.id;
            assignedDoctorName = availableDoctor.name;
            console.log('🤖 Auto-assigned doctor from current context:', availableDoctor.name, 'ID:', availableDoctor.id);
          }
        } else {
          // Fallback: fetch any available doctor for this date/time
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
              assignedDoctorName = `Bác sĩ (ID: ${assignedDoctorId})`;
              console.log('🔄 Fallback auto-assigned doctor ID:', assignedDoctorId);
            }
          } catch (error) {
            console.error('Failed to fetch fallback doctor:', error);
          }
        }
      } else if (assignedDoctorId) {
        const selectedDoctorObj = doctors.find(d => d.id === assignedDoctorId);
        assignedDoctorName = selectedDoctorObj?.name || '';
        console.log('✅ Using selected doctor:', assignedDoctorName, 'ID:', assignedDoctorId);
      }

      const bookingData = {
        ...(bookingType === 'service' ? 
          { serviceId: selectedService } : 
          bookingType === 'package' ? 
            { servicePackageId: selectedServicePackage } :
            { 
              serviceId: selectedServiceFromPackage,
              packagePurchaseId: selectedPurchasedPackage
            }
        ),
        doctorId: assignedDoctorId,
        appointmentDate: selectedDate.format('YYYY-MM-DD'),
        appointmentTime: selectedTimeSlot,
        appointmentType: 'consultation' as const,
        typeLocation: (typeLocation === 'online' ? 'Online' : typeLocation) as 'clinic' | 'home' | 'Online',
        profileId: selectedProfile,
        description: values.description,
        notes: values.notes,
        address: typeLocation === 'home' ? values.address : undefined,
        bookingType: bookingType === 'service' ? 'service_only' : 
                     bookingType === 'package' ? 'package_booking' : 
                     'purchased_package_usage'
      };

      console.log('🚀 Creating appointment...', bookingData);
      const response = await appointmentApi.createAppointment(bookingData as any);
      
      if (response.success || response.data) {
        const appointmentId = response.data?._id || response.data?.id;
        
        if (!appointmentId) {
          throw new Error('Không nhận được ID appointment');
        }

        console.log('✅ Appointment created, creating payment link...', appointmentId);

        // Tạo payment link với PayOS
        try {
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const token = getValidTokenFromStorage('access_token');
          
          if (!token) {
            throw new Error('Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
          }
          
          const paymentResponse = await fetch(`${apiBase}/api/payments/appointments/${appointmentId}/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              returnUrl: `${window.location.origin}/payment/success?appointmentId=${appointmentId}`,
              cancelUrl: `${window.location.origin}/booking`
            })
          });

          const paymentData = await paymentResponse.json();
          
          if (paymentData.success && paymentData.data?.paymentUrl) {
            console.log('💳 Redirecting to PayOS payment page...');
            
            // Store booking info for later refresh  
            localStorage.setItem('pendingBooking', JSON.stringify({
              appointmentId,
              dateStr: selectedDate.format('YYYY-MM-DD'),
              timeSlot: selectedTimeSlot
            }));
            
            // Redirect đến trang thanh toán PayOS
            window.location.href = paymentData.data.paymentUrl;
          } else {
            throw new Error(paymentData.message || 'Không thể tạo link thanh toán');
          }
          
        } catch (paymentError) {
          console.error('Payment error:', paymentError);
          notification.error({
            message: 'Lỗi thanh toán',
            description: 'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại!',
            placement: 'topRight'
          });
        }
        
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('Error submitting booking:', error);
      notification.error({
        message: 'Lỗi đặt lịch',
        description: 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại!',
        placement: 'topRight'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const getSelectedService = () => services.find(s => s.id === selectedService);
  const getSelectedServicePackage = () => servicePackages.find(p => p._id === selectedServicePackage);
  const getSelectedPurchasedPackage = () => purchasedPackages.find(p => p._id === selectedPurchasedPackage);
  
  // 🆕 Get available services from purchased package with remaining quantities
  const getAvailableServicesFromPackage = () => {
    const purchasedPackage = getSelectedPurchasedPackage();
    if (!purchasedPackage) return [];
    
    return purchasedPackage.servicePackage.services.map(service => {
      const usedService = purchasedPackage.usedServices.find(used => used.serviceId === service.serviceId);
      const usedCount = usedService ? usedService.usedCount : 0;
      const remainingQuantity = service.quantity - usedCount;
      
      return {
        ...service,
        usedCount,
        remainingQuantity,
        canUse: remainingQuantity > 0
      };
    }).filter(service => service.canUse); // Only show services that can still be used
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

              {/* Booking Type Tabs */}
              <div style={{ 
                display: 'flex', 
                marginBottom: '20px',
                gap: '4px',
                backgroundColor: '#f3f4f6',
                padding: '4px',
                borderRadius: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => handleBookingTypeChange('service')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: bookingType === 'service' ? 'white' : 'transparent',
                    color: bookingType === 'service' ? '#3b82f6' : '#6b7280',
                    boxShadow: bookingType === 'service' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                >
                  Dịch vụ đơn lẻ
                </button>
                <button
                  type="button"
                  onClick={() => handleBookingTypeChange('package')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: bookingType === 'package' ? 'white' : 'transparent',
                    color: bookingType === 'package' ? '#3b82f6' : '#6b7280',
                    boxShadow: bookingType === 'package' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                >
                  Gói dịch vụ
                </button>
                {/* 🆕 Purchased Package Tab */}
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => handleBookingTypeChange('purchased_package')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: bookingType === 'purchased_package' ? 'white' : 'transparent',
                      color: bookingType === 'purchased_package' ? '#3b82f6' : '#6b7280',
                      boxShadow: bookingType === 'purchased_package' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
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

              {/* 🆕 Purchased Package Selection */}
              {bookingType === 'purchased_package' && (
                <>
                  {purchasedPackages.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      backgroundColor: '#fef3cd',
                      borderRadius: '8px',
                      border: '1px solid #fbbf24'
                    }}>
                      <p style={{ 
                        fontSize: '16px', 
                        color: '#92400e', 
                        margin: '0 0 12px 0',
                        fontWeight: '600'
                      }}>
                        Bạn chưa có gói dịch vụ nào
                      </p>
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#b45309', 
                        margin: '0 0 16px 0'
                      }}>
                        Hãy mua gói dịch vụ để sử dụng tính năng này
                      </p>
                      <button
                        type="button"
                        onClick={() => window.location.href = '/service-packages'}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Xem gói dịch vụ
                      </button>
                    </div>
                  ) : (
                    <>
                      <Form.Item
                        label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Gói dịch vụ đã mua</span>}
                        required
                        style={{ marginBottom: '16px' }}
                      >
                        <Select
                          value={selectedPurchasedPackage}
                          onChange={handlePurchasedPackageChange}
                          placeholder="Chọn gói dịch vụ đã mua"
                          style={{ fontSize: '14px' }}
                          size="large"
                        >
                          {purchasedPackages.map(purchase => (
                            <Option key={purchase._id} value={purchase._id}>
                              <div style={{ padding: '4px 0' }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center' 
                                }}>
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                      {purchase.servicePackage.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                      {purchase.servicePackage.services.length} dịch vụ • 
                                      Hết hạn: {dayjs(purchase.expiresAt).format('DD/MM/YYYY')}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    fontSize: '10px', 
                                    backgroundColor: '#10b981', 
                                    color: 'white', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    fontWeight: '600'
                                  }}>
                                    ĐÃ MUA
                                  </div>
                                </div>
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      {/* Service selection from purchased package */}
                      {selectedPurchasedPackage && (
                        <Form.Item
                          label={<span style={{ fontSize: '14px', fontWeight: '600' }}>Dịch vụ muốn sử dụng</span>}
                          required
                          style={{ marginBottom: '16px' }}
                        >
                          <Select
                            value={selectedServiceFromPackage}
                            onChange={handleServiceFromPackageChange}
                            placeholder="Chọn dịch vụ muốn sử dụng"
                            style={{ fontSize: '14px' }}
                            size="large"
                          >
                            {getAvailableServicesFromPackage().map(service => (
                              <Option key={service.serviceId} value={service.serviceId}>
                                <div style={{ padding: '4px 0' }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center' 
                                  }}>
                                    <div>
                                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                        {service.serviceName}
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                        Đã dùng: {service.usedCount}/{service.quantity} lần
                                      </div>
                                    </div>
                                    <div style={{ 
                                      fontSize: '11px', 
                                      backgroundColor: service.remainingQuantity > service.quantity / 2 ? '#10b981' : '#f59e0b', 
                                      color: 'white', 
                                      padding: '2px 6px', 
                                      borderRadius: '4px',
                                      fontWeight: '600'
                                    }}>
                                      Còn {service.remainingQuantity}
                                    </div>
                                  </div>
                                </div>
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Service Package Selection */}
              {bookingType === 'package' && (
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
                    {servicePackages.filter(pkg => pkg.isActive).map(servicePackage => (
                      <Option key={servicePackage._id} value={servicePackage._id}>
                        <div style={{ padding: '4px 0' }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                {servicePackage.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {servicePackage.services.length} dịch vụ • {servicePackage.durationInDays} ngày
                              </div>
                            </div>
                            {servicePackage.priceBeforeDiscount > servicePackage.price && (
                              <div style={{ 
                                fontSize: '10px', 
                                backgroundColor: '#ef4444', 
                                color: 'white', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                fontWeight: '600'
                              }}>
                                -{Math.round(((servicePackage.priceBeforeDiscount - servicePackage.price) / servicePackage.priceBeforeDiscount) * 100)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              {/* Selected Item Info */}
              {(selectedService || selectedServicePackage || (selectedPurchasedPackage && selectedServiceFromPackage)) && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: bookingType === 'package' ? '#fef3c7' : bookingType === 'purchased_package' ? '#e0f2fe' : '#f0fdf4', 
                  borderRadius: '6px',
                  border: `1px solid ${bookingType === 'package' ? '#f59e0b' : bookingType === 'purchased_package' ? '#0284c7' : '#10b981'}`
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
                        {userProfiles.filter(profile => profile.id || (profile as any)._id).map(profile => (
                          <Option 
                            key={profile.id || (profile as any)._id} 
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
                        ))}
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
                          {doctors.filter(d => d.isAvailable && d.id).map(doctor => (
                            <Option key={doctor.id} value={doctor.id}>
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
                    >
                      <Input.TextArea
                        placeholder="Mô tả triệu chứng hoặc lý do khám (tùy chọn)"
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
                  </div>

                  {/* Submit Button */}
                  <div style={{ textAlign: 'center' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSubmitting}
                      disabled={!(selectedService || selectedServicePackage) || !selectedDate || !selectedTimeSlot || !selectedProfile}
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