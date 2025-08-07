import React from 'react';
import CommonItemTab from '../../components/CommonItemTab';

interface CategoriesTabProps {
  isAuthenticated: boolean;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ isAuthenticated }) => {
  return (
    <CommonItemTab 
      isAuthenticated={isAuthenticated}
      itemType="category"
      title="Quản lý Danh Mục"
    />
  );
};

export default CategoriesTab;
