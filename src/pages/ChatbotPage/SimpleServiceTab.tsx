import React from 'react';

const SimpleServiceTab: React.FC = () => {
  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-green-600 mb-4">Quản lý Dịch vụ</h1>
      <p className="text-gray-700 mb-4">Đây là trang quản lý dịch vụ đơn giản để test.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800">Dịch vụ 1</h3>
          <p className="text-gray-600">Mô tả dịch vụ 1</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800">Dịch vụ 2</h3>
          <p className="text-gray-600">Mô tả dịch vụ 2</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800">Dịch vụ 3</h3>
          <p className="text-gray-600">Mô tả dịch vụ 3</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleServiceTab; 