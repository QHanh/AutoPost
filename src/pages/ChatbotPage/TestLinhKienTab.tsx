import React from 'react';

const TestLinhKienTab: React.FC = () => {
  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-purple-600 mb-4">Test Tab Linh kiện</h1>
      <p className="text-gray-700 mb-4">Tab này được tạo để test việc render tab Linh kiện.</p>
      
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-purple-800">Trạng thái</h3>
          <p className="text-purple-700">Tab đang hoạt động bình thường</p>
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800">Thông tin</h3>
          <p className="text-blue-700">Nếu bạn thấy component này, có nghĩa là tab Linh kiện đang render đúng.</p>
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Ghi chú</h3>
          <p className="text-yellow-700">Component gốc ProductComponentsTab có thể có vấn đề với các import hoặc dependencies.</p>
        </div>
      </div>
    </div>
  );
};

export default TestLinhKienTab; 