import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Palette, X } from 'lucide-react';
import ToolbarButton from './ToolbarButton';

interface Props {
  onChange: (color: string) => void;
  onClear?: () => void;
  ariaLabel: string;
  type?: 'text' | 'highlight';
}

const ColorPopover: React.FC<Props> = ({ onChange, onClear, ariaLabel, type = 'text' }) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Bảng màu chuẩn Material Design
  const standardColors = [
    '#F44336', // Red
    '#FF9800', // Orange  
    '#FFEB3B', // Yellow
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#E91E63', // Pink
    '#795548', // Brown
  ];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onChange(color);
  };

  const handleClear = () => {
    setSelectedColor(null);
    if (onClear) {
      onClear();
    } else {
      // Fallback: set transparent or default
      onChange(type === 'highlight' ? 'transparent' : '#000000');
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <ToolbarButton 
          icon={<Palette size={18} />} 
          ariaLabel={ariaLabel}
          style={{ 
            backgroundColor: selectedColor || undefined,
            color: selectedColor && type === 'text' ? selectedColor : undefined 
          }}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          side="bottom" 
          className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-50"
          sideOffset={5}
        >
          <div className="flex flex-col gap-3">
            {/* Tiêu đề */}
            <div className="text-sm font-medium text-gray-700">
              {type === 'highlight' ? 'Màu nền' : 'Màu chữ'}
            </div>
            
            {/* Bảng màu chuẩn */}
            <div className="grid grid-cols-4 gap-2">
              {standardColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Nút hủy màu */}
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <X size={16} />
              Hủy màu
            </button>

            {/* Hiển thị màu đã chọn */}
            {selectedColor && (
              <div className="text-xs text-gray-500 text-center font-mono">
                {selectedColor}
              </div>
            )}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default ColorPopover; 