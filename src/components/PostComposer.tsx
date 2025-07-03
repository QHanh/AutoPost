import React, { useState } from 'react';
import { PlatformAccount, MediaFile } from '../types/platform';
import { Calendar, X, AlertTriangle, CheckSquare, Square, Clock, CheckCircle, FileText, Type, Tag } from 'lucide-react';
import { MediaUploader } from './MediaUploader';
import { PlatformMediaValidator } from './PlatformMediaValidator';
import { AIContentGenerator } from './AIContentGenerator';
import { validateMediaForPlatform } from '../utils/mediaUtils';
import { useAuth } from '../hooks/useAuth';

const getAiResultKey = (platformId: string, postType: string): string | null => {
  if (platformId === 'facebook') {
      if (postType === 'facebook') return 'facebook-page';
      if (postType === 'reel') return 'facebook-reels';
  }
  if (platformId === 'instagram') {
      if (postType === 'feed') return 'instagram-feed';
      if (postType === 'reels') return 'instagram-reels';
  }
  if (platformId === 'youtube' && postType === 'youtube') {
      return 'youtube';
  }
  return null;
};

interface PostComposerProps {
  accounts: PlatformAccount[];
  getSocialAccountId: (platformAccountId: string) => string | null;
  onPostScheduled: () => void;
}

interface PlatformPostTypes {
  [accountId: string]: string[];
}

// --- THAY ĐỔI 1: Đơn giản hóa cấu trúc state cho nội dung ---
interface PostContent {
  text: string;
  title: string; // Sử dụng chủ yếu cho YouTube
  tags: string; // Sử dụng chủ yếu cho YouTube
}

