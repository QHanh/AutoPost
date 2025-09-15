import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Book, Loader2, Save, AlertTriangle, CheckCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export const PromptManager: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  const getApiBaseUrl = () => {
    // This helper function gets the base URL from environment variables
    // Ensure you have VITE_API_BASE_URL set in your .env file
    return import.meta.env.VITE_API_BASE_URL;
  };

  // --- REFACTORED: Reusable function to fetch the prompt ---
  const fetchPrompt = useCallback(async () => {
    if (!user?.token) {
      setError('Bạn phải đăng nhập để quản lý prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null); // Clear success message on reload
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/users/me/system-prompt`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải system prompt.');
      }

      const data = await response.json();
      const currentPrompt = data.custom_system_prompt || '';
      setPrompt(currentPrompt);
      setInitialPrompt(currentPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.token]);

  // Fetch the current prompt when the component mounts
  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  // Handle saving the new prompt
  const handleSavePrompt = async () => {
    if (!user?.token) {
      setError('Bạn phải đăng nhập để cập nhật prompt.');
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/users/me/system-prompt`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ custom_system_prompt: prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể lưu prompt.');
      }
      
      setSuccess('Prompt đã được cập nhật thành công!');
      setInitialPrompt(prompt);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi lưu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const hasChanges = prompt !== initialPrompt;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Book size={20} className="text-purple-600" />
          System Prompt
        </h2>
        
        <div className="flex items-center gap-2">
          {/* --- ADDED: Reload Button --- */}
          <button
            onClick={fetchPrompt}
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            title="Tải lại prompt từ cơ sở dữ liệu"
          >
            <RefreshCw size={14} />
            Tải lại
          </button>
          
          {/* --- ADDED: Collapse/Expand Button --- */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
            title={isCollapsed ? "Hiện nội dung" : "Ẩn nội dung"}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            {isCollapsed ? "Hiện" : "Ẩn"}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="animate-spin text-purple-600" size={32} />
          <p className="ml-4 text-gray-600">Đang tải prompt...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle size={16} />
            {error}
        </div>
      )}

      {!isLoading && !error && !isCollapsed && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            System prompt này sẽ được sử dụng làm chỉ dẫn mặc định cho AI khi tạo nội dung. 
            Bạn có thể tùy chỉnh nó để phù hợp với giọng văn thương hiệu của mình.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y text-sm leading-relaxed"
            rows={5}
            placeholder="Nhập system prompt của bạn ở đây..."
          />

          {success && (
            <div className="p-3 rounded-lg flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm animate-fade-in">
                <CheckCircle size={16} />
                {success}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSavePrompt}
              disabled={isSaving || !hasChanges}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Lưu Prompt
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 