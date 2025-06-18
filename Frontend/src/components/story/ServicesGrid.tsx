import { motion } from "framer-motion";
import React from "react";

import Image1 from "../../assets/images/image1.jpg";
import Image2 from "../../assets/images/image2.jpg";
import Image3 from "../../assets/images/image3.jpg";
import Image4 from "../../assets/images/image4.jpg";
import Image5 from "../../assets/images/image5.jpg";
import Image6 from "../../assets/images/image6.jpg";

interface Service {
  image: string;
  title: string;
  desc: string;
}

const services: Service[] = [
  { image: Image1, title: "Tư vấn tiền hôn nhân", desc: "Kiểm tra sức khoẻ toàn diện." },
  { image: Image2, title: "Xét nghiệm STIs", desc: "Nhanh chóng & chính xác." },
  { image: Image3, title: "Theo dõi chu kỳ", desc: "Dự đoán ngày rụng trứng." },
  { image: Image4, title: "Tư vấn trực tuyến", desc: "Liên hệ chuyên gia mọi lúc." },
  { image: Image5, title: "Sức khoẻ sinh sản", desc: "Chăm sóc toàn diện." },
  { image: Image6, title: "Nhắc nhở uống thuốc", desc: "Hệ thống nhắc nhở thông minh." },
];

const ServicesGrid: React.FC = () => {
  return (
    <section className="relative w-full py-20 bg-[#0C3C54] overflow-hidden">
      {/* background pattern */}
      <div className="absolute inset-0 bg-[url('../../assets/images/pattern.png')] bg-repeat opacity-5" />
      {/* floating shapes */}
      {[...Array(15)].map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute rounded-full bg-cyan-500/20 blur-sm"
          style={{
            width: `${Math.random() * 60 + 40}px`,
            height: `${Math.random() * 60 + 40}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            zIndex: 5,
          }}
          animate={{ y: [0, -15, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: Math.random() * 12 + 8, repeat: Infinity, repeatType: "reverse", delay: Math.random() * 4 }}
        />
      ))}

      <h2 className="relative z-20 text-center text-3xl md:text-4xl font-bold text-white mb-12">
        Dịch vụ nổi bật
      </h2>

      <div className="relative z-20 max-w-6xl mx-auto px-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((svc, idx) => (
          <motion.div
            key={svc.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            whileHover={{ y: -6 }}
            className="relative group rounded-3xl overflow-hidden shadow-xl border border-white/10 bg-white/5 backdrop-blur-lg"
          >
            <img src={svc.image} alt={svc.title} className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C3C54]/80 via-transparent to-transparent opacity-80" />
            <div className="relative p-6 text-white flex flex-col gap-2">
              <h3 className="font-semibold text-lg">{svc.title}</h3>
              <p className="text-sm text-white/80 leading-relaxed">{svc.desc}</p>
            </div>
            {/* Decorative border shine */}
            <span className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-cyan-400 transition-colors duration-300" />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ServicesGrid; 