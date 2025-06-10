import React from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import './CustomPagination.css';

interface CustomPaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize: number) => void;
  className?: string;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  current,
  total,
  pageSize,
  onChange,
  className = '',
}) => {
  // Tính toán số trang
  const totalPages = Math.ceil(total / pageSize);
  
  // Tạo mảng các trang hiển thị
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5; // Số trang hiển thị tối đa
    
    if (totalPages <= maxVisiblePages) {
      // Hiển thị tất cả các trang nếu tổng số trang nhỏ hơn hoặc bằng maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Luôn hiển thị trang đầu
      pages.push(1);
      
      if (current <= 3) {
        // Nếu trang hiện tại gần đầu
        pages.push(2, 3, 4, 'ellipsis');
      } else if (current >= totalPages - 2) {
        // Nếu trang hiện tại gần cuối
        pages.push('ellipsis', totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        // Trang hiện tại ở giữa
        pages.push('ellipsis', current - 1, current, current + 1, 'ellipsis');
      }
      
      // Luôn hiển thị trang cuối
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className={`custom-pagination ${className}`}>
      {/* Previous button */}
      <button
        className={`pagination-button ${current === 1 ? 'disabled' : ''}`}
        onClick={() => current > 1 && onChange(current - 1, pageSize)}
        disabled={current === 1}
      >
        <LeftOutlined /> Previous
      </button>

      {/* Page numbers */}
      <div className="pagination-numbers">
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === 'ellipsis' ? (
              <span className="pagination-ellipsis">...</span>
            ) : (
              <button
                className={`pagination-number ${page === current ? 'active' : ''}`}
                onClick={() => onChange(page as number, pageSize)}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next button */}
      <button
        className={`pagination-button ${current === totalPages ? 'disabled' : ''}`}
        onClick={() => current < totalPages && onChange(current + 1, pageSize)}
        disabled={current === totalPages}
      >
        Next <RightOutlined />
      </button>
    </div>
  );
};

export default CustomPagination; 