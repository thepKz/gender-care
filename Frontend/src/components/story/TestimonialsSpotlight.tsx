import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Feedback {
  name: string;
  avatar: string;
  comment: string;
  rating: number;
}

const feedbacks: Feedback[] = [
  {
    name: "Nguyễn Thị Hương",
    avatar: "https://picsum.photos/200",
    comment:
      "Dịch vụ tại Gender Healthcare rất chuyên nghiệp và tận tâm. Đội ngũ nhân viên thân thiện và tư vấn rất chi tiết về các vấn đề sức khỏe.",
    rating: 5,
  },
  {
    name: "Trần Văn Nam",
    avatar: "https://picsum.photos/201",
    comment:
      "Tôi rất hài lòng với dịch vụ xét nghiệm STI tại Gender Healthcare. Kết quả nhanh chóng và chính xác, nhân viên tư vấn rất tận tình.",
    rating: 5,
  },
  {
    name: "Lê Thị Lan",
    avatar: "https://picsum.photos/202",
    comment:
      "Chất lượng dịch vụ rất tốt, tôi cảm thấy yên tâm khi được tư vấn tại đây. Các bác sĩ rất chuyên nghiệp và thân thiện.",
    rating: 4,
  },
];

const TestimonialsSpotlight: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % feedbacks.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="w-full py-24 bg-[#0C3C54] relative overflow-hidden">
      <h2 className="text-center text-3xl md:text-4xl font-bold text-white mb-16">
        Được khách hàng ghi nhận
      </h2>
      <div className="flex items-center justify-center gap-6 w-full px-6">
        {feedbacks.map((fb, i) => {
          const isActive = i === index;
          const scale = isActive ? 1 : 0.8;
          const opacity = isActive ? 1 : 0.4;
          const blur = isActive ? "blur-0" : "blur-sm";
          return (
            <motion.div
              key={fb.name}
              animate={{ scale, opacity }}
              transition={{ duration: 0.6 }}
              className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl text-white p-6 max-w-sm ${blur}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={fb.avatar}
                  alt={fb.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-cyan-400"
                />
                <div>
                  <h3 className="font-semibold">{fb.name}</h3>
                  <div className="flex gap-1 text-cyan-400 text-sm">
                    {Array.from({ length: fb.rating }).map((_, idx) => (
                      <span key={idx}>★</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{fb.comment}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default TestimonialsSpotlight; 