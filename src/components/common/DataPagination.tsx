import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';

interface PaginationData {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface DataPaginationProps {
  /**
   * Pagination data from PaginatedResponse
   */
  paginationData: PaginationData;
  
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  
  /**
   * Maximum number of page links to show (default: 5)
   */
  maxVisiblePages?: number;
  
  /**
   * Show page info text (e.g., "Showing 1-20 of 100 items")
   */
  showPageInfo?: boolean;
  
  /**
   * Custom class name for the container
   */
  className?: string;
}

/**
 * Reusable pagination component that works with PaginatedResponse interface
 * Used across all grid pages in the system for consistent pagination behavior
 */
export const DataPagination: React.FC<DataPaginationProps> = ({
  paginationData,
  onPageChange,
  maxVisiblePages = 5,
  showPageInfo = true,
  className = ''
}) => {
  const { pageNumber, pageSize, totalCount, totalPages, hasPreviousPage, hasNextPage } = paginationData;

  // Don't render if there's only one page or no data
  if (totalPages <= 1) {
    return null;
  }

  /**
   * Generate array of page numbers to display
   * Handles ellipsis logic for large page counts
   */
  const generatePageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, pageNumber - halfVisible);
    let endPage = Math.min(totalPages, pageNumber + halfVisible);

    // Adjust if we're near the beginning or end
    if (pageNumber <= halfVisible) {
      endPage = Math.min(totalPages, maxVisiblePages);
    } else if (pageNumber > totalPages - halfVisible) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }

    const pages: (number | 'ellipsis')[] = [];

    // Add first page if not included
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis');
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page if not included
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageClick = (page: number) => {
    if (page !== pageNumber && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handlePreviousClick = () => {
    if (hasPreviousPage) {
      onPageChange(pageNumber - 1);
    }
  };

  const handleNextClick = () => {
    if (hasNextPage) {
      onPageChange(pageNumber + 1);
    }
  };

  const pageNumbers = generatePageNumbers();

  // Calculate display info for page info text
  const startItem = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endItem = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {showPageInfo && (
        <div className="text-sm text-muted-foreground">
          {totalCount === 0 ? (
            'No items found'
          ) : (
            `Showing ${startItem.toLocaleString()}-${endItem.toLocaleString()} of ${totalCount.toLocaleString()} items`
          )}
        </div>
      )}
      
      <Pagination>
        <PaginationContent>
          {hasPreviousPage && (
            <PaginationItem>
              <PaginationPrevious 
                onClick={handlePreviousClick}
                className="cursor-pointer"
              />
            </PaginationItem>
          )}
          
          {pageNumbers.map((pageNum, index) => (
            <PaginationItem key={index}>
              {pageNum === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={pageNumber === pageNum}
                  onClick={() => handlePageClick(pageNum)}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          {hasNextPage && (
            <PaginationItem>
              <PaginationNext 
                onClick={handleNextClick}
                className="cursor-pointer"
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};

/**
 * Helper function to extract pagination data from PaginatedResponse
 */
export const extractPaginationData = <T,>(response: {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}): PaginationData => ({
  pageNumber: response.pageNumber,
  pageSize: response.pageSize,
  totalCount: response.totalCount,
  totalPages: response.totalPages,
  hasPreviousPage: response.hasPreviousPage,
  hasNextPage: response.hasNextPage
});
