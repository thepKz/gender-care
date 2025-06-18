import React from 'react';

interface TagChipProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * TagChip – nhãn nhỏ thay thế cho antd Tag.
 * Màu mặc định: cyan nhạt; có thể override bằng className.
 */
const TagChip: React.FC<TagChipProps> = ({ children, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 ${className}`}
    >
      {children}
    </span>
  );
};

export default TagChip; 