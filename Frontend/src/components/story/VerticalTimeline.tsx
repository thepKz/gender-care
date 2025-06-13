import { motion } from "framer-motion";
import React from "react";

import Image1 from "../../assets/images/image1.jpg";
import Image2 from "../../assets/images/image2.jpg";
import Image3 from "../../assets/images/image3.jpg";
import Image4 from "../../assets/images/image4.jpg";
import Image5 from "../../assets/images/image5.jpg";

interface Step {
  title: string;
  desc: string;
  image: string;
}

const steps: Step[] = [
  { title: "Tư vấn ban đầu", desc: "Lắng nghe & định hướng", image: Image1 },
  { title: "Xét nghiệm chuyên sâu", desc: "Kết quả nhanh & bảo mật", image: Image2 },
  { title: "Phân tích & chẩn đoán", desc: "Đưa ra kế hoạch cá nhân hoá", image: Image3 },
  { title: "Điều trị & theo dõi", desc: "Đồng hành cùng chuyên gia", image: Image4 },
  { title: "Chăm sóc lâu dài", desc: "Duy trì sức khoẻ bền vững", image: Image5 },
];

const VerticalTimeline: React.FC = () => {
  return (
    <section className="relative w-full py-20 bg-[#2A7F9E] overflow-hidden">
      {/* subtle pattern background */}
      <div className="absolute inset-0 bg-[url('../../assets/images/pattern.png')] bg-repeat opacity-10" />
      {/* floating background dots */}
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute w-2 h-2 rounded-full bg-white/20"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, zIndex: 10 }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: Math.random() * 5,
          }}
        />
      ))}
      <h2 className="text-center text-3xl md:text-4xl font-bold text-white mb-16">
        Hành trình chăm sóc toàn diện
      </h2>
      <div className="relative z-20 max-w-5xl mx-auto">
        {/* central line inside list area */}
        <div className="hidden md:block absolute left-1/2 top-0 h-full w-0.5 bg-cyan-300/50 -translate-x-1/2" />

        <ol className="relative space-y-12 md:space-y-16">
          {steps.map((step, idx) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="relative md:grid md:grid-cols-2 md:gap-10"
            >
              {/* Dot */}
              <span className="absolute left-4 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-400 ring-4 ring-[#2A7F9E]" />

              {/* Card */}
              <div className={`${idx % 2 === 0 ? 'md:col-start-1 md:justify-self-end md:pr-8' : 'md:col-start-2 md:pl-8'}`}>
                <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 flex items-center gap-4 min-h-[140px] w-full md:w-[380px] overflow-hidden">
                  {/* big index watermark */}
                  <span className="absolute -left-3 -top-4 md:-left-6 md:-top-6 text-[90px] md:text-[120px] font-extrabold text-white/5 select-none pointer-events-none leading-none">
                    {`0${idx + 1}`}
                  </span>
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-24 h-24 rounded-full object-cover shrink-0 hover:scale-105 transition-transform duration-300"
                  />
                  <div className="text-white">
                    <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default VerticalTimeline; 