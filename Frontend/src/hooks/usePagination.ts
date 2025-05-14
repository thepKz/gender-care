import { useCallback, useMemo, useState } from 'react';

interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  total?: number;
}

interface PaginationResult<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalItems: number;
  startItem: number;
  endItem: number;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: number) => void;
  paginatedData: T[];
  setData: (data: T[]) => void;
}

/**
 * Custom hook cho phân trang
 * @param options Tùy chọn phân trang
 * @returns Các giá trị và hàm xử lý phân trang
 */
export const usePagination = <T>(
  options: PaginationOptions = {}
): PaginationResult<T> => {
  // Khởi tạo giá trị mặc định
  const { initialPage = 1, initialPageSize = 10, total = 0 } = options;

  // State
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [data, setData] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState<number>(total);

  // Tính toán các giá trị phân trang
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  // Kiểm tra có trang sau không
  const hasNextPage = useMemo(
    () => currentPage < totalPages,
    [currentPage, totalPages]
  );

  // Kiểm tra có trang trước không
  const hasPreviousPage = useMemo(() => currentPage > 1, [currentPage]);

  // Chỉ số bắt đầu và kết thúc của dữ liệu hiện tại
  const startItem = useMemo(
    () => (currentPage - 1) * pageSize + 1,
    [currentPage, pageSize]
  );
  
  const endItem = useMemo(
    () => Math.min(startItem + pageSize - 1, totalItems),
    [startItem, pageSize, totalItems]
  );

  // Xử lý khi thay đổi trang
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Xử lý khi thay đổi kích thước trang
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi kích thước
  }, []);

  // Tạo dữ liệu đã phân trang
  const paginatedData = useMemo(() => {
    if (data.length === 0) return [];
    
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, data.length);
    
    // Cập nhật tổng số item nếu cần
    if (data.length !== totalItems) {
      setTotalItems(data.length);
    }
    
    return data.slice(start, end);
  }, [data, currentPage, pageSize, totalItems]);

  // Hàm set dữ liệu và cập nhật tổng số item
  const handleSetData = useCallback((newData: T[]) => {
    setData(newData);
    setTotalItems(newData.length);
    
    // Reset về trang 1 nếu trang hiện tại lớn hơn số trang của dữ liệu mới
    const newTotalPages = Math.max(1, Math.ceil(newData.length / pageSize));
    if (currentPage > newTotalPages) {
      setCurrentPage(1);
    }
  }, [pageSize, currentPage]);

  return {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    totalItems,
    startItem,
    endItem,
    handlePageChange,
    handlePageSizeChange,
    paginatedData,
    setData: handleSetData,
  };
}; 