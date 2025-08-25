import React from 'react';

interface SimpleWrapperProps {
  children: React.ReactNode;
  name: string;
}

const SimpleWrapper: React.FC<SimpleWrapperProps> = ({ children, name }) => {
  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Wrapper: {name}</h1>
      <div className="border border-gray-200 rounded-lg p-4">
        {children}
      </div>
    </div>
  );
};

export default SimpleWrapper; 