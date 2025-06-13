import React from "react";
import { motion } from "framer-motion";

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon, title, description }) => (
  <motion.div
    whileHover={{ y: -6 }}
    className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-white flex flex-col items-center text-center"
  >
    <div className="mb-6 text-3xl">{icon}</div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-white/80 text-sm leading-relaxed max-w-xs">{description}</p>
  </motion.div>
);

export default BenefitCard; 