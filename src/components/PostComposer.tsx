import React, { useState, useRef, useEffect } from 'react';
import { PlatformAccount, MediaFile } from '../types/platform';
import { Calendar, X, AlertTriangle, CheckSquare, Square, Clock, CheckCircle, Maximize2 } from 'lucide-react';
import { MediaUploader } from './MediaUploader';
import { PlatformMediaValidator } from './PlatformMediaValidator';
import { AIContentGenerator } from './AIContentGenerator';
import { validateMediaForPlatform } from '../utils/mediaUtils';
import { useAuth } from '../hooks/useAuth';

interface PostComposerProps {
  accounts: PlatformAccount[];
  getSocialAccountId: (platformAccountId: string) => string | null;
  onPostScheduled: () => void;
}

interface PlatformPostTypes {
  [accountId: string]: string[];
}

interface ContentBoxes {
  short_video: { caption: string };
  long_video: { caption: string };
  youtube: { 
    description: string;
    tags: string[];
    title: string;
  };
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
  
  // Content boxes - always present
  const [contentBoxes, setContentBoxes] = useState<ContentBoxes>({
    short_video: { caption: '' },
    long_video: { caption: '' },
    youtube: { description: '', tags: [], title: '' }
  });
  
  const [activeContentTypes, setActiveContentTypes] = useState<Set<string>>(new Set());
  const [lockedContentTypes, setLockedContentTypes] = useState<Set<string>>(new Set());
  const [expandedBox, setExpandedBox] = useState<string | null>(null);
  
  const { user } = useAuth();

  const connectedAccounts = accounts.filter(acc => acc.connected);

