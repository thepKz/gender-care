import React from 'react';
import FloatingAppointmentButton from './FloatingAppointmentButton';

/**
 * Demo component để test FloatingAppointmentButton
 * Sử dụng component này trong layout hoặc page components
 */
const FloatingAppointmentDemo: React.FC = () => {
  // Custom handler cho demo
  const handleAppointmentClick = () => {
    console.log('🩺 Đặt lịch hẹn được click!');
    
    // Demo: Show modal hoặc navigate
    const confirmed = window.confirm(
      'Bạn có muốn được chuyển đến trang đặt lịch hẹn tư vấn không?'
    );
    
    if (confirmed) {
      // Có thể thay thế bằng navigation logic thực tế
      window.open('/consultation/book', '_blank');
    }
  };

  return (
    <>
      {/* Demo content để test scroll */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header section */}
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Demo Floating Appointment Button
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Scroll xuống để xem floating button xuất hiện với animations
            </p>
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
              <span>⚡</span>
              <span className="font-medium">
                Button sẽ hiện sau khi scroll xuống 300px
              </span>
            </div>
          </div>

          {/* Content sections để tạo scroll */}
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Section {i + 1}: Dịch vụ tư vấn sức khỏe
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                </p>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse 
                  cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat 
                  cupidatat non proident, sunt in culpa qui officia deserunt mollit.
                </p>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem 
                  accusantium doloremque laudantium, totam rem aperiam, eaque ipsa 
                  quae ab illo inventore veritatis et quasi architecto beatae vitae.
                </p>
                {i === 3 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                    <h3 className="font-semibold text-green-800 mb-2">
                      💡 Floating Button Features:
                    </h3>
                    <ul className="list-disc list-inside text-green-700 space-y-1">
                      <li>Xuất hiện mượt mà khi scroll xuống</li>
                      <li>Animation attention-seeking sau 2 giây</li>
                      <li>Hover effects với magnetic pull</li>
                      <li>Responsive tooltip và mobile expansion</li>
                      <li>Accessibility support đầy đủ</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="text-center py-16 border-t border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              🎉 Bạn đã đến cuối trang!
            </h3>
            <p className="text-gray-600 mb-6">
              Floating appointment button vẫn ở đó để hỗ trợ bạn đặt lịch hẹn bất kỳ lúc nào.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
              <p className="text-blue-800 font-medium">
                💡 Tip: Hover vào button để xem tooltip và animation effects!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Appointment Button */}
      <FloatingAppointmentButton 
        onAppointmentClick={handleAppointmentClick}
        className="demo-floating-button"
      />
    </>
  );
};

export default FloatingAppointmentDemo; 