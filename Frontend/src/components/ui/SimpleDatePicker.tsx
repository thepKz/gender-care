import React from 'react';

interface SimpleDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const SimpleDatePicker: React.FC<SimpleDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Chọn ngày",
  style = {},
  disabled = false
}) => {
  const defaultStyle: React.CSSProperties = {
    width: '100%',
    height: '32px',
    padding: '4px 11px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'border-color 0.3s',
    ...style
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%'
  };

  const clearButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#999',
    padding: '0',
    display: value ? 'block' : 'none'
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#1890ff';
    e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#d9d9d9';
    e.target.style.boxShadow = 'none';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div style={containerStyle}>
      <input
        type="date"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={defaultStyle}
        disabled={disabled}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={handleClear}
        style={clearButtonStyle}
        title="Xóa ngày"
      >
        ✕
      </button>
    </div>
  );
};

export default SimpleDatePicker;
