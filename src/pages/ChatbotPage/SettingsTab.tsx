import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, User, MessageSquare, Settings, ToggleLeft, ToggleRight } from 'lucide-react';

interface UserConfig {
  ai_name: string;
  ai_role: string;
  custom_prompt: string;
  service_feature_enabled: boolean;
  accessory_feature_enabled: boolean;
}

const SettingsTab: React.FC = () => {
  const [config, setConfig] = useState<UserConfig>({
    ai_name: 'Mai',
    ai_role: 'trợ lý ảo',
    custom_prompt: '',
    service_feature_enabled: true,
    accessory_feature_enabled: true,
  });
  
  const [isLoadingPersona, setIsLoadingPersona] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isLoadingService, setIsLoadingService] = useState(false);
  const [isLoadingAccessory, setIsLoadingAccessory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Load data immediately without blocking UI
    loadUserConfig();
  }, []);

  const loadUserConfig = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để cấu hình' });
        return;
      }

      // Load persona config
      setIsLoadingPersona(true);
      try {
        const personaResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user-config/persona`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (personaResponse.ok) {
          const personaData = await personaResponse.json();
          setConfig(prev => ({ ...prev, ...personaData }));
        }
      } catch (error) {
        console.error('Error loading persona config:', error);
      } finally {
        setIsLoadingPersona(false);
      }

      // Load prompt config
      setIsLoadingPrompt(true);
      try {
        const promptResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user-config/prompt`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (promptResponse.ok) {
          const promptData = await promptResponse.json();
          setConfig(prev => ({ ...prev, custom_prompt: promptData.custom_prompt }));
        }
      } catch (error) {
        console.error('Error loading prompt config:', error);
      } finally {
        setIsLoadingPrompt(false);
      }

      // Load service feature config
      setIsLoadingService(true);
      try {
        const serviceResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user-config/service-feature`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (serviceResponse.ok) {
          const serviceData = await serviceResponse.json();
          setConfig(prev => ({ ...prev, service_feature_enabled: serviceData.enabled }));
        }
      } catch (error) {
        console.error('Error loading service config:', error);
      } finally {
        setIsLoadingService(false);
      }

      // Load accessory feature config
      setIsLoadingAccessory(true);
      try {
        const accessoryResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user-config/accessory-feature`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (accessoryResponse.ok) {
          const accessoryData = await accessoryResponse.json();
          setConfig(prev => ({ ...prev, accessory_feature_enabled: accessoryData.enabled }));
        }
      } catch (error) {
        console.error('Error loading accessory config:', error);
      } finally {
        setIsLoadingAccessory(false);
      }

    } catch (error) {
      console.error('Error loading config:', error);
      setMessage({ type: 'error', text: 'Không thể tải cấu hình. Vui lòng thử lại.' });
    }
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để lưu cấu hình' });
        return;
      }

      // Optimistic update - show success message immediately
      const originalConfig = { ...config };
      setMessage({ type: 'success', text: 'Cấu hình đã được lưu thành công!' });
      setTimeout(() => setMessage(null), 3000);

      // Save persona config
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user-config/persona`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ai_name: config.ai_name,
          ai_role: config.ai_role
        })
      });

      // Save prompt config
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user-config/prompt`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          custom_prompt: config.custom_prompt
        })
      });

      // Save service feature config
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user-config/service-feature`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: config.service_feature_enabled
        })
      });

      // Save accessory feature config
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user-config/accessory-feature`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: config.accessory_feature_enabled
        })
      });

    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Không thể lưu cấu hình. Vui lòng thử lại.' });
      // Restore original config on error
      setConfig(originalConfig);
    } finally {
      setIsSaving(false);
    }
  };

  const reloadConfig = async () => {
    await loadUserConfig();
    setMessage({ type: 'success', text: 'Cấu hình đã được làm mới!' });
    setTimeout(() => setMessage(null), 2000);
  };

  const resetToDefault = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đặt lại cấu hình về mặc định?')) {
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để đặt lại cấu hình' });
        return;
      }

      // Optimistic update - reset to default values immediately
      const originalConfig = { ...config };
      setConfig({
        ai_name: 'Mai',
        ai_role: 'trợ lý ảo',
        custom_prompt: '',
        service_feature_enabled: true,
        accessory_feature_enabled: true,
      });

      // Reset persona config
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user-config/persona`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Reset prompt config
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user-config/prompt`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: 'Cấu hình đã được đặt lại về mặc định!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error resetting config:', error);
      setMessage({ type: 'error', text: 'Không thể đặt lại cấu hình. Vui lòng thử lại.' });
      // Restore original config on error
      setConfig(originalConfig);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Cài Đặt Hệ Thống</h2>
          <p className="text-gray-600">Cấu hình chatbot AI và các tính năng của hệ thống</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Persona Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Cấu Hình Chatbot AI</h3>
            {isLoadingPersona && (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            )}
          </div>
          
          {isLoadingPersona ? (
            // Skeleton loading for persona config
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                <div className="w-full h-10 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                <div className="w-full h-10 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Chatbot AI
                </label>
                <input
                  type="text"
                  value={config.ai_name}
                  onChange={(e) => setConfig(prev => ({ ...prev, ai_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên chatbot"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai Trò Chatbot
                </label>
                <input
                  type="text"
                  value={config.ai_role}
                  onChange={(e) => setConfig(prev => ({ ...prev, ai_role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập vai trò chatbot"
                />
              </div>
            </div>
          )}
        </div>

        {/* Prompt Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">System Prompt Tùy Chỉnh</h3>
            {isLoadingPrompt && (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
            )}
          </div>
          
          {isLoadingPrompt ? (
            // Skeleton loading for prompt config
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-full h-24 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-64 h-3 bg-gray-300 rounded animate-pulse"></div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Tùy Chỉnh
              </label>
              <textarea
                value={config.custom_prompt}
                onChange={(e) => setConfig(prev => ({ ...prev, custom_prompt: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập system prompt tùy chỉnh cho chatbot..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Để trống để sử dụng prompt mặc định của hệ thống
              </p>
            </div>
          )}
        </div>

        {/* Feature Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Tính Năng Hệ Thống</h3>
            {(isLoadingService || isLoadingAccessory) && (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
            )}
          </div>
          
          {(isLoadingService || isLoadingAccessory) ? (
            // Skeleton loading for feature config
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg animate-pulse">
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-gray-300 rounded"></div>
                    <div className="w-48 h-3 bg-gray-300 rounded"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Tư Vấn Dịch Vụ</h4>
                  <p className="text-sm text-gray-600">Cho phép chatbot tư vấn về các dịch vụ</p>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, service_feature_enabled: !prev.service_feature_enabled }))}
                  className="flex items-center"
                >
                  {config.service_feature_enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Tư Vấn Phụ Kiện</h4>
                  <p className="text-sm text-gray-600">Cho phép chatbot tư vấn về phụ kiện</p>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, accessory_feature_enabled: !prev.accessory_feature_enabled }))}
                  className="flex items-center"
                >
                  {config.accessory_feature_enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              onClick={reloadConfig}
              disabled={isLoadingPersona || isLoadingPrompt || isLoadingService || isLoadingAccessory}
              className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm Mới
            </button>
            <button
              onClick={resetToDefault}
              disabled={isSaving}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Đặt Lại Mặc Định
            </button>
          </div>
          
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang Lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu Cấu Hình
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;