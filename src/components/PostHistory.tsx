import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, ExternalLink, Image as ImageIcon, Film, Play, RefreshCw, User, ChevronDown, ChevronUp, Edit, Trash2, Loader2 } from 'lucide-react';
import { PlatformAccount } from '../types/platform';
import Swal from 'sweetalert2';

interface MediaAsset {
  id: string;
  user_id: string;
  storage_path: string;
  url: string[];
  file_name: string;
  file_type: 'image' | 'video';
  duration?: number;
  brand_name?: string;
  posting_purpose?: string;
  uploaded_at: string;
  updated_at: string;
  prompt_for_content?: string;
}

interface YouTubeMetadata {
  platform_post_id: string;
  content_type: string;
  title: string;
  description: string;
  tags: string[];
  privacy_status: string;
  shorts_hashtags: string[];
  shorts_music?: string;
  created_at: string;
  updated_at: string;
}

interface BackendPost {
  id: string;
  social_account_id: string;
  platform: string;
  platform_type?: string;
  status: string;
  scheduled_at: string;
  generated_content: string | null;
  post_url: string | null;
  created_at: string;
  updated_at: string;
  media_assets?: MediaAsset[];
  youtube_metadata?: YouTubeMetadata;
}

interface PostHistoryProps {
  publishedPosts: BackendPost[];
  unpublishedPosts: BackendPost[];
  isLoadingPublished: boolean;
  isLoadingUnpublished: boolean;
  accounts: PlatformAccount[];
  getSocialAccountId: (platformAccountId: string) => string | null;
  onRefreshPosts: () => void;
  onUpdatePost: (postId: string, data: { preview_content: string; scheduled_at: string }) => Promise<any>;
  onDeletePost: (postId: string) => Promise<void>;
  onRetryPost: (postId: string) => Promise<any>;
}

// --- Helper Functions ---
const getPostTypeDisplayName = (platformType?: string): string | null => {
  if (!platformType) return null;
  const displayNames: Record<string, string> = {
    'facebook-page': 'Page',
    'facebook-reels': 'Reel',
    'instagram-feed': 'Feed',
    'instagram-reels': 'Reel',
    'youtube': 'Video',
  };
  return displayNames[platformType] || platformType;
};

const getPlatformIcon = (platform: string) => {
  const icons = {
    facebook: '📘',
    instagram: '📷',
    youtube: '📺',
    twitter: '🐦',
    linkedin: '💼',
    tiktok: '🎵'
  };
  return icons[platform as keyof typeof icons] || '🌐';
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('vi-VN');
};

const truncateContent = (content: string, maxLength: number = 200) => {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'published':
    case 'posted':
      return <CheckCircle className="text-green-500" size={16} />;
    case 'ready':
    case 'scheduled':
      return <Clock className="text-blue-500" size={16} />;
    case 'failed':
    case 'error':
      return <XCircle className="text-red-500" size={16} />;
    case 'processing':
    case 'posting':
      return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />;
    default:
      return <Calendar className="text-gray-500" size={16} />;
  }
};

const getStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'published':
    case 'posted':
      return 'Đã đăng';
    case 'ready':
    case 'scheduled':
      return 'Đang chờ';
    case 'failed':
    case 'error':
      return 'Thất bại';
    case 'processing':
    case 'posting':
      return 'Đang đăng...';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'published':
    case 'posted':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'ready':
    case 'scheduled':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'failed':
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'processing':
    case 'posting':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// --- PostCard Component ---
