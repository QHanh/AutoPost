import React from 'react';
import CommonItemTab from '../../components/CommonItemTab';

interface PropertiesTabProps {
  isAuthenticated: boolean;
}

const PropertiesTab: React.FC<PropertiesTabProps> = ({ isAuthenticated }) => {
  return (
    <CommonItemTab 
      isAuthenticated={isAuthenticated}
      itemType="property"
      title="Quản lý Thuộc Tính"
    />
  );
};

export default PropertiesTab;