export const PostComposer: React.FC<PostComposerProps> = ({
  accounts,
  getSocialAccountId,
  onPostScheduled
}) => {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<PlatformAccount[]>([]);
  const [platformPostTypes, setPlatformPostTypes] = useState<PlatformPostTypes>({});
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingStatus, setSchedulingStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // AI generation data for API
  const [aiGenerationData, setAiGenerationData] = useState<any>(null);
  
  // --- THAY ĐỔI 2: Sử dụng state `postContent` mới ---
  const [postContent, setPostContent] = useState<PostContent>({
    text: '',
    title: '',
    tags: ''
  });
  
  // State mới cho việc tạo nội dung bằng AI
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const [activeAiCard, setActiveAiCard] = useState<string | null>(null);
  const [editedAiContent, setEditedAiContent] = useState<any>({});
  const [postTypeConfirmation, setPostTypeConfirmation] = useState<{accountId: string; postType: string} | null>(null);
  
  const { user } = useAuth();

  const confirmedAiPlatforms = React.useMemo(() => {
    if (!aiResults) return [];
    
    const confirmed = new Set<string>();
    
    selectedAccounts.forEach(account => {
        const postTypes = platformPostTypes[account.id] || [];
        postTypes.forEach(postType => {
            const aiKey = getAiResultKey(account.platformId, postType);
            if (aiKey && aiResults[aiKey]) {
                confirmed.add(aiKey);
            }
        });
    });

    return Array.from(confirmed);
  }, [selectedAccounts, platformPostTypes, aiResults]);

  const connectedAccounts = accounts.filter(acc => acc.connected);

  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL;
  };

  const handleMediaChange = (newMedia: MediaFile[]) => {
    const hasImage = newMedia.some(f => f.type === 'image');
    const hasVideo = newMedia.some(f => f.type === 'video');

    if (hasImage && hasVideo) {
      setSchedulingStatus({
        type: 'error',
        message: 'Không thể tải lên cùng lúc cả ảnh và video. Vui lòng chỉ chọn một loại.'
      });
      // Do not update state to prevent mixed media types
      return; 
    }
    
    // Clear previous media type error if any
    if (schedulingStatus?.message.includes('cả ảnh và video')) {
      setSchedulingStatus(null);
    }
    setMedia(newMedia);
  };

  const getPostTypesForPlatform = (platformId: string): { id: string; name: string; icon: string; requiresVideo?: boolean; requiresImage?: boolean }[] => {
    switch (platformId) {
      case 'facebook':
        return [
          { id: 'facebook', name: 'Page', icon: '📄' },
          { id: 'reel', name: 'Reel', icon: '🎬', requiresVideo: true }
        ];
      case 'instagram':
        return [
          { id: 'feed', name: 'Feed', icon: '📷', requiresImage: true },
          { id: 'reels', name: 'Reel', icon: '🎬', requiresVideo: true },
        ];
      case 'youtube':
        return [
          { id: 'youtube', name: 'Video', icon: '📺', requiresVideo: true }
        ];
      default:
        return [];
    }
  };

  const postTypeRequiresVideo = (accountId: string, postType: string): boolean => {
    const account = selectedAccounts.find(acc => acc.id === accountId);
    if (!account) return false;
    
    const postTypes = getPostTypesForPlatform(account.platformId);
    const typeConfig = postTypes.find(type => type.id === postType);
    return !!typeConfig?.requiresVideo;
  };

  // const postTypeRequiresImage = (accountId: string, postType: string): boolean => {
  //   const account = selectedAccounts.find(acc => acc.id === accountId);
  //   if (!account) return false;
    
  //   const postTypes = getPostTypesForPlatform(account.platformId);
  //   const typeConfig = postTypes.find(type => type.id === postType);
  //   return !!typeConfig?.requiresImage;
  // };

  const canSelectPostType = (accountId: string, postType: string): boolean => {
    const account = selectedAccounts.find(acc => acc.id === accountId);
    if (!account) return false;
    
    const postTypes = getPostTypesForPlatform(account.platformId);
    const typeConfig = postTypes.find(type => type.id === postType);
    if (!typeConfig) return false;

    if (typeConfig.requiresVideo) {
      return media.some(m => m.type === 'video');
    }
    if (typeConfig.requiresImage) {
      return media.some(m => m.type === 'image');
    }
    return true; // e.g. Facebook Page post can be text-only
  };

  const handlePostTypeToggle = (accountId: string, postType: string) => {
    if (!canSelectPostType(accountId, postType)) {
      return;
    }
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    const isSelecting = !(platformPostTypes[accountId] || []).includes(postType);

    if (isSelecting && aiResults) {
      const aiKey = getAiResultKey(account.platformId, postType);
      if (!aiKey || !aiResults[aiKey]) {
        setPostTypeConfirmation({ accountId, postType });
        return;
      }
    }

    setPlatformPostTypes(prev => {
      const currentTypes = prev[accountId] || [];
      const newTypes = currentTypes.includes(postType)
        ? currentTypes.filter(type => type !== postType)
        : [...currentTypes, postType];
      
      return {
        ...prev,
        [accountId]: newTypes
      };
    });
  };

  const handleAccountToggle = (account: PlatformAccount) => {
    const isCurrentlySelected = selectedAccounts.find(acc => acc.id === account.id);
    
    if (isCurrentlySelected) {
      setSelectedAccounts(prev => prev.filter(acc => acc.id !== account.id));
      setPlatformPostTypes(prev => {
        const newTypes = { ...prev };
        delete newTypes[account.id];
        return newTypes;
      });
    } else {
      setSelectedAccounts(prev => [...prev, account]);
      const defaultTypes = getPostTypesForPlatform(account.platformId);
      if (defaultTypes.length > 0) {
        const defaultType = defaultTypes.find(type => !type.requiresVideo) || defaultTypes[0];
        if (canSelectPostType(account.id, defaultType.id)) {
          setPlatformPostTypes(prev => ({
            ...prev,
            [account.id]: [defaultType.id]
          }));
        }
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedAccounts.length === connectedAccounts.length) {
      setSelectedAccounts([]);
      setPlatformPostTypes({});
    } else {
      setSelectedAccounts([...connectedAccounts]);
      const newPostTypes: PlatformPostTypes = {};
      connectedAccounts.forEach(account => {
        const defaultTypes = getPostTypesForPlatform(account.platformId);
        if (defaultTypes.length > 0) {
          const defaultType = defaultTypes.find(type => !type.requiresVideo) || defaultTypes[0];
          if (canSelectPostType(account.id, defaultType.id)) {
            newPostTypes[account.id] = [defaultType.id];
          }
        }
      });
      setPlatformPostTypes(newPostTypes);
    }
  };

  // --- THAY ĐỔI 4: Hàm cập nhật nội dung mới ---
  const updatePostContent = (field: keyof PostContent, value: string) => {
    setPostContent(prev => ({ ...prev, [field]: value }));
  };

  const formatDateTimeForAPI = (dateTimeLocal: string): string => {
    const date = new Date(dateTimeLocal);
    return date.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- VALIDATION ---
    if (!aiResults && postContent.text.trim() === '' && media.length === 0) {
      setSchedulingStatus({ type: 'error', message: 'Vui lòng nhập nội dung hoặc thêm media' });
      return;
    }

    if (selectedAccounts.length === 0) {
      setSchedulingStatus({ type: 'error', message: 'Vui lòng chọn ít nhất một tài khoản' });
      return;
    }

    if (!scheduledTime) {
      setSchedulingStatus({ type: 'error', message: 'Vui lòng chọn thời gian đăng bài' });
      return;
    }
    
    if (!user?.token) {
        setSchedulingStatus({ type: 'error', message: 'Vui lòng đăng nhập để lên lịch đăng bài' });
        return;
      }
  
      const accountsWithoutTypes = selectedAccounts.filter(account => {
        const types = platformPostTypes[account.id] || [];
        return types.length === 0;
      });
  
      if (accountsWithoutTypes.length > 0) {
        setSchedulingStatus({ 
          type: 'error', 
          message: `Vui lòng chọn loại đăng bài cho: ${accountsWithoutTypes.map(acc => acc.accountName).join(', ')}` 
        });
        return;
      }
  
      const accountsWithVideoRequirements = selectedAccounts.filter(account => {
        const types = platformPostTypes[account.id] || [];
        return types.some(type => postTypeRequiresVideo(account.id, type));
      });
  
      const hasVideo = media.some(m => m.type === 'video');
      if (accountsWithVideoRequirements.length > 0 && !hasVideo) {
        setSchedulingStatus({ 
          type: 'error', 
          message: `Các loại bài đăng đã chọn yêu cầu video: ${accountsWithVideoRequirements.map(acc => acc.accountName).join(', ')}` 
        });
        return;
      }
  
      const accountsWithErrors = selectedAccounts.filter(account => {
        if (!media || media.length === 0) return false;
        const errors = validateMediaForPlatform(media, account.platformId);
        return errors.length > 0;
      });
  
      if (accountsWithErrors.length > 0) {
        const proceed = confirm(
          `Một số file media không tương thích với ${accountsWithErrors.map(acc => acc.accountName).join(', ')}. ` +
          'Những tài khoản này sẽ bị bỏ qua. Bạn có muốn tiếp tục?'
        );
        if (!proceed) return;
      }
      
    setIsScheduling(true);
    setSchedulingStatus(null);

    try {
      const postTypesToSchedule = selectedAccounts.flatMap(account => 
        (platformPostTypes[account.id] || []).map(postType => ({
            account,
            postType,
            aiKey: getAiResultKey(account.platformId, postType),
        }))
      );

      const apiBaseUrl = getApiBaseUrl();
      const formData = new FormData();

      // Append media files
      media.forEach((mediaFile) => {
        formData.append('media_files', mediaFile.file);
      });

      // Append other data
      formData.append('prompt', postContent.text);
      formData.append('brand_name', aiGenerationData?.brand_name || '');
      formData.append('posting_purpose', aiGenerationData?.posting_purpose || '');
      formData.append('scheduled_at', formatDateTimeForAPI(scheduledTime));

      // Construct and append preview_content
      const contentToSubmit: any = {};

      postTypesToSchedule.forEach(p => {
        if (p.aiKey && aiResults?.[p.aiKey]) {
          // Use AI content if it exists
          contentToSubmit[p.aiKey] = editedAiContent[p.aiKey];
        } else if (p.aiKey) {
          // Fallback to manual content if AI content is missing
          if (p.aiKey === 'youtube') {
            contentToSubmit[p.aiKey] = {
              content: {
                title: postContent.title,
                description: postContent.text,
                tags: postContent.tags ? postContent.tags.split(',').map(t => t.trim()) : [],
              },
            };
          } else {
            contentToSubmit[p.aiKey] = { content: postContent.text };
          }
        }
      });
      formData.append('preview_content', JSON.stringify(contentToSubmit));

      // Construct and append platform_specific_data
      const platformSpecificData = postTypesToSchedule.map(p => {
        const socialAccountId = getSocialAccountId(p.account.id);
        if (!socialAccountId) return null;
        
        return {
          platform_type: p.aiKey,
          social_account_id: socialAccountId,
          call_to_action: aiGenerationData?.call_to_action || ''
        };
      }).filter(Boolean);

      formData.append('platform_specific_data', JSON.stringify(platformSpecificData));

      const response = await fetch(`${apiBaseUrl}/api/v1/scheduled-videos/schedule-post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to schedule posts`);
      }

      setSchedulingStatus({ 
        type: 'success', 
        message: `Đã lên lịch thành công ${platformSpecificData.length} bài đăng` 
      });

      // Reset form on success
      clearForm();
      onPostScheduled();

    } catch (error) {
      console.error('Error scheduling posts:', error);
      setSchedulingStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Lỗi khi lên lịch đăng bài. Vui lòng thử lại.' 
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };
  
  // --- THAY ĐỔI 7: Cập nhật hàm xóa form ---
  const clearForm = () => {
    setPostContent({ text: '', title: '', tags: '' });
    setMedia([]);
    setSelectedAccounts([]);
    setPlatformPostTypes({});
    setScheduledTime('');
    setAiGenerationData(null);
    setSchedulingStatus(null);
  };

  const accountsByPlatform = connectedAccounts.reduce((acc, account) => {
    if (!acc[account.platformId]) {
      acc[account.platformId] = [];
    }
    acc[account.platformId].push(account);
    return acc;
  }, {} as Record<string, PlatformAccount[]>);

  const getPlatformIcon = (platformId: string) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      youtube: '📺',
    };
    return icons[platformId as keyof typeof icons] || '🌐';
  };

  const isAllSelected = selectedAccounts.length === connectedAccounts.length && connectedAccounts.length > 0;
  const isSomeSelected = selectedAccounts.length > 0 && selectedAccounts.length < connectedAccounts.length;
  
  const totalPostsToSchedule = selectedAccounts.reduce((total, account) => {
    const postTypes = platformPostTypes[account.id] || [];
    return total + postTypes.filter(type => canSelectPostType(account.id, type)).length;
  }, 0);

  // --- THAY ĐỔI 8: Biến để kiểm tra xem có tài khoản YouTube nào được chọn không ---
  const isYouTubeSelected = selectedAccounts.some(acc => acc.platformId === 'youtube');

  const handleAiGenerate = async (generationData: any) => {
    if (!user?.token) {
      setSchedulingStatus({ type: 'error', message: 'Vui lòng đăng nhập để sử dụng tính năng AI.' });
      return;
    }

    if (generationData.platform_type.length === 0) {
        return;
    }
    
    setAiGenerationData(generationData);
    setIsAiGenerating(true);
    setSchedulingStatus(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/scheduled-videos/generate-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(generationData)
      });

      if (!response.ok) { throw new Error('Failed to generate content from AI.'); }

      const data = await response.json();
      
      // Merge new results with previous results to preserve existing cards
      setAiResults((prevResults: any) => ({
        ...prevResults,
        ...data
      }));
      setEditedAiContent((prevEdited: any) => ({
        ...prevEdited,
        ...data
      }));
      
    } catch (error) {
      setSchedulingStatus({ type: 'error', message: error instanceof Error ? error.message : 'Lỗi khi tạo nội dung AI.' });
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Map tên hiển thị cho thẻ kết quả AI
  const platformDisplay: Record<string, string> = {
    'facebook-page': 'Facebook Page',
    'facebook-reels': 'Facebook Reels',
    'instagram-feed': 'Instagram Feed',
    'instagram-reels': 'Instagram Reels',
    'youtube': 'YouTube'
  };

  // Thứ tự các nền tảng
  const platformOrder = [
    'facebook-page',
    'facebook-reels',
    'instagram-feed',
    'instagram-reels',
    'youtube'
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Clock size={20} className="text-blue-600" />
        Lên lịch đăng bài
      </h2>

      <form onSubmit={handleSubmit}>
        {schedulingStatus && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            schedulingStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {schedulingStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {schedulingStatus.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            {/* --- Ô NHẬP LIỆU CHÍNH (LUÔN HIỂN THỊ) --- */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">Nội dung bài đăng</h3>
              <div className="border rounded-lg p-4 bg-gray-50 border-gray-200 space-y-4">
                {isYouTubeSelected && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Type size={16} className="text-gray-500" />
                      Tiêu đề (tự động thêm cho YouTube)
                    </label>
                    <input
                      type="text"
                      value={postContent.title}
                      onChange={(e) => updatePostContent('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Tiêu đề video YouTube..."
                    />
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
                    <FileText size={16} className="text-gray-500" />
                    Nội dung nhập thủ công
                  </label>
                  <textarea
                    value={postContent.text}
                    onChange={(e) => updatePostContent('text', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm"
                    rows={isYouTubeSelected ? 8 : 12}
                    placeholder="Nhập nội dung bài đăng..."
                  />
                </div>
                {isYouTubeSelected && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Tag size={16} className="text-gray-500" />
                      Tags (tự động thêm cho YouTube)
                    </label>
                    <input
                      type="text"
                      value={postContent.tags}
                      onChange={(e) => updatePostContent('tags', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Tags video YouTube..."
                    />
                  </div>
                )}

              </div>
            </div>
            {/* --- KHI CÓ KẾT QUẢ AI: HIỂN THỊ CÁC THẺ --- */}
            {aiResults && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                 <h4 className="font-medium text-gray-900 flex items-center gap-2">Nội dung AI tạo</h4>
                  <div className="flex flex-wrap gap-2 justify-start">
                  {platformOrder.filter(key => aiResults[key]).map((key) => {
                    const icon = getPlatformIcon(key.split('-')[0]);
                    const isConfirmed = confirmedAiPlatforms.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveAiCard(key)}
                        type="button"
                        className={`transition-all duration-200 flex items-center gap-2 border-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm hover:shadow-md ${
                          isConfirmed
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'bg-white hover:border-blue-500 border-gray-300'
                        }`}
                      >
                        <span className="text-base">{icon}</span>
                        <span>{platformDisplay[key]}</span>
                        {isConfirmed && (
                          <CheckCircle size={14} className="ml-auto text-green-600" />
                        )}
                      </button>
                    );
                  })}
                  </div>

                {/* --- MODAL CHỈNH SỬA --- */}
                {activeAiCard && aiResults[activeAiCard] && (() => {
                  const isModalConfirmed = confirmedAiPlatforms.includes(activeAiCard);
                  return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
                      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative">
                        <div className="flex items-center gap-3 font-semibold text-lg mb-4">
                          <span className="text-xl">{getPlatformIcon(activeAiCard.split('-')[0])}</span>
                          <span>{platformDisplay[activeAiCard]}</span>
                        </div>
                        <div className="w-full max-h-[60vh] overflow-y-auto pr-2">
                          {/* YouTube content editing */}
                          {activeAiCard === 'youtube' && typeof editedAiContent[activeAiCard]?.content === 'object' ? (
                            <div className="space-y-3">
                              <input
                                className={`w-full border rounded px-3 py-2 text-sm ${isModalConfirmed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                value={editedAiContent[activeAiCard]?.content?.title || ''}
                                onChange={e => setEditedAiContent((prev: any) => ({ ...prev, [activeAiCard]: { ...prev[activeAiCard], content: { ...prev[activeAiCard].content, title: e.target.value } } }))}
                                placeholder="Tiêu đề video"
                                readOnly={isModalConfirmed}
                              />
                              <textarea
                                className={`w-full border rounded px-3 py-2 text-sm ${isModalConfirmed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                rows={8}
                                value={editedAiContent[activeAiCard]?.content?.description || ''}
                                onChange={e => setEditedAiContent((prev: any) => ({ ...prev, [activeAiCard]: { ...prev[activeAiCard], content: { ...prev[activeAiCard].content, description: e.target.value } } }))}
                                placeholder="Mô tả video"
                                readOnly={isModalConfirmed}
                              />
                              <input
                                className={`w-full border rounded px-3 py-2 text-sm ${isModalConfirmed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                value={editedAiContent[activeAiCard]?.content?.tags || ''}
                                onChange={e => setEditedAiContent((prev: any) => ({ ...prev, [activeAiCard]: { ...prev[activeAiCard], content: { ...prev[activeAiCard].content, tags: e.target.value } } }))}
                                placeholder="Tags"
                                readOnly={isModalConfirmed}
                              />
                            </div>
                          ) : (
                            // Standard content editing
                            <textarea
                              className={`w-full border rounded px-3 py-2 text-sm ${isModalConfirmed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              rows={12}
                              value={editedAiContent[activeAiCard]?.content || ''}
                              onChange={e => setEditedAiContent((prev: any) => ({ ...prev, [activeAiCard]: { ...prev[activeAiCard], content: e.target.value } }))}
                              readOnly={isModalConfirmed}
                            />
                          )}
                        </div>
                        <div className="flex justify-end items-center mt-6 gap-3">
                          {isModalConfirmed && (
                            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mr-auto">
                              <CheckCircle size={16} />
                              <span>Nội dung đã được chốt và không thể chỉnh sửa.</span>
                            </div>
                          )}
                          <button
                            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                            onClick={() => setActiveAiCard(null)}
                            type="button"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            <AIContentGenerator 
              onGenerate={handleAiGenerate} 
              isGenerating={isAiGenerating} 
              mainContent={postContent.text}
            />

          </div>

          {/* Cột bên phải giữ nguyên */}
          <div className="space-y-6">
            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                File Media (Hình ảnh & Video)
              </label>
              <MediaUploader
                media={media}
                onMediaChange={handleMediaChange}
                maxFiles={10}
              />
            </div>

            {/* Account Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Chọn tài khoản ({selectedAccounts.length} đã chọn)
                </label>
                
                {connectedAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      isAllSelected 
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
                        <div className="w-1.5 h-0.5 bg-white rounded"></div>
                      </div>
                    ) : (
                      <Square size={12} />
                    )}
                    {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                )}
              </div>
              
              {connectedAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="font-medium">Chưa có tài khoản nào được kết nối</p>
                  <p className="text-sm mt-1">Kết nối tài khoản mạng xã hội để bắt đầu đăng bài.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {Object.entries(accountsByPlatform).map(([platformId, platformAccounts]) => (
                    <div key={platformId} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">{getPlatformIcon(platformId)}</span>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {platformAccounts[0].platformName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          ({platformAccounts.length} tài khoản)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {platformAccounts.map((account) => (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => handleAccountToggle(account)}
                            className={`p-2 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-sm ${
                              selectedAccounts.find(acc => acc.id === account.id)
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col items-center text-center space-y-1">
                              {account.profileInfo?.profilePicture ? (
                                <img
                                  src={account.profileInfo.profilePicture}
                                  alt={account.accountName}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-sm">👤</span>
                                </div>
                              )}
                              
                              <div className="w-full">
                                <div className="flex items-center justify-center gap-1">
                                  <div className="font-medium text-xs text-gray-900 truncate max-w-full">
                                    {account.accountName}
                                  </div>
                                </div>
                                
                                {account.profileInfo?.username && (
                                  <div className="text-xs text-gray-500 truncate">
                                    @{account.profileInfo.username}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {platformAccounts.some(account => selectedAccounts.find(acc => acc.id === account.id)) && (
                        <div className="border-t border-gray-200 pt-3">
                          {platformAccounts
                            .filter(account => selectedAccounts.find(acc => acc.id === account.id))
                            .map(account => {
                              const postTypes = getPostTypesForPlatform(account.platformId);
                              const selectedTypes = platformPostTypes[account.id] || [];
                              
                              return (
                                <div key={account.id} className="mb-3 last:mb-0">
                                  <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <span className="text-sm">{getPlatformIcon(account.platformId)}</span>
                                    {account.accountName} - Loại đăng bài:
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {postTypes.map(postType => {
                                      const canSelect = canSelectPostType(account.id, postType.id);
                                      const isSelected = selectedTypes.includes(postType.id);
                                      let disabledTitle = '';
                                      if (!canSelect) {
                                        if (postType.requiresVideo) {
                                          disabledTitle = `Yêu cầu video để chọn ${postType.name}`;
                                        } else if (postType.requiresImage) {
                                          disabledTitle = `Yêu cầu ảnh để chọn ${postType.name}`;
                                        }
                                      }
                                      
                                      return (
                                        <button
                                          key={postType.id}
                                          type="button"
                                          onClick={() => handlePostTypeToggle(account.id, postType.id)}
                                          disabled={!canSelect}
                                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                            isSelected
                                              ? 'bg-green-100 text-green-700 border border-green-300'
                                              : canSelect
                                              ? 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                                              : 'bg-red-50 text-red-400 border border-red-200 cursor-not-allowed opacity-50'
                                          }`}
                                          title={disabledTitle}
                                        >
                                          <span>{postType.icon}</span>
                                          {postType.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Calendar size={16} />
                Thời gian đăng bài <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={getMinDateTime()}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isScheduling || selectedAccounts.length === 0 || !scheduledTime || totalPostsToSchedule === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isScheduling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang lên lịch...
                  </>
                ) : (
                  <>
                    <Calendar size={16} />
                    Lên lịch đăng bài
                    {totalPostsToSchedule > 0 && (
                      <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                        {totalPostsToSchedule}
                      </span>
                    )}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={clearForm}
                className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <X size={16} />
                Xóa form
              </button>
            </div>
          </div>
        </div>

        {media.length > 0 && selectedAccounts.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <PlatformMediaValidator
              media={media}
              selectedPlatforms={selectedAccounts}
            />
          </div>
        )}
      </form>
      
      {postTypeConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Nội dung nền tảng này chưa được bạn tạo bằng AI. Bạn có muốn sử dụng nội dung ở ô nội dung thủ công để đăng không?
                </p>
                <div className="mt-5 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setPostTypeConfirmation(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium text-sm"
                    >
                        Không
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                          if (postTypeConfirmation) {
                            const { accountId, postType } = postTypeConfirmation;
                            setPlatformPostTypes(prev => ({
                              ...prev,
                              [accountId]: [...(prev[accountId] || []), postType]
                            }));
                            setPostTypeConfirmation(null);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                    >
                        Có
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};