  // Get API base URL from environment variables with fallback
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  };

  // Get available post types for a platform
  const getPostTypesForPlatform = (platformId: string): { id: string; name: string; icon: string; requiresVideo?: boolean }[] => {
    switch (platformId) {
      case 'facebook':
        return [
          { id: 'facebook', name: 'Page', icon: '📄' },
          { id: 'reel', name: 'Reel', icon: '🎬', requiresVideo: true }
        ];
      case 'instagram':
        return [
          { id: 'photo', name: 'Photo', icon: '📷' },
          { id: 'reels', name: 'Reel', icon: '🎬', requiresVideo: true },
          { id: 'carousel', name: 'Carousel', icon: '🎠' }
        ];
      case 'youtube':
        return [
          { id: 'youtube', name: 'Video', icon: '📺', requiresVideo: true }
        ];
      default:
        return [];
    }
  };

  // Check if post type requires video
  const postTypeRequiresVideo = (accountId: string, postType: string): boolean => {
    const account = selectedAccounts.find(acc => acc.id === accountId);
    if (!account) return false;
    
    const postTypes = getPostTypesForPlatform(account.platformId);
    const typeConfig = postTypes.find(type => type.id === postType);
    return typeConfig?.requiresVideo || false;
  };

  // Check if account has video when required
  const canSelectPostType = (accountId: string, postType: string): boolean => {
    if (!postTypeRequiresVideo(accountId, postType)) return true;
    
    // Check if there's at least one video in media
    const hasVideo = media.some(m => m.type === 'video');
    return hasVideo;
  };

  // Update active content types and lock status based on selected accounts and post types
  useEffect(() => {
    const newActiveTypes = new Set<string>();
    const newLockedTypes = new Set<string>();
    
    selectedAccounts.forEach(account => {
      const postTypes = platformPostTypes[account.id] || [];
      postTypes.forEach(postType => {
        if (postType === 'reel' || postType === 'reels') {
          newActiveTypes.add('short_video');
          newLockedTypes.add('short_video');
        } else if (postType === 'facebook' || postType === 'photo' || postType === 'carousel') {
          newActiveTypes.add('long_video');
          newLockedTypes.add('long_video');
        } else if (postType === 'youtube') {
          newActiveTypes.add('youtube');
          newLockedTypes.add('youtube');
        }
      });
    });
    
    setActiveContentTypes(newActiveTypes);
    setLockedContentTypes(newLockedTypes);
  }, [selectedAccounts, platformPostTypes]);

  // Handle post type selection for an account
  const handlePostTypeToggle = (accountId: string, postType: string) => {
    if (!canSelectPostType(accountId, postType)) {
      return; // Don't allow selection if requirements not met
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
      // Remove account and its post types
      setSelectedAccounts(prev => prev.filter(acc => acc.id !== account.id));
      setPlatformPostTypes(prev => {
        const newTypes = { ...prev };
        delete newTypes[account.id];
        return newTypes;
      });
    } else {
      // Add account and set default post type
      setSelectedAccounts(prev => [...prev, account]);
      const defaultTypes = getPostTypesForPlatform(account.platformId);
      if (defaultTypes.length > 0) {
        // Only set default if it doesn't require video or we have video
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

  const handleAIContentGenerated = (generatedContent: any, generationData: any) => {
    // Update content boxes with AI generated content
    const newContentBoxes = { ...contentBoxes };
    
    if (generatedContent.short_video) {
      newContentBoxes.short_video = generatedContent.short_video;
    }
    if (generatedContent.long_video) {
      newContentBoxes.long_video = generatedContent.long_video;
    }
    if (generatedContent.youtube) {
      newContentBoxes.youtube = generatedContent.youtube;
    }
    
    setContentBoxes(newContentBoxes);
    setAiGenerationData(generationData);
  };

  // Update content box
  const updateContentBox = (type: keyof ContentBoxes, field: string, value: string) => {
    setContentBoxes(prev => {
      const updated = { ...prev };
      if (type === 'short_video' || type === 'long_video') {
        updated[type] = { caption: value };
      } else if (type === 'youtube') {
        updated[type] = { ...updated[type], [field]: value };
      }
      return updated;
    });
  };

  // Convert datetime-local to ISO format for API
  const formatDateTimeForAPI = (dateTimeLocal: string): string => {
    const date = new Date(dateTimeLocal);
    return date.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if any content box has content
    const hasContent = contentBoxes.short_video.caption.trim() || 
                      contentBoxes.long_video.caption.trim() || 
                      contentBoxes.youtube.description.trim();
    
    if (!hasContent && media.length === 0) {
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

    // Check if all selected accounts have post types selected
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

    // Check for video requirements
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

    // Validate media for selected accounts
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
      const apiBaseUrl = getApiBaseUrl();
      const formData = new FormData();

      // Required fields
      formData.append('prompt', aiGenerationData?.platform_specific_data?.prompt || 'Generated content');
      formData.append('scheduled_at', formatDateTimeForAPI(scheduledTime));

      // Preview content - send the entire content boxes
      formData.append('preview_content', JSON.stringify(contentBoxes));

      // Media files
      media.forEach((mediaFile, index) => {
        formData.append('media_files', mediaFile.file);
      });

      // Platform specific data - array of account configurations
      const platformSpecificData = selectedAccounts.flatMap(account => {
        const socialAccountId = getSocialAccountId(account.id);
        if (!socialAccountId) return [];

        const postTypes = platformPostTypes[account.id] || [];
        return postTypes.map(postType => ({
          platform: account.platformId,
          social_account_id: socialAccountId,
          ...(account.platformId !== 'youtube' && { type: postType }),
          call_to_action: aiGenerationData?.platform_specific_data?.call_to_action || ''
        }));
      });

      formData.append('platform_specific_data', JSON.stringify(platformSpecificData));

      // Optional fields
      formData.append('brand_name', aiGenerationData?.brand_name || '');
      formData.append('posting_purpose', aiGenerationData?.posting_purpose || '');

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

      const result = await response.json();
      
      setSchedulingStatus({ 
        type: 'success', 
        message: `Đã lên lịch thành công ${platformSpecificData.length} bài đăng` 
      });

      // Reset form on success
      setContentBoxes({
        short_video: { caption: '' },
        long_video: { caption: '' },
        youtube: { description: '', tags: [], title: '' }
      });
      setMedia([]);
      setSelectedAccounts([]);
      setPlatformPostTypes({});
      setScheduledTime('');
      setAiGenerationData(null);

      // Notify parent to refresh posts
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

  const clearForm = () => {
    setContentBoxes({
      short_video: { caption: '' },
      long_video: { caption: '' },
      youtube: { description: '', tags: [], title: '' }
    });
    setMedia([]);
    setSelectedAccounts([]);
    setPlatformPostTypes({});
    setScheduledTime('');
    setAiGenerationData(null);
    setSchedulingStatus(null);
  };

  // Group accounts by platform
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
      twitter: '🐦',
      linkedin: '💼',
      tiktok: '🎵'
    };
    return icons[platformId as keyof typeof icons] || '🌐';
  };

  const isAllSelected = selectedAccounts.length === connectedAccounts.length && connectedAccounts.length > 0;
  const isSomeSelected = selectedAccounts.length > 0 && selectedAccounts.length < connectedAccounts.length;

  // Calculate total posts that will be scheduled
  const totalPostsToSchedule = selectedAccounts.reduce((total, account) => {
    const postTypes = platformPostTypes[account.id] || [];
    return total + postTypes.filter(type => canSelectPostType(account.id, type)).length;
  }, 0);

  // Get content box info
  const getContentBoxInfo = (type: string) => {
    switch (type) {
      case 'short_video':
        return { title: 'Reel', icon: '🎬', color: 'border-purple-200 bg-purple-50' };
      case 'long_video':
        return { title: 'Page/Instagram', icon: '📄', color: 'border-blue-200 bg-blue-50' };
      case 'youtube':
        return { title: 'YouTube', icon: '📺', color: 'border-red-200 bg-red-50' };
      default:
        return { title: type, icon: '📝', color: 'border-gray-200 bg-gray-50' };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Clock size={20} className="text-blue-600" />
        Lên lịch đăng bài
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Status Messages */}
        {schedulingStatus && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            schedulingStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {schedulingStatus.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            {schedulingStatus.message}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Content Boxes & AI Generator */}
          <div className="space-y-6">
            {/* Content Boxes - Always Present */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Nội dung bài đăng</h3>
              
              {Object.entries(contentBoxes).map(([type, content]) => {
                const boxInfo = getContentBoxInfo(type);
                const isActive = activeContentTypes.has(type);
                const isLocked = lockedContentTypes.has(type);
                
                return (
                  <div 
                    key={type} 
                    className={`border-2 rounded-lg p-4 transition-all ${
                      isActive 
                        ? `${boxInfo.color} border-opacity-100` 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isActive}
                          readOnly
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span>{boxInfo.icon}</span>
                        <span className="font-medium text-gray-900">{boxInfo.title}</span>
                        {isActive && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Sẽ đăng
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            Đã chọn
                          </span>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setExpandedBox(type)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                        title="Mở rộng để chỉnh sửa"
                      >
                        <Maximize2 size={14} />
                        Mở rộng
                      </button>
                    </div>
                    
                    {type === 'youtube' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tiêu đề:</label>
                          <input
                            type="text"
                            value={content.title}
                            onChange={(e) => updateContentBox('youtube', 'title', e.target.value)}
                            disabled={isLocked}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                              isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="Tiêu đề video YouTube..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả:</label>
                          <textarea
                            value={content.description}
                            onChange={(e) => updateContentBox('youtube', 'description', e.target.value)}
                            disabled={isLocked}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm ${
                              isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            rows={4}
                            placeholder="Mô tả video YouTube..."
                          />
                        </div>
                        {content.tags && content.tags.length > 0 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tags:</label>
                            <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                              {content.tags.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <textarea
                        value={content.caption}
                        onChange={(e) => updateContentBox(type as keyof ContentBoxes, 'caption', e.target.value)}
                        disabled={isLocked}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm ${
                          isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        rows={4}
                        placeholder={`Nội dung ${boxInfo.title}...`}
                      />
                    )}
                    
                    {isLocked && (
                      <div className="mt-2 text-xs text-orange-600">
                        Để chỉnh sửa, bỏ chọn loại đăng bài tương ứng ở bên phải
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* AI Content Generator */}
            <AIContentGenerator onContentGenerated={handleAIContentGenerated} />
          </div>

          {/* Right Column - Media Upload, Account Selection, Schedule & Actions */}
          <div className="space-y-6">
            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                File Media (Hình ảnh & Video)
              </label>
              <MediaUploader
                media={media}
                onMediaChange={setMedia}
                maxFiles={10}
              />
            </div>

            {/* Account Selection - Grid Layout */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Chọn tài khoản ({selectedAccounts.length} đã chọn)
                </label>
                
                {/* Select All Button */}
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
                      {/* Platform Header - Compact */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">{getPlatformIcon(platformId)}</span>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {platformAccounts[0].platformName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          ({platformAccounts.length} tài khoản{platformAccounts.length !== 1 ? '' : ''})
                        </span>
                      </div>
                      
                      {/* Accounts Grid - 3 columns */}
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
                              {/* Avatar */}
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
                              
                              {/* Account Name */}
                              <div className="w-full">
                                <div className="flex items-center justify-center gap-1">
                                  <div className="font-medium text-xs text-gray-900 truncate max-w-full">
                                    {account.accountName}
                                  </div>
                                  {account.profileInfo?.verified && (
                                    <div className="text-blue-500 text-xs flex-shrink-0" title="Verified">
                                      ✓
                                    </div>
                                  )}
                                </div>
                                
                                {/* Username */}
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

                      {/* Post Type Selection for Selected Accounts - Always Show Below */}
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
                                          title={!canSelect ? `Yêu cầu video để chọn ${postType.name}` : ''}
                                        >
                                          <span>{postType.icon}</span>
                                          {postType.name}
                                          {postType.requiresVideo && !canSelect && (
                                            <span className="text-red-400">🎥</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {postTypes.some(type => type.requiresVideo) && !media.some(m => m.type === 'video') && (
                                    <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                      <AlertTriangle size={10} />
                                      Cần video để chọn Reel/YouTube
                                    </div>
                                  )}
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

            {/* Schedule - REQUIRED */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Calendar size={16} />
                Thời gian đăng bài *
                <span className="text-red-500">Bắt buộc</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={getMinDateTime()}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {scheduledTime && (
                <p className="mt-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-2">
                  📅 Bài đăng sẽ được xuất bản vào {new Date(scheduledTime).toLocaleString()}
                </p>
              )}
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

            {/* Compact Quick Stats */}
            {selectedAccounts.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tóm tắt lên lịch</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Tài khoản:</span>
                    <span className="font-medium">{selectedAccounts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bài đăng:</span>
                    <span className="font-medium text-blue-600">{totalPostsToSchedule}</span>
                  </div>
                  {media.length > 0 && (
                    <div className="flex justify-between">
                      <span>Media:</span>
                      <span className="font-medium">{media.length}</span>
                    </div>
                  )}
                  {scheduledTime && (
                    <div className="flex justify-between col-span-2">
                      <span>Lên lịch:</span>
                      <span className="font-medium text-blue-600">
                        {new Date(scheduledTime).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media Validation - Full Width Below */}
        {media.length > 0 && selectedAccounts.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <PlatformMediaValidator
              media={media}
              selectedPlatforms={selectedAccounts}
            />
          </div>
        )}
      </form>

      {/* Expanded Content Modal */}
      {expandedBox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>{getContentBoxInfo(expandedBox).icon}</span>
                Chỉnh sửa {getContentBoxInfo(expandedBox).title}
              </h3>
              <button
                onClick={() => setExpandedBox(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-6">
              {expandedBox === 'youtube' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề:</label>
                    <input
                      type="text"
                      value={contentBoxes.youtube.title}
                      onChange={(e) => updateContentBox('youtube', 'title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tiêu đề video YouTube..."
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả:</label>
                    <textarea
                      value={contentBoxes.youtube.description}
                      onChange={(e) => updateContentBox('youtube', 'description', e.target.value)}
                      className="w-full h-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Mô tả video YouTube..."
                    />
                  </div>
                  {contentBoxes.youtube.tags && contentBoxes.youtube.tags.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags:</label>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                        {contentBoxes.youtube.tags.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  value={expandedBox === 'short_video' ? contentBoxes.short_video.caption : contentBoxes.long_video.caption}
                  onChange={(e) => updateContentBox(expandedBox as keyof ContentBoxes, 'caption', e.target.value)}
                  className="w-full h-full min-h-[400px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={`Nội dung ${getContentBoxInfo(expandedBox).title}...`}
                  autoFocus
                />
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setExpandedBox(null)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đóng và Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};