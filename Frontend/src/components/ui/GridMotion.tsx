import React, { useEffect, useRef, FC } from "react";
import "./GridMotion.css";

interface GridMotionProps {
  items?: (string | React.ReactNode)[];
  gradientColor?: string;
  height?: string;
}

const GridMotion: FC<GridMotionProps> = ({
  items = [],
  gradientColor = "rgba(0, 100, 120, 0.05)",
  height = "60vh"
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseXRef = useRef<number>(window.innerWidth / 2);

  const totalItems = 28;
  const defaultItems = [
    '🏥 Bệnh viện chất lượng',
    <div key="jsx-1" className="healthcare-item">
      <div className="healthcare-icon">💊</div>
      <span>Thuốc an toàn</span>
    </div>,
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?q=80&w=2070&auto=format&fit=crop',
    '👩‍⚕️ Bác sĩ chuyên nghiệp',
    <div key="jsx-2" className="healthcare-item">
      <div className="healthcare-icon">🔬</div>
      <span>Xét nghiệm chính xác</span>
    </div>,
    '🩺 Tư vấn tận tâm',
    <div key="jsx-3" className="healthcare-item">
      <div className="healthcare-icon">💝</div>
      <span>Chăm sóc chu đáo</span>
    </div>,
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=2128&auto=format&fit=crop',
    '🏃‍♀️ Sức khỏe tốt',
    <div key="jsx-4" className="healthcare-item">
      <div className="healthcare-icon">📱</div>
      <span>Ứng dụng hiện đại</span>
    </div>,
    '🤰 Chăm sóc mẹ bầu',
    <div key="jsx-5" className="healthcare-item">
      <div className="healthcare-icon">🎯</div>
      <span>Điều trị hiệu quả</span>
    </div>,
    'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=2069&auto=format&fit=crop',
    '👶 Chăm sóc trẻ em',
    <div key="jsx-6" className="healthcare-item">
      <div className="healthcare-icon">⚡</div>
      <span>Nhanh chóng</span>
    </div>,
    '🧬 Công nghệ tiên tiến',
    <div key="jsx-7" className="healthcare-item">
      <div className="healthcare-icon">🛡️</div>
      <span>Bảo mật tuyệt đối</span>
    </div>,
    'https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?q=80&w=2070&auto=format&fit=crop',
    '💻 Tư vấn online',
    <div key="jsx-8" className="healthcare-item">
      <div className="healthcare-icon">🎖️</div>
      <span>Chất lượng cao</span>
    </div>,
    '🏆 Uy tín hàng đầu',
    <div key="jsx-9" className="healthcare-item">
      <div className="healthcare-icon">🌟</div>
      <span>Dịch vụ 5 sao</span>
    </div>,
    'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=2128&auto=format&fit=crop',
    '🤝 Tin cậy',
    <div key="jsx-10" className="healthcare-item">
      <div className="healthcare-icon">💚</div>
      <span>Yêu thương</span>
    </div>,
    '⏰ 24/7 hỗ trợ',
    <div key="jsx-11" className="healthcare-item">
      <div className="healthcare-icon">🔥</div>
      <span>Nhiệt huyết</span>
    </div>,
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=2128&auto=format&fit=crop',
    '🌈 Sống khỏe mạnh'
  ];

  const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      mouseXRef.current = e.clientX;
      
      // Simple CSS transform animation without GSAP
      rowRefs.current.forEach((row, index) => {
        if (row) {
          const direction = index % 2 === 0 ? 1 : -1;
          const maxMoveAmount = 100;
          const moveAmount = ((e.clientX / window.innerWidth) * maxMoveAmount - maxMoveAmount / 2) * direction;
          
          row.style.transform = `translateX(${moveAmount}px)`;
          row.style.transition = 'transform 0.3s ease-out';
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="gridmotion-wrapper" style={{ height }} ref={gridRef}>
      <section
        className="gridmotion-intro"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        <div className="gridmotion-container">
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="gridmotion-row"
              ref={(el) => {
                rowRefs.current[rowIndex] = el;
              }}
            >
              {Array.from({ length: 7 }, (_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];
                return (
                  <div key={itemIndex} className="gridmotion-row__item">
                    <div className="gridmotion-row__item-inner">
                      {typeof content === "string" &&
                      content.startsWith("http") ? (
                        <div
                          className="gridmotion-row__item-img"
                          style={{
                            backgroundImage: `url(${content})`,
                          }}
                        ></div>
                      ) : (
                        <div className="gridmotion-row__item-content">{content}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default GridMotion; 