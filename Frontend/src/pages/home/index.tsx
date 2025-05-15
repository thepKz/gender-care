import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16 rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Chăm sóc sức khỏe giới tính toàn diện</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Giải pháp chăm sóc sức khỏe giới tính chuyên biệt, bảo mật và tôn trọng dành cho mọi người.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-md font-semibold">
              Đặt lịch tư vấn
            </button>
            <button className="btn bg-blue-700 hover:bg-blue-800 px-6 py-3 rounded-md font-semibold">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Dịch vụ của chúng tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Tư vấn sức khỏe</h3>
              <p className="text-gray-600 mb-4">
                Tư vấn trực tuyến hoặc trực tiếp với các chuyên gia về các vấn đề sức khỏe giới tính.
              </p>
              <a href="/services/consultation" className="text-blue-600 font-medium hover:underline">Tìm hiểu thêm →</a>
            </div>

            {/* Service 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Xét nghiệm STI</h3>
              <p className="text-gray-600 mb-4">
                Dịch vụ xét nghiệm các bệnh lây truyền qua đường tình dục nhanh chóng, chính xác và bảo mật.
              </p>
              <a href="/services/testing" className="text-pink-600 font-medium hover:underline">Tìm hiểu thêm →</a>
            </div>

            {/* Service 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Giáo dục giới tính</h3>
              <p className="text-gray-600 mb-4">
                Chương trình học và tài liệu cung cấp kiến thức toàn diện về sức khỏe giới tính.
              </p>
              <a href="/services/education" className="text-purple-600 font-medium hover:underline">Tìm hiểu thêm →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-gray-50 rounded-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Phản hồi từ khách hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-300 overflow-hidden mr-4">
                  <img src="https://placehold.co/48x48" alt="Avatar" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="font-semibold">Nguyễn Văn A</h4>
                  <p className="text-gray-500 text-sm">Khách hàng</p>
                </div>
              </div>
              <p className="text-gray-600">
                "Dịch vụ tư vấn rất chuyên nghiệp và tôn trọng. Tôi cảm thấy an tâm khi chia sẻ các vấn đề cá nhân và nhận được lời khuyên hữu ích."
              </p>
              <div className="flex text-yellow-400 mt-3">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-300 overflow-hidden mr-4">
                  <img src="https://placehold.co/48x48" alt="Avatar" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="font-semibold">Trần Thị B</h4>
                  <p className="text-gray-500 text-sm">Khách hàng</p>
                </div>
              </div>
              <p className="text-gray-600">
                "Đội ngũ y tế rất nhiệt tình và có chuyên môn cao. Tôi đánh giá cao sự bảo mật và không gian thoải mái mà trung tâm tạo ra."
              </p>
              <div className="flex text-yellow-400 mt-3">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-300 overflow-hidden mr-4">
                  <img src="https://placehold.co/48x48" alt="Avatar" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="font-semibold">Lê Văn C</h4>
                  <p className="text-gray-500 text-sm">Khách hàng</p>
                </div>
              </div>
              <p className="text-gray-600">
                "Các khóa học về giáo dục giới tính rất hữu ích và được trình bày một cách dễ hiểu. Tôi đã học được nhiều điều quý giá."
              </p>
              <div className="flex text-yellow-400 mt-3">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-blue-600 text-white rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Sẵn sàng đặt lịch hẹn?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn với các vấn đề sức khỏe giới tính.
          </p>
          <button className="btn bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-md font-semibold">
            Đặt lịch ngay
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 