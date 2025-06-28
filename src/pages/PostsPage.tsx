import React from 'react';
import { PostComposer } from '../components/PostComposer';
import { PostHistory } from '../components/PostHistory';
import { PlatformAccount } from '../types/platform';

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
}

interface PostsPageProps {
  accounts: PlatformAccount[];
  publishedPosts: BackendPost[];
  unpublishedPosts: BackendPost[];
  isLoadingPublished: boolean;
  isLoadingUnpublished: boolean;
  getSocialAccountId: (platformAccountId: string) => string | null;
  onRefreshPosts: () => void;
}

export const PostsPage: React.FC<PostsPageProps> = ({
  accounts,
  publishedPosts,
  unpublishedPosts,
  isLoadingPublished,
  isLoadingUnpublished,
  getSocialAccountId,
  onRefreshPosts
}) => {
  const connectedAccounts = accounts.filter(acc => acc.connected);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Quản lý lịch đăng bài trên mạng xã hội
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Tạo nội dung hấp dẫn với AI, upload video và hình ảnh, và lên lịch đăng bài 
          trên tất cả các tài khoản mạng xã hội của bạn.
        </p>
      </div>

      {/* Post Composer - Full Width Row */}
      <section className="mb-8">
        <PostComposer
          accounts={accounts}
          getSocialAccountId={getSocialAccountId}
          onPostScheduled={onRefreshPosts}
        />
      </section>

      {/* Post History - Full Width Row with Scroll */}
      <section className="mb-8">
        <PostHistory
          publishedPosts={publishedPosts}
          unpublishedPosts={unpublishedPosts}
          isLoadingPublished={isLoadingPublished}
          isLoadingUnpublished={isLoadingUnpublished}
          accounts={accounts}
          getSocialAccountId={getSocialAccountId}
          onRefreshPosts={onRefreshPosts}
        />
      </section>

      {/* Enhanced Features Section */}
      <section className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Tính năng nâng cao với Backend API</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🤖</span>
            </div>
            <h4 className="font-semibold mb-2">AI Content Generation</h4>
            <p className="text-sm text-gray-600">
              Tạo nội dung với AI backend, tùy chỉnh theo nền tảng và loại bài đăng
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📅</span>
            </div>
            <h4 className="font-semibold mb-2">Backend Scheduling</h4>
            <p className="text-sm text-gray-600">
              Tất cả bài đăng được lên lịch và xử lý tự động bởi backend API
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔗</span>
            </div>
            <h4 className="font-semibold mb-2">Server Accounts</h4>
            <p className="text-sm text-gray-600">
              Tài khoản được quản lý tập trung từ database backend
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="font-semibold mb-2">Form Data API</h4>
            <p className="text-sm text-gray-600">
              Gửi media files và metadata qua multipart/form-data
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      {connectedAccounts.length === 0 && (
        <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Bắt đầu sử dụng</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔗</span>
              </div>
              <h4 className="font-semibold mb-2">1. Kết nối tài khoản</h4>
              <p className="text-sm text-gray-600">
                Đi đến trang Accounts để kết nối các nền tảng mạng xã hội
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✍️</span>
              </div>
              <h4 className="font-semibold mb-2">2. Tạo nội dung</h4>
              <p className="text-sm text-gray-600">
                Viết bài đăng, upload media, hoặc sử dụng AI để tạo nội dung hấp dẫn
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📅</span>
              </div>
              <h4 className="font-semibold mb-2">3. Lên lịch đăng bài</h4>
              <p className="text-sm text-gray-600">
                Chọn thời gian và lên lịch đăng bài trên tất cả tài khoản đã chọn
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};