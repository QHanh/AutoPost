import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, CheckCircle, Loader2, Key, ChevronDown, CheckSquare, Square, Wrench } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePersistentState } from '../hooks/useFormPersistence';

interface AIContentGeneratorProps {
  onGenerate: (data: any) => void;
  isGenerating: boolean;
  mainContent: string;
  apiError: string | null;
  onClearApiError: () => void;
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

export const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({ onGenerate, isGenerating, mainContent, apiError, onClearApiError }) => {
  const [showPromptInput, setShowPromptInput] = useState(true);
  const [hashtags, setHashtags] = usePersistentState('hashtags', '');
  const [brandName, setBrandName] = usePersistentState('brandName', '');
  const [callToAction, setCallToAction] = usePersistentState('callToAction', '');
  const [postingPurpose, setPostingPurpose] = usePersistentState('postingPurpose', '');
  const [selectedAiPlatform, setSelectedAiPlatform] = usePersistentState<'gemini' | 'openai'>('selectedAiPlatform', 'openai');
  const [showAiPlatformSelector, setShowAiPlatformSelector] = useState(false);
  const [validationError, setValidationError] = useState('');
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

  // Trong component
  const isAllSelected =
    platformSelection.facebook.page &&
    platformSelection.facebook.reels &&
    platformSelection.instagram.feed &&
    platformSelection.instagram.reels &&
    platformSelection.youtube;

  const isSomeSelected =
    !isAllSelected &&
    (
      platformSelection.facebook.page ||
      platformSelection.facebook.reels ||
      platformSelection.instagram.feed ||
      platformSelection.instagram.reels ||
      platformSelection.youtube
    );
  

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

  // Hàm xử lý toggle
  const handleSelectAll = () => {
    const newState = isAllSelected
      ? {
          facebook: { page: false, reels: false },
          instagram: { feed: false, reels: false },
          youtube: false,
        }
      : {
          facebook: { page: true, reels: true },
          instagram: { feed: true, reels: true },
          youtube: true,
        };
    setPlatformSelection(newState);
  };

  // Get available AI platforms based on saved API keys
  const availableAiPlatforms = React.useMemo(() => {
    const platforms = [];
    if (apiKeys.gemini_api_key) {
      platforms.push({ id: 'gemini', name: 'Gemini', icon: '🤖' });
    }
    if (apiKeys.openai_api_key) {
      platforms.push({ id: 'openai', name: 'OpenAI', icon: '🧠' });
    }
    return platforms;
  }, [apiKeys]);

  // Automatically select an AI platform based on availability.
  // If only one is available, it's selected.
  // If multiple are available, the previously selected one is kept.
  // If the previously selected one is no longer available, it defaults to the first available.
  useEffect(() => {
    const platformIds = availableAiPlatforms.map(p => p.id as 'gemini' | 'openai');

    if (platformIds.length === 0) {
      return;
    }

    if (platformIds.length === 1) {
      // If there's only one platform, it must be selected.
      if (selectedAiPlatform !== platformIds[0]) {
        setSelectedAiPlatform(platformIds[0]);
      }
    } else { // More than one platform available
      // If the persisted selection is not valid anymore, default to the first available one.
      if (!platformIds.includes(selectedAiPlatform)) {
        setSelectedAiPlatform(platformIds[0]);
      }
    }
  }, [availableAiPlatforms, selectedAiPlatform, setSelectedAiPlatform]);

  const handleGenerateContent = async () => {
    setValidationError('');
    onClearApiError();

    if (!mainContent.trim()) {
      setValidationError('Vui lòng nhập nội dung ở ô bên trên để AI có thể viết lại.');
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
      setValidationError('Vui lòng chọn ít nhất một nền tảng');
      return;
    }

    if (!user?.token) {
      setValidationError('Vui lòng đăng nhập để sử dụng tính năng AI');
      return;
    }

    if (availableAiPlatforms.length === 0) {
      setValidationError('Vui lòng cấu hình ít nhất một API key trong trang Accounts');
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
    setValidationError('');
    setSuccess('');
    setPlatformSelection({
      facebook: { page: false, reels: false },
      instagram: { feed: false, reels: false },
      youtube: false
    });
  };

  // Platform selection handlers
  const handleFacebookParentClick = () => {
    const isFullySelected = platformSelection.facebook.page && platformSelection.facebook.reels;
    setPlatformSelection(prev => ({
      ...prev,
      facebook: {
        page: !isFullySelected,
        reels: !isFullySelected,
      }
    }));
  };

  const handleInstagramParentClick = () => {
    const isFullySelected = platformSelection.instagram.feed && platformSelection.instagram.reels;
    setPlatformSelection(prev => ({
      ...prev,
      instagram: {
        feed: !isFullySelected,
        reels: !isFullySelected,
      }
    }));
  };

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

  const isFacebookFullySelected = platformSelection.facebook.page && platformSelection.facebook.reels;
  const isInstagramFullySelected = platformSelection.instagram.feed && platformSelection.instagram.reels;

  return (
    <div className="space-y-3">
      {/* AI Generate Button with Platform Selector */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPromptInput(!showPromptInput)}
          className="
            flex items-center gap-2
            px-4 py-2
            bg-gray-500/80          
            text-white
            rounded-lg
            hover:bg-gray-600         
            hover:shadow-md
            transition-all duration-200
            text-sm font-medium
            min-w-[220px]
          "
        >
          <Wrench size={16} className="opacity-80 shrink-0" />
          <span className="mx-1 flex-1 text-center">
            Thiết lập tùy chọn nội dung
          </span>
          <ChevronDown size={16} className="opacity-80 shrink-0" />
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
          Chưa có API key nào được cấu hình. Vui lòng thêm API key trong trang Kết Nối.
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-2">
          <CheckCircle size={14} />
          {success}
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
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Chọn nền tảng để viết lại nội dung: *
              </label>

              <button
                type="button"
                onClick={handleSelectAll}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors
                  ${isAllSelected 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : isSomeSelected
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {isAllSelected ? (
                  <CheckSquare size={12} />
                ) : isSomeSelected ? (
                  <div className="w-3 h-3 bg-blue-600 rounded-sm flex items-center justify-center">
                    <div className="w-1.5 h-0.5 bg-white rounded" />
                  </div>
                ) : (
                  <Square size={12} />
                )}
                {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-6 justify-items-center">
              {/* Facebook */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleFacebookParentClick}
                  className={`focus:outline-none focus:ring-0 flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                    ${isFacebookFullySelected
                      ? 'border-blue-500 bg-white text-blue-700 shadow-md'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  style={{ minWidth: 120 }}
                >
                  <span className={`${isFacebookFullySelected ? 'text-blue-600' : 'text-gray-400'}`}>📘</span>
                  Facebook
                  {isFacebookFullySelected && (
                    <CheckCircle size={14} className="text-blue-600" />
                  )}
                </button>

                <div className="flex flex-row gap-2 mt-2 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => handleFacebookSelection('page')}
                    className={`flex items-center gap-1 px-1.5 py-1.5 rounded-md border transition-all duration-200 text-xs min-w-[60px] justify-center
                      ${platformSelection.facebook.page
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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
                    className={`flex items-center gap-1 px-1.5 py-1.5 rounded-md border transition-all duration-200 text-xs min-w-[60px] justify-center
                      ${platformSelection.facebook.reels
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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
                  onClick={handleInstagramParentClick}
                  className={`focus:outline-none focus:ring-0 flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                    ${isInstagramFullySelected
                      ? 'border-pink-500 bg-white text-pink-700 shadow-md'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  style={{ minWidth: 120 }}
                >
                  <span className={`${isInstagramFullySelected ? 'text-pink-600' : 'text-gray-400'}`}>📷</span>
                  Instagram
                  {isInstagramFullySelected && (
                    <CheckCircle size={14} className="text-pink-600" />
                  )}
                </button>

                <div className="flex flex-row gap-2 mt-2 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => handleInstagramSelection('feed')}
                    className={`flex items-center gap-1 px-1.5 py-1.5 rounded-md border transition-all duration-200 text-xs min-w-[60px] justify-center
                      ${platformSelection.instagram.feed
                        ? 'border-pink-500 bg-pink-100 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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
                    className={`flex items-center gap-1 px-1.5 py-1.5 rounded-md border transition-all duration-200 text-xs min-w-[60px] justify-center
                      ${platformSelection.instagram.reels
                        ? 'border-pink-500 bg-pink-100 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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
                  className={`focus:outline-none focus:ring-0 flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                    ${platformSelection.youtube
                      ? 'border-red-500 bg-white text-red-700 shadow-md'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  style={{ minWidth: 120 }}
                >
                  <span className={`${platformSelection.youtube ? 'text-red-600' : 'text-gray-400'}`}>📺</span>
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

          {/* Error display */}
          {(apiError || validationError) && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle size={14} />
                  <span>{apiError || validationError}</span>
              </div>
          )}

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
                  Tạo nội dung bằng AI
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