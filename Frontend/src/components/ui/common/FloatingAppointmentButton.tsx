import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Heart, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FloatingAppointmentButtonProps {
  className?: string;
  onAppointmentClick?: () => void;
}

const FloatingAppointmentButton: React.FC<FloatingAppointmentButtonProps> = ({
  className = '',
  onAppointmentClick
}) => {
  // State để track scroll position và animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasJustAppeared, setHasJustAppeared] = useState(false);
  const [showAttentionSeeker, setShowAttentionSeeker] = useState(false);
  
  // Hook navigation
  const navigate = useNavigate();
  
  // Optimized scroll handler với throttle
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const shouldShow = scrollTop > 300; // Hiện sau khi scroll 300px
    
    if (shouldShow && !isVisible) {
      setIsVisible(true);
      setHasJustAppeared(true);
      
      // Trigger attention seeker sau 2 giây
      setTimeout(() => {
        setShowAttentionSeeker(true);
      }, 2000);
      
      // Reset entrance animation sau 0.7s
      setTimeout(() => {
        setHasJustAppeared(false);
      }, 700);
    } else if (!shouldShow && isVisible) {
      setIsVisible(false);
      setShowAttentionSeeker(false);
      setHasJustAppeared(false);
    }
  }, [isVisible]);
  
  // Scroll listener với throttle để tối ưu performance
  useEffect(() => {
    let ticking = false;
    
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // Add scroll listener
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    // Cleanup
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [handleScroll]);
  
  // Handle click event
  const handleClick = () => {
    // Stop attention seeking animation when clicked
    setShowAttentionSeeker(false);
    
    if (onAppointmentClick) {
      onAppointmentClick();
    } else {
      // Navigate to consultation booking page
      navigate('/consultation/book');
    }
  };
  
  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50 
        transition-all duration-500 ease-out
        ${isVisible ? 
          'translate-y-0 opacity-100 scale-100' : 
          'translate-y-full opacity-0 scale-75 pointer-events-none'
        }
        ${hasJustAppeared ? 'slide-up-entrance' : ''}
        ${className}
      `}
    >
      {/* Main Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative overflow-hidden
          w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20
          bg-gradient-to-br from-[#0C3C54] to-[#2A7F9E]
          hover:from-[#2A7F9E] hover:to-[#0C3C54]
          text-white rounded-full shadow-xl
          transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-2xl
          focus:outline-none focus:ring-4 focus:ring-[#0C3C54] focus:ring-opacity-30
          advanced-pulse magnetic-hover floating-bounce
          ${showAttentionSeeker ? 'attention-seeking' : ''}
          ${isHovered ? 'heartbeat-button' : ''}
        `}
        aria-label="Đặt lịch hẹn tư vấn"
        title="Đặt lịch hẹn tư vấn"
      >
        {/* Background shimmer effect */}
        <div className={`
          absolute inset-0 rounded-full
          bg-gradient-to-r from-transparent via-white to-transparent
          opacity-0 group-hover:opacity-20
          transform translate-x-[-100%] group-hover:translate-x-[100%]
          transition-all duration-700 ease-out
          pointer-events-none
        `} />
        
        {/* Icon container */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <Calendar 
            className={`
              w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9
              transition-transform duration-300 ease-out
              ${isHovered ? 'scale-110 rotate-12' : ''}
            `} 
          />
        </div>
        
        {/* Pulse rings */}
        <div className={`
          absolute inset-0 rounded-full border-2 border-white
          opacity-75 scale-100
          animate-ping
          ${isVisible ? '' : 'animate-none'}
        `} />
        
        <div className={`
          absolute inset-0 rounded-full border border-white
          opacity-50 scale-110
          animate-ping
          animation-delay-200
          ${isVisible ? '' : 'animate-none'}
        `} />
      </button>
      
      {/* Tooltip */}
      <div className={`
        absolute bottom-full right-0 mb-3
        px-4 py-2 bg-gray-800 text-white text-sm rounded-lg
        whitespace-nowrap shadow-lg
        transition-all duration-300 ease-out
        ${isHovered ? 
          'opacity-100 translate-y-0' : 
          'opacity-0 translate-y-2 pointer-events-none'
        }
        before:content-[''] before:absolute before:top-full before:right-4
        before:border-4 before:border-transparent before:border-t-gray-800
      `}>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" />
          <span className="font-medium">Đặt lịch tư vấn</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          Nhận tư vấn chuyên nghiệp
        </div>
      </div>
      
      {/* Mobile expanded state */}
      <div className={`
        md:hidden absolute bottom-full right-0 mb-4
        transition-all duration-300 ease-out
        ${isHovered ? 
          'opacity-100 translate-y-0' : 
          'opacity-0 translate-y-4 pointer-events-none'
        }
      `}>
        <div className="bg-white rounded-2xl shadow-2xl p-4 min-w-[280px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0C3C54] to-[#2A7F9E] rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Tư vấn sức khỏe</h3>
              <p className="text-sm text-gray-600">Chuyên nghiệp & riêng tư</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-primary rounded-full"></div>
              <span>Tư vấn trực tuyến 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-primary rounded-full"></div>
              <span>Bác sĩ chuyên khoa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-primary rounded-full"></div>
              <span>Bảo mật thông tin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingAppointmentButton; 