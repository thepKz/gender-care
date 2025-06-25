import React from 'react';
import { Modal, Tabs, Button } from 'antd';
import { HeartOutlined, CalendarOutlined, CheckCircleOutlined, BookOutlined, BulbOutlined, MedicineBoxOutlined } from '@ant-design/icons';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose }) => {
  const items = [
    {
      key: '1',
      label: 'Phương pháp Billings',
      children: (
        <div className="space-y-10">
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-900 rounded-full flex items-center justify-center">
                <MedicineBoxOutlined className="text-2xl text-white" />
              </div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                Phương pháp Billings
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Phương pháp nhận biết khả năng sinh sản tự nhiên được khuyến nghị bởi WHO, 
                dựa trên quan sát chất nhờn cổ tử cung và cảm giác âm đạo
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircleOutlined className="text-xl text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Mục tiêu
                </h3>
              </div>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">Xác định ngày đỉnh - khả năng thụ thai cao nhất</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">Theo dõi 3 chu kỳ để đưa ra kết luận chính xác</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">Dự đoán chu kỳ và thời gian an toàn</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">Hỗ trợ kế hoạch gia đình tự nhiên</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mr-4">
                  <CalendarOutlined className="text-xl text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Thời gian
                </h3>
              </div>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">Quan sát hàng ngày vào buổi tối</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">Ghi nhận trong 3 chu kỳ liên tiếp</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">Mỗi chu kỳ khoảng 28-35 ngày</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="leading-relaxed">Cần kiên nhẫn và nhất quán</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: '2',
      label: 'Quan sát chất nhờn',
      children: (
        <div className="space-y-10">
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-900 rounded-full flex items-center justify-center">
                <BookOutlined className="text-2xl text-white" />
              </div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                Hướng dẫn quan sát
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Quan sát chất nhờn vào buổi tối, trước khi đi ngủ, tại cửa âm đạo.
                Đây là chìa khóa để hiểu chu kỳ của bạn.
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                    Có máu / Lấm tấm máu
                  </h3>
                </div>
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Kinh nguyệt
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">Thời kỳ kinh nguyệt - Cảm giác: <strong>Ướt</strong></p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                    Đục
                  </h3>
                </div>
                <div className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Có thể thụ thai
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">Cảm giác: <strong>Dính, Ẩm</strong></p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                    Đục nhiều sợi / Trong nhiều sợi
                  </h3>
                </div>
                <div className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Có thể thụ thai
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">Cảm giác: <strong>Ướt, Trơn</strong></p>
            </div>
            
            <div className="bg-white border-2 border-blue-600 rounded-lg p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">X</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                    Trong và âm hộ căng
                  </h3>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                  NGÀY ĐỈNH
                </div>
              </div>
              <p className="text-gray-900 font-semibold text-lg mb-2">🌟 NGÀY X - Cảm giác: <strong>Trơn</strong></p>
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                <BulbOutlined className="mr-2" />
                Khả năng thụ thai cao nhất. Hệ thống sẽ tự động tạo các ngày theo dõi tiếp theo.
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">D</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                    Ít chất tiết
                  </h3>
                </div>
                <div className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Khô
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">Cảm giác: <strong>Ẩm, Ướt</strong></p>
            </div>
          </div>
        </div>
      )
    },
    {
      key: '3',
      label: 'Ký hiệu và màu sắc',
      children: (
        <div className="space-y-10">
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-900 rounded-full flex items-center justify-center">
                <HeartOutlined className="text-2xl text-white" />
              </div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                Bảng ký hiệu và màu sắc
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Mỗi ký hiệu và màu sắc đại diện cho một giai đoạn khác nhau trong chu kỳ của bạn.
                Hãy nắm vững các ký hiệu này để theo dõi hiệu quả.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-md"
                  style={{ backgroundColor: '#e53935' }}
                >
                  M
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Kinh nguyệt
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Có máu hoặc lấm tấm máu
                </p>
                <div className="mt-3 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  Cảm giác: Ướt
                </div>
              </div>
            </div>
            
            <div className="bg-white border-2 border-blue-600 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-md"
                  style={{ backgroundColor: '#ff9800' }}
                >
                  X
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Ngày đỉnh
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Khả năng thụ thai cao nhất
                </p>
                <div className="mt-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  🌟 QUAN TRỌNG
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-800 font-bold text-xl shadow-md"
                  style={{ backgroundColor: '#fdd835' }}
                >
                  1
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Sau đỉnh 1
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ngày đầu tiên sau đỉnh
                </p>
                <div className="mt-3 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  75% khả năng
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-md"
                  style={{ backgroundColor: '#66bb6a' }}
                >
                  2
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Sau đỉnh 2
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ngày thứ hai sau đỉnh
                </p>
                <div className="mt-3 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  50% khả năng
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-md"
                  style={{ backgroundColor: '#42a5f5' }}
                >
                  3
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Sau đỉnh 3
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ngày thứ ba sau đỉnh
                </p>
                <div className="mt-3 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  20% khả năng
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-md"
                  style={{ backgroundColor: '#ab47bc' }}
                >
                  C
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Có thể thụ thai
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Chất nhờn đục
                </p>
                <div className="mt-3 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  Cần chú ý
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-md"
                  style={{ backgroundColor: '#26c6da' }}
                >
                  S
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  An toàn
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Thời gian bình thường
                </p>
                <div className="mt-3 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  ✓ An toàn
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-md"
                  style={{ backgroundColor: '#78909c' }}
                >
                  D
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                  Khô
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ít chất tiết hoặc không có
                </p>
                <div className="mt-3 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  Bình thường
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <BulbOutlined className="mr-2 text-blue-600" />
              Mẹo ghi nhớ
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 text-gray-700">
                <p className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>Màu đỏ = Kinh nguyệt</span>
                </p>
                <p className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>Màu cam/vàng = Ngày đỉnh quan trọng</span>
                </p>
              </div>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>Màu tím = Có thể thụ thai</span>
                </p>
                <p className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>Màu xanh/xám = An toàn/bình thường</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: '4',
      label: 'Quy tắc validation',
      children: (
        <div className="space-y-10">
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-900 rounded-full flex items-center justify-center">
                <CheckCircleOutlined className="text-2xl text-white" />
              </div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                Quy tắc kết hợp thông minh
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Hệ thống sẽ tự động kiểm tra và gợi ý các kết hợp đúng giữa quan sát chất nhờn và cảm giác, 
                giúp bạn ghi nhận chính xác theo phương pháp Billings.
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <span className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                    Có máu, Lấm tấm máu
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 font-medium">Chỉ kết hợp với:</span>
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Ướt
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <span className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                    Đục
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 font-medium">Kết hợp với:</span>
                  <div className="flex space-x-2">
                    <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Dính
                    </div>
                    <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Ẩm
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <span className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                    Đục nhiều sợi, Trong nhiều sợi
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 font-medium">Kết hợp với:</span>
                  <div className="flex space-x-2">
                    <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Ướt
                    </div>
                    <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Trơn
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border-2 border-blue-600 rounded-lg p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">X</span>
                  </div>
                  <span className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                    Trong và âm hộ căng
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 font-medium">Chỉ kết hợp với:</span>
                  <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Trơn
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900 font-semibold text-lg flex items-center">
                  <span className="mr-2">🌟</span>
                  Đây là ngày X - Ngày đỉnh khả năng thụ thai cao nhất
                </p>
                <p className="text-gray-700 mt-2 leading-relaxed">
                  Khi bạn chọn kết hợp này, hệ thống sẽ tự động đánh dấu là ngày đỉnh và tạo các ngày theo dõi tiếp theo.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">D</span>
                  </div>
                  <span className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
                    Ít chất tiết
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 font-medium">Kết hợp với:</span>
                  <div className="flex space-x-2">
                    <div className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Ẩm
                    </div>
                    <div className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Ướt
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircleOutlined className="mr-3 text-xl text-green-600" />
                Validation thông minh
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Tự động kiểm tra kết hợp đúng/sai</span>
                </p>
                <p className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Hiển thị gợi ý khi nhập sai</span>
                </p>
                <p className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Lọc tùy chọn theo quan sát</span>
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BulbOutlined className="mr-3 text-xl text-amber-500" />
                Lưu ý quan trọng
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="flex items-start">
                  <span className="text-amber-500 mr-2 mt-1">⚠</span>
                  <span>Nếu chọn sai kết hợp, hệ thống sẽ cảnh báo</span>
                </p>
                <p className="flex items-start">
                  <span className="text-amber-500 mr-2 mt-1">⚠</span>
                  <span>Bạn vẫn có thể lưu nếu chắc chắn</span>
                </p>
                <p className="flex items-start">
                  <span className="text-amber-500 mr-2 mt-1">⚠</span>
                  <span>Dữ liệu chính xác giúp dự đoán tốt hơn</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <Modal
      title={
        <div className="text-center py-6 bg-white -mx-6 -mt-6 mb-6 border-b border-gray-200">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}>
            Hướng dẫn sử dụng
          </h1>
          <p className="text-lg text-gray-600 font-medium">Phương pháp Billings - Theo dõi chu kỳ tự nhiên</p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-gray-50 rounded-full border border-gray-300">
            <MedicineBoxOutlined className="text-blue-600 mr-2" />
            <span className="text-gray-800 font-medium text-sm">Được khuyến nghị bởi WHO</span>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <div className="text-center py-6 bg-white -mx-6 -mb-6 border-t border-gray-200">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              💡 Hãy thực hành thường xuyên để nắm vững phương pháp
            </p>
          </div>
          <Button 
            type="primary" 
            onClick={onClose}
            size="large"
            className="px-12 py-3 h-auto text-lg font-semibold bg-gray-900 hover:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
            style={{ fontFamily: 'SF Pro Rounded, -apple-system, sans-serif' }}
          >
            <CheckCircleOutlined className="mr-2" />
            Đã hiểu, bắt đầu sử dụng
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            Bạn luôn có thể xem lại hướng dẫn bằng cách nhấn nút "Trợ giúp"
          </p>
        </div>
      }
      width={1000}
      centered
      className="help-modal overflow-hidden"
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
      <div className="px-2">
        <Tabs 
          items={items}
          centered
          className="help-tabs"
          tabBarStyle={{ 
            borderBottom: '2px solid #e5e7eb',
            marginBottom: '32px',
            padding: '0 16px'
          }}
          tabBarGutter={32}
          size="large"
        />
      </div>
    </Modal>
  );
};

export default HelpModal; 