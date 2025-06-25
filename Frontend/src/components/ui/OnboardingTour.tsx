import React from 'react';
import { Modal, Steps, Button } from 'antd';
import { 
  HeartOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined, 
  BookOutlined, 
  BulbOutlined, 
  MedicineBoxOutlined,
  PlusOutlined,
  SettingOutlined,
  StarOutlined,
  RocketOutlined
} from '@ant-design/icons';

interface OnboardingTourProps {
  visible: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ 
  visible, 
  currentStep, 
  onNext, 
  onPrev, 
  onComplete 
}) => {
  const steps = [
    {
      title: 'Chào mừng đến với Phương pháp Billings',
      content: (
        <div className="text-center space-y-10 py-8">
          <div className="space-y-6">
            <div className="w-24 h-24 mx-auto bg-gray-900 rounded-full flex items-center justify-center shadow-xl">
              <HeartOutlined className="text-4xl text-white" />
            </div>
            <h2 className="text-4xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
              Chào mừng bạn đến với
            </h2>
            <h3 className="text-3xl font-bold text-gray-900">
              Phương pháp Billings
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Hãy cùng bắt đầu hành trình theo dõi chu kỳ tự nhiên, an toàn và khoa học 
              được tin dùng bởi hàng triệu phụ nữ trên toàn thế giới
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-3xl mx-auto shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mr-4">
                <MedicineBoxOutlined className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                Phương pháp tự nhiên, an toàn và hiệu quả
              </h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-gray-700">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircleOutlined className="text-xl text-white" />
                </div>
                <p className="font-medium">Được WHO khuyến nghị</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <StarOutlined className="text-xl text-white" />
                </div>
                <p className="font-medium">96% độ chính xác</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HeartOutlined className="text-xl text-white" />
                </div>
                <p className="font-medium">Hoàn toàn tự nhiên</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Tạo chu kỳ đầu tiên',
      content: (
        <div className="space-y-10 py-8">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gray-900 rounded-full flex items-center justify-center shadow-xl">
              <PlusOutlined className="text-4xl text-white" />
            </div>
            <h2 className="text-4xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
              Bước đầu tiên
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Tạo chu kỳ theo dõi đầu tiên để bắt đầu hành trình của bạn
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mr-4">
                  <BulbOutlined className="text-2xl text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Cách thực hiện:
                </h3>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-4 mx-auto">1</div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-center">Tạo chu kỳ mới</h4>
                  <p className="text-gray-700 text-center leading-relaxed">
                    Nhấn nút "Tạo chu kỳ mới" trên trang chính
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-4 mx-auto">2</div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-center">Chọn ngày bắt đầu</h4>
                  <p className="text-gray-700 text-center leading-relaxed">
                    Chọn ngày đầu tiên có kinh nguyệt của chu kỳ hiện tại
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-4 mx-auto">3</div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-center">Hoàn thành</h4>
                  <p className="text-gray-700 text-center leading-relaxed">
                    Hệ thống tự động tạo chu kỳ theo dõi cho bạn
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <StarOutlined className="text-xl text-white" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">Lưu ý quan trọng</p>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                Bạn cần theo dõi ít nhất <strong>3 chu kỳ liên tiếp</strong> để có kết quả chính xác nhất 
                và hiểu rõ pattern chu kỳ của mình.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Cách ghi nhận dữ liệu hàng ngày',
      content: (
        <div className="space-y-10 py-8">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gray-900 rounded-full flex items-center justify-center shadow-xl">
              <BookOutlined className="text-4xl text-white" />
            </div>
            <h2 className="text-4xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
              Quan sát hàng ngày
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Ghi nhận quan sát mỗi tối để có kết quả chính xác. Đây là bước quan trọng nhất trong phương pháp Billings.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center mr-4">
                  <HeartOutlined className="text-xl text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Quan sát chất nhờn
                </h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Có máu</span>
                    <span className="text-sm bg-red-500 text-white px-3 py-1 rounded-full font-medium">M</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Đục</span>
                    <span className="text-sm bg-purple-500 text-white px-3 py-1 rounded-full font-medium">C</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-blue-600 hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Trong và âm hộ căng</span>
                    <span className="text-sm bg-orange-500 text-white px-3 py-1 rounded-full font-bold">X</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Ít chất tiết</span>
                    <span className="text-sm bg-gray-500 text-white px-3 py-1 rounded-full font-medium">D</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center mr-4">
                  <CheckCircleOutlined className="text-xl text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Cảm giác âm đạo
                </h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Ướt</span>
                    <span className="text-sm text-gray-600 font-medium">Cảm giác ẩm ướt</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Dính</span>
                    <span className="text-sm text-gray-600 font-medium">Hơi dính chất</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-blue-600 hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Trơn</span>
                    <span className="text-sm text-gray-700 font-bold">Rất mượt mà ⭐</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Khô</span>
                    <span className="text-sm text-gray-600 font-medium">Khô ráo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <CalendarOutlined className="text-xl text-white" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">Thời gian tốt nhất</p>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                Quan sát vào <strong>buổi tối, trước khi đi ngủ</strong> để có kết quả chính xác nhất. 
                Hãy kiên trì thực hiện hàng ngày.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Hiểu ký hiệu trên lịch',
      content: (
        <div className="space-y-10 py-8">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gray-900 rounded-full flex items-center justify-center shadow-xl">
              <StarOutlined className="text-4xl text-white" />
            </div>
            <h2 className="text-4xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
              Bảng ký hiệu và màu sắc
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Mỗi ký hiệu và màu sắc có ý nghĩa riêng trong chu kỳ của bạn. Hãy nắm vững để theo dõi hiệu quả.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 text-white rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-xl shadow-md">M</div>
                <h4 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Kinh nguyệt
                </h4>
                <p className="text-gray-600 text-sm">Có máu</p>
              </div>
            </div>
            <div className="bg-white border-2 border-blue-600 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 text-white rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-xl shadow-md">X</div>
                <h4 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Ngày đỉnh
                </h4>
                <p className="text-gray-600 text-sm font-bold">🌟 Quan trọng</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500 text-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-xl shadow-md">1</div>
                <h4 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Sau đỉnh
                </h4>
                <p className="text-gray-600 text-sm">Theo dõi</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 text-white rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-xl shadow-md">C</div>
                <h4 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Có thể thụ thai
                </h4>
                <p className="text-gray-600 text-sm">Chú ý</p>
              </div>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <BulbOutlined className="text-xl text-white" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">Ngày X là quan trọng nhất</p>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                Khi chọn <strong>"Trong và âm hộ căng" + "Trơn"</strong>, hệ thống sẽ tự động đánh dấu đây là ngày đỉnh 
                và tạo các ngày theo dõi tiếp theo.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Sẵn sàng bắt đầu',
      content: (
        <div className="text-center space-y-10 py-8">
          <div className="space-y-6">
            <div className="w-24 h-24 mx-auto bg-gray-900 rounded-full flex items-center justify-center shadow-xl">
              <RocketOutlined className="text-4xl text-white" />
            </div>
            <h2 className="text-4xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
              Bạn đã sẵn sàng!
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Hãy bắt đầu theo dõi chu kỳ của mình. Nhớ ghi nhận dữ liệu mỗi ngày để có kết quả chính xác nhất.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mr-4">
                  <SettingOutlined className="text-2xl text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Các tính năng hữu ích
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircleOutlined className="text-white text-sm" />
                      </div>
                      <span className="font-medium text-gray-900">Nhắc nhở hàng ngày lúc 8h tối</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircleOutlined className="text-white text-sm" />
                      </div>
                      <span className="font-medium text-gray-900">Validation thông minh khi nhập sai</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircleOutlined className="text-white text-sm" />
                      </div>
                      <span className="font-medium text-gray-900">Bảng chi tiết theo phương pháp Billings</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircleOutlined className="text-white text-sm" />
                      </div>
                      <span className="font-medium text-gray-900">Trợ giúp luôn có sẵn khi cần</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-3xl mx-auto shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                <HeartOutlined className="text-xl text-white" />
              </div>
              <p className="text-gray-900 font-semibold text-lg">Chúc bạn thành công!</p>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              Nếu có thắc mắc, hãy nhấn nút <strong>"Trợ giúp"</strong> bất cứ lúc nào. 
              Chúng tôi luôn sẵn sàng hỗ trợ bạn.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <Modal
      title={
        <div className="text-center py-8 bg-white -mx-6 -mt-6 mb-6 border-b border-gray-200">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
            <RocketOutlined className="text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
            Hướng dẫn sử dụng nhanh
          </h1>
          <div className="max-w-5xl mx-auto">
            <Steps
              current={currentStep}
              size="small"
              items={steps.map((step, index) => ({
                title: index === currentStep ? step.title : '',
                status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait'
              }))}
              className="onboarding-steps"
            />
          </div>
          <div className="mt-6 inline-flex items-center px-4 py-2 bg-gray-50 rounded-full border border-gray-300">
            <HeartOutlined className="text-blue-600 mr-2" />
            <span className="text-gray-800 font-medium text-sm">
              Chỉ mất 2 phút để bắt đầu
            </span>
          </div>
        </div>
      }
      open={visible}
      onCancel={onComplete}
      footer={
        <div className="bg-white -mx-6 -mb-6 border-t border-gray-200">
          <div className="flex justify-between items-center py-6 px-6">
            <Button 
              onClick={onPrev} 
              disabled={currentStep === 0}
              size="large"
              className="px-8 py-3 h-auto text-base font-medium border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 rounded-lg"
              style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}
            >
              ← Quay lại
            </Button>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 font-medium">
                {currentStep + 1} / {steps.length}
              </span>
              <div className="flex items-center space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentStep ? 'bg-purple-600 scale-125' : 
                      index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {currentStep < steps.length - 1 ? (
              <Button 
                type="primary" 
                onClick={onNext}
                size="large"
                className="px-8 py-3 h-auto text-base font-semibold bg-gray-900 hover:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}
              >
                Tiếp theo →
              </Button>
            ) : (
              <Button 
                type="primary" 
                onClick={onComplete}
                size="large"
                className="px-12 py-3 h-auto text-lg font-bold bg-gray-900 hover:bg-gray-800 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-lg"
                style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}
              >
                <RocketOutlined className="mr-2" />
                Bắt đầu sử dụng
              </Button>
            )}
          </div>
          
          <div className="text-center pb-4">
            <p className="text-xs text-gray-500">
              Bạn có thể xem lại hướng dẫn này bất cứ lúc nào bằng cách nhấn nút "Hướng dẫn"
            </p>
          </div>
        </div>
      }
      width={1100}
      centered
      closable={false}
      maskClosable={false}
      className="onboarding-modal overflow-hidden"
      styles={{
        body: { 
          padding: '0 24px 0 24px',
          maxHeight: '70vh',
          overflowY: 'auto'
        },
        header: { 
          padding: 0,
          border: 'none',
          marginBottom: 0
        },
        footer: {
          padding: 0,
          border: 'none'
        }
      }}
    >
      <div className="min-h-[500px] flex items-center justify-center px-4">
        {currentStepData.content}
      </div>
    </Modal>
  );
};

export default OnboardingTour; 