import { Form, Input, message, Progress, Rate, Select, Upload } from 'antd';
import { motion } from 'framer-motion';
import {
    Camera,
    Heart,
    Home,
    Location,
    MonitorMobbile,
    Star,
    TickCircle,
    User
} from 'iconsax-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ModernButton from '../../components/ui/ModernButton';
import ModernCard from '../../components/ui/ModernCard';

const { Option } = Select;

const { TextArea } = Input;

interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  packageName?: string;
  doctorName?: string;
  doctorAvatar?: string;
  appointmentDate: string;
  appointmentTime: string;
  typeLocation: 'online' | 'clinic' | 'home';
  price: number;
  status: string;
}

interface FeedbackData {
  appointmentId: string;
  overallRating: number;
  serviceQuality: number;
  doctorRating: number;
  facilityRating: number;
  valueForMoney: number;
  recommendation: number;
  positiveAspects: string[];
  improvements: string[];
  detailedFeedback: string;
  wouldRecommend: boolean;
  images?: File[];
}

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [feedbackData, setFeedbackData] = useState<Partial<FeedbackData>>({});

  // Mock appointment data
  const mockAppointment: Appointment = {
    id: 'apt1',
    serviceId: 'consultation',
    serviceName: 'Tư vấn sức khỏe',
    doctorName: 'BS. Nguyễn Thị Hương',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    appointmentDate: '2024-01-15',
    appointmentTime: '09:00',
    typeLocation: 'clinic',
    price: 500000,
    status: 'completed'
  };

  const locationConfig = {
    online: { icon: <MonitorMobbile size={16} />, text: 'Online' },
    clinic: { icon: <Location size={16} />, text: 'Phòng khám' }
  };

  const positiveOptions = [
    'Bác sĩ tận tâm và chuyên nghiệp',
    'Thời gian chờ đợi ngắn',
    'Cơ sở vật chất hiện đại',
    'Nhân viên thân thiện',
    'Giải thích rõ ràng, dễ hiểu',
    'Quy trình khám nhanh gọn',
    'Giá cả hợp lý',
    'Bảo mật thông tin tốt',
    'Dịch vụ chăm sóc sau khám',
    'Thuận tiện về địa điểm'
  ];

  const improvementOptions = [
    'Cần cải thiện thời gian chờ đợi',
    'Nâng cấp cơ sở vật chất',
    'Tăng cường đào tạo nhân viên',
    'Cải thiện quy trình đặt lịch',
    'Tăng thời gian tư vấn',
    'Giảm chi phí dịch vụ',
    'Cải thiện hệ thống thanh toán',
    'Tăng cường bảo mật thông tin',
    'Mở rộng giờ làm việc',
    'Cải thiện dịch vụ hỗ trợ'
  ];

  const steps = [
    { title: 'Đánh giá tổng quan', description: 'Đánh giá chung về dịch vụ' },
    { title: 'Đánh giá chi tiết', description: 'Đánh giá từng khía cạnh' },
    { title: 'Phản hồi chi tiết', description: 'Chia sẻ trải nghiệm cụ thể' },
    { title: 'Hoàn thành', description: 'Xác nhận và gửi đánh giá' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
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

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalFeedback = {
        ...feedbackData,
        ...values,
        appointmentId: appointment?.id
      };
      
      console.log('Feedback submitted:', finalFeedback);
      message.success('Cảm ơn bạn đã đánh giá! Phản hồi của bạn rất quan trọng với chúng tôi.');
      
      // Navigate back to booking history
      navigate('/booking-history');
    } catch {
      message.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const appointmentId = searchParams.get('appointment');
    if (appointmentId) {
      // In real app, fetch appointment data from API
      setAppointment(mockAppointment);
    } else {
      navigate('/booking-history');
    }
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

      {/* Progress */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Bước {currentStep + 1} / {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {steps[currentStep].title}
            </span>
          </div>
          <Progress 
            percent={((currentStep + 1) / steps.length) * 100} 
            showInfo={false}
            strokeColor="#3b82f6"
          />
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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-8"
        >
          {/* Step 1: Overall Rating */}
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <ModernCard variant="default" size="large">
                <div className="text-center space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Bạn cảm thấy thế nào về dịch vụ?
                    </h2>
                    <p className="text-gray-600">
                      Đánh giá tổng quan về trải nghiệm của bạn
                    </p>
                  </div>

                  <div className="space-y-6">
                    <Form.Item
                      name="overallRating"
                      rules={[{ required: true, message: 'Vui lòng đánh giá!' }]}
                    >
                      <div className="text-center">
                                                 <Rate
                           character={<Star size={32} variant="Bold" />}
                           className="text-4xl"
                           onChange={(value) => setFeedbackData(prev => ({ ...prev, overallRating: value }))}
                         />
                        <div className="mt-4 text-lg text-gray-600">
                          {feedbackData.overallRating === 5 && "Xuất sắc! 🌟"}
                          {feedbackData.overallRating === 4 && "Rất tốt! 👍"}
                          {feedbackData.overallRating === 3 && "Tốt 👌"}
                          {feedbackData.overallRating === 2 && "Cần cải thiện 😐"}
                          {feedbackData.overallRating === 1 && "Không hài lòng 😞"}
                        </div>
                      </div>
                    </Form.Item>

                    <Form.Item
                      name="wouldRecommend"
                      label="Bạn có giới thiệu dịch vụ này cho người khác không?"
                      rules={[{ required: true, message: 'Vui lòng chọn!' }]}
                    >
                      <Select size="large" placeholder="Chọn câu trả lời">
                        <Option value={true}>Có, tôi sẽ giới thiệu</Option>
                        <Option value={false}>Không, tôi sẽ không giới thiệu</Option>
                      </Select>
                    </Form.Item>
                  </div>
                </div>
              </ModernCard>
            </motion.div>
          )}

          {/* Step 2: Detailed Ratings */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <ModernCard variant="default" size="large">
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Đánh giá chi tiết
                    </h2>
                    <p className="text-gray-600">
                      Đánh giá từng khía cạnh của dịch vụ
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                                             <Form.Item
                         name="serviceQuality"
                         label="Chất lượng dịch vụ"
                         rules={[{ required: true, message: 'Vui lòng đánh giá!' }]}
                       >
                         <Rate character={<Star size={20} variant="Bold" />} />
                       </Form.Item>

                       <Form.Item
                         name="doctorRating"
                         label="Bác sĩ/Nhân viên y tế"
                         rules={[{ required: true, message: 'Vui lòng đánh giá!' }]}
                       >
                         <Rate character={<Star size={20} variant="Bold" />} />
                       </Form.Item>

                       <Form.Item
                         name="facilityRating"
                         label="Cơ sở vật chất"
                         rules={[{ required: true, message: 'Vui lòng đánh giá!' }]}
                       >
                         <Rate character={<Star size={20} variant="Bold" />} />
                       </Form.Item>
                    </div>

                    <div className="space-y-6">
                                             <Form.Item
                         name="valueForMoney"
                         label="Giá trị so với chi phí"
                         rules={[{ required: true, message: 'Vui lòng đánh giá!' }]}
                       >
                         <Rate character={<Star size={20} variant="Bold" />} />
                       </Form.Item>

                       <Form.Item
                         name="recommendation"
                         label="Mức độ giới thiệu"
                         rules={[{ required: true, message: 'Vui lòng đánh giá!' }]}
                       >
                         <Rate character={<Star size={20} variant="Bold" />} />
                       </Form.Item>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-700">
                          <strong>Gợi ý đánh giá:</strong>
                          <ul className="mt-2 space-y-1 text-xs">
                            <li>⭐ = Rất không hài lòng</li>
                            <li>⭐⭐ = Không hài lòng</li>
                            <li>⭐⭐⭐ = Bình thường</li>
                            <li>⭐⭐⭐⭐ = Hài lòng</li>
                            <li>⭐⭐⭐⭐⭐ = Rất hài lòng</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ModernCard>
            </motion.div>
          )}

          {/* Step 3: Detailed Feedback */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-8">
                <ModernCard variant="default" size="large">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Chia sẻ trải nghiệm
                      </h2>
                      <p className="text-gray-600">
                        Phản hồi chi tiết giúp chúng tôi cải thiện dịch vụ
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Positive Aspects */}
                      <div>
                        <Form.Item
                          name="positiveAspects"
                          label="Điểm tích cực (chọn tất cả phù hợp)"
                        >
                          <Select
                            mode="multiple"
                            size="large"
                            placeholder="Chọn những điểm bạn hài lòng"
                            options={positiveOptions.map(option => ({
                              label: option,
                              value: option
                            }))}
                          />
                        </Form.Item>
                      </div>

                      {/* Improvements */}
                      <div>
                        <Form.Item
                          name="improvements"
                          label="Cần cải thiện (chọn tất cả phù hợp)"
                        >
                          <Select
                            mode="multiple"
                            size="large"
                            placeholder="Chọn những điểm cần cải thiện"
                            options={improvementOptions.map(option => ({
                              label: option,
                              value: option
                            }))}
                          />
                        </Form.Item>
                      </div>
                    </div>

                    <Form.Item
                      name="detailedFeedback"
                      label="Phản hồi chi tiết"
                    >
                      <TextArea
                        rows={6}
                        placeholder="Chia sẻ chi tiết về trải nghiệm của bạn: điều gì bạn thích nhất? Có điều gì cần cải thiện không? Bạn có gợi ý nào khác?"
                        showCount
                        maxLength={1000}
                      />
                    </Form.Item>

                    {/* Image Upload */}
                    <Form.Item
                      name="images"
                      label="Hình ảnh (tùy chọn)"
                    >
                      <Upload.Dragger
                        name="files"
                        multiple
                        accept="image/*"
                        beforeUpload={() => false}
                        className="border-dashed border-2 border-gray-300 rounded-lg p-6"
                      >
                        <div className="text-center">
                          <Camera size={48} className="mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium text-gray-700 mb-2">
                            Thêm hình ảnh
                          </p>
                          <p className="text-sm text-gray-500">
                            Kéo thả hoặc click để chọn hình ảnh
                          </p>
                        </div>
                      </Upload.Dragger>
                    </Form.Item>
                  </div>
                </ModernCard>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <ModernCard variant="default" size="large">
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Xem lại đánh giá
                    </h2>
                    <p className="text-gray-600">
                      Kiểm tra lại thông tin trước khi gửi
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Rating Summary */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Tóm tắt đánh giá
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Đánh giá tổng quan:</span>
                          <Rate disabled value={form.getFieldValue('overallRating')} className="text-sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Chất lượng dịch vụ:</span>
                                                      <Rate disabled value={form.getFieldValue('serviceQuality')} className="text-sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Bác sĩ/Nhân viên:</span>
                          <Rate disabled value={form.getFieldValue('doctorRating')} className="text-sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Cơ sở vật chất:</span>
                          <Rate disabled value={form.getFieldValue('facilityRating')} className="text-sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Giá trị/Chi phí:</span>
                          <Rate disabled value={form.getFieldValue('valueForMoney')} className="text-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Feedback Summary */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Phản hồi của bạn
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Giới thiệu:</span>
                          <p className="text-gray-800">
                            {form.getFieldValue('wouldRecommend') ? 'Có' : 'Không'}
                          </p>
                        </div>
                        {form.getFieldValue('detailedFeedback') && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Chi tiết:</span>
                            <p className="text-gray-800 text-sm">
                              {form.getFieldValue('detailedFeedback')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <TickCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-green-800 mb-2">
                          Cảm ơn bạn đã dành thời gian đánh giá!
                        </h4>
                        <p className="text-green-700 text-sm">
                          Phản hồi của bạn giúp chúng tôi cải thiện chất lượng dịch vụ và mang đến trải nghiệm tốt hơn cho tất cả khách hàng.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ModernCard>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-8">
            {currentStep > 0 ? (
              <ModernButton
                variant="outline"
                onClick={handlePrev}
                icon={<span className="rotate-180">→</span>}
              >
                Quay lại
              </ModernButton>
            ) : (
              <ModernButton
                variant="outline"
                onClick={() => navigate('/booking-history')}
              >
                Hủy bỏ
              </ModernButton>
            )}

            {currentStep < steps.length - 1 ? (
              <ModernButton
                variant="primary"
                onClick={handleNext}
                icon={<span>→</span>}
                iconPosition="right"
              >
                Tiếp tục
              </ModernButton>
            ) : (
              <ModernButton
                variant="primary"
                htmlType="submit"
                loading={loading}
                icon={<TickCircle size={20} />}
                iconPosition="right"
                size="large"
              >
                Gửi đánh giá
              </ModernButton>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Feedback; 