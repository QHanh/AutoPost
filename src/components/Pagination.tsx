import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = '' 
}) => {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setInputPage(value);
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(inputPage, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      // If submission is invalid, reset to the current page.
      setInputPage(currentPage.toString());
    }
  };
  
  const handlePageInputBlur = () => {
    // Also reset on blur if the value is invalid or empty.
    const page = parseInt(inputPage, 10);
    if (isNaN(page) || page < 1 || page > totalPages) {
      setInputPage(currentPage.toString());
    }
  };

  const goToFirstPage = () => onPageChange(1);
  const goToLastPage = () => onPageChange(totalPages);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* First Page Button */}
      <button
        onClick={goToFirstPage}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        title="Trang đầu"
      >
        <ChevronsLeft size={20} />
      </button>

      {/* Previous Page Button */}
      <button
        onClick={goToPreviousPage}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        title="Trang trước"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Page Input */}
      <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Trang</span>
        <input
          type="text"
          value={inputPage}
          onChange={handlePageInputChange}
          onBlur={handlePageInputBlur}
          className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={currentPage.toString()}
        />
        <span className="text-sm text-gray-600">/ {totalPages}</span>
        <button
          type="submit"
          onMouseDown={(e) => e.preventDefault()} // The key fix to prevent blur before submit
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Đi
        </button>
      </form>

      {/* Next Page Button */}
      <button
        onClick={goToNextPage}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        title="Trang sau"
      >
        <ChevronRight size={20} />
      </button>

      {/* Last Page Button */}
      <button
        onClick={goToLastPage}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        title="Trang cuối"
      >
        <ChevronsRight size={20} />
      </button>
    </div>
  );
};

export default Pagination; 