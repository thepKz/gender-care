import { Calendar as AntCalendar, Button, Card, Rate, Spin, Tag, message } from "antd";
import dayjs from 'dayjs';
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Award,
    Calendar,
    Call,
    Clock,
    Heart,
    Profile2User,
    TickCircle
} from "iconsax-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doctorApi, type Doctor, type DoctorSchedule } from "../../api/endpoints/doctorApi";
import { AnimatedSection } from "../../shared";

const DoctorDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // Lấy thông tin bác sĩ
  const fetchDoctor = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const doctorData = await doctorApi.getDoctorById(id);
      setDoctor(doctorData);
      
      // Lấy lịch làm việc
      try {
        const scheduleData = await doctorApi.getDoctorSchedules(id);
        setSchedule(scheduleData);
      } catch (scheduleError) {
        console.log('Bác sĩ chưa có lịch làm việc');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin bác sĩ:', error);
      message.error('Không thể tải thông tin bác sĩ');
      navigate('/counselors');
    } finally {
      setLoading(false);
    }
  };

  // Lấy slots trống theo ngày
  const fetchAvailableSlots = async (date: string) => {
    if (!id || !date) return;
    
    try {
      const slots = await doctorApi.getAvailableSlots(id, date);
      setAvailableSlots(slots.availableSlots || []);
    } catch (error) {
      console.error('Lỗi khi lấy slots:', error);
      setAvailableSlots([]);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const handleDateSelect = (date: any) => {
    const dateStr = date.format('YYYY-MM-DD');
    setSelectedDate(dateStr);
  };

  const handleBookAppointment = (slotId?: string) => {
    if (!doctor) return;
    
    const bookingData = {
      doctorId: doctor._id,
      doctorName: doctor.userId.fullName,
      date: selectedDate,
      slotId
    };
    
    navigate('/booking', { state: { selectedDoctor: doctor, bookingData } });
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    message.success(isFavorite ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích');
  };

  // Disable past dates
  const disabledDate = (current: any) => {
    return current && current < dayjs().startOf('day');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <Spin size="large" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bác sĩ</h2>
          <Button onClick={() => navigate('/counselors')}>Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="relative pt-12 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] opacity-90"></div>
        
        <div className="relative container mx-auto px-4">
          <AnimatedSection animation="slideUp">
            <div className="flex items-center gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/counselors')}
                className="p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
              >
                <ArrowLeft size={24} />
              </motion.button>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Thông tin bác sĩ
              </h1>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Doctor Profile */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Doctor Info Card */}
            <div className="lg:col-span-2">
              <AnimatedSection animation="slideLeft">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="relative">
                    {/* Cover Image */}
                    <div className="h-48 bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] relative">
                      <div className="absolute inset-0 bg-black/20"></div>
                      
                      {/* Doctor Avatar */}
                      <div className="absolute -bottom-16 left-8">
                        <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                          <img
                            src={doctor.image || doctor.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.userId?.fullName || 'doctor'}`}
                            alt={doctor.userId?.fullName || 'Bác sĩ'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Favorite Button */}
                      <div className="absolute top-4 right-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleToggleFavorite}
                          className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
                            isFavorite
                              ? "bg-red-500 text-white"
                              : "bg-white/20 text-white hover:bg-red-500"
                          }`}
                        >
                          <Heart size={20} variant={isFavorite ? "Bold" : "Outline"} />
                        </motion.button>
                      </div>
                    </div>

                    {/* Doctor Details */}
                    <div className="pt-20 p-8">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                            {doctor.userId?.fullName || 'Bác sĩ'}
                          </h2>
                          <p className="text-lg text-[#0C3C54] font-medium mb-2">
                            {doctor.specialization || 'Bác sĩ chuyên khoa'}
                          </p>
                          <p className="text-gray-600">
                            {doctor.education || 'Bác sĩ Y khoa'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Rate disabled defaultValue={doctor.rating || 0} allowHalf className="text-sm" />
                            </div>
                            <p className="text-sm text-gray-600">
                              {doctor.rating ? doctor.rating.toFixed(1) : 'Chưa có đánh giá'}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 mb-1">
                              <Award size={20} className="text-[#0C3C54]" />
                              <span className="font-bold text-lg text-[#0C3C54]">
                                {doctor.experience || 0}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">Năm kinh nghiệm</p>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Giới thiệu</h3>
                        <p className="text-gray-600 leading-relaxed">
                          {doctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực chăm sóc sức khỏe giới tính và sinh sản. Cam kết mang đến dịch vụ tư vấn chất lượng cao và môi trường thân thiện cho bệnh nhân.'}
                        </p>
                      </div>

                      {/* Certificates */}
                      {doctor.certificate && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">Chứng chỉ</h3>
                          <div className="flex flex-wrap gap-2">
                            <Tag color="green" className="px-3 py-1">
                              <TickCircle size={16} className="mr-1" />
                              {doctor.certificate}
                            </Tag>
                          </div>
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-[#0C3C54] rounded-full flex items-center justify-center">
                            <Call size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Điện thoại</p>
                            <p className="font-medium text-gray-800">
                              {doctor.userId.phone || 'Chưa cập nhật'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-[#0C3C54] rounded-full flex items-center justify-center">
                            <Profile2User size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium text-gray-800 break-all">
                              {doctor.userId.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </AnimatedSection>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <AnimatedSection animation="slideRight">
                <Card className="border-0 shadow-lg sticky top-4">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <Calendar size={24} className="text-[#0C3C54]" />
                      Đặt lịch tư vấn
                    </h3>

                    {/* Calendar */}
                    <div className="mb-6">
                      <AntCalendar
                        fullscreen={false}
                        onSelect={handleDateSelect}
                        disabledDate={disabledDate}
                        className="border-0"
                      />
                    </div>

                    {/* Available Slots */}
                    {selectedDate && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3">
                          Khung giờ trống - {dayjs(selectedDate).format('DD/MM/YYYY')}
                        </h4>
                        
                        {availableSlots.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {availableSlots.map((slot) => (
                              <motion.button
                                key={slot._id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleBookAppointment(slot._id)}
                                className="p-3 border border-[#0C3C54] text-[#0C3C54] rounded-lg hover:bg-[#0C3C54] hover:text-white transition-colors text-sm font-medium"
                              >
                                {slot.slotTime}
                              </motion.button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <Clock size={32} className="mx-auto mb-2 opacity-50" />
                            <p>Không có khung giờ trống</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Book Button */}
                    <Button
                      type="primary"
                      size="large"
                      block
                      className="bg-[#0C3C54] border-[#0C3C54] rounded-lg font-medium h-12"
                      onClick={() => handleBookAppointment()}
                      icon={<Calendar size={20} />}
                    >
                      Đặt lịch ngay
                    </Button>

                    <p className="text-xs text-gray-500 text-center mt-3">
                      * Vui lòng chọn ngày và giờ phù hợp
                    </p>
                  </div>
                </Card>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail; 