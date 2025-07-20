import { motion } from "framer-motion";
import { Award, Star1, ArrowRight } from "iconsax-react";
import { useNavigate } from "react-router-dom";
import { type Doctor } from "../../../api/endpoints/doctorApi";
import { BlurFade } from "../blur-fade";
import PrimaryButton from "../primitives/PrimaryButton";

interface ModernCounselorCardProps {
  doctor: Doctor;
  index: number;
}

export function ModernCounselorCard({ doctor, index }: ModernCounselorCardProps) {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/doctors/${doctor._id}`);
  };

  const years = (doctor as any).yearsOfExperience
    ? (doctor as any).yearsOfExperience
    : typeof doctor.experience === 'number'
      ? doctor.experience
      : 0;

  return (
    <BlurFade delay={0.25 * (index + 1)} inView>
      <motion.div
        whileHover={{
          scale: 1.02,
          boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.1)",
        }}
        transition={{ duration: 0.3 }}
        className="h-full w-full rounded-2xl overflow-hidden bg-white border border-gray-200/80 shadow-sm transition-all"
      >
        <div className="relative h-48 w-full">
          <img
            src={doctor.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.userId?.fullName || 'doctor'}`}
            alt={doctor.userId?.fullName || "Bác sĩ"}
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <h3 className="text-xl font-bold text-white">
              {doctor.userId?.fullName || "Bác sĩ"}
            </h3>
            <p className="text-sm text-white/90">
              {doctor.specialization || "Chuyên khoa"}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Star1 size={20} className="text-yellow-500" variant="Bold" />
              <span className="font-semibold text-gray-700">
                {doctor.rating?.toFixed(1) || "N/A"}
              </span>
              <span className="text-sm text-gray-500">
                ({doctor.feedback?.totalFeedbacks || 0} đánh giá)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={20} className="text-blue-600" variant="Bold" />
              <span className="font-semibold text-gray-700">
                {years}+ năm
              </span>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3 h-[72px]">
            {doctor.bio ||
              "Bác sĩ có chuyên môn cao và tận tâm, luôn sẵn sàng hỗ trợ bạn."}
          </p>

          <PrimaryButton
            onClick={handleViewProfile}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-all group"
            fullWidth
          >
            Xem chi tiết
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </PrimaryButton>
        </div>
      </motion.div>
    </BlurFade>
  );
} 