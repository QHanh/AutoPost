import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, CheckCircle, Loader2, Key, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AIContentGeneratorProps {
  onGenerate: (data: any) => void;
  isGenerating: boolean;
  mainContent: string;
}

interface ApiKeys {
  gemini_api_key: string;
  openai_api_key: string;
  youtube: boolean;
}

interface PlatformSelection {
  facebook: {
    page: boolean;
    reels: boolean;
  };
  instagram: {
    feed: boolean;
    reels: boolean;
  };
  youtube: boolean;
}

export const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({ onGenerate, isGenerating, mainContent }) => {
  const [showPromptInput, setShowPromptInput] = useState(true);
  const [hashtags, setHashtags] = useState('');
  const [brandName, setBrandName] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [postingPurpose, setPostingPurpose] = useState('');
  const [selectedAiPlatform, setSelectedAiPlatform] = useState<'gemini' | 'openai'>('openai');
  const [showAiPlatformSelector, setShowAiPlatformSelector] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini_api_key: '',
    openai_api_key: '',
    youtube: false
  });
  const [platformSelection, setPlatformSelection] = useState<PlatformSelection>({
    facebook: { page: false, reels: false },
    instagram: { feed: false, reels: false },
    youtube: false
  });

  const { user } = useAuth();

  // Get API base URL from environment variables with fallback
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL;
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

  const handleGenerateContent = async () => {
    if (!mainContent.trim()) {
      setError('Vui lòng nhập nội dung ở ô bên trên để AI có thể viết lại.');
      return;
    }

    // Check if at least one platform is selected
    const hasSelectedPlatform = 
      platformSelection.facebook.page || 
      platformSelection.facebook.reels || 
      platformSelection.instagram.feed || 
      platformSelection.instagram.reels || 
      platformSelection.youtube;

    if (!hasSelectedPlatform) {
      setError('Vui lòng chọn ít nhất một nền tảng');
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

    // Chuẩn bị dữ liệu gửi đi
    const selectedPlatforms: string[] = [];
    if (platformSelection.facebook.page) selectedPlatforms.push('facebook-page');
    if (platformSelection.facebook.reels) selectedPlatforms.push('facebook-reels');
    if (platformSelection.instagram.feed) selectedPlatforms.push('instagram-feed');
    if (platformSelection.instagram.reels) selectedPlatforms.push('instagram-reels');
    if (platformSelection.youtube) selectedPlatforms.push('youtube');

    const hashtagArray = hashtags.trim()
      ? hashtags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    const body = {
      prompt: mainContent.trim(),
      platform_type: selectedPlatforms,
      hashtags: hashtagArray,
      brand_name: brandName.trim(),
      call_to_action: callToAction.trim(),
      posting_purpose: postingPurpose.trim(),
      ai_platform: selectedAiPlatform
    };

    onGenerate(body);
    // Component này không còn tự gọi API hay quản lý kết quả nữa
  };

  const clearForm = () => {
    setHashtags('');
    setBrandName('');
    setCallToAction('');
    setPostingPurpose('');
    setError('');
    setSuccess('');
    setPlatformSelection({
      facebook: { page: false, reels: false },
      instagram: { feed: false, reels: false },
      youtube: false
    });
  };

  // Platform selection handlers
  const handleFacebookSelection = (type: 'page' | 'reels') => {
    setPlatformSelection(prev => ({
      ...prev,
      facebook: {
        ...prev.facebook,
        [type]: !prev.facebook[type]
      }
    }));
  };

  const handleInstagramSelection = (type: 'feed' | 'reels') => {
    setPlatformSelection(prev => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        [type]: !prev.instagram[type]
      }
    }));
  };

  const handleYoutubeSelection = () => {
    setPlatformSelection(prev => ({
      ...prev,
      youtube: !prev.youtube
    }));
  };

  // Thứ tự các nền tảng
  // const platformOrder = [
  //   'facebook-page',
  //   'facebook-reels',
  //   'instagram-feed',
  //   'instagram-reels',
  //   'youtube'
  // ];

  // Map tên hiển thị
  // const platformDisplay: Record<string, string> = {
  //   'facebook-page': 'Facebook Page',
  //   'facebook-reels': 'Facebook Reels',
  //   'instagram-feed': 'Instagram Feed',
  //   'instagram-reels': 'Instagram Reels',
  //   'youtube': 'YouTube'
  // };

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
          Viết lại nội dung thủ công của bạn bằng AI
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

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chọn nền tảng để viết lại nội dung: *
            </label>
            <div className="flex flex-row justify-center gap-8">
              {/* Facebook */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium border-blue-500 bg-white text-blue-700 ${
                    (platformSelection.facebook.page || platformSelection.facebook.reels)
                      ? 'shadow-md' : ''
                  }`}
                  style={{ minWidth: 120 }}
                  tabIndex={-1}
                  disabled
                >
                  <span className="text-blue-600">📘</span>
                  Facebook
                  {(platformSelection.facebook.page || platformSelection.facebook.reels) && (
                    <CheckCircle size={14} className="text-blue-600" />
                  )}
                </button>
                <div className="flex flex-row gap-2 mt-2 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => handleFacebookSelection('page')}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md border transition-all duration-200 text-xs min-w-[80px] justify-center ${
                      platformSelection.facebook.page
                        ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>📄</span>
                    Page
                    {platformSelection.facebook.page && (
                      <CheckCircle size={12} className="text-blue-600" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFacebookSelection('reels')}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md border transition-all duration-200 text-xs min-w-[80px] justify-center ${
                      platformSelection.facebook.reels
                        ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>🎬</span>
                    Reels
                    {platformSelection.facebook.reels && (
                      <CheckCircle size={12} className="text-blue-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium border-pink-500 bg-white text-pink-700 ${
                    (platformSelection.instagram.feed || platformSelection.instagram.reels)
                      ? 'shadow-md' : ''
                  }`}
                  style={{ minWidth: 120 }}
                  tabIndex={-1}
                  disabled
                >
                  <span className="text-pink-600">📷</span>
                  Instagram
                  {(platformSelection.instagram.feed || platformSelection.instagram.reels) && (
                    <CheckCircle size={14} className="text-pink-600" />
                  )}
                </button>
                <div className="flex flex-row gap-2 mt-2 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => handleInstagramSelection('feed')}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md border transition-all duration-200 text-xs min-w-[80px] justify-center ${
                      platformSelection.instagram.feed
                        ? 'border-pink-500 bg-pink-100 text-pink-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>📱</span>
                    Feed
                    {platformSelection.instagram.feed && (
                      <CheckCircle size={12} className="text-pink-600" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInstagramSelection('reels')}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md border transition-all duration-200 text-xs min-w-[80px] justify-center ${
                      platformSelection.instagram.reels
                        ? 'border-pink-500 bg-pink-100 text-pink-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>🎬</span>
                    Reels
                    {platformSelection.instagram.reels && (
                      <CheckCircle size={12} className="text-pink-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* YouTube */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleYoutubeSelection}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium border-red-500 bg-white text-red-700 ${
                    platformSelection.youtube ? 'shadow-md' : ''
                  }`}
                  style={{ minWidth: 120 }}
                >
                  <span className="text-red-600">📺</span>
                  YouTube
                  {platformSelection.youtube && (
                    <CheckCircle size={14} className="text-red-600" />
                  )}
                </button>
              </div>
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
              disabled={
                isGenerating || 
                !mainContent.trim() || 
                availableAiPlatforms.length === 0 ||
                !(platformSelection.facebook.page || 
                  platformSelection.facebook.reels || 
                  platformSelection.instagram.feed || 
                  platformSelection.instagram.reels || 
                  platformSelection.youtube)
              }
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
        </div>
      )}
    </div>
  );
};