// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { Smartphone, Palette, Layers, Database, MessageSquare, Package, Settings, FileText, Wrench, ChevronDown, ChevronRight, Component, Code, Bot } from 'lucide-react';

// Import all tab components
import DevicesTab from './ChatbotPage/DevicesTab';
import ColorsTab from './ChatbotPage/ColorsTab';
import SettingsTab from './ChatbotPage/SettingsTab';
import StoreSettingsTab from './ChatbotPage/StoreSettingsTab';
import DocumentsTab from './ChatbotPage/DocumentsTab';
import DeviceColorsTab from './ChatbotPage/DeviceColorsTab';
import DeviceInfosTab from './ChatbotPage/DeviceInfosTab';
import DeviceStorageTab from './ChatbotPage/DeviceStorageTab';
import ChatbotTab from './ChatbotPage/ChatbotTab';
import LinhKienManagementTabs from './ChatbotPage/LinhKienManagementTabs';
import { ServiceManagementPage } from './ServiceManagementPage';
import ApiIntegrationPage from './ApiIntegrationPage'; // Import trang API
import ChatbotLinhKienTab from './ChatbotPage/ChatbotLinhKienTab'; // Import tab mới
import ProductComponentsTab from './ChatbotPage/ProductComponentsTab'; // Import ProductComponentsTab
import ApiDataSyncTab from './ChatbotPage/ApiDataSyncTab'; // Import API Data Sync tab
import FaqMobileTab from './ChatbotPage/FaqMobileTab'; // Import FAQ Mobile tab
import ErrorBoundary from './ChatbotPage/ErrorBoundary'; // Import ErrorBoundary

type MainCategory = 'dienthoai' | 'dichvu' | 'linhkien' | 'chat' | 'chatbot-linhkien' | 'caidat'; // Added 'chatbot-linhkien'
type SubTab =
  | 'my-devices'
  | 'device-info'
  | 'colors'
  | 'device-colors'
  | 'device-storage'
  | 'services'
  | 'components'
  | 'api-data-sync' // Added for API data sync
  | 'documents'
  | 'api-integration' // Added
  | 'settings'
  | 'store-settings' // Added for store settings
  | 'chat' // Added for single tab
  | 'faq-mobile' // Added for FAQ Mobile sub-tab
  | 'dichvu' // Added for single tab
  | 'linhkien' // Added for single tab
  | 'chatbot-linhkien' // Added for single tab
  | 'caidat'; // Added for single tab

const getMainTabsConfig = (
  page: number,
  limit: number,
  onPageChange: (page: number) => void,
  onLimitChange: (limit: number) => void,
) => ({
  dienthoai: {
    label: 'Điện thoại',
    icon: Smartphone,
    subTabs: [
      { id: 'my-devices', label: 'Thiết bị của tôi', component: <DevicesTab currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /> },
      { id: 'device-info', label: 'Thông tin thiết bị', component: <DeviceInfosTab currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /> },
      { id: 'colors', label: 'Màu sắc', component: <ColorsTab currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /> },
      { id: 'device-colors', label: 'Thiết bị - Màu sắc', component: <DeviceColorsTab currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /> },
      { id: 'device-storage', label: 'Thiết bị - Dung lượng', component: <DeviceStorageTab currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /> },
    ]
  },
  dichvu: {
    label: 'Dịch vụ',
    icon: Settings,
    isSingleTab: true,
    component: <ErrorBoundary><ServiceManagementPage currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /></ErrorBoundary>
  },
  linhkien: {
    label: 'Linh kiện',
    icon: Component,
    subTabs: [
      { id: 'components', label: 'Quản lý linh kiện', component: <ErrorBoundary><ProductComponentsTab isAuthenticated={true} currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /></ErrorBoundary> },
      { id: 'api-data-sync', label: 'Nạp dữ liệu API', component: <ErrorBoundary><ApiDataSyncTab isAuthenticated={true} currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /></ErrorBoundary> },
    ]
  },
  caidat: {
    label: 'Cài đặt',
    icon: Settings,
    isSingleTab: true,
    component: <ApiIntegrationPage currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} />
  },

  chat: {
    label: 'Chatbot Agent',
    icon: MessageSquare,
    subTabs: [
      { id: 'chat', label: 'Chat với Bot', component: <ErrorBoundary><ChatbotTab currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /></ErrorBoundary> },
      { id: 'faq-mobile', label: 'FAQ Mobile', component: <ErrorBoundary><FaqMobileTab currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /></ErrorBoundary> },
      { id: 'documents', label: 'Tài liệu', component: <DocumentsTab currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /> },
      { id: 'settings', label: 'Cài đặt Chatbot', component: <ErrorBoundary><SettingsTab /></ErrorBoundary> },
    ]
  },

  'chatbot-linhkien': {
    label: 'Chatbot tùy chỉnh',
    icon: Bot,
    subTabs: [
      { id: 'chatbot-linhkien', label: 'Chat tùy chỉnh', component: <ErrorBoundary><ChatbotLinhKienTab currentPage={page} currentLimit={limit} onPageChange={onPageChange} onLimitChange={onLimitChange} /></ErrorBoundary> },
      { id: 'store-settings', label: 'Thông tin Cửa hàng', component: <ErrorBoundary><StoreSettingsTab /></ErrorBoundary> },
    ]
  }
});

