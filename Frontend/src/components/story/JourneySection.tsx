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

const JourneySection: React.FC = () => {
  return (
    <section className="relative w-full py-20 bg-[#2A7F9E]">
      {/* timeline line */}
      <div className="hidden md:block absolute left-1/2 top-0 h-full w-1 bg-cyan-400/40 -translate-x-1/2" />
      <h2 className="text-center text-3xl md:text-4xl font-bold text-white mb-12">
        Hành trình chăm sóc toàn diện
      </h2>
      <div className="max-w-6xl mx-auto flex flex-col gap-24 px-4">
        {steps.map((step, idx) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="relative grid md:grid-cols-12 items-center gap-8"
          >
            {/* Dot giữa hàng */}
            <div className="hidden md:block absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 border-2 border-white z-10" />

            {/* Left column */}
            {idx % 2 === 0 ? (
              <>
                <img
                  src={step.image}
                  alt={step.title}
                  className="md:col-span-5 col-span-12 rounded-lg shadow-md object-cover h-40 md:h-56 w-full"
                />
                <div className="md:col-span-5 col-span-12 text-white px-2 md:px-4">
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm md:text-base text-white/90 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="md:col-start-1 md:col-span-5 col-span-12 order-2 md:order-none text-white px-2 md:px-4">
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm md:text-base text-white/90 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <img
                  src={step.image}
                  alt={step.title}
                  className="md:col-span-5 col-span-12 order-1 md:order-none rounded-lg shadow-md object-cover h-40 md:h-56 w-full"
                />
              </>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default JourneySection; 