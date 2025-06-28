import React, { useState, useEffect } from 'react';
import { Key, Save, RefreshCw, Trash2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ApiKeys {
  gemini_api_key: string;
  openai_api_key: string;
}

export const ApiKeyManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini_api_key: '',
    openai_api_key: ''
  });
  const [savedApiKeys, setSavedApiKeys] = useState<ApiKeys>({
    gemini_api_key: '',
    openai_api_key: ''
  });
  const [showKeys, setShowKeys] = useState({
    gemini: false,
    openai: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { user } = useAuth();

  // Get API base URL from environment variables with fallback
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  };

  // Load saved API keys
  const loadApiKeys = async () => {
    if (!user?.token) return;

    setIsLoadingKeys(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/users/me/api-key`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSavedApiKeys(data);
        setApiKeys(data);
      } else {
        console.warn('Failed to load API keys:', response.status);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // Save API keys
  const saveApiKeys = async () => {
    if (!user?.token) {
      setMessage({ type: 'error', text: 'Vui lòng đăng nhập để lưu API keys' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/users/me/api-key`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiKeys)
      });

      if (response.ok) {
        setSavedApiKeys(apiKeys);
        setMessage({ type: 'success', text: 'API keys đã được lưu thành công!' });
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Lỗi khi lưu API keys' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối khi lưu API keys' });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete API keys
  const deleteApiKeys = async () => {
    if (!user?.token) {
      setMessage({ type: 'error', text: 'Vui lòng đăng nhập để xóa API keys' });
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn xóa tất cả API keys?')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/users/me/api-key`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gemini_api_key: '',
          openai_api_key: ''
        })
      });

      if (response.ok) {
        setApiKeys({ gemini_api_key: '', openai_api_key: '' });
        setSavedApiKeys({ gemini_api_key: '', openai_api_key: '' });
        setMessage({ type: 'success', text: 'API keys đã được xóa thành công!' });
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Lỗi khi xóa API keys' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối khi xóa API keys' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load API keys on component mount
  useEffect(() => {
    loadApiKeys();
  }, [user?.token]);

  const handleInputChange = (field: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleShowKey = (platform: 'gemini' | 'openai') => {
    setShowKeys(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const hasUnsavedChanges = JSON.stringify(apiKeys) !== JSON.stringify(savedApiKeys);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 w-12 h-12 rounded-xl flex items-center justify-center">
            <Key className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">API Key Management</h3>
            <p className="text-gray-600 text-sm">Quản lý API keys cho AI content generation</p>
          </div>
        </div>

        <button
          onClick={loadApiKeys}
          disabled={isLoadingKeys}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingKeys ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <RefreshCw size={16} />
          )}
          Reload
        </button>
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Gemini API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🤖 Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showKeys.gemini ? 'text' : 'password'}
              value={apiKeys.gemini_api_key}
              onChange={(e) => handleInputChange('gemini_api_key', e.target.value)}
              placeholder="Nhập Gemini API key..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => toggleShowKey('gemini')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showKeys.gemini ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {savedApiKeys.gemini_api_key && (
            <div className="mt-2 text-sm text-gray-600">
              Đã lưu: {maskApiKey(savedApiKeys.gemini_api_key)}
            </div>
          )}
        </div>

        {/* OpenAI API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🧠 OpenAI API Key
          </label>
          <div className="relative">
            <input
              type={showKeys.openai ? 'text' : 'password'}
              value={apiKeys.openai_api_key}
              onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
              placeholder="Nhập OpenAI API key..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => toggleShowKey('openai')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showKeys.openai ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {savedApiKeys.openai_api_key && (
            <div className="mt-2 text-sm text-gray-600">
              Đã lưu: {maskApiKey(savedApiKeys.openai_api_key)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={saveApiKeys}
            disabled={isLoading || !hasUnsavedChanges}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Save size={16} />
            )}
            {isLoading ? 'Đang lưu...' : 'Lưu API Keys'}
          </button>

          <button
            onClick={deleteApiKeys}
            disabled={isLoading || (!savedApiKeys.gemini_api_key && !savedApiKeys.openai_api_key)}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            Xóa tất cả
          </button>
        </div>

        {/* Status Indicators */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Trạng thái API Keys:</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">🤖 Gemini:</span>
              <span className={`text-sm font-medium ${
                savedApiKeys.gemini_api_key ? 'text-green-600' : 'text-gray-400'
              }`}>
                {savedApiKeys.gemini_api_key ? '✓ Đã cấu hình' : '○ Chưa cấu hình'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">🧠 OpenAI:</span>
              <span className={`text-sm font-medium ${
                savedApiKeys.openai_api_key ? 'text-green-600' : 'text-gray-400'
              }`}>
                {savedApiKeys.openai_api_key ? '✓ Đã cấu hình' : '○ Chưa cấu hình'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn lấy API Keys:</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div>
              <strong>🤖 Gemini API:</strong> Truy cập{' '}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-900"
              >
                Google AI Studio
              </a>{' '}
              để tạo API key miễn phí
            </div>
            <div>
              <strong>🧠 OpenAI API:</strong> Truy cập{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-900"
              >
                OpenAI Platform
              </a>{' '}
              để tạo API key (có phí)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};