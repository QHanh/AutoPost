import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, CheckCircle, Loader2, Key, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AIContentGeneratorProps {
  onContentGenerated: (content: any, generationData: any) => void;
}

interface GenerateRequest {
  prompt: string;
  platform: string;
  generate_for: string[];
  platform_specific_data: {
    call_to_action?: string;
    hashtags?: string[];
  };
  brand_name?: string;
  posting_purpose?: string;
  ai_platform: 'gemini' | 'openai';
}

interface ApiKeys {
  gemini_api_key: string;
  openai_api_key: string;
}

export const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
  onContentGenerated
}) => {
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedGenerateFor, setSelectedGenerateFor] = useState<string[]>(['short_video']);
  const [hashtags, setHashtags] = useState('');
  const [brandName, setBrandName] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [postingPurpose, setPostingPurpose] = useState('');
  const [selectedAiPlatform, setSelectedAiPlatform] = useState<'gemini' | 'openai'>('gemini');
  const [showAiPlatformSelector, setShowAiPlatformSelector] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini_api_key: '',
    openai_api_key: ''
  });

  const { user } = useAuth();

  // Get API base URL from environment variables with fallback
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  };

  // Load API keys on component mount
  useEffect(() => {
    const loadApiKeys = async () => {
      if (!user?.token) return;

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
          setApiKeys(data);
        }
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
    };

    loadApiKeys();
  }, [user?.token]);

  // Get available AI platforms based on saved API keys
  const getAvailableAiPlatforms = () => {
    const platforms = [];
    if (apiKeys.gemini_api_key) {
      platforms.push({ id: 'gemini', name: 'Gemini', icon: '🤖' });
    }
    if (apiKeys.openai_api_key) {
      platforms.push({ id: 'openai', name: 'OpenAI', icon: '🧠' });
    }
    return platforms;
  };

  const availableAiPlatforms = getAvailableAiPlatforms();

  // Generate for options
  const getGenerateForOptions = () => {
    return [
      { id: 'short_video', name: 'Reel', icon: '🎬' },
      { id: 'long_video', name: 'Photo/Content', icon: '📄' },
      { id: 'youtube', name: 'YouTube', icon: '📺' }
    ];
  };

  const handleGenerateForToggle = (optionId: string) => {
    setSelectedGenerateFor(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      setError('Vui lòng nhập prompt');
      return;
    }

    if (!user?.token) {
      setError('Vui lòng đăng nhập để sử dụng tính năng AI');
      return;
    }

    if (availableAiPlatforms.length === 0) {
      setError('Vui lòng cấu hình ít nhất một API key trong trang Accounts');
      return;
    }

    if (selectedGenerateFor.length === 0) {
      setError('Vui lòng chọn ít nhất một loại nội dung');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      // Parse hashtags from string to array
      const hashtagArray = hashtags.trim() 
        ? hashtags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      // Prepare request body
      const requestBody: GenerateRequest = {
        prompt: prompt.trim(),
        platform: 'facebook', // Fixed platform as requested
        generate_for: selectedGenerateFor,
        platform_specific_data: {
          call_to_action: callToAction.trim() || '',
          hashtags: hashtagArray
        },
        brand_name: brandName.trim() || '',
        posting_purpose: postingPurpose.trim() || '',
        ai_platform: selectedAiPlatform
      };

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/scheduled-videos/generate-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data) {
        // Pass the entire response to parent
        onContentGenerated(data, {
          platform: 'facebook',
          generate_for: selectedGenerateFor,
          platform_specific_data: {
            prompt: prompt.trim(),
            call_to_action: callToAction.trim(),
            hashtags: hashtagArray
          },
          brand_name: brandName.trim(),
          posting_purpose: postingPurpose.trim(),
          ai_platform: selectedAiPlatform
        });

        setSuccess('Nội dung đã được tạo thành công!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Không nhận được nội dung từ AI');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setError(error instanceof Error ? error.message : 'Lỗi khi tạo nội dung');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearForm = () => {
    setPrompt('');
    setHashtags('');
    setBrandName('');
    setCallToAction('');
    setPostingPurpose('');
    setSelectedGenerateFor(['short_video']);
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-3">
      {/* AI Generate Button with Platform Selector */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPromptInput(!showPromptInput)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
        >
          <Sparkles size={16} />
          Tạo nội dung bằng AI
        </button>

        {/* AI Platform Selector */}
        {availableAiPlatforms.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAiPlatformSelector(!showAiPlatformSelector)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <Key size={14} />
              <ChevronDown size={14} />
            </button>

            {showAiPlatformSelector && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                {availableAiPlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => {
                      setSelectedAiPlatform(platform.id as 'gemini' | 'openai');
                      setShowAiPlatformSelector(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                      selectedAiPlatform === platform.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span>{platform.icon}</span>
                    {platform.name}
                    {selectedAiPlatform === platform.id && (
                      <CheckCircle size={12} className="ml-auto text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* No API Keys Warning */}
      {availableAiPlatforms.length === 0 && (
        <div className="flex items-center gap-2 text-orange-600 text-sm bg-orange-50 border border-orange-200 rounded-lg p-2">
          <AlertCircle size={14} />
          Chưa có API key nào được cấu hình. Vui lòng thêm API key trong trang Accounts.
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-2">
          <CheckCircle size={14} />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* AI Content Generator Form */}
      {showPromptInput && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              AI Content Generator
              {selectedAiPlatform && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {availableAiPlatforms.find(p => p.id === selectedAiPlatform)?.icon} {availableAiPlatforms.find(p => p.id === selectedAiPlatform)?.name}
                </span>
              )}
            </h4>
            <button
              onClick={() => {
                setShowPromptInput(false);
                clearForm();
              }}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả nội dung bạn muốn tạo: *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError('');
              }}
              placeholder="VD: 'Viết bài quảng bá sản phẩm nước hoa mới dành cho giới trẻ', 'Tạo video giới thiệu khóa học online'..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* Generate For Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại nội dung: * (có thể chọn nhiều)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {getGenerateForOptions().map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleGenerateForToggle(option.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedGenerateFor.includes(option.id)
                      ? 'border-purple-500 bg-purple-100 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.icon}</span>
                  {option.name}
                  {selectedGenerateFor.includes(option.id) && (
                    <CheckCircle size={14} className="ml-auto text-purple-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hashtags (tùy chọn)
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="VD: #nuochoa, #giotre, #sale50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">Cách nhau bằng dấu phẩy</div>
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên thương hiệu (tùy chọn)
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="VD: CoolScent"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Call to Action */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hành động kêu gọi (tùy chọn)
              </label>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="VD: Đặt hàng ngay để nhận quà"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Posting Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mục đích bài đăng (tùy chọn)
              </label>
              <input
                type="text"
                value={postingPurpose}
                onChange={(e) => setPostingPurpose(e.target.value)}
                placeholder="VD: Ra mắt dòng nước hoa mới"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleGenerateContent}
              disabled={isGenerating || !prompt.trim() || selectedGenerateFor.length === 0 || availableAiPlatforms.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Tạo nội dung
                </>
              )}
            </button>

            <button
              onClick={clearForm}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Xóa form
            </button>
          </div>

          {/* Example Prompts */}
          <div className="border-t border-purple-200 pt-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Ví dụ prompt:</p>
            <div className="space-y-1">
              {[
                "Viết bài quảng bá sản phẩm nước hoa mới dành cho giới trẻ",
                "Tạo video giới thiệu khóa học online về marketing",
                "Chia sẻ 5 mẹo tiết kiệm tiền cho sinh viên",
                "Cảm ơn khách hàng đã ủng hộ trong năm qua"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="block text-xs text-purple-600 hover:text-purple-700 hover:underline text-left"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};