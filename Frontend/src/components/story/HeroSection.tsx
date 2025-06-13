import { motion } from "framer-motion";
import { Call, Calendar } from "iconsax-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import ModernButton from "../ui/ModernButton";
import heroVideo from "../../assets/videos/health-hero.mp4";

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#0C3C54]">
      {/* video bg */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        autoPlay
        loop
        muted
        playsInline
        src={heroVideo}
      />
      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0C3C54]/30 via-[#2A7F9E]/20 to-[#0C3C54]/40" />

      {/* content */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight font-['Be_Vietnam_Pro',_sans-serif]"
        >
          Chăm sóc sức khỏe giới tính toàn diện
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-base md:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto"
        >
          Dịch vụ từ tư vấn đến xét nghiệm, đồng hành cùng bạn trên hành trình yêu thương bản thân. Hãy bắt đầu hành trình chăm sóc sức khỏe với <span className="font-bold">Gender Healthcare</span> ngay hôm nay!
        </motion.p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-row flex-wrap items-center justify-center gap-6">
          <ModernButton
            variant="primary"
            className="min-w-[190px] bg-cyan-500 hover:bg-cyan-600 from-cyan-500 to-cyan-500"
            icon={<Calendar size={18} />}
            iconPosition="left"
            onClick={() => navigate('/booking')}
          >
            Đặt lịch ngay
          </ModernButton>
          <ModernButton
            variant="glass"
            className="min-w-[190px] border-white/40 text-white hover:bg-white/20 hover:text-[#0C3C54]"
            icon={<Call size={18} />}
            iconPosition="left"
            onClick={() => window.open('tel:+84888888888', '_blank')}
          >
            Tư vấn miễn phí
          </ModernButton>
        </div>
      </div>

      {/* floating bubbles */}
      {[...Array(15)].map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute rounded-full bg-cyan-400/20 blur-2xl"
          style={{
            width: `${Math.random() * 120 + 40}px`,
            height: `${Math.random() * 120 + 40}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: Math.random() * 20 + 10, repeat: Infinity, repeatType: 'reverse', delay: Math.random() * 5 }}
        />
      ))}
    </section>
  );
};

export default HeroSection; 