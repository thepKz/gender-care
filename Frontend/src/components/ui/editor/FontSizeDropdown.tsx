import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Type } from 'lucide-react';

interface Props {
  setFontSize: (size: string) => void;
  getCurrentFontSize: () => string;
}

const FontSizeDropdown: React.FC<Props> = ({ setFontSize, getCurrentFontSize }) => {
  const fontSizes = [
    { label: '8', value: '8pt' },
    { label: '9', value: '9pt' },
    { label: '10', value: '10pt' },
    { label: '11', value: '11pt' },
    { label: '12', value: '12pt' },
    { label: '14', value: '14pt' },
    { label: '16', value: '16pt' },
    { label: '18', value: '18pt' },
    { label: '20', value: '20pt' },
    { label: '24', value: '24pt' },
    { label: '28', value: '28pt' },
    { label: '36', value: '36pt' },
    { label: '48', value: '48pt' },
    { label: '72', value: '72pt' },
  ];

  const currentSize = getCurrentFontSize();
  const currentSizeLabel = fontSizes.find(size => size.value === currentSize)?.label || '12';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button 
          className="p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-[#0C3C54] min-w-[50px] text-left flex items-center gap-1"
          aria-label={`Font size: ${currentSizeLabel}pt`}
        >
          <Type size={16} />
          <span className="text-sm font-mono min-w-[20px]">{currentSizeLabel}</span>
          <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 text-sm z-50 min-w-[120px] editor-dropdown-content">
          <div className="text-xs text-gray-500 px-3 py-1 mb-1">Kích thước</div>
          {fontSizes.map((size) => (
            <DropdownMenu.Item 
              key={size.value} 
              onSelect={() => setFontSize(size.value)} 
              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                currentSize === size.value ? 'text-[#0C3C54] bg-blue-50 font-semibold' : 'text-gray-700'
              }`}
            >
              <span className="font-mono text-base">{size.label}</span>
              <span className="text-xs text-gray-400 ml-3">pt</span>
              {currentSize === size.value && (
                <div className="ml-auto w-2 h-2 bg-[#0C3C54] rounded-full"></div>
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default FontSizeDropdown; 