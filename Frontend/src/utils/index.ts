import * as dateUtils from './dateUtils';
import { debounce, formatCurrency, truncateString } from './helpers';
import * as localStorageUtils from './localStorage';
import * as validationUtils from './validation';

// Hàm tiện ích để bảo vệ input số
export const preventNonNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Chỉ cho phép: số, backspace, delete, arrow keys, tab
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  const isNumber = /[0-9]/.test(e.key);
  const isAllowedKey = allowedKeys.includes(e.key);
  
  if (!isNumber && !isAllowedKey) {
    e.preventDefault();
  }
};

// Hàm tiện ích để bảo vệ input số có dấu chấm thập phân
export const preventNonNumericDecimalInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Chỉ cho phép: số, dấu chấm, backspace, delete, arrow keys, tab
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  const isNumber = /[0-9]/.test(e.key);
  const isDot = e.key === '.';
  const isAllowedKey = allowedKeys.includes(e.key);
  
  if (!isNumber && !isDot && !isAllowedKey) {
    e.preventDefault();
  }
  
  // Ngăn chặn nhập nhiều dấu chấm
  if (isDot && e.currentTarget.value.includes('.')) {
    e.preventDefault();
  }
};

export {
    dateUtils, debounce,
    formatCurrency, localStorageUtils, truncateString, validationUtils
};

