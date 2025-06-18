import { Button } from "antd";
import { Calendar } from "iconsax-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import React from "react";

interface HeroVideoSectionProps {
  onSearchClick?: () => void;
}

const HeroVideoSection: React.FC<HeroVideoSectionProps> = ({ onSearchClick }) => {
  const navigate = useNavigate();
  return (
    <section className="relative w-full h-[80vh] overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/health-hero.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#0C3C54]/70 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 max-w-4xl"
        >
          Chăm sóc sức khỏe giới tính toàn diện
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/90 text-lg md:text-2xl mb-10 max-w-3xl"
        >
          Đội ngũ chuyên gia giàu kinh nghiệm, công nghệ hiện đại, bảo mật tuyệt đối.
        </motion.p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="large"
            className="bg-white text-[#0C3C54] border-none font-semibold px-12 py-7 h-auto rounded-full text-lg flex items-center gap-3"
            onClick={() => navigate("/booking")}
          >
            <Calendar size={24} /> Đặt lịch ngay
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroVideoSection; 