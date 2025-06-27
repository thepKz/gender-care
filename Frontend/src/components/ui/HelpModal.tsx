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
        <div className="space-y-4">
          <div className="text-center py-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-center space-x-4">
              <MedicineBoxOutlined className="text-2xl text-gray-600" />
              <div className="text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  Phương pháp Billings
                </h2>
                <p className="text-gray-600 text-sm">
                  Phương pháp nhận biết khả năng sinh sản tự nhiên được khuyến nghị bởi WHO
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center mb-3">
                <CheckCircleOutlined className="text-lg text-gray-600 mr-2" />
                <h3 className="text-base font-semibold text-gray-900">Mục tiêu</h3>
              </div>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>• Xác định ngày đỉnh - khả năng thụ thai cao nhất</p>
                <p>• Theo dõi 3 chu kỳ để đưa ra kết luận chính xác</p>
                <p>• Dự đoán chu kỳ và thời gian an toàn</p>
                <p>• Hỗ trợ kế hoạch gia đình tự nhiên</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center mb-3">
                <CalendarOutlined className="text-lg text-gray-600 mr-2" />
                <h3 className="text-base font-semibold text-gray-900">Thời gian</h3>
              </div>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>• Quan sát hàng ngày vào buổi tối</p>
                <p>• Ghi nhận trong 3 chu kỳ liên tiếp</p>
                <p>• Mỗi chu kỳ khoảng 28-35 ngày</p>
                <p>• Cần kiên nhẫn và nhất quán</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-200 lg:col-span-1 md:col-span-2">
              <div className="flex items-center mb-3">
                <BookOutlined className="text-lg text-gray-600 mr-2" />
                <h3 className="text-base font-semibold text-gray-900">Lưu ý quan trọng</h3>
              </div>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>• Quan sát tại cửa âm đạo, không dùng giấy vệ sinh</p>
                <p>• Ghi nhận vào cùng thời điểm mỗi ngày</p>
                <p>• Dựa trên quan sát chất nhờn và cảm giác âm đạo</p>
                <p>• Hỗ trợ kế hoạch gia đình tự nhiên hiệu quả</p>
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
        <div className="space-y-4">
          <div className="text-center py-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-center space-x-4">
              <BookOutlined className="text-2xl text-gray-600" />
              <div className="text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  Hướng dẫn quan sát
                </h2>
                <p className="text-gray-600 text-sm">
                  Quan sát chất nhờn vào buổi tối, trước khi đi ngủ, tại cửa âm đạo
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">M</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Có máu / Lấm tấm máu</h3>
                </div>
                <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">Kinh nguyệt</div>
              </div>
              <p className="text-gray-700 text-xs">Thời kỳ kinh nguyệt - Cảm giác: <strong>Ướt</strong></p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">C</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Đục</h3>
                </div>
                <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs">Có thể thụ thai</div>
              </div>
              <p className="text-gray-700 text-xs">Cảm giác: <strong>Dính, Ẩm</strong></p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">C</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Đục nhiều sợi / Trong nhiều sợi</h3>
                </div>
                <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs">Có thể thụ thai</div>
              </div>
              <p className="text-gray-700 text-xs">Cảm giác: <strong>Ướt, Trơn</strong></p>
            </div>
            
            <div className="bg-white border-2 border-orange-500 rounded-2xl p-3 lg:col-span-2 xl:col-span-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">X</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Trong và âm hộ căng</h3>
                </div>
                <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">NGÀY ĐỈNH</div>
              </div>
              <div className="flex lg:flex-row flex-col lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                <p className="text-gray-900 font-semibold text-sm">🌟 NGÀY X - Cảm giác: <strong>Trơn</strong></p>
                <p className="text-gray-700 bg-gray-50 p-2 rounded-xl text-xs">
                  Khả năng thụ thai cao nhất. Hệ thống sẽ tự động tạo các ngày theo dõi tiếp theo.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">D</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Ít chất tiết</h3>
                </div>
                <div className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs">Khô</div>
              </div>
              <p className="text-gray-700 text-xs">Cảm giác: <strong>Ẩm, Ướt</strong></p>
            </div>
          </div>
        </div>
      )
    },
    {
      key: '3',
      label: 'Ký hiệu và màu sắc',
      children: (
        <div className="space-y-4">
          <div className="text-center py-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-center space-x-4">
              <HeartOutlined className="text-2xl text-gray-600" />
              <div className="text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  Bảng ký hiệu và màu sắc
                </h2>
                <p className="text-gray-600 text-sm">
                  Mỗi ký hiệu và màu sắc đại diện cho một giai đoạn khác nhau trong chu kỳ
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold bg-red-500">
                M
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-xs">Kinh nguyệt</h4>
              <p className="text-gray-600 text-xs">Có máu hoặc lấm tấm máu</p>
              <div className="mt-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-xl text-xs">
                Cảm giác: Ướt
              </div>
            </div>
            
            <div className="bg-white border-2 border-orange-500 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold bg-orange-500">
                X
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-xs">Ngày đỉnh</h4>
              <p className="text-gray-600 text-xs">Khả năng thụ thai cao nhất</p>
              <div className="mt-1 bg-orange-500 text-white px-2 py-1 rounded-xl text-xs font-bold">
                🌟 QUAN TRỌNG
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-gray-800 font-bold bg-yellow-400">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-xs">Sau đỉnh 1</h4>
              <p className="text-gray-600 text-xs">Ngày đầu tiên sau đỉnh</p>
              <div className="mt-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-xl text-xs">
                75% khả năng
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold bg-green-500">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-xs">Sau đỉnh 2</h4>
              <p className="text-gray-600 text-xs">Ngày thứ hai sau đỉnh</p>
              <div className="mt-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-xl text-xs">
                50% khả năng
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold bg-blue-500">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-xs">Sau đỉnh 3</h4>
              <p className="text-gray-600 text-xs">Ngày thứ ba sau đỉnh</p>
              <div className="mt-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-xl text-xs">
                20% khả năng
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold bg-purple-500">
                C
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-xs">Có thể thụ thai</h4>
              <p className="text-gray-600 text-xs">Chất nhờn đục</p>
              <div className="mt-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-xl text-xs">
                Cần chú ý
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold bg-cyan-500">
                S
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-xs">An toàn</h4>
              <p className="text-gray-600 text-xs">Thời gian bình thường</p>
              <div className="mt-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-xl text-xs">
                ✓ An toàn
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold bg-gray-500">
                D
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-xs">Khô</h4>
              <p className="text-gray-600 text-xs">Ít chất tiết hoặc không có</p>
              <div className="mt-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-xl text-xs">
                Bình thường
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-3">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <BulbOutlined className="mr-2 text-blue-600" />
              Mẹo ghi nhớ
            </h3>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              <div className="space-y-1 text-gray-700">
                <p>• Màu đỏ = Kinh nguyệt</p>
                <p>• Màu cam/vàng = Ngày đỉnh quan trọng</p>
              </div>
              <div className="space-y-1 text-gray-700">
                <p>• Màu tím = Có thể thụ thai</p>
                <p>• Màu xanh/xám = An toàn/bình thường</p>
              </div>
              <div className="space-y-1 text-gray-700">
                <p>• X = Ngày quan trọng nhất</p>
                <p>• 1,2,3 = Đếm sau ngày đỉnh</p>
              </div>
              <div className="space-y-1 text-gray-700">
                <p>• M = Máu kinh nguyệt</p>
                <p>• C,S,D = Loại chất nhờn</p>
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
        <div className="space-y-4">
          <div className="text-center py-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-center space-x-4">
              <CheckCircleOutlined className="text-2xl text-gray-600" />
              <div className="text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  Quy tắc kết hợp thông minh
                </h2>
                <p className="text-gray-600 text-sm">
                  Hệ thống sẽ tự động kiểm tra và gợi ý các kết hợp đúng giữa quan sát chất nhờn và cảm giác
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Kết hợp chuẩn</h3>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">M</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Có máu, Lấm tấm máu</span>
                  </div>
                  <div className="bg-red-500 text-white px-2 py-1 rounded-xl text-xs">Ướt</div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">C</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Đục</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="bg-purple-500 text-white px-2 py-1 rounded-xl text-xs">Dính</div>
                    <div className="bg-purple-500 text-white px-2 py-1 rounded-xl text-xs">Ẩm</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">C</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Đục nhiều sợi, Trong nhiều sợi</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="bg-purple-500 text-white px-2 py-1 rounded-xl text-xs">Ướt</div>
                    <div className="bg-purple-500 text-white px-2 py-1 rounded-xl text-xs">Trơn</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border-2 border-orange-500 rounded-2xl p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">X</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Trong và âm hộ căng</span>
                  </div>
                  <div className="bg-orange-500 text-white px-2 py-1 rounded-xl text-xs font-bold">Trơn</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Hướng dẫn chi tiết</h3>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                  🌟 Ngày X - Quan trọng nhất
                </h4>
                <p className="text-gray-700 text-xs mb-2">
                  Ngày có khả năng thụ thai cao nhất trong chu kỳ. Chỉ kết hợp với cảm giác "Trơn".
                </p>
                <div className="bg-orange-50 p-2 rounded-xl">
                  <p className="text-orange-800 font-semibold text-xs">
                    ⚡ Sau ngày X, hệ thống tự động tạo các ngày 1, 2, 3...
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                  ✅ Validation tự động
                </h4>
                <div className="space-y-1 text-gray-700 text-xs">
                  <p>• Hệ thống sẽ cảnh báo khi chọn kết hợp sai</p>
                  <p>• Đề xuất kết hợp đúng theo phương pháp Billings</p>
                  <p>• Giúp đảm bảo tính chính xác của dữ liệu</p>
                  <p>• Hỗ trợ học tập và ghi nhận đúng cách</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                  📚 Lưu ý quan trọng
                </h4>
                <div className="space-y-1 text-gray-700 text-xs">
                  <p>• Quan sát vào cùng thời điểm mỗi ngày</p>
                  <p>• Ghi nhận ngay sau khi quan sát</p>
                  <p>• Không đoán mà dựa vào cảm giác thực tế</p>
                  <p>• Liên tục trong ít nhất 3 chu kỳ</p>
                </div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MedicineBoxOutlined className="text-xl text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Hướng dẫn sử dụng</h1>
              <p className="text-sm text-gray-600">Phương pháp Billings - Theo dõi chu kỳ tự nhiên</p>
            </div>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-2xl text-xs font-medium">
            Được khuyến nghị bởi WHO
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            💡 Hãy thực hành thường xuyên để nắm vững phương pháp
          </p>
          <Button type="primary" onClick={onClose} className="rounded-2xl">
            Đã hiểu
          </Button>
        </div>
      }
      width="95%"
      style={{ maxWidth: '1200px' }}
      className="help-modal"
    >
      <Tabs
        items={items}
        className="mt-4"
        tabBarStyle={{ 
          marginBottom: '16px',
          borderBottom: '2px solid #f0f0f0'
        }}
      />
    </Modal>
  );
};

export default HelpModal; 