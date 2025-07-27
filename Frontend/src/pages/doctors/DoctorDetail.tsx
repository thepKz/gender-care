import { Button, Card, Rate, Spin, message, Calendar } from "antd";
import dayjs from 'dayjs';
import {
    ArrowLeft,
    Award,
    Clock,
    MessageText1,
    Profile2User
} from "iconsax-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doctorApi, type Doctor, type DoctorSchedule } from "../../api/endpoints/doctorApi";
import { feedbackApi } from "../../api/endpoints/feedback";
import { ModernCounselorCard } from "../../components/ui/counselors/ModernCounselorCard";
import { AnimatedSection } from "../../shared";
import DoctorFeedbacks from "../../components/ui/DoctorFeedbacks";

const DoctorDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(true);
  const [relatedDoctors, setRelatedDoctors] = useState<Doctor[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<{ totalFeedbacks: number; averageRating: number } | null>(null);

  const fetchFeedbackStats = async (doctorId: string) => {
    try {
      console.log('📊 Fetching feedback stats for doctor:', doctorId);
      const response = await feedbackApi.getDoctorFeedbacks(doctorId, 1, 1); // Just get first result for stats
      if (response.success && response.data.stats) {
        setFeedbackStats({
          totalFeedbacks: response.data.stats.totalFeedbacks || 0,
          averageRating: response.data.stats.averageRating || 0,
        });
        console.log('✅ Feedback stats loaded:', response.data.stats);
      }
    } catch (error) {
      console.error('❌ Error fetching feedback stats:', error);
      setFeedbackStats({ totalFeedbacks: 0, averageRating: 0 });
    }
  };

  const fetchAllDoctorData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching doctor data for ID:', id);
      
      const [doctorResponse, schedulesResponse, allDoctorsResponse] = await Promise.all([
        doctorApi.getDoctorById(id),
        doctorApi.getDoctorSchedules(id),
        doctorApi.getAllDoctors()
      ]);

      console.log('📊 Doctor Response:', doctorResponse);
      console.log('📅 Schedules Response:', schedulesResponse);
      console.log('👥 All Doctors Response:', allDoctorsResponse);

      // Doctor data is returned directly, not wrapped in data.data
      if (doctorResponse) {
        setDoctor(doctorResponse);
        // Load feedback stats after doctor data is loaded
        await fetchFeedbackStats(doctorResponse._id);
      } else {
        console.error('❌ No doctor data found');
        message.error('Không tìm thấy thông tin bác sĩ');
      }

      // Schedules data is wrapped in data.data
      if (schedulesResponse && (schedulesResponse as any).data?.data) {
        setSchedules((schedulesResponse as any).data.data);
      }

      // All doctors is returned directly as array
      if (Array.isArray(allDoctorsResponse)) {
        const filtered = allDoctorsResponse
          .filter((d: any) => d._id !== id)
          .slice(0, 3);
        setRelatedDoctors(filtered);
      }

      // Fetch available slots for today
      await fetchAvailableSlots(selectedDate);
    } catch (error) {
      console.error('❌ Error fetching doctor data:', error);
      message.error('Có lỗi xảy ra khi tải thông tin bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to filter slots based on current time (real-time filtering)
  const filterSlotsByCurrentTime = (slots: any[], selectedDate: dayjs.Dayjs) => {
    const now = dayjs(); // Use system time for testing
    const isToday = selectedDate.isSame(now, 'day');

    if (!isToday) {
      return slots; // If not today, return all available slots
    }

    // If today, filter slots that are still bookable
    return slots.filter(slot => {
      const slotTime = typeof slot === 'string' ? slot : slot.slotTime;
      if (!slotTime) return false;

      // Parse slot time (format: "07:00-08:00" -> start time "07:00")
      const slotStartTime = slotTime.split('-')[0];
      const [hours, minutes] = slotStartTime.split(':').map(Number);

      // Create slot datetime for today
      const slotDateTime = selectedDate.hour(hours).minute(minutes).second(0);

      // Add 1 hour buffer - can't book slot that starts within 1 hour
      const bufferTime = 60; // minutes (1 hour as requested)
      const cutoffTime = now.add(bufferTime, 'minute');

      // If slot starts before cutoff time, filter it out
      return slotDateTime.isAfter(cutoffTime) || slotDateTime.isSame(cutoffTime);
    });
  };

  const fetchAvailableSlots = async (date: dayjs.Dayjs) => {
    if (!id) return;

    try {
      const slots = await doctorApi.getAvailableSlots(id, date.format('YYYY-MM-DD'));
      console.log('Available slots received:', slots);

      let rawSlots: any[] = [];
      // Handle different response structures
      if (Array.isArray(slots)) {
        rawSlots = slots;
      } else if (slots.availableSlots) {
        rawSlots = slots.availableSlots;
      } else if (slots.data && Array.isArray(slots.data)) {
        rawSlots = slots.data;
      } else {
        rawSlots = [];
      }

      // Apply real-time filtering for today's slots
      const filteredSlots = filterSlotsByCurrentTime(rawSlots, date);
      setAvailableSlots(filteredSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    }
  };

  useEffect(() => {
    fetchAllDoctorData();
  }, [id]);

  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [selectedDate, id]);

  const handleDateSelect = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
  };

  const disabledDate = (current: dayjs.Dayjs) => {
    return current && current < dayjs().startOf('day');
  };

  const handleBooking = () => {
    if (!doctor) return;
    navigate(`/booking?doctorId=${doctor._id}&date=${selectedDate.format('YYYY-MM-DD')}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" tip="Đang tải thông tin bác sĩ..." />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bác sĩ</h2>
          <Button type="primary" onClick={() => navigate('/doctors')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  // Extract doctor information with proper fallbacks
  const doctorName = doctor.userId?.fullName || 'Bác sĩ';
  const doctorAvatar = doctor.userId?.avatar || doctor.image || "https://placehold.co/128x128?text=BS";
  const doctorSpecialization = doctor.specialization || 'Chuyên khoa';
  const doctorExperience = (doctor as any).yearsOfExperience || doctor.experience || 0;
  const doctorEducation = doctor.education || 'Chưa cập nhật';
  const doctorBio = doctor.bio || 'Chưa cập nhật';
  const doctorCertificate = doctor.certificate || '';


  // Debug console logs
  console.log('🔍 Doctor Data:', doctor);
  console.log('📅 Selected Date:', selectedDate);
  console.log('📅 Available Slots:', availableSlots);
  console.log('📅 Schedules:', schedules);

  // Parse certificates - support multiple formats (enhanced version)
  const parseCertificates = (certificateData: string): string[] => {
    console.log('🏥 [CERTIFICATE PARSE] Raw certificate data:', certificateData);
    console.log('🏥 [CERTIFICATE PARSE] Type:', typeof certificateData);

    if (typeof certificateData === 'string' && certificateData.trim()) {
      // Format 1: JSON array - ["url1", "url2"]
      if (certificateData.trim().startsWith('[') && certificateData.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(certificateData);
          if (Array.isArray(parsed)) {
            console.log('🏥 [CERTIFICATE PARSE] Successfully parsed JSON array:', parsed);
            console.log('🏥 [CERTIFICATE PARSE] Array length:', parsed.length);
            return parsed.filter(url => url && url.trim()); // Filter out empty URLs
          }
        } catch (error) {
          console.error('🏥 [CERTIFICATE PARSE] JSON parse error:', error);
        }
      }

      // Format 2: Comma-separated URLs - "url1, url2, url3"
      if (certificateData.includes(',')) {
        const urls = certificateData.split(',')
          .map(url => url.trim())
          .filter(url => url && (url.startsWith('http') || url.includes('.')));

        if (urls.length > 0) {
          console.log('🏥 [CERTIFICATE PARSE] Parsed comma-separated URLs:', urls);
          return urls;
        }
      }

      // Format 3: Single certificate URL or filename
      if (certificateData.startsWith('http') || certificateData.includes('.')) {
        console.log('🏥 [CERTIFICATE PARSE] Single certificate URL:', certificateData);
        return [certificateData];
      }

      // Format 4: Filename only (old format)
      console.log('🏥 [CERTIFICATE PARSE] Treating as filename:', certificateData);
      return [certificateData];
    } else if (Array.isArray(certificateData)) {
      console.log('🏥 [CERTIFICATE PARSE] Already an array:', certificateData);
      return certificateData.filter(url => url && url.trim());
    }

    console.log('🏥 [CERTIFICATE PARSE] No certificates found');
    return [];
  };

  const doctorCertificates = parseCertificates(doctorCertificate);
  console.log('🏥 [CERTIFICATE FINAL] Final certificates array:', doctorCertificates);
  console.log('🏥 [CERTIFICATE FINAL] Array length:', doctorCertificates.length);

  const formatCertificateUrl = (cert: string): string => {
    if (!cert) return '';
    return cert.startsWith('http') ? cert : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${cert}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="relative pt-12 pb-8 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] text-white">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              type="text" 
              icon={<ArrowLeft size={20} />} 
              onClick={() => navigate('/doctors')}
              className="text-white hover:text-cyan-300"
            />
            <h1 className="text-2xl font-bold font-['Be_Vietnam_Pro',_sans-serif]">Thông tin bác sĩ</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Doctor Info */}
          <div className="lg:col-span-2">
            {/* Doctor Profile Card */}
            <AnimatedSection animation="slideUp">
              <Card className="mb-8 border-0 shadow-lg rounded-2xl overflow-hidden">
                <div className="relative">
                  {/* Background Image */}
                  <div className="h-36 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E]"></div>
                  
                  {/* Doctor Avatar */}
                  <div className="absolute -bottom-16 left-8">
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                      <img 
                        src={doctorAvatar} 
                        alt={doctorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-20 px-8 pb-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-2 font-['Be_Vietnam_Pro',_sans-serif]">
                        {doctorName}
                      </h2>
                      <p className="text-lg text-[#2A7F9E] font-medium mb-2">{doctorSpecialization}</p>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {doctorExperience} năm kinh nghiệm
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageText1 size={16} />
                          {feedbackStats?.totalFeedbacks || 0} đánh giá
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Rate disabled defaultValue={feedbackStats?.averageRating || 0} className="text-yellow-400" />
                      <p className="text-sm text-gray-600 mt-1">
                        {feedbackStats?.averageRating ? `${feedbackStats.averageRating}/5` : 'Chưa có đánh giá'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-[#0C3C54]/5 rounded-xl">
                      <div className="text-2xl font-bold text-[#0C3C54]">{doctorExperience}</div>
                      <div className="text-sm text-gray-600">Năm kinh nghiệm</div>
                    </div>
                    <div className="text-center p-4 bg-[#2A7F9E]/5 rounded-xl">
                      <div className="text-2xl font-bold text-[#2A7F9E]">{feedbackStats?.totalFeedbacks || 0}</div>
                      <div className="text-sm text-gray-600">Khách hàng</div>
                    </div>
                    <div className="text-center p-4 bg-cyan-500/5 rounded-xl">
                      <div className="text-2xl font-bold text-cyan-500">{schedules.length || 0}</div>
                      <div className="text-sm text-gray-600">Lịch làm việc</div>
                    </div>
                  </div>

                  {/* Introduction */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 font-['Be_Vietnam_Pro',_sans-serif]">Giới thiệu</h3>
                    <p className="text-gray-700 leading-relaxed">{doctorBio}</p>
                  </div>

                  {/* Education & Experience */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 font-['Be_Vietnam_Pro',_sans-serif]">Học vấn & Kinh nghiệm</h3>
                    <div className="space-y-4">
                      {/* Education Timeline */}
                      {doctorEducation && doctorEducation !== 'Chưa cập nhật' && (
                        <div>
                          <h4 className="font-semibold text-[#0C3C54] mb-2 flex items-center gap-2">
                            <Award size={16} />
                            Học vấn
                          </h4>
                          <div className="ml-6 space-y-2">
                            {doctorEducation.split('\n').map((item, index) => {
                              if (item.trim()) {
                                const [period, institution] = item.split(':').map(s => s.trim());
                                return (
                                  <div key={index} className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-[#0C3C54] rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                      <p className="font-medium text-gray-800">{period}</p>
                                      <p className="text-gray-600">{institution}</p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Experience Timeline */}
                      {doctor.experience && typeof doctor.experience === 'string' && (
                        <div>
                          <h4 className="font-semibold text-[#2A7F9E] mb-2 flex items-center gap-2">
                            <Profile2User size={16} />
                            Kinh nghiệm làm việc
                          </h4>
                          <div className="ml-6 space-y-2">
                            {doctor.experience.split('\n').map((item, index) => {
                              if (item.trim()) {
                                const [period, workplace] = item.split(':').map(s => s.trim());
                                return (
                                  <div key={index} className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-[#2A7F9E] rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                      <p className="font-medium text-gray-800">{period}</p>
                                      <p className="text-gray-600">{workplace}</p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Fallback if no structured data */}
                      {(!doctorEducation || doctorEducation === 'Chưa cập nhật') && !doctor.experience && (
                        <p className="text-gray-500 italic">Chưa cập nhật thông tin học vấn và kinh nghiệm</p>
                      )}
                    </div>
                  </div>

                  {/* Certificates */}
                  {doctorCertificates.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-3 font-['Be_Vietnam_Pro',_sans-serif]">
                        Chứng chỉ {doctorCertificates.length > 1 && `(${doctorCertificates.length})`}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctorCertificates.map((cert, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                            <img
                              src={formatCertificateUrl(cert)}
                              alt={`Chứng chỉ ${index + 1}`}
                              className="w-full h-48 object-contain rounded bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => window.open(formatCertificateUrl(cert), '_blank')}
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Không+thể+tải+chứng+chỉ';
                              }}
                            />
                            <p className="text-sm text-gray-600 mt-2 text-center">
                              Chứng chỉ {index + 1} - Nhấp để xem chi tiết
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </AnimatedSection>

            {/* Feedbacks Section */}
            <AnimatedSection animation="slideUp" delay={0.2}>
              <div className="mb-8">
                <DoctorFeedbacks doctorId={doctor._id} />
              </div>
            </AnimatedSection>

            {/* Related Doctors */}
            {relatedDoctors.length > 0 && (
              <AnimatedSection animation="slideUp" delay={0.4}>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 font-['Be_Vietnam_Pro',_sans-serif]">Bác sĩ liên quan</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedDoctors.map((relatedDoctor, index) => (
                      <ModernCounselorCard key={relatedDoctor._id} doctor={relatedDoctor} index={index} />
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1 sticky top-24">
            <AnimatedSection animation="slideRight">
              <Card 
                title={<span className="font-['Be_Vietnam_Pro',_sans-serif] text-[#0C3C54] text-lg">Đặt lịch tư vấn</span>} 
                className="border-0 shadow-lg rounded-2xl bg-white"
              >
                <p className="text-sm text-[#2A7F9E] mb-4 font-['Be_Vietnam_Pro',_sans-serif]">
                  Chọn ngày và khung giờ còn trống để đặt lịch.
                </p>
                
                {/* Calendar */}
                <div className="mb-6 rounded-lg border border-[#2A7F9E]/30 p-2 bg-[#2A7F9E]/5">
                  <Calendar
                    fullscreen={false}
                    value={selectedDate}
                    onSelect={(date: any) => handleDateSelect(date)}
                    disabledDate={disabledDate}
                    style={{ border: 'none' }}
                  />
                </div>

                {/* Available Slots */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">
                    Khung giờ trống cho ngày {selectedDate.format('DD/MM/YYYY')}
                  </h4>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot: any, index: number) => (
                        <Button 
                          key={slot.slotId || index} 
                          size="small" 
                          className="text-xs"
                        >
                          {typeof slot === 'string' ? slot : slot.slotTime}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Không có lịch trống trong ngày này.</p>
                  )}
                </div>

                {/* Booking Button */}
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleBooking}
                  className="w-full bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] border-0 hover:from-[#2A7F9E] hover:to-[#0C3C54] font-['Be_Vietnam_Pro',_sans-serif]"
                >
                  Đặt lịch ngay
                </Button>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail; 
