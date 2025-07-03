import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Heading1, Heading2, Heading3 } from 'lucide-react';

interface Props {
  setHeading: (level: number | null) => void;
  editorIsActive: (level: number) => boolean;
}

// Icon cho H4 (sử dụng text khi không có icon riêng)
const Heading4Icon = () => (
  <div className="w-4 h-4 flex items-center justify-center text-xs font-bold">H4</div>
);

const HeadingDropdown: React.FC<Props> = ({ setHeading, editorIsActive }) => {
  // Xác định heading nào đang active để hiển thị icon đúng
  const getActiveHeading = () => {
    if (editorIsActive(1)) return 1;
    if (editorIsActive(2)) return 2;
    if (editorIsActive(3)) return 3;
    if (editorIsActive(4)) return 4;
    return null;
  };

  const activeHeading = getActiveHeading();

  // Icon hiển thị trên button chính
  const getButtonIcon = () => {
    switch (activeHeading) {
      case 1: return <Heading1 size={18} />;
      case 3: return <Heading3 size={18} />;
      case 4: return <Heading4Icon />;
      default: return <Heading2 size={18} />; // H2 là mặc định
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button 
          className={`p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-[#0C3C54] ${
            activeHeading !== null ? 'bg-[#0C3C54]/10 text-[#0C3C54]' : ''
          }`}
          aria-label="Heading"
        >
          {getButtonIcon()}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 text-sm z-50 editor-dropdown-content">
          {[1, 2, 3, 4].map(level => (
            <DropdownMenu.Item 
              key={level} 
              onSelect={() => setHeading(level)} 
              className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                editorIsActive(level) ? 'text-[#0C3C54] bg-blue-50 font-semibold' : 'text-gray-700'
              }`}
            >
              {level === 1 && <Heading1 size={16}/>} 
              {level === 2 && <Heading2 size={16}/>} 
              {level === 3 && <Heading3 size={16}/>}
              {level === 4 && <div className="w-4 h-4 flex items-center justify-center text-xs font-bold">H4</div>}
              <span className={`${level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : level === 3 ? 'text-lg' : 'text-base'} font-semibold`}>
                Heading {level}
              </span>
              {editorIsActive(level) && (
                <div className="ml-auto w-2 h-2 bg-[#0C3C54] rounded-full"></div>
              )}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="h-px bg-gray-200 my-2" />
          <DropdownMenu.Item 
            onSelect={() => setHeading(null)} 
            className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
              activeHeading === null ? 'text-[#0C3C54] bg-blue-50 font-semibold' : 'text-gray-700'
            }`}
          >
            <div className="w-4 h-4 flex items-center justify-center text-xs">P</div>
            <span>Paragraph</span>
            {activeHeading === null && (
              <div className="ml-auto w-2 h-2 bg-[#0C3C54] rounded-full"></div>
            )}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default HeadingDropdown; 