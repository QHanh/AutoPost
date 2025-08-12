import React, { useState, useEffect } from 'react';
import {
  Key, Save, RefreshCw, Trash2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useApiKeys, ApiKeys } from '../hooks/useApiKeys';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';

export const ApiKeyManager: React.FC = () => {
  const { user } = useAuth();
  const {
    savedApiKeys,
    setSavedApiKeys,
    isLoadingKeys,
    reloadApiKeys,
  } = useApiKeys();

  const [apiKeys, setApiKeys] = useState<ApiKeys>(savedApiKeys);
  const [showKeys, setShowKeys] = useState({ gemini: false, openai: false });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setApiKeys(savedApiKeys);
  }, [savedApiKeys]);

  const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL;

  const saveApiKeys = async () => {
    if (!user?.token) {
      setMessage({ type: 'error', text: 'Vui lòng đăng nhập để lưu API keys' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/users/me/api-key`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiKeys),
      });

      if (response.ok) {
        setSavedApiKeys(apiKeys);
        setMessage({ type: 'success', text: 'API keys đã được lưu thành công!' });
        window.dispatchEvent(new Event('apiKeysUpdated'));
        setTimeout(() => setMessage(null), 1000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Lỗi khi lưu API keys' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối khi lưu API keys' });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApiKeys = async () => {
    if (!user?.token) {
      setMessage({ type: 'error', text: 'Vui lòng đăng nhập để xóa API keys' });
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: 'Xóa API keys?',
      text: 'Bạn có chắc chắn muốn xóa tất cả API keys?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });
    if (!isConfirmed) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/users/me/api-key`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gemini_api_key: '', openai_api_key: '' }),
      });

      if (response.ok) {
        const emptyKeys = { gemini_api_key: '', openai_api_key: '' };
        setApiKeys(emptyKeys);
        setSavedApiKeys(emptyKeys);
        setMessage({ type: 'success', text: 'API keys đã được xóa thành công!' });
        window.dispatchEvent(new Event('apiKeysUpdated'));
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Lỗi khi xóa API keys' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối khi xóa API keys' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [field]: value }));
  };

  const toggleShowKey = (platform: 'gemini' | 'openai') => {
    setShowKeys(prev => ({ ...prev, [platform]: !prev[platform] }));
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
            <h3 className="text-xl font-bold text-gray-900">API Key</h3>
            <p className="text-gray-600 text-sm">Quản lý API keys cho AI</p>
          </div>
        </div>

        <button
          onClick={reloadApiKeys}
          disabled={isLoadingKeys}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingKeys ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : <RefreshCw size={16} />}
          Tải lại
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {['gemini', 'openai'].map((platform) => (
          <div key={platform}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {platform === 'gemini' ? '✨ Gemini API Key' : '🧠 OpenAI API Key'}
            </label>
            <div className="relative">
              <input
                type={showKeys[platform as 'gemini' | 'openai'] ? 'text' : 'password'}
                value={apiKeys[`${platform}_api_key` as keyof ApiKeys] || ''}
                onChange={(e) =>
                  handleInputChange(`${platform}_api_key` as keyof ApiKeys, e.target.value)
                }
                placeholder={`Nhập ${platform} API key...`}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => toggleShowKey(platform as 'gemini' | 'openai')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showKeys[platform as 'gemini' | 'openai'] ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={saveApiKeys}
            disabled={isLoading || !hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : <Save size={16} />}
            {isLoading ? 'Đang lưu...' : 'Lưu API Keys'}
          </button>

          <button
            onClick={deleteApiKeys}
            disabled={isLoading || (!savedApiKeys.gemini_api_key && !savedApiKeys.openai_api_key)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            Xóa tất cả
          </button>
        </div>
        
        <div className="flex flex-wrap items-start gap-4 mt-6">
          {/* Trạng thái cấu hình */}
          <div className="bg-gray-50 rounded-lg p-4 sm:w-1/2">
            <div className="space-y-2">
              <div className="flex items-center gap-7">
                <span className="text-sm text-gray-700">✨ Gemini:</span>
                <span className={`text-sm font-medium ${
                  savedApiKeys.gemini_api_key ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {savedApiKeys.gemini_api_key ? '✓ Đã cấu hình' : '○ Chưa cấu hình'}
                </span>
              </div>
              <div className="flex items-center gap-7">
                <span className="text-sm text-gray-700">🧠 OpenAI:</span>
                <span className={`text-sm font-medium ${
                  savedApiKeys.openai_api_key ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {savedApiKeys.openai_api_key ? '✓ Đã cấu hình' : '○ Chưa cấu hình'}
                </span>
              </div>
            </div>
          </div>

          {/* Hướng dẫn */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full sm:flex-1">
            <div className="space-y-2 text-sm text-blue-800">
              <div>
                <strong>✨ Gemini API:</strong> Truy cập{' '}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900"
                >
                  Google AI Studio
                </a>{' '}
                để tạo API key (miễn phí)
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
    </div>
  );
};
