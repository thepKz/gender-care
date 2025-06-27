import React from 'react';

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

interface TimeSlotSelectionProps {
  selectedDate: string;
  selectedTimeSlot: string;
  timeSlots: TimeSlot[];
  onDateSelect: (date: string) => void;
  onTimeSlotSelect: (timeSlot: string) => void;
  isLoading?: boolean;
}

const TimeSlotSelection: React.FC<TimeSlotSelectionProps> = ({
  selectedDate,
  selectedTimeSlot,
  timeSlots,
  onDateSelect,
  onTimeSlotSelect,
  isLoading = false
}) => {
  // Generate next 30 days for date selection
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const isToday = i === 0;
      const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
      const dayNumber = date.getDate();
      
      dates.push({
        dateString,
        dayName,
        dayNumber,
        isToday,
        isPast: false
      });
    }
    
    return dates;
  };

  const dates = generateDates();

  return (
    <div className="space-y-4">
      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          📅 Chọn ngày
        </h3>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.slice(0, 7).map((date) => (
            <button
              key={date.dateString}
              onClick={() => onDateSelect(date.dateString)}
              className={`flex-shrink-0 text-center p-2 rounded-lg border-2 transition-all min-w-[60px] ${
                selectedDate === date.dateString
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : date.isToday
                  ? 'border-blue-300 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >
              <div className="text-xs font-medium">{date.dayName}</div>
              <div className="text-lg font-bold">{date.dayNumber}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🕐 Chọn giờ
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">Không có lịch trống</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => slot.isAvailable && onTimeSlotSelect(slot.id)}
                  disabled={!slot.isAvailable}
                  className={`p-2 text-sm rounded-lg border-2 transition-all ${
                    selectedTimeSlot === slot.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : slot.isAvailable
                      ? 'border-gray-200 hover:border-blue-300 text-gray-700'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelection; 