// @ts-nocheck
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Smartphone, Palette, Layers, Database, MessageSquare, Package, Settings, FileText, Wrench, ChevronDown, ChevronRight, Component, Code } from 'lucide-react';

// Import all tab components
import DevicesTab from './ChatbotPage/DevicesTab';
import ColorsTab from './ChatbotPage/ColorsTab';
import SettingsTab from './ChatbotPage/SettingsTab';
import DocumentsTab from './ChatbotPage/DocumentsTab';
import DeviceColorsTab from './ChatbotPage/DeviceColorsTab';
import DeviceInfosTab from './ChatbotPage/DeviceInfosTab';
import DeviceStorageTab from './ChatbotPage/DeviceStorageTab';
import ChatbotTab from './ChatbotPage/ChatbotTab';
import LinhKienManagementTabs from './ChatbotPage/LinhKienManagementTabs';
import { ServiceManagementPage } from './ServiceManagementPage';
import ApiIntegrationPage from './ApiIntegrationPage'; // Import trang API

type MainCategory = 'dienthoai' | 'dichvu' | 'linhkien' | 'chat' | 'caidat';
type SubTab =
  | 'my-devices'
  | 'device-infos'
  | 'colors'
  | 'device-colors'
  | 'device-storage'
  | 'services'
  | 'components'
  | 'documents'
  | 'api-integration'
  | 'settings';

const mainTabsConfig = {
    dienthoai: {
        label: 'Điện thoại',
        icon: Smartphone,
        subTabs: [
            { id: 'my-devices', label: 'Thiết bị của tôi', component: <DevicesTab /> },
            { id: 'device-infos', label: 'Thông tin thiết bị', component: <DeviceInfosTab /> },
            { id: 'colors', label: 'Màu sắc', component: <ColorsTab /> },
            { id: 'device-colors', label: 'Thiết bị - Màu sắc', component: <DeviceColorsTab /> },
            { id: 'device-storage', label: 'Thiết bị - Dung lượng', component: <DeviceStorageTab /> },
        ]
    },
    dichvu: {
        label: 'Dịch vụ',
        icon: Wrench,
        subTabs: [
            { id: 'services', label: 'Quản lý Dịch vụ', component: <ServiceManagementPage /> }
        ]
    },
    linhkien: {
        label: 'Linh kiện',
        icon: Component,
        subTabs: [
            { id: 'components', label: 'Quản lý Linh kiện', component: <LinhKienManagementTabs /> }
        ]
    },
    chat: {
        label: 'Chat',
        icon: MessageSquare,
        isSingleTab: true,
        component: <ChatbotTab />
    },
    caidat: {
        label: 'Cài đặt',
        icon: Settings,
        subTabs: [
            { id: 'documents', label: 'Tài liệu', component: <DocumentsTab /> },
            { id: 'api-integration', label: 'Tích hợp API', component: <ApiIntegrationPage /> },
            { id: 'settings', label: 'Cài đặt chung', component: <SettingsTab /> },
        ]
    },
};

const ChatbotPageWithTabs: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [openCategory, setOpenCategory] = useState<MainCategory | null>('dienthoai');
  const [activeTab, setActiveTab] = useState<SubTab>('my-devices');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const renderTabContent = () => {
    if (activeTab === 'chat') {
        return mainTabsConfig.chat.component;
    }
    for (const category of Object.values(mainTabsConfig)) {
        if (category.subTabs) {
            const tab = category.subTabs.find(sub => sub.id === activeTab);
            if (tab) return tab.component;
        }
    }
    return null;
  };

  const handleCategoryClick = (categoryKey: MainCategory) => {
    const category = mainTabsConfig[categoryKey];
    if (category.isSingleTab) {
      setActiveTab(categoryKey as SubTab | 'chat'); // Handle 'chat' case
      setOpenCategory(null);
    } else {
      setOpenCategory(prev => (prev === categoryKey ? null : categoryKey));
    }
  };

  const handleTabClick = (tabId: SubTab) => {
    setActiveTab(tabId);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Chatbot</h2>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="select-none p-2">
            {Object.entries(mainTabsConfig).map(([key, value]) => (
                <li key={key} className="mb-1">
                    <div
                        className={`flex items-center justify-between p-3 cursor-pointer rounded-lg hover:bg-gray-200 transition-colors ${
                            value.isSingleTab && activeTab === key ? 'bg-blue-500 text-white' : ''
                        }`}
                        onClick={() => handleCategoryClick(key as MainCategory)}
                    >
                        <div className="flex items-center">
                            <value.icon className={`mr-3 ${ value.isSingleTab && activeTab === key ? 'text-white' : 'text-gray-600'}`} size={20} />
                            <span className={`font-semibold ${ value.isSingleTab && activeTab === key ? 'text-white' : 'text-gray-700'}`}>{value.label}</span>
                        </div>
                        {!value.isSingleTab && (openCategory === key ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                    </div>
                    {!value.isSingleTab && openCategory === key && (
                        <ul className="pl-6 mt-1 border-l-2 border-gray-200">
                            {value.subTabs.map(subTab => (
                                <li
                                    key={subTab.id}
                                    className={`p-2 my-1 pl-4 cursor-pointer rounded-r-lg text-sm transition-colors ${activeTab === subTab.id ? 'bg-blue-500 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                                    onClick={() => handleTabClick(subTab.id as SubTab)}
                                >
                                    {subTab.label}
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            ))}
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