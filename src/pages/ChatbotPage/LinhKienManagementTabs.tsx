import React from 'react';
import ProductComponentsTab from './ProductComponentsTab';
import { useAuth } from '../../hooks/useAuth';

const LinhKienManagementTabs: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="w-full">
      <ProductComponentsTab isAuthenticated={isAuthenticated} />
    </div>
  );
};

export default LinhKienManagementTabs;
