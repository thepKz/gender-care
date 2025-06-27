import React from 'react';
import { Doctor } from '../../../types';
import { Star1, Profile, Location, Calendar } from 'iconsax-react';

interface Props {
  doctor: Doctor;
  onBook: (doctor: Doctor) => void;
  onView: (doctor: Doctor) => void;
}

const fallbackAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor&backgroundColor=ffffff';

const CounselorCard: React.FC<Props> = ({ doctor, onBook, onView }) => {
  const avatar = doctor.image || doctor.userId?.avatar || fallbackAvatar;
  const rating = doctor.rating || 0;
  const experience = doctor.experience || 0;
  const workplace = doctor.workplace || 'Bệnh viện Đa khoa';

  // Xác định chức vụ dựa vào kinh nghiệm thực tế
  const getTitle = (exp: number): string => {
    if (exp >= 20) return 'GS. TS.';
    if (exp >= 15) return 'PGS. TS.';
    if (exp >= 10) return 'TS.';
    if (exp >= 7) return 'ThS.';
    return 'BS.';
  };

  const title = getTitle(experience);

  return (
    <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden h-full flex flex-col group hover:-translate-y-2">
      {/* Avatar Section - Hình vuông to hơn */}
      <div className="relative p-6 pb-4">
        <div className="relative mx-auto w-32 h-32">
          <img
            src={avatar}
            alt={doctor.userId.fullName}
            className="w-full h-full rounded-2xl object-cover border-4 border-[#0C3C54]/10 shadow-lg group-hover:border-[#0C3C54]/30 transition-all duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
            }}
            loading="lazy"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6 flex-1 flex flex-col">
        {/* Doctor Name & Title */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-[#0C3C54] mb-1 leading-tight">
            {title} {doctor.userId?.fullName || 'Bác sĩ'}
          </h3>
          <p className="text-[#2A7F9E] font-semibold text-base">
            {doctor.specialization || 'Bác sĩ chuyên khoa'}
          </p>
        </div>

        {/* Workplace */}
        <div className="flex items-center justify-center gap-2 mb-4 text-gray-600">
          <Location size={16} className="text-[#2A7F9E]" />
          <span className="text-sm font-medium">{workplace}</span>
        </div>

        {/* Experience */}
        {experience > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar size={16} className="text-[#0C3C54]" />
            <span className="text-sm font-semibold text-[#0C3C54]">
              {experience} năm kinh nghiệm
            </span>
          </div>
        )}

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center justify-center gap-2 mb-6 bg-gray-50 rounded-2xl px-4 py-3">
            <Star1 size={18} variant="Bold" className="text-yellow-500" />
            <span className="text-base font-bold text-gray-800">
              {rating.toFixed(1)}
            </span>
            <span className="text-gray-500 text-sm">/ 5</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook(doctor);
            }}
            className="w-full bg-gradient-to-r from-[#0C3C54] to-[#2A7F9E] hover:from-[#2A7F9E] hover:to-[#0C3C54] text-white py-3 rounded-2xl text-base font-bold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Calendar size={20} variant="Bold" />
            Đặt lịch tư vấn
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(doctor);
            }}
            className="w-full border-2 border-[#0C3C54] text-[#0C3C54] hover:bg-[#0C3C54] hover:text-white py-3 rounded-2xl text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Profile size={20} />
            Xem hồ sơ
          </button>
        </div>
      </div>
      
      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0C3C54]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"></div>
    </div>
  );
};

export default CounselorCard; 