const ChatbotPageWithTabs: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { tab, page, limit } = useParams<{ tab?: string; page?: string; limit?: string }>();
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState<MainCategory | null>('dienthoai');
  const [activeTab, setActiveTab] = useState<SubTab>('my-devices');
  // Extract URL parameters for direct use (single source of truth)
  const urlPage = parseInt(page || '1', 10);
  const urlLimit = parseInt(limit || '15', 10);

  const handlePageChange = useCallback((newPage: number) => {
    localStorage.setItem(`chatbot-pagination-${activeTab}-page`, newPage.toString());
    // Use urlLimit to avoid drift with state
    navigate(`/chatbot-tabs/${activeTab}/${newPage}/${urlLimit}`);
  }, [activeTab, urlLimit, navigate]);

  const handleLimitChange = useCallback((newLimit: number) => {
    localStorage.setItem(`chatbot-pagination-${activeTab}-limit`, newLimit.toString());
    localStorage.setItem(`chatbot-pagination-${activeTab}-page`, '1');
    navigate(`/chatbot-tabs/${activeTab}/1/${newLimit}`);
  }, [activeTab, navigate]);

  // Initialize state from URL parameters - must be before any conditional returns
  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return; // Don't process routing if not authenticated or still loading
    }

    if (tab) {
      setActiveTab(tab as SubTab);
      
      // Determine which category should be open based on the tab
      const mainTabsConfig = getMainTabsConfig(urlPage, urlLimit, handlePageChange, handleLimitChange);
      const categoryForTab = Object.entries(mainTabsConfig).find(([key, config]) => {
        if (config.isSingleTab && key === tab) {
          return true;
        }
        if (config.subTabs) {
          return config.subTabs.some(subTab => subTab.id === tab);
        }
        return false;
      });
      
      if (categoryForTab) {
        const [categoryKey, categoryConfig] = categoryForTab;
        if (!categoryConfig.isSingleTab) {
          setOpenCategory(categoryKey as MainCategory);
        } else {
          setOpenCategory(null);
        }
      }
      
      // Handle URL parameters or redirect to saved/default values
      if (page && limit) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (!isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0) {
          // Save to localStorage
          localStorage.setItem(`chatbot-pagination-${tab}-page`, pageNum.toString());
          localStorage.setItem(`chatbot-pagination-${tab}-limit`, limitNum.toString());
        }
      } else {
        // Get saved pagination for this tab or use defaults
        const savedPage = localStorage.getItem(`chatbot-pagination-${tab}-page`);
        const savedLimit = localStorage.getItem(`chatbot-pagination-${tab}-limit`);
        const defaultPage = savedPage ? parseInt(savedPage, 10) : 1;
        const defaultLimit = savedLimit ? parseInt(savedLimit, 10) : 15;
        // Redirect to saved or default pagination
        navigate(`/chatbot-tabs/${tab}/${defaultPage}/${defaultLimit}`, { replace: true });
        return;
      }
    } else {
      // If no tab is specified, redirect to default tab with saved pagination
      const savedPage = localStorage.getItem('chatbot-pagination-components-page') || '1';
      const savedLimit = localStorage.getItem('chatbot-pagination-components-limit') || '15';
      navigate(`/chatbot-tabs/components/${savedPage}/${savedLimit}`, { replace: true });
      return;
    }
  }, [tab, page, limit, navigate, isAuthenticated, isLoading, handlePageChange, handleLimitChange]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const renderTabContent = () => {
    const mainTabsConfig = getMainTabsConfig(urlPage, urlLimit, handlePageChange, handleLimitChange);
    
    // Xử lý các tab đơn lẻ trước
    if (activeTab === 'dichvu') {
        return mainTabsConfig.dichvu.component;
    }
    if (activeTab === 'caidat') {
        return mainTabsConfig.caidat.component;
    }
    
    // Xử lý các sub-tabs
    for (const category of Object.values(mainTabsConfig)) {
        if (category.subTabs) {
            const tab = category.subTabs.find(sub => sub.id === activeTab);
            if (tab) {
                return tab.component;
            }
        }
    }
    return null;
  };

  const handleCategoryClick = (categoryKey: MainCategory) => {
    const mainTabsConfig = getMainTabsConfig(urlPage, urlLimit, handlePageChange, handleLimitChange);
    const category = mainTabsConfig[categoryKey];
    
    if (category.isSingleTab) {
      const tabId = categoryKey as SubTab;
      
      // Get saved pagination for this tab
      const savedPage = localStorage.getItem(`chatbot-pagination-${tabId}-page`) || '1';
      const savedLimit = localStorage.getItem(`chatbot-pagination-${tabId}-limit`) || '15';
      
      setActiveTab(tabId);
      navigate(`/chatbot-tabs/${tabId}/${savedPage}/${savedLimit}`);
    } else {
      setOpenCategory(openCategory === categoryKey ? null : categoryKey);
    }
  };

  const handleTabClick = (tabId: SubTab) => {
    // Get saved pagination for this tab
    const savedPage = localStorage.getItem(`chatbot-pagination-${tabId}-page`) || '1';
    const savedLimit = localStorage.getItem(`chatbot-pagination-${tabId}-limit`) || '15';
    
    setActiveTab(tabId);
    navigate(`/chatbot-tabs/${tabId}/${savedPage}/${savedLimit}`);
  };


  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Chatbot</h2>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="select-none p-2">
            {Object.entries(getMainTabsConfig(urlPage, urlLimit, handlePageChange, handleLimitChange)).map(([key, value]) => (
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
      <main className="flex-1 overflow-y-auto">
        <div className="p-4">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default ChatbotPageWithTabs;