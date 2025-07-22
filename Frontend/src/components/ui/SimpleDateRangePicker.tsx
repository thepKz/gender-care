import React from 'react';

interface SimpleDateRangePickerProps {
  value: [string, string] | null;
  onChange: (value: [string, string] | null) => void;
  placeholder?: [string, string];
  style?: React.CSSProperties;
  disabled?: boolean;
}

const SimpleDateRangePicker: React.FC<SimpleDateRangePickerProps> = ({
  value,
  onChange,
  placeholder = ["Từ ngày", "Đến ngày"],
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
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    width: '100%'
  };

  const inputStyle: React.CSSProperties = {
    ...defaultStyle,
    flex: 1
  };

  const clearButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#999',
    padding: '0 4px',
    display: value ? 'block' : 'none'
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value;
    const endDate = value?.[1] || '';
    onChange(startDate ? [startDate, endDate] : null);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = value?.[0] || '';
    const endDate = e.target.value;
    onChange(endDate ? [startDate, endDate] : null);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#1890ff';
    e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#d9d9d9';
    e.target.style.boxShadow = 'none';
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div style={containerStyle}>
      <input
        type="date"
        value={value?.[0] || ''}
        onChange={handleStartDateChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={inputStyle}
        disabled={disabled}
        placeholder={placeholder[0]}
      />
      <span style={{ color: '#999', fontSize: '14px' }}>~</span>
      <input
        type="date"
        value={value?.[1] || ''}
        onChange={handleEndDateChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={inputStyle}
        disabled={disabled}
        placeholder={placeholder[1]}
      />
      <button
        type="button"
        onClick={handleClear}
        style={clearButtonStyle}
        title="Xóa khoảng ngày"
      >
        ✕
      </button>
    </div>
  );
};

export default SimpleDateRangePicker;
