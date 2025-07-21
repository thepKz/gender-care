import { Form, Input, message, Rate } from 'antd';
import { motion } from 'framer-motion';
import {
    Heart,
    Location,
    MonitorMobbile,
    Star,
    TickCircle,
    User
} from 'iconsax-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { feedbackApi, CreateFeedbackRequest } from '../../api/endpoints/feedback';
import { appointmentApi } from '../../api/endpoints/appointment';
import ModernCard from '../../components/ui/ModernCard';

const { TextArea } = Input;

interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  packageName?: string;
  doctorId?: string;
  doctorName?: string;
  doctorAvatar?: string;
  appointmentDate: string;
  appointmentTime: string;
  typeLocation: 'online' | 'clinic' | 'home';
  price: number;
  status: string;
}

interface FormValues {
  serviceRating: number;
  doctorRating: number;
  comment: string;
}

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);



  const locationConfig = {
    online: { icon: <MonitorMobbile size={16} />, text: 'Online' },
    clinic: { icon: <Location size={16} />, text: 'Phòng khám' }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const handleSubmit = async (values: FormValues) => {
    console.log('🚀 Form submitted with values:', values);
    console.log('📋 Current appointment:', appointment);
    
    setLoading(true);
    try {
      if (!appointment) {
        console.error('❌ No appointment data');
        message.error('Không tìm thấy thông tin lịch hẹn');
        return;
      }

      // Validate required fields
      if (!values.serviceRating) {
        console.error('❌ Missing serviceRating');
        message.error('Vui lòng đánh giá dịch vụ!');
        return;
      }

      if (!values.doctorRating) {
        console.error('❌ Missing doctorRating');
        message.error('Vui lòng đánh giá bác sĩ!');
        return;
      }

      if (!values.comment) {
        console.error('❌ Missing comment');
        message.error('Vui lòng để lại bình luận!');
        return;
      }

      // Tạo feedback data để gửi lên server
      const feedbackRequest: CreateFeedbackRequest = {
        appointmentId: appointment.id,
        rating: values.serviceRating,
        feedback: values.comment,
        comment: values.comment,
        doctorRating: values.doctorRating,
        serviceQuality: values.serviceRating
      };
      
      console.log('📤 Submitting feedback:', feedbackRequest);
      
      // Gọi API tạo feedback
      const response = await feedbackApi.createFeedback(feedbackRequest);
      
      console.log('📥 API Response:', response);
      
      if (response.success) {
        message.success(response.message || 'Cảm ơn bạn đã đánh giá! Phản hồi của bạn rất quan trọng với chúng tôi.');
        // Navigate back to booking history
        navigate('/booking-history', { 
          state: { 
            refreshData: true,
            feedbackSubmitted: true 
          } 
        });
      } else {
        throw new Error('API returned success: false');
      }
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      message.error('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Load appointment data từ API
  useEffect(() => {
    const loadAppointmentData = async () => {
      const appointmentId = searchParams.get('appointment');
      if (!appointmentId) {
        navigate('/booking-history');
        return;
      }

      try {
        setLoading(true);
        
        // Kiểm tra xem đã có feedback cho appointment này chưa
        try {
          const feedbackResponse = await feedbackApi.getFeedbackByAppointment(appointmentId);
          if (feedbackResponse.success) {
            message.info('Bạn đã đánh giá lịch hẹn này rồi.');
            navigate('/booking-history');
            return;
          }
        } catch {
          // Chưa có feedback, tiếp tục
        }

        // Load appointment details từ API
        const appointmentResponse = await appointmentApi.getAppointmentById(appointmentId);
        console.log('📋 Raw API Response:', appointmentResponse);
        
        // API có thể trả về trực tiếp data hoặc wrapped trong success/data
        let aptData;
        if (appointmentResponse.success && appointmentResponse.data) {
          aptData = appointmentResponse.data;
        } else if (appointmentResponse._id) {
          // Trường hợp API trả về trực tiếp object appointment
          aptData = appointmentResponse;
        } else {
          throw new Error('Không thể tải thông tin lịch hẹn');
        }
        
        console.log('📋 Appointment Data to Transform:', aptData);
        
        // Transform dữ liệu từ API thành format cần thiết
        const transformedAppointment: Appointment = {
          id: aptData._id,
          serviceId: aptData.serviceId?._id || aptData.serviceId || '',
          serviceName: aptData.serviceId?.serviceName || aptData.serviceName || 'Dịch vụ không xác định',
          packageName: aptData.packageId?.name || aptData.packageName,
          doctorId: aptData.doctorId?._id || aptData.doctorId,
          doctorName: aptData.doctorId?.userId?.fullName || aptData.doctorName || 'Bác sĩ không xác định', 
          doctorAvatar: aptData.doctorId?.userId?.avatar || aptData.doctorAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
          appointmentDate: aptData.appointmentDate ? new Date(aptData.appointmentDate).toISOString().split('T')[0] : '',
          appointmentTime: aptData.appointmentTime || '',
          typeLocation: (aptData.typeLocation as 'online' | 'clinic' | 'home') || 'clinic',
          price: aptData.price || aptData.serviceId?.price || aptData.packageId?.price || 0,
          status: aptData.status || 'pending'
        };
        
        console.log('🔄 Transformed appointment:', transformedAppointment);
        console.log('💰 Price debugging:', {
          rawPrice: aptData.price,
          servicePrice: aptData.serviceId?.price,
          packagePrice: aptData.packageId?.price,
          finalPrice: transformedAppointment.price
        });
        
        setAppointment(transformedAppointment);
        
      } catch (error) {
        console.error('Error loading appointment:', error);
        message.error('Không thể tải thông tin lịch hẹn');
        navigate('/booking-history');
      } finally {
        setLoading(false);
      }
    };

    loadAppointmentData();
  }, [searchParams, navigate]);

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Đánh giá dịch vụ
            </h1>
            <p className="text-xl text-gray-600">
              Chia sẻ trải nghiệm của bạn để chúng tôi cải thiện dịch vụ
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Appointment Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <ModernCard variant="glass" className="bg-blue-50/50">
            <div className="flex items-start gap-4 p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                <Heart size={32} variant="Bold" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {appointment.serviceName}
                </h3>
                {appointment.packageName && (
                  <p className="text-blue-600 font-medium mb-2">
                    {appointment.packageName}
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{appointment.doctorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{formatDate(appointment.appointmentDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{appointment.appointmentTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {locationConfig[appointment.typeLocation].icon}
                    <span>{locationConfig[appointment.typeLocation].text}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {formatPrice(appointment.price)}
                </div>
                <div className="text-sm text-gray-500">
                  Đã hoàn thành
                </div>
              </div>
            </div>
          </ModernCard>
        </motion.div>

        {/* Feedback Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ModernCard variant="default" size="large">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Bạn cảm thấy thế nào về dịch vụ?
                </h2>
                <p className="text-gray-600">
                  Đánh giá tổng quan về trải nghiệm của bạn
                </p>
              </div>

              {/* Đánh giá dịch vụ */}
              <div className="text-center space-y-4">
                <Form.Item
                  name="serviceRating"
                  label={<span className="text-lg font-semibold text-gray-900">Đánh giá dịch vụ</span>}
                  rules={[{ required: true, message: 'Vui lòng đánh giá dịch vụ!' }]}
                >
                  <Rate
                    character={<Star size={40} variant="Bold" />}
                    className="text-5xl text-yellow-400"
                  />
                </Form.Item>
              </div>

              {/* Đánh giá bác sĩ */}
              <div className="text-center space-y-4">
                <Form.Item
                  name="doctorRating"
                  label={<span className="text-lg font-semibold text-gray-900">Đánh giá bác sĩ: {appointment.doctorName}</span>}
                  rules={[{ required: true, message: 'Vui lòng đánh giá bác sĩ!' }]}
                >
                  <Rate
                    character={<Star size={40} variant="Bold" />}
                    className="text-5xl text-yellow-400"
                  />
                </Form.Item>
              </div>

              {/* Bình luận */}
              <div className="space-y-4">
                <Form.Item
                  name="comment"
                  label={<span className="text-lg font-semibold text-gray-900">Bình luận về trải nghiệm</span>}
                  rules={[{ required: true, message: 'Vui lòng để lại bình luận!' }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ và bác sĩ..."
                    showCount
                    maxLength={500}
                    className="text-base"
                  />
                </Form.Item>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <div className="flex gap-4 justify-center items-center">
                  <button
                    type="button"
                    onClick={() => navigate('/booking-history')}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium text-base"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    onClick={() => console.log('🔘 Submit button clicked')}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base min-w-[200px] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <TickCircle size={20} />
                        Gửi đánh giá
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Form>
          </ModernCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Feedback; 