import React from 'react';

const TestTab: React.FC = () => {
  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Test Tab Component</h1>
      <p className="text-gray-700">Nếu bạn thấy component này, có nghĩa là việc render đang hoạt động bình thường.</p>
      <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
        <p className="text-blue-800">Component này được tạo để test việc render các tab.</p>
      </div>
    </div>
  );
};

export default TestTab; 