import React from 'react';
import ProductComponentsTab from './ProductComponentsTab';
import { useAuth } from '../../hooks/useAuth';

const LinhKienManagementTabs: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    
      
      <ProductComponentsTab isAuthenticated={isAuthenticated} />
    
  );
};

export default LinhKienManagementTabs;
