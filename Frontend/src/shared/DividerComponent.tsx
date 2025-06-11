import { motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

interface DividerComponentProps {
  topColor?: string;
  bottomColor?: string;
  height?: number;
}

const DividerComponent: React.FC<DividerComponentProps> = ({ 
  topColor = "#175670", 
  bottomColor = "#0C3C54",
  height = 80
}) => {
  const waveRef1 = useRef<SVGPathElement>(null);
  const waveRef2 = useRef<SVGPathElement>(null);
  
  useEffect(() => {
    const animateWaves = () => {
      if (waveRef1.current && waveRef2.current) {
        const path1 = waveRef1.current;
        const path2 = waveRef2.current;
        let phase1 = 0;
        let phase2 = Math.PI; // Đối lập với sóng 1
        
        const animate = () => {
          phase1 += 0.003;
          phase2 += 0.005;
          
          // Sóng 1
          const points1 = [];
          for (let i = 0; i <= 120; i++) {
            const x = (i / 120) * 1440;
            const y = Math.sin(i * 0.05 + phase1) * 15 + 50;
            points1.push(`${x},${y}`);
          }
          const pathData1 = `M0,100 L0,50 ${points1.map(p => `L${p}`).join(' ')} L1440,50 L1440,100 Z`;
          path1.setAttribute('d', pathData1);
          
          // Sóng 2 - ngược hướng
          const points2 = [];
          for (let i = 0; i <= 120; i++) {
            const x = (i / 120) * 1440;
            const y = Math.sin(i * 0.04 + phase2) * 12 + 60;
            points2.push(`${x},${y}`);
          }
          const pathData2 = `M0,100 L0,60 ${points2.map(p => `L${p}`).join(' ')} L1440,60 L1440,100 Z`;
          path2.setAttribute('d', pathData2);
          
          requestAnimationFrame(animate);
        };
        
        animate();
      }
    };
    
    animateWaves();
  }, []);
  
  return (
    <div 
      className="relative overflow-hidden w-screen" 
      style={{ 
        marginLeft: 'calc(-50vw + 50%)', 
        marginRight: 'calc(-50vw + 50%)', 
        width: '100vw',
        height: `${height}px`
      }}
    >
      {/* Gradient background */}
      <div className="absolute top-0 left-0 w-full h-full" style={{ background: `linear-gradient(to bottom, ${topColor}, ${bottomColor})` }}></div>
      
      <div className="absolute w-full h-full">
        <div className="relative h-full">
          {/* Wave animation 1 */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" className="w-full absolute top-0 left-0">
            <motion.path 
              ref={waveRef1}
              fill={bottomColor} 
              fillOpacity="0.3"
              d="M0,100 L0,50 L1440,50 L1440,100 Z"
            >
            </motion.path>
          </svg>
          
          {/* Wave animation 2 */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" className="w-full absolute top-0 left-0">
            <motion.path 
              ref={waveRef2}
              fill={bottomColor} 
              fillOpacity="0.15"
              d="M0,100 L0,60 L1440,60 L1440,100 Z"
            >
            </motion.path>
          </svg>
          
          {/* Main curved wave */}
          <div className="absolute top-0 left-0 w-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none" className="w-full h-full">
              <motion.path 
                initial={{ opacity: 0.7, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                fill="#FFFFFF" 
                fillOpacity="0.08" 
                d="M0,30 C240,70 480,90 720,70 C960,50 1200,10 1440,30 L1440,100 L0,100 Z"
              >
              </motion.path>
            </svg>
          </div>
          
          {/* Floating particles */}
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(12)].map((_, index) => (
              <motion.div 
                key={index}
                initial={{ 
                  opacity: Math.random() * 0.5 + 0.1, 
                  x: `${Math.random() * 100}%`, 
                  y: `${Math.random() * 100}%`,
                  scale: Math.random() * 0.5 + 0.2
                }}
                animate={{ 
                  y: [`${Math.random() * 60 + 20}%`, `${Math.random() * 60 + 20}%`],
                  x: [`${Math.random() * 10 + index * 8}%`, `${Math.random() * 10 + index * 8 + 3}%`],
                  scale: [Math.random() * 0.3 + 0.2, Math.random() * 0.5 + 0.3]
                }}
                transition={{ 
                  duration: Math.random() * 4 + 3, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
                className="absolute h-1 w-1 rounded-full bg-white"
                style={{opacity: Math.random() * 0.3 + 0.1}}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DividerComponent;
