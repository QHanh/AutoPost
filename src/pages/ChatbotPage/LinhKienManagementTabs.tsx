import React, { useState } from 'react';
import ProductComponentsTab from './ProductComponentsTab';
import { useAuth } from '../../hooks/useAuth';

const LinhKienManagementTabs: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(15);

  return (
    <div className="w-full">
      <ProductComponentsTab
        isAuthenticated={isAuthenticated}
        currentPage={currentPage}
        currentLimit={currentLimit}
        onPageChange={setCurrentPage}
        onLimitChange={(limit) => {
          setCurrentLimit(limit);
          // Reset to first page when page size changes
          setCurrentPage(1);
        }}
      />
    </div>
  );
};

export default LinhKienManagementTabs;
