import { motion } from "framer-motion";
import { Star, Calendar, User, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type Doctor } from "../../../api/endpoints/doctorApi";

interface ModernCounselorCardProps {
  doctor: Doctor;
  index?: number;
  onBook?: () => void;
  onView?: () => void;
}

export function ModernCounselorCard({ doctor, index = 0, onBook, onView }: ModernCounselorCardProps) {
  const navigate = useNavigate();



  const handleViewProfile = () => {
    if (onView) {
      onView();
    } else {
      navigate(`/doctors/${doctor._id}`);
    }
  };

  const handleBooking = () => {
    if (onBook) {
      onBook();
    } else {
      navigate(`/booking/consultation/${doctor._id}`);
    }
  };

  // Enhanced avatar URL logic
  const getAvatarUrl = () => {
    // Try multiple possible avatar sources
    const avatarSources = [
      doctor.image,
      doctor.userId?.avatar,
      (doctor as any).avatar,
      (doctor as any).userId?.image
    ];

    const validAvatar = avatarSources.find(src => src && src.trim() !== '');

    if (validAvatar) {
      return validAvatar;
    }

    // Fallback to generated avatar
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.userId?.fullName || doctor._id || 'doctor'}`;
  };

  // Enhanced name logic
  const getDoctorName = () => {
    return doctor.userId?.fullName ||
           (doctor as any).fullName ||
           (doctor as any).name ||
           "Bác sĩ";
  };

  const years = (doctor as any).yearsOfExperience
    ? (doctor as any).yearsOfExperience
    : typeof doctor.experience === 'number'
      ? doctor.experience
      : Math.floor(Math.random() * 10) + 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full"
    >
      {/* Header with Avatar */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
              <img
                src={getAvatarUrl()}
                alt={getDoctorName()}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${getDoctorName()}`;
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {getDoctorName()}
            </h3>
            <p className="text-sm text-blue-600 font-medium mt-1">
              {doctor.specialization || "Chuyên khoa"}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-700">
                  {doctor.rating?.toFixed(1) || "5.0"}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                ({doctor.feedback?.totalFeedbacks || 0} đánh giá)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {/* Experience */}
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {years}+ năm kinh nghiệm
          </span>
        </div>

        {/* Bio */}
        <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
          {doctor.bio || "Bác sĩ có chuyên môn cao và tận tâm, luôn sẵn sàng hỗ trợ bạn trong các vấn đề sức khỏe."}
        </p>
      </div>

      {/* Action Buttons - Moved to bottom */}
      <div className="px-6 pb-6 pt-0 mt-auto">
        <div className="flex gap-3">
          <button
            onClick={handleBooking}
            className="flex-1 bg-[#0e314e] hover:bg-[#0a2538] text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group/btn"
          >
            <Calendar className="w-4 h-4" />
            <span>Đặt lịch</span>
          </button>

          <button
            onClick={handleViewProfile}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group/btn"
          >
            <User className="w-4 h-4" />
            <span>Xem thêm</span>
          </button>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
} 