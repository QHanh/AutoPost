import React, { useState, useEffect } from 'react';
import { Book, Loader2, Save, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

const SettingsCustomTab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPrompt();
  }, []);

  const fetchPrompt = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setError('Vui lòng đăng nhập để xem system prompt');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot-linhkien/system-prompt`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Không thể tải system prompt');
      }

      const data = await response.json();
      setPrompt(data.prompt_content || '');

    } catch (err) {
      console.error('Error fetching prompt:', err);
      setError('Không thể tải system prompt. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const savePrompt = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Vui lòng đăng nhập để lưu system prompt');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot-linhkien/system-prompt`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt_content: prompt })
        }
      );

      if (!response.ok) {
        throw new Error('Không thể lưu system prompt');
      }

      setMessage({ type: 'success', text: 'System prompt đã được lưu thành công!' });
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'System prompt đã được lưu thành công!',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (err) {
      console.error('Error saving prompt:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể lưu system prompt. Vui lòng thử lại.';
      setError(errorMessage);
      setMessage({ type: 'error', text: errorMessage });
      
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: errorMessage
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Cài Đặt Chatbot Linh Kiện</h2>
          <p className="text-gray-600">Quản lý system prompt cho chatbot linh kiện</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Book size={20} className="text-purple-600" />
              System Prompt
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchPrompt}
                disabled={isLoading || isSaving}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                Tải lại
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-purple-600" size={24} />
              <span className="ml-2 text-gray-600">Đang tải system prompt...</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {message && (
            <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <AlertTriangle size={20} className="text-red-500" />
              )}
              <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {message.text}
              </span>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    System Prompt
                  </label>
                  <span className="text-xs text-gray-500">
                    {prompt.length.toLocaleString()} ký tự
                  </span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Nhập system prompt cho chatbot sản phẩm..."
                  className="w-full h-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y font-mono text-sm"
                  disabled={isSaving}
                  style={{ minHeight: '320px' }}
                />
                <p className="mt-1 text-sm text-gray-500">
                  <br/>System prompt sẽ hướng dẫn chatbot cách trả lời và xử lý câu hỏi về tư vấn sản phẩm.
                  <br/>Lưu ý: Chỉ áp dụng với các câu hỏi tư vấn sản phẩm.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={savePrompt}
                  disabled={isSaving || !prompt.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSaving ? 'Đang lưu...' : 'Lưu System Prompt'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsCustomTab;
