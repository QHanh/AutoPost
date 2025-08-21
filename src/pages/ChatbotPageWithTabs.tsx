import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Smartphone, Palette, Layers, Database, MessageSquare, Package, Settings, FileText } from 'lucide-react';

import DevicesTab from './ChatbotPage/DevicesTab';
import ColorsTab from './ChatbotPage/ColorsTab';
import SettingsTab from './ChatbotPage/SettingsTab';
import DocumentsTab from './ChatbotPage/DocumentsTab';
import DeviceColorsTab from './ChatbotPage/DeviceColorsTab';
import DeviceInfosTab from './ChatbotPage/DeviceInfosTab';
import DeviceStorageTab from './ChatbotPage/DeviceStorageTab';
import ChatbotTab from './ChatbotPage/ChatbotTab';
import LinhKienManagementTabs from './ChatbotPage/LinhKienManagementTabs';

const ChatbotPageWithTabs: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'devices' | 'colors' | 'storage' | 'settings' | 'documents' | 'device-colors' | 'device-infos' | 'device-storage' | 'chat' | 'product-components'>('devices');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'devices':
        return <DevicesTab />;
      case 'colors':
        return <ColorsTab />;
      // case 'storage':
      //   return <StorageTab />;
      case 'settings':
        return <SettingsTab />;
      case 'documents':
        return <DocumentsTab />;
      case 'device-colors':
        return <DeviceColorsTab />;
      case 'device-infos':
        return <DeviceInfosTab />;
      case 'device-storage':
        return <DeviceStorageTab />;
      case 'chat':
        return <ChatbotTab />;
      case 'product-components':
        return <LinhKienManagementTabs />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-xl font-bold">Quản lý</h2>
        </div>
        <nav>
          <ul className="select-none">
            <li className={`p-4 cursor-pointer ${activeTab === 'devices' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`} onClick={() => setActiveTab('devices')}>
              <div className="flex items-center">
                <Smartphone className="mr-2" />
                <span>Thiết bị của tôi</span>
              </div>
            </li>
            <li className={`p-4 cursor-pointer ${activeTab === 'device-infos' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`} onClick={() => setActiveTab('device-infos')}>
              <div className="flex items-center">
                <Database className="mr-2" />
                <span>Thông tin thiết bị</span>
              </div>
            </li>
            <li className={`p-4 cursor-pointer ${activeTab === 'colors' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`} onClick={() => setActiveTab('colors')}>
              <div className="flex items-center">
                <Palette className="mr-2" />
                <span>Màu sắc</span>
              </div>
            </li>
            {/* <li className={`p-4 cursor-pointer ${activeTab === 'storage' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`} onClick={() => setActiveTab('storage')}>
              <div className="flex items-center">
                <HardDrive className="mr-2" />
                <span>Dung lượng</span>
              </div>
            </li> */}
            <li className={`p-4 cursor-pointer ${activeTab === 'device-colors' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`} onClick={() => setActiveTab('device-colors')}>
                <div className="flex items-center">
                    <Layers className="mr-2" />
                    <span>Thiết bị - Màu sắc</span>
                </div>
            </li>
            <li className={`p-4 cursor-pointer ${activeTab === 'device-storage' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`} onClick={() => setActiveTab('device-storage')}>
                <div className="flex items-center">
                    <Layers className="mr-2" />
                    <span>Thiết bị - Dung lượng</span>
                </div>
            </li>
            <li className={`p-4 cursor-pointer ${activeTab === 'product-components' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`} onClick={() => setActiveTab('product-components')}>
                <div className="flex items-center">
                    <Package className="mr-2" />
                    <span>Linh kiện</span>
                </div>
            </li>
            <li className={`p-4 cursor-pointer ${activeTab === 'chat' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`} onClick={() => setActiveTab('chat')}>
                <div className="flex items-center">
                    <MessageSquare className="mr-2" />
                    <span>Chat</span>
                </div>
            </li>
            <li className={`p-4 cursor-pointer ${activeTab === 'documents' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`} onClick={() => setActiveTab('documents')}>
              <div className="flex items-center">
                <FileText className="mr-2" />
                <span>Tài liệu</span>
              </div>
            </li>
                        <li className={`p-4 cursor-pointer ${activeTab === 'settings' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`} onClick={() => setActiveTab('settings')}>
              <div className="flex items-center">
                <Settings className="mr-2" />
                <span>Cài đặt</span>
              </div>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default ChatbotPageWithTabs;