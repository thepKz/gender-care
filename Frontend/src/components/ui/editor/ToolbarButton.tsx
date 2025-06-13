import React, { forwardRef } from 'react';
import * as Toolbar from '@radix-ui/react-toolbar';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ToolbarButtonProps {
  onClick?: () => void;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

/*
 * Nút trong thanh công cụ TipTap, có tooltip.
 */
const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(({ onClick, icon, active = false, disabled = false, ariaLabel, style }, ref) => {
  const btnClasses = `p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-[#0C3C54] disabled:opacity-40 disabled:cursor-not-allowed ${active ? 'bg-[#0C3C54]/10 text-[#0C3C54]' : ''}`;

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Toolbar.Button
          ref={ref as any}
          aria-label={ariaLabel}
          onClick={onClick}
          disabled={disabled}
          className={btnClasses}
          style={style}
        >
          {icon}
        </Toolbar.Button>
      </Tooltip.Trigger>
      {ariaLabel && (
        <Tooltip.Portal>
          <Tooltip.Content side="bottom" className="px-2 py-1 rounded text-xs bg-gray-800 text-white shadow-lg select-none" >{ariaLabel}</Tooltip.Content>
        </Tooltip.Portal>
      )}
    </Tooltip.Root>
  );
});

ToolbarButton.displayName = 'ToolbarButton';

export default ToolbarButton; 