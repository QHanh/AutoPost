import React from 'react';
import { PlatformCard } from '../components/PlatformCard';
import { ApiKeyManager } from '../components/ApiKeyManager';
import { Platform, PlatformAccount } from '../types/platform';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AccountsPageProps {
  platforms: Platform[];
  accounts: PlatformAccount[];
  savedAccounts: any[];
  isLoadingAccounts: boolean;
  getAccountsByPlatform: (platformId: string) => PlatformAccount[];
  getSavedAccountsByPlatform: (platformId: string) => any[];
  onReloadAccounts: (platformId?: string) => void;
  onAccountDeleted: (socialAccountId: string) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  platforms,
  accounts,
  savedAccounts,
  isLoadingAccounts,
  getAccountsByPlatform,
  getSavedAccountsByPlatform,
  onReloadAccounts,
  onAccountDeleted,
}) => {
  const connectedAccounts = accounts.filter(acc => acc.connected);
  const totalServerAccounts = savedAccounts.length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Quản Lý Tài Khoản & API Keys
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Kết nối các tài khoản mạng xã hội và cấu hình API keys của bạn.
        </p>
      </div>

      {/* Stats Overview */}
      {/* <section className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalServerAccounts}</div>
              <div className="text-sm text-gray-600">Tài khoản đã kết nối</div>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{connectedAccounts.length}</div>
              <div className="text-sm text-gray-600">Đang hoạt động</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Getting Started Guide */}
      {totalServerAccounts === 0 && connectedAccounts.length === 0 && (
        <section className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8 border border-yellow-200 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Bắt Đầu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="flex flex-col h-full p-4 bg-white rounded-lg shadow-sm border border-yellow-100">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-sm">1</span>
                </div>
                Cấu Hình API Keys
              </h4>
              <p className="text-sm text-gray-600">
                Cấu hình API Key Gemini và OpenAI để tạo nội dung AI.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col h-full p-4 bg-white rounded-lg shadow-sm border border-yellow-100">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-sm">2</span>
                </div>
                Kết Nối Các Nền Tảng
              </h4>
              <p className="text-sm text-gray-600">
                Kết nối tài khoản mạng xã hội của bạn.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col h-full p-4 bg-white rounded-lg shadow-sm border border-yellow-100">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-sm">3</span>
                </div>
                Bắt Đầu Đăng Bài
              </h4>
              <p className="text-sm text-gray-600">
                Sử dụng các công cụ đăng bài và tạo nội dung AI.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* API Key Management */}
      <section className="mb-8">
        <ApiKeyManager />
      </section>

      {/* Platform Connections */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Kết Nối Các Nền Tảng
          </h3>
          <div className="text-sm text-gray-600">
            {totalServerAccounts} tài khoản từ server
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              accounts={getAccountsByPlatform(platform.id)}
              savedAccounts={getSavedAccountsByPlatform(platform.id)}
              isLoadingAccounts={isLoadingAccounts}
              onReloadAccounts={() => onReloadAccounts(platform.id)}
              onAccountDeleted={onAccountDeleted}
            />
          ))}
        </div>
      </section>

      {/* API Information */}
      <section className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Tích Hợp API Mới Nhất</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📘</span>
              <div>
                <h4 className="font-semibold">Facebook API v23.0</h4>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Latest</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Tăng cường chức năng đăng bài trang với khả năng xử lý phương tiện được cải thiện
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-pink-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📷</span>
              <div>
                <h4 className="font-semibold">Instagram Integration</h4>
                <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">Auto-Detect</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Tự động phát hiện và kết nối với tài khoản Instagram của bạn khi đăng nhập Facebook
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📺</span>
              <div>
                <h4 className="font-semibold">YouTube Data API v3</h4>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">OAuth 2.0</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Tích hợp OAuth 2.0 bảo mật cho quản lý kênh YouTube và tải lên video
            </p>
          </div>
        </div>
      </section>

      {/* Account Management Tips */}
      {(totalServerAccounts > 0 || connectedAccounts.length > 0) && (
        <section className="bg-white rounded-xl p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Account Management Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-gray-900">Server-Only Accounts</h4>
                  <p className="text-sm text-gray-600">
                    All accounts are now managed through our secure backend database with OAuth integration
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-gray-900">Auto-Reload on Login</h4>
                  <p className="text-sm text-gray-600">
                    Accounts are automatically loaded from server when you login or visit the page
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-gray-900">AI Content Generation</h4>
                  <p className="text-sm text-gray-600">
                    Configure API keys to unlock AI-powered content creation with multiple platform support
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-gray-900">Secure OAuth</h4>
                  <p className="text-sm text-gray-600">
                    All platforms use secure OAuth 2.0 authentication with automatic token management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};