interface PostCardProps {
  post: BackendPost;
  accountName: string;
  isExpanded: boolean;
  isProcessing: boolean;
  postTypeDisplayName: string | null;
  showPostUrl?: boolean;
  onToggleExpansion: (postId: string) => void;
  onEdit: (post: BackendPost) => void;
  onDelete: (postId: string) => void;
  onRetry: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = React.memo(({
  post,
  accountName,
  isExpanded,
  isProcessing,
  postTypeDisplayName,
  showPostUrl = false,
  onToggleExpansion,
  onEdit,
  onDelete,
  onRetry
}) => {
  const shouldShowExpandButton = post.generated_content && post.generated_content.length > 200;
  const isFailed = post.status.toLowerCase() === 'failed' || post.status.toLowerCase() === 'error';

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
        isProcessing ? 'border-blue-200 bg-blue-50' : 
        post.status === 'ready' || post.status === 'scheduled' ? 'border-green-200 bg-green-50' :
        'border-gray-200 bg-white'
      }`}
    >
      <div className="flex gap-4">
        {/* Left Column: Post Details */}
        <div className="flex-grow">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getPlatformIcon(post.platform)}</span>
              <div>
                <div className="flex items-center gap-2">
                  {isProcessing ? getStatusIcon('posting') : getStatusIcon(post.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${isProcessing ? getStatusColor('posting') : getStatusColor(post.status)}`}>
                    {isProcessing ? getStatusText('posting') : getStatusText(post.status)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                  {postTypeDisplayName && ` • ${postTypeDisplayName}`}
                </div>
              </div>
            </div>
          </div>

          {/* Account Name + Post URL Section */}
          <div className="mb-3 flex items-center gap-4">
            <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg w-fit flex items-center gap-2">
              <User size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Tài khoản:</span>
              <span className="text-sm text-gray-800 font-semibold">{accountName}</span>
            </div>

            {showPostUrl && post.post_url && (
              <a
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline text-xs font-medium px-2 py-1 bg-green-50 border border-green-200 rounded-md"
              >
                <ExternalLink size={12} />
                Xem bài
              </a>
            )}
          </div>

          {/* Content */}
          {post.generated_content && (
            <div className="mb-3">
              <div className="text-gray-900 text-sm leading-relaxed">
                {isExpanded ? post.generated_content : truncateContent(post.generated_content)}
              </div>
              {shouldShowExpandButton && (
                <button
                  onClick={() => onToggleExpansion(post.id)}
                  className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={14} />
                      Thu gọn
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      Xem thêm
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Footer - Timestamps */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
            <div>
              Tạo: {formatDateTime(post.created_at)}
            </div>
            <div className={isProcessing ? 'text-blue-600 font-medium' : 'text-green-600'}>
              {post.status.toLowerCase() === 'published' ? 'Đã đăng: ' : 'Lên lịch: '}
              {formatDateTime(post.scheduled_at)}
            </div>
          </div>

          {/* Action Buttons for Unpublished Posts */}
          {!showPostUrl && (isFailed || !isProcessing) && (
            <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-200">
              {!isProcessing && (
                <button 
                  onClick={() => onEdit(post)} 
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors border border-blue-200"
                >
                  <Edit size={14} /> Chỉnh sửa
                </button>
              )}
              {isFailed && (
                <button 
                  onClick={() => onRetry(post.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors border border-green-200"
                >
                  <RefreshCw size={14} /> Đăng lại
                </button>
              )}
              {!isProcessing && (
                <button 
                  onClick={() => onDelete(post.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors border border-red-200"
                >
                  <Trash2 size={14} /> Xóa
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Media Assets */}
        {post.media_assets && post.media_assets.length > 0 && (
          <div className="flex-shrink-0 w-48">
            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <ImageIcon size={14} />
              Media Files ({post.media_assets.length})
            </h5>
            <div className="space-y-2">
              {post.media_assets
                .filter(asset => asset.url && asset.url.length > 0)
                .map((asset) => (
                <div key={asset.id} className="relative group">
                  {asset.file_type === 'image' ? (
                    <img
                      src={asset.url[0]}
                      alt={asset.file_name}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                      <video
                        src={asset.url[0]}
                        className="w-full h-full object-cover rounded-lg"
                        muted
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
                        <Play className="text-white" size={20} />
                      </div>
                    </div>
                  )}
                  
                  {/* File Info Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-end rounded-lg">
                    <div className="w-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="text-xs font-medium truncate">{asset.file_name}</div>
                      <div className="text-xs flex items-center gap-1">
                        {asset.file_type === 'image' ? <ImageIcon size={10} /> : <Film size={10} />}
                        {asset.file_type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const PostHistory: React.FC<PostHistoryProps> = ({
  publishedPosts,
  unpublishedPosts,
  isLoadingPublished,
  isLoadingUnpublished,
  accounts,
  getSocialAccountId,
  onRefreshPosts,
  onUpdatePost,
  onDeletePost,
  onRetryPost
}) => {
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'unpublished' | 'published'>('unpublished');
  const [editingPost, setEditingPost] = useState<BackendPost | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedScheduledAt, setEditedScheduledAt] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second to check for overdue posts in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isPostProcessing = useCallback((post: BackendPost) => {
    const status = post.status.toLowerCase();
    if (status === 'processing' || status === 'posting') {
      return true;
    }
    if (status === 'ready' && new Date(post.scheduled_at) < currentTime) {
      return true;
    }
    return false;
  }, [currentTime]);

  useEffect(() => {
    const hasProcessingPosts = unpublishedPosts.some(isPostProcessing);
    let intervalId: NodeJS.Timeout | null = null;

    if (hasProcessingPosts) {
      intervalId = setInterval(() => {
        console.log('🔄 Auto-refreshing posts due to processing items...');
        onRefreshPosts();
      }, 5000); // 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [unpublishedPosts, onRefreshPosts, isPostProcessing]);

  const getAccountNameBySocialId = useCallback((socialAccountId: string, platform: string): string => {
    // Find the platform account that matches this social_account_id
    const matchingAccount = accounts.find(account => {
      const accountSocialId = getSocialAccountId(account.id);
      return accountSocialId === socialAccountId && account.platformId === platform;
    });

    return matchingAccount?.accountName || `${platform} Account`;
  }, [accounts, getSocialAccountId]);

  const toggleContentExpansion = useCallback((postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  }, []);

  const handleEditClick = useCallback((post: BackendPost) => {
    setEditingPost(post);
    if (post.platform === 'youtube' && post.youtube_metadata) {
        setEditedTitle(post.youtube_metadata.title);
        setEditedContent(post.youtube_metadata.description);
    } else {
        setEditedContent(post.generated_content || '');
    }
    const scheduleDate = new Date(post.scheduled_at);
    const formattedDate = new Date(scheduleDate.getTime() - (scheduleDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setEditedScheduledAt(formattedDate);
    setModalError(null);
  }, []);

  const handleCancelEdit = () => {
    setEditingPost(null);
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    setIsUpdating(true);
    setModalError(null);

    try {
        let previewContent;
        if (editingPost.platform === 'youtube' && editingPost.platform_type) {
            const content = {
                title: editedTitle,
                description: editedContent,
                tags: editingPost.youtube_metadata?.tags || []
            };
            previewContent = { [editingPost.platform_type]: { content } };
        } else if (editingPost.platform_type) {
            previewContent = { [editingPost.platform_type]: { content: editedContent } };
        }

        if (!previewContent) {
            throw new Error("Could not construct preview content. Platform type is missing.");
        }

        const scheduledAtISO = new Date(editedScheduledAt).toISOString();

        await onUpdatePost(editingPost.id, {
            preview_content: JSON.stringify(previewContent),
            scheduled_at: scheduledAtISO
        });

        setEditingPost(null);
        onRefreshPosts();

    } catch (error) {
        setModalError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
        setIsUpdating(false);
    }
  };

  const handleDeletePost = useCallback(async (postId: string) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Xóa bài đăng?',
      text: 'Bạn có chắc chắn muốn xóa bài đăng đã lên lịch này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });
    if (isConfirmed) {
        try {
            await onDeletePost(postId);
            onRefreshPosts();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Thất bại khi xóa bài đăng.');
        }
    }
  }, [onDeletePost, onRefreshPosts]);

  const handleRetryPost = useCallback(async (postId: string) => {
    try {
      await onRetryPost(postId);
      onRefreshPosts();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Thất bại khi thử đăng lại.');
    }
  }, [onRetryPost, onRefreshPosts]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Lịch sử bài đăng
          </h2>
          <button
            onClick={onRefreshPosts}
            disabled={isLoadingPublished || isLoadingUnpublished}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingPublished || isLoadingUnpublished ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <RefreshCw size={16} />
            )}
            Tải lại
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="px-6 pt-4 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('unpublished')}
            className={`flex items-center gap-2 pb-3 font-medium transition-colors ${
              activeTab === 'unpublished'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock size={16} />
            Đang chờ đăng ({unpublishedPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`flex items-center gap-2 pb-3 font-medium transition-colors ${
              activeTab === 'published'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle size={16} />
            Đã đăng ({publishedPosts.length})
          </button>
        </div>
      </div>

      {/* Single Column Layout for content */}
      <div className="p-6">
        {activeTab === 'unpublished' && (
          <div className="max-h-[600px] overflow-y-auto space-y-4">
            {isLoadingUnpublished ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tải bài đăng chờ...</p>
              </div>
            ) : unpublishedPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium mb-2">Không có bài đăng nào đang chờ</h4>
                <p className="text-sm">Các bài đăng đã lên lịch sẽ xuất hiện ở đây.</p>
              </div>
            ) : (
              unpublishedPosts.map((post) => {
                const accountName = getAccountNameBySocialId(post.social_account_id, post.platform);
                const isExpanded = expandedPosts.has(post.id);
                const postTypeDisplayName = getPostTypeDisplayName(post.platform_type);
                const isProcessing = isPostProcessing(post);
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    accountName={accountName}
                    isExpanded={isExpanded}
                    isProcessing={isProcessing}
                    postTypeDisplayName={postTypeDisplayName}
                    showPostUrl={false}
                    onToggleExpansion={toggleContentExpansion}
                    onEdit={handleEditClick}
                    onDelete={handleDeletePost}
                    onRetry={handleRetryPost}
                  />
                );
              })
            )}
          </div>
        )}

        {activeTab === 'published' && (
          <div className="max-h-[600px] overflow-y-auto space-y-4">
            {isLoadingPublished ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tải bài đăng đã đăng...</p>
              </div>
            ) : publishedPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium mb-2">Chưa có bài đăng nào</h4>
                <p className="text-sm">Các bài đăng đã xuất bản sẽ xuất hiện ở đây.</p>
              </div>
            ) : (
              publishedPosts.map((post) => {
                 const accountName = getAccountNameBySocialId(post.social_account_id, post.platform);
                 const isExpanded = expandedPosts.has(post.id);
                 const postTypeDisplayName = getPostTypeDisplayName(post.platform_type);
                 const isProcessing = isPostProcessing(post);
                 return (
                  <PostCard
                    key={post.id}
                    post={post}
                    accountName={accountName}
                    isExpanded={isExpanded}
                    isProcessing={isProcessing}
                    postTypeDisplayName={postTypeDisplayName}
                    showPostUrl={true}
                    onToggleExpansion={toggleContentExpansion}
                    onEdit={handleEditClick}
                    onDelete={handleDeletePost}
                    onRetry={handleRetryPost}
                  />
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chỉnh sửa bài đăng</h3>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {editingPost.platform === 'youtube' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={e => setEditedTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                    <textarea
                      value={editedContent}
                      onChange={e => setEditedContent(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                  <textarea
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian đăng bài</label>
                <input
                  type="datetime-local"
                  value={editedScheduledAt}
                  onChange={e => setEditedScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {modalError}
              </div>
            )}

            <div className="flex justify-end items-center mt-6 gap-3">
              <button
                onClick={handleCancelEdit}
                className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdatePost}
                disabled={isUpdating}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};