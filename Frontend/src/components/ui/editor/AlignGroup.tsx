import React from 'react';
import * as Toolbar from '@radix-ui/react-toolbar';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import ToolbarButton from './ToolbarButton';

interface Props {
  setAlign: (value: string) => void;
  isActive: (value: string) => boolean;
}

const AlignGroup: React.FC<Props> = ({ setAlign, isActive }) => {
  const items = [
    { value: 'left', icon: <AlignLeft size={18} />, label: 'Căn trái' },
    { value: 'center', icon: <AlignCenter size={18} />, label: 'Căn giữa' },
    { value: 'right', icon: <AlignRight size={18} />, label: 'Căn phải' },
    { value: 'justify', icon: <AlignJustify size={18} />, label: 'Căn đều' },
  ];

  return (
    <div className="flex items-center gap-1">
      {items.map((item) => (
        <ToolbarButton
          key={item.value}
          ariaLabel={item.label}
          icon={item.icon}
          active={isActive(item.value)}
          onClick={() => setAlign(item.value)}
        />
      ))}
    </div>
  );
};

export default AlignGroup; 