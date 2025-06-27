import React from "react";
import { motion } from "framer-motion";
import Banner from "../../assets/images/background.jpg";

const commitments = [
  {
    title: "Chuyên môn",
    desc: "Đội ngũ y bác sĩ được đào tạo chuyên sâu, nhiều năm kinh nghiệm.",
  },
  {
    title: "Riêng tư",
    desc: "Mọi thông tin cá nhân và kết quả xét nghiệm đều được bảo mật tuyệt đối.",
  },
  {
    title: "Tận tâm",
    desc: "Luôn đặt sức khỏe và nhu cầu khách hàng lên hàng đầu.",
  },
];

const CommitmentParallax: React.FC = () => {
  return (
    <section className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden">
      <img
        src={Banner}
        alt="commitment-bg"
        className="absolute inset-0 h-full w-full object-cover object-center"
        style={{ transform: "translateZ(-1px) scale(1.5)" }}
      />
      <div className="absolute inset-0 bg-[#0C3C54]/70" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
          Cam kết của Gender Healthcare
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {commitments.map((cmt, idx) => (
            <motion.div
              key={cmt.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 text-white text-center"
            >
              <h3 className="text-2xl font-semibold mb-3">{cmt.title}</h3>
              <p className="text-sm leading-relaxed text-white/90">{cmt.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommitmentParallax; 