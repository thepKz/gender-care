import React, { useState } from 'react';
import { Modal, Button, Progress } from 'antd';
import { 
  CalendarOutlined, 
  EditOutlined, 
  BookOutlined, 
  BellOutlined, 
  LineChartOutlined,
  RightOutlined,
  LeftOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

interface OnboardingTourProps {
  visible: boolean;
  onClose: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ visible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Chào mừng đến với Theo dõi Chu kỳ Kinh nguyệt',
      icon: <CalendarOutlined className="text-xl text-blue-600" />,
      content: (
        <div className="space-y-4">
          <div className="text-center py-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-center space-x-4">
              <CalendarOutlined className="text-3xl text-blue-600" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bắt đầu hành trình theo dõi chu kỳ của bạn
                </h3>
                <p className="text-gray-600 text-sm">
                  Ứng dụng được thiết kế dựa trên phương pháp Billings - được WHO khuyến nghị
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-2xl border border-gray-200 text-center">
              <EditOutlined className="text-lg text-green-600 mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1 text-sm">Ghi nhận dễ dàng</h4>
              <p className="text-gray-600 text-xs">Interface đơn giản, thao tác nhanh chóng</p>
            </div>
            
            <div className="bg-white p-3 rounded-2xl border border-gray-200 text-center">
              <LineChartOutlined className="text-lg text-purple-600 mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1 text-sm">Phân tích thông minh</h4>
              <p className="text-gray-600 text-xs">Dự đoán chu kỳ và thời gian quan trọng</p>
            </div>
            
            <div className="bg-white p-3 rounded-2xl border border-gray-200 text-center">
              <BellOutlined className="text-lg text-orange-600 mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1 text-sm">Nhắc nhở thông minh</h4>
              <p className="text-gray-600 text-xs">Không bao giờ bỏ lỡ việc ghi nhận</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Bước 1: Ghi nhận hàng ngày',
      icon: <EditOutlined className="text-xl text-green-600" />,
      content: (
        <div className="space-y-4">
          <div className="text-center py-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-center space-x-4">
              <EditOutlined className="text-3xl text-green-600" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Quan sát và ghi nhận
                </h3>
                <p className="text-gray-600 text-sm">
                  Mỗi tối, dành 2-3 phút để quan sát và ghi nhận những thay đổi của cơ thể
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs mt-1">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Chọn quan sát chất nhờn</h4>
                  <p className="text-gray-700 mb-2 text-xs">
                    Có máu, Đục, Đục nhiều sợi, Trong và âm hộ căng, Ít chất tiết
                  </p>
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <p className="text-xs text-gray-600">
                      💡 Quan sát tại cửa âm đạo, không dùng giấy vệ sinh
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs mt-1">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Chọn cảm giác</h4>
                  <p className="text-gray-700 mb-2 text-xs">
                    Khô, Ẩm, Ướt, Trơn - cảm giác tại âm đạo
                  </p>
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <p className="text-xs text-gray-600">
                      ⚡ Hệ thống sẽ tự động kiểm tra kết hợp đúng/sai
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Bước 2: Hiểu ký hiệu và màu sắc',
      icon: <BookOutlined className="text-xl text-purple-600" />,
      content: (
        <div className="space-y-4">
          <div className="text-center py-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-center space-x-4">
              <BookOutlined className="text-3xl text-purple-600" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bảng ký hiệu màu sắc
                </h3>
                <p className="text-gray-600 text-sm">
                  Mỗi màu sắc và ký hiệu có ý nghĩa riêng, giúp bạn dễ dàng nhận biết giai đoạn hiện tại
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs">
                M
              </div>
              <h4 className="font-semibold text-gray-900 text-xs mb-1">Kinh nguyệt</h4>
              <p className="text-gray-600 text-xs">Có máu</p>
            </div>
            
            <div className="bg-white border-2 border-orange-500 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs">
                X
              </div>
              <h4 className="font-semibold text-gray-900 text-xs mb-1">Ngày đỉnh</h4>
              <p className="text-gray-600 text-xs">Quan trọng nhất</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs">
                C
              </div>
              <h4 className="font-semibold text-gray-900 text-xs mb-1">Có thể thụ thai</h4>
              <p className="text-gray-600 text-xs">Chất nhờn đục</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 bg-gray-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs">
                D
              </div>
              <h4 className="font-semibold text-gray-900 text-xs mb-1">Khô</h4>
              <p className="text-gray-600 text-xs">Ít/không tiết</p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-3">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
              <CheckCircleOutlined className="text-green-600 mr-2" />
              Lưu ý quan trọng
            </h4>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1 text-gray-700 text-xs">
                <p>• Màu cam (X) = Ngày đỉnh - quan trọng nhất trong chu kỳ</p>
                <p>• Sau ngày X, hệ thống tự động tạo các ngày 1, 2, 3...</p>
              </div>
              <div className="space-y-1 text-gray-700 text-xs">
                <p>• Quan sát liên tục ít nhất 3 chu kỳ để có kết quả chính xác</p>
                <p>• Mỗi ký hiệu và màu đại diện cho giai đoạn khác nhau</p>
              </div>
              <div className="space-y-1 text-gray-700 text-xs">
                <p>• Ghi nhận vào cùng thời điểm mỗi ngày</p>
                <p>• Dựa vào cảm giác thực tế, không đoán</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Bước 3: Thiết lập nhắc nhở',
      icon: <BellOutlined className="text-xl text-orange-600" />,
      content: (
        <div className="space-y-4">
          <div className="text-center py-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-center space-x-4">
              <BellOutlined className="text-3xl text-orange-600" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nhắc nhở thông minh
                </h3>
                <p className="text-gray-600 text-sm">
                  Đặt nhắc nhở để không bao giờ quên ghi nhận. Tính nhất quán là chìa khóa thành công
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs mt-1">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Chọn thời gian phù hợp</h4>
                  <p className="text-gray-700 text-xs">Thường là 21:00 - 22:00 mỗi tối</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs mt-1">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Đặt nhắc nhở hàng ngày</h4>
                  <p className="text-gray-700 text-xs">Để duy trì thói quen quan sát</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs mt-1">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Tùy chỉnh thông báo</h4>
                  <p className="text-gray-700 text-xs">Cá nhân hóa nội dung nhắc nhở</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                  <CalendarOutlined className="text-blue-600 mr-2" />
                  Nhắc nhở thông minh
                </h4>
                <div className="space-y-1 text-gray-700 text-xs">
                  <p>• Nhắc nhở ghi nhận hàng ngày</p>
                  <p>• Cảnh báo khi quên ghi nhận</p>
                  <p>• Thông báo giai đoạn quan trọng</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                  <CheckCircleOutlined className="text-green-600 mr-2" />
                  Lợi ích
                </h4>
                <div className="space-y-1 text-gray-700 text-xs">
                  <p>• Duy trì thói quen quan sát đều đặn</p>
                  <p>• Không bỏ lỡ thông tin quan trọng</p>
                  <p>• Tăng độ chính xác của dữ liệu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Sẵn sàng bắt đầu!',
      icon: <CheckCircleOutlined className="text-xl text-green-600" />,
      content: (
        <div className="space-y-4">
          <div className="text-center py-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl">
            <div className="flex items-center justify-center space-x-4">
              <CheckCircleOutlined className="text-3xl text-green-600" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bạn đã sẵn sàng!
                </h3>
                <p className="text-gray-600 text-sm">
                  Bắt đầu hành trình tự nhiên với phương pháp Billings - được WHO khuyến nghị
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                🚀 Bắt đầu ngay hôm nay
              </h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700 text-xs">Quan sát và ghi nhận vào buổi tối</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700 text-xs">Đặt nhắc nhở cho phù hợp</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700 text-xs">Kiên trì trong ít nhất 3 chu kỳ</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                📚 Luôn có hỗ trợ
              </h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">?</span>
                  </div>
                  <span className="text-gray-700 text-xs">Nhấn "Trợ giúp" để xem lại hướng dẫn</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <span className="text-gray-700 text-xs">Hệ thống validation sẽ hỗ trợ bạn</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">💡</span>
                  </div>
                  <span className="text-gray-700 text-xs">Tooltips và gợi ý luôn sẵn sàng</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border-2 border-green-500 rounded-2xl p-3 text-center">
            <h4 className="font-semibold text-green-800 mb-2 text-sm">
              🌟 Phương pháp Billings - Được WHO khuyến nghị
            </h4>
            <p className="text-green-700 text-xs">
              Một phương pháp tự nhiên, an toàn và hiệu quả để hiểu rõ chu kỳ của bạn.
              Hãy kiên nhẫn và nhất quán - kết quả sẽ đến!
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {steps[currentStep].icon}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {steps[currentStep].title}
              </h1>
              <p className="text-sm text-gray-600">
                Bước {currentStep + 1} / {steps.length}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Progress 
              percent={((currentStep + 1) / steps.length) * 100} 
              size="small"
              strokeColor="#10b981"
              className="w-20"
            />
            <span className="text-xs text-gray-500 font-medium">
              {currentStep + 1}/{steps.length}
            </span>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <div className="flex justify-between items-center">
          <Button 
            onClick={prevStep} 
            disabled={currentStep === 0}
            className="flex items-center space-x-2 rounded-2xl"
          >
            <LeftOutlined className="text-xs" />
            <span>Quay lại</span>
          </Button>
          
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep === steps.length - 1 ? (
            <Button 
              type="primary" 
              onClick={handleFinish}
              className="flex items-center space-x-2 rounded-2xl bg-green-600 hover:bg-green-700 border-0"
            >
              <CheckCircleOutlined />
              <span>Bắt đầu sử dụng</span>
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={nextStep}
              className="flex items-center space-x-2 rounded-2xl"
            >
              <span>Tiếp theo</span>
              <RightOutlined className="text-xs" />
            </Button>
          )}
        </div>
      }
      width="95%"
      style={{ maxWidth: '1000px' }}
      className="onboarding-modal"
    >
      <div className="mt-4">
        {steps[currentStep].content}
      </div>
    </Modal>
  );
};

export default OnboardingTour; 