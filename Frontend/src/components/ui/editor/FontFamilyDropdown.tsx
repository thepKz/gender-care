import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Type } from 'lucide-react';

interface Props {
  setFontFamily: (family: string) => void;
  getCurrentFontFamily: () => string;
}

const FontFamilyDropdown: React.FC<Props> = ({ setFontFamily, getCurrentFontFamily }) => {
  const fontFamilies = [
    { label: 'Arial', value: 'Arial, sans-serif', preview: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman, serif', preview: 'Times New Roman' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif', preview: 'Helvetica' },
    { label: 'Georgia', value: 'Georgia, serif', preview: 'Georgia' },
    { label: 'Verdana', value: 'Verdana, sans-serif', preview: 'Verdana' },
    { label: 'Courier New', value: 'Courier New, monospace', preview: 'Courier New' },
    { label: 'Roboto', value: 'Roboto, sans-serif', preview: 'Roboto' },
    { label: 'Open Sans', value: 'Open Sans, sans-serif', preview: 'Open Sans' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif', preview: 'Montserrat' },
    { label: 'Playfair Display', value: 'Playfair Display, serif', preview: 'Playfair Display' },
  ];

  const currentFamily = getCurrentFontFamily();
  const currentFamilyLabel = fontFamilies.find(font => font.value === currentFamily)?.label || 'Arial';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button 
          className="p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-[#0C3C54] min-w-[80px] text-left"
          aria-label={`Font family: ${currentFamilyLabel}`}
        >
          <div className="flex items-center gap-1">
            <Type size={16} />
            <span className="text-xs truncate">{currentFamilyLabel}</span>
          </div>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 text-sm z-50 min-w-[200px]">
          <div className="text-xs text-gray-500 px-3 py-1 mb-1">Font Family</div>
          {fontFamilies.map((font) => (
            <DropdownMenu.Item 
              key={font.value} 
              onSelect={() => setFontFamily(font.value)} 
              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                currentFamily === font.value ? 'text-[#0C3C54] bg-blue-50 font-semibold' : 'text-gray-700'
              }`}
            >
              <span style={{ fontFamily: font.preview }} className="text-base">
                {font.label}
              </span>
              <span className="text-xs text-gray-400 ml-3">Aa</span>
              {currentFamily === font.value && (
                <div className="ml-2 w-2 h-2 bg-[#0C3C54] rounded-full"></div>
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default FontFamilyDropdown; 