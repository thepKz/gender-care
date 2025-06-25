import React, { useState } from 'react';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  reviewCount: number;
  avatar: string;
  isAvailable: boolean;
  bio?: string;
}

interface DoctorSelectionProps {
  doctors: Doctor[];
  selectedDoctor: string;
  onDoctorSelect: (doctorId: string) => void;
  isLoading?: boolean;
  allowAutoSelection?: boolean;
}

const DoctorSelection: React.FC<DoctorSelectionProps> = ({
  doctors,
  selectedDoctor,
  onDoctorSelect,
  isLoading = false,
  allowAutoSelection = true
}) => {
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);

  const availableDoctors = doctors.filter(doctor => doctor.isAvailable);

  const toggleDoctorDetails = (doctorId: string) => {
    setExpandedDoctor(expandedDoctor === doctorId ? null : doctorId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Đang tải bác sĩ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Chọn bác sĩ</h2>
      
      {availableDoctors.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-gray-400 text-2xl mb-2">👨‍⚕️</div>
          <p className="text-gray-500">Không có bác sĩ khả dụng</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {/* Auto Selection Option */}
          {allowAutoSelection && (
            <div
              onClick={() => onDoctorSelect('')}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedDoctor === ''
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 border-dashed hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">AI</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Hệ thống tự chọn</h3>
                  <p className="text-sm text-gray-500">Gợi ý bác sĩ phù hợp nhất</p>
                </div>
              </div>
            </div>
          )}

          {/* Doctor List */}
          {availableDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className={`rounded-lg border-2 transition-all duration-200 ${
                selectedDoctor === doctor.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Main Doctor Card */}
              <div
                onClick={() => onDoctorSelect(doctor.id)}
                className="p-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{doctor.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>⭐ {doctor.rating}</span>
                      <span>•</span>
                      <span>{doctor.experience} năm</span>
                    </div>
                  </div>

                  {/* Details Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDoctorDetails(doctor.id);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {expandedDoctor === doctor.id ? 'Ẩn' : 'Xem'}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedDoctor === doctor.id && (
                <div className="px-3 pb-3 border-t border-gray-200 bg-gray-50">
                  <div className="pt-3 space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Chuyên khoa:</span>
                      <span className="ml-2 font-medium">{doctor.specialization}</span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-600">Đánh giá:</span>
                      <span className="ml-2 font-medium">{doctor.reviewCount} lượt đánh giá</span>
                    </div>


                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorSelection; 