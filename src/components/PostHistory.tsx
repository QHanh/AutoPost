import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, ExternalLink, Image as ImageIcon, Film, Play, AlertTriangle, RefreshCw, User, ChevronDown, ChevronUp } from 'lucide-react';
import { PlatformAccount } from '../types/platform';

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
  post_id: string;
  social_account_id: string;
  platform: string;
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
}

export const PostHistory: React.FC<PostHistoryProps> = ({
  publishedPosts,
  unpublishedPosts,
  isLoadingPublished,
  isLoadingUnpublished,
  accounts,
  getSocialAccountId,
  onRefreshPosts
}) => {
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'unpublished' | 'published'>('unpublished');

  // Find account name by social_account_id
  const getAccountNameBySocialId = (socialAccountId: string, platform: string): string => {
    // Find the platform account that matches this social_account_id
    const matchingAccount = accounts.find(account => {
      const accountSocialId = getSocialAccountId(account.id);
      return accountSocialId === socialAccountId && account.platformId === platform;
    });

    return matchingAccount?.accountName || `${platform} Account`;
  };

  const toggleContentExpansion = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
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
        return 'text-blue-600 bg-blue-50 border-blue-200';
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

  const isOverdue = (post: BackendPost) => {
    return post.status.toLowerCase() === 'ready' && 
           new Date(post.scheduled_at) < new Date();
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

  const PostCard: React.FC<{ post: BackendPost; showPostUrl?: boolean }> = ({ post, showPostUrl = false }) => {
    const accountName = getAccountNameBySocialId(post.social_account_id, post.platform);
    const isExpanded = expandedPosts.has(post.id);
    const shouldShowExpandButton = post.generated_content && post.generated_content.length > 200;
    
    return (
      <div
        className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
          isOverdue(post) ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
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
                    {getStatusIcon(post.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                      {getStatusText(post.status)}
                    </span>
                    {isOverdue(post) && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-100 border border-orange-200 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Quá hạn
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Name + Post URL Section */}
            <div className="mb-3 flex items-center gap-4">
              <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg w-fit flex items-center gap-2">
                <User size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Tài khoản:</span>
                <span className="text-sm text-gray-900 font-semibold">{accountName}</span>
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
                    onClick={() => toggleContentExpansion(post.id)}
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

            {/* Post URL */}
            {/* {showPostUrl && post.post_url && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md w-fit">
                <a
                  href={post.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline text-xs font-medium"
                >
                  <ExternalLink size={12} />
                  Xem bài
                </a>
              </div>
            )} */}

            {/* Footer - Timestamps */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
              <div>
                Tạo: {formatDateTime(post.created_at)}
              </div>
              <div className={isOverdue(post) ? 'text-orange-600 font-medium' : ''}>
                {post.status.toLowerCase() === 'published' ? 'Đã đăng: ' : 'Lên lịch: '}
                {formatDateTime(post.scheduled_at)}
              </div>
            </div>
          </div>

          {/* Right Column: Media Assets */}
          {post.media_assets && post.media_assets.length > 0 && (
            <div className="flex-shrink-0 w-48">
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <ImageIcon size={14} />
                Media Files ({post.media_assets.length})
              </h5>
              <div className="space-y-2">
                {post.media_assets.map((asset) => (
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
  };

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
              unpublishedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
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
              publishedPosts.map((post) => (
                <PostCard key={post.id} post={post} showPostUrl={true} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};