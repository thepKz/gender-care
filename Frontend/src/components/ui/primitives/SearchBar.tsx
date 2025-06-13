import React from 'react';
import { SearchNormal1 } from 'iconsax-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchBar – input lớn với icon search bên trái, style đồng bộ Primary.
 */
const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Tìm kiếm...', className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-4 pl-14 pr-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0C3C54] text-gray-700 text-lg"
      />
      <SearchNormal1 size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
};

export default SearchBar; 