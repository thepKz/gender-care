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

const ServicesCarousel: React.FC = () => {
  return (
    <section className="w-full py-20 bg-[#0C3C54] overflow-hidden">
      <h2 className="text-center text-3xl md:text-4xl font-bold text-white mb-12">
        Dịch vụ nổi bật
      </h2>
      <div className="relative w-full flex justify-center">
        <motion.div
          drag="x"
          dragConstraints={{ left: -((services.length - 3) * 260), right: 0 }}
          className="flex gap-8 px-8 cursor-grab active:cursor-grabbing"
          style={{ perspective: 800 }}
        >
          {services.map((svc) => (
            <motion.div
              key={svc.title}
              whileHover={{ scale: 1.08, rotateY: 0 }}
              initial={{ rotateY: -8 }}
              className="min-w-[240px] h-[340px] rounded-2xl overflow-hidden shadow-lg bg-white/5 backdrop-blur-lg border border-white/10"
            >
              <img
                src={svc.image}
                alt={svc.title}
                className="h-48 w-full object-cover"
              />
              <div className="p-4 text-white">
                <h3 className="font-semibold mb-2 text-lg">{svc.title}</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  {svc.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesCarousel; 