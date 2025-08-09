import React, { useState } from 'react';
import ProductComponentsTab from './ProductComponentsTab';
import CategoriesTab from './CategoriesTab';
import PropertiesTab from './PropertiesTab';
import { useAuth } from '../../hooks/useAuth';

const LinhKienManagementTabs: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'product-components' | 'categories' | 'properties'>('product-components');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'product-components':
        return <ProductComponentsTab isAuthenticated={isAuthenticated} />;
      case 'categories':
        return <CategoriesTab isAuthenticated={isAuthenticated} />;
      case 'properties':
        return <PropertiesTab isAuthenticated={isAuthenticated} />;
      default:
        return <ProductComponentsTab isAuthenticated={isAuthenticated} />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý Linh Kiện</h1>
        <p className="text-gray-600">Quản lý các thành phần sản phẩm, danh mục và thuộc tính</p>
      </div>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('product-components')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'product-components' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Linh Kiện
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'categories' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Danh Mục
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'properties' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Thuộc Tính
          </button>
        </nav>
      </div>
      
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default LinhKienManagementTabs;
