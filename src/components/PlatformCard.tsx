import React, { useState } from 'react';
import { Platform, PlatformAccount } from '../types/platform';
import { CheckCircle, AlertCircle, Zap, Plus, RefreshCw, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SavedAccount {
  id: string;
  platform: string;
  account_name: string;
  account_id: string;
  is_active: boolean;
  created_at: string;
}

interface YouTubeAccount {
  account_id: string;
  channel_id: string;
  channel_name: string;
  is_active: boolean;
  is_token_valid: boolean;
  token_expires_at: string;
  connected_at: string;
  last_updated: string;
}

interface PlatformCardProps {
  platform: Platform;
  accounts: PlatformAccount[];
  savedAccounts: SavedAccount[] | YouTubeAccount[];
  isLoadingAccounts: boolean;
  onReloadAccounts: () => void;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  accounts,
  savedAccounts,
  isLoadingAccounts,
  onReloadAccounts
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const { user } = useAuth();
  const platformAccounts = accounts.filter(acc => acc.platformId === platform.id);

  // Get API base URL from environment variables with fallback
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL;
  };

  // 🔧 FIXED: Delete account function using correct social_account_id
  const handleDeleteAccount = async (account: SavedAccount | YouTubeAccount) => {
    if (!user?.token) {
      alert('Vui lòng đăng nhập để xóa tài khoản');
      return;
    }

    // 🔧 FIX: Use correct social_account_id for all platforms
    // For Facebook/Instagram: use 'id' field as social_account_id (from database)
    // For YouTube: use 'account_id' field as social_account_id
    const socialAccountId = 'channel_name' in account ? account.account_id : account.id;
    const accountName = 'channel_name' in account ? account.channel_name : account.account_name;

    const confirmMessage = `Bạn có chắc chắn muốn gỡ tài khoản "${accountName}"?\n\nHành động này không thể hoàn tác.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingAccountId(socialAccountId);

    try {
      const apiBaseUrl = getApiBaseUrl();
      let deleteUrl = '';
     
      deleteUrl = `${apiBaseUrl}/api/v1/facebook/${socialAccountId}`;

      console.log(`🗑️ Deleting account: ${accountName} (social_account_id: ${socialAccountId})`);
      console.log(`🌐 DELETE URL: ${deleteUrl}`);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        // Success - reload accounts
        setValidationStatus('valid');
        setValidationMessage(`Đã gỡ tài khoản "${accountName}" thành công!`);
        
        // Reload accounts after successful deletion
        await onReloadAccounts();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setValidationStatus('idle');
          setValidationMessage('');
        }, 300);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Không thể xóa tài khoản ${accountName}`);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setValidationStatus('invalid');
      setValidationMessage(error instanceof Error ? error.message : 'Lỗi khi xóa tài khoản');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setValidationStatus('idle');
        setValidationMessage('');
      }, 5000);
    } finally {
      setDeletingAccountId(null);
    }
  };

  const handlePlatformConnect = async () => {
    if (!user?.token) {
      alert(`Vui lòng đăng nhập để kết nối ${platform.name}`);
      return;
    }

    // Handle different platforms
    if (platform.id === 'facebook') {
      await handleFacebookConnect();
    } else if (platform.id === 'youtube') {
      await handleYouTubeConnect();
    } else {
      alert(`${platform.name} chưa được hỗ trợ kết nối tự động`);
    }
  };

  const handleFacebookConnect = async () => {
    setIsConnecting(true);
    setValidationStatus('validating');
    setValidationMessage('Đang khởi tạo kết nối Facebook...');

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/facebook/auth/facebook/init`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        setValidationStatus('invalid');
        setValidationMessage('Không thể kết nối đến server. Vui lòng thử lại.');
        setIsConnecting(false);
        return;
      }

      const data = await response.json();

      if (data.auth_url) {
        setValidationStatus('valid');
        setValidationMessage('Đang chuyển hướng đến Facebook...');

        const authWindow = window.open(
          data.auth_url,
          'facebook-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (authWindow) {
          setTimeout(() => {
            const checkClosed = setInterval(async () => {
              if (authWindow.closed) {
                clearInterval(checkClosed);
                setValidationStatus('validating');
                setValidationMessage('Đang tải lại danh sách tài khoản...');

                try {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  await onReloadAccounts();
                  setValidationStatus('valid');
                  setValidationMessage('Kết nối Facebook thành công!');

                  setTimeout(() => {
                    setValidationStatus('idle');
                    setValidationMessage('');
                  }, 3000);
                } catch (error) {
                  setValidationStatus('invalid');
                  setValidationMessage('Lỗi khi tải lại danh sách tài khoản.');
                  console.error('Error reloading accounts:', error);
                } finally {
                  setIsConnecting(false);
                }
              }
            }, 1000);
          }, 3000);
        } else {
          throw new Error('Không thể mở cửa sổ đăng nhập Facebook. Vui lòng kiểm tra popup blocker.');
        }

      } else {
        setValidationStatus('invalid');
        setValidationMessage(data.message || 'Không thể khởi tạo kết nối Facebook');
        setIsConnecting(false);
      }
    } catch (error) {
      setValidationStatus('invalid');
      console.error('Facebook auth error:', error);
      setValidationMessage('Lỗi kết nối. Vui lòng thử lại.');
      setIsConnecting(false);
    }
  };

  const handleYouTubeConnect = async () => {
    setIsConnecting(true);
    setValidationStatus('validating');
    setValidationMessage('Đang khởi tạo kết nối YouTube...');

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/youtube/connect`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        setValidationStatus('invalid');
        setValidationMessage('Không thể kết nối đến server. Vui lòng thử lại.');
        setIsConnecting(false);
        return;
      }

      const data = await response.json();

      if (data.data?.auth_url) {
        setValidationStatus('valid');
        setValidationMessage('Đang chuyển hướng đến Google...');
        
        const authWindow = window.open(
          data.data.auth_url,
          'youtube-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (authWindow) {
          const checkClosed = setInterval(async () => {
            if (authWindow.closed) {
              clearInterval(checkClosed);
              setValidationStatus('validating');
              setValidationMessage('Đang tải lại danh sách kênh YouTube...');
              
              try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await onReloadAccounts();
                setValidationStatus('valid');
                setValidationMessage('Kết nối YouTube thành công!');
                
                setTimeout(() => {
                  setValidationStatus('idle');
                  setValidationMessage('');
                }, 3000);
              } catch (error) {
                setValidationStatus('invalid');
                setValidationMessage('Lỗi khi tải lại danh sách kênh.');
                console.error('Error reloading YouTube accounts:', error);
              } finally {
                setIsConnecting(false);
              }
            }
          }, 1000);
        } else {
          throw new Error('Không thể mở cửa sổ đăng nhập Google. Vui lòng kiểm tra popup blocker.');
        }
      } else {
        setValidationStatus('invalid');
        setValidationMessage(data.message || 'Không thể khởi tạo kết nối YouTube');
        setIsConnecting(false);
      }
    } catch (error) {
      setValidationStatus('invalid');
      console.error('YouTube auth error:', error);
      setValidationMessage('Lỗi kết nối. Vui lòng thử lại.');
      setIsConnecting(false);
    }
  };

  const handleReloadAccounts = async () => {
    setValidationStatus('validating');
    setValidationMessage(`Đang tải lại danh sách ${platform.name}...`);
    
    try {
      await onReloadAccounts();
      setValidationStatus('valid');
      setValidationMessage('Tải lại thành công!');
      
      setTimeout(() => {
        setValidationStatus('idle');
        setValidationMessage('');
      }, 2000);
    } catch (error) {
      setValidationStatus('invalid');
      setValidationMessage(`Lỗi khi tải lại danh sách ${platform.name}.`);
      console.error('Error reloading accounts:', error);
    }
  };

  const getPlatformIcon = (platformType?: string) => {
    if (platformType === 'instagram' || platform.id === 'instagram') return '📷';
    if (platformType === 'youtube' || platform.id === 'youtube') return '📺';
    return '📘';
  };

  const getApiVersion = () => {
    if (platform.id === 'youtube') return 'v3';
    return 'v23.0';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Filter saved accounts for current platform
  const platformSavedAccounts = savedAccounts.filter(acc => {
    if (platform.id === 'facebook') {
      return 'platform' in acc && acc.platform === 'facebook';
    } else if (platform.id === 'instagram') {
      return 'platform' in acc && acc.platform === 'instagram';
    } else if (platform.id === 'youtube') {
      return 'channel_id' in acc; // YouTube accounts have channel_id
    }
    return false;
  });

  // Check if account is YouTube account
  const isYouTubeAccount = (acc: any): acc is YouTubeAccount => {
    return 'channel_id' in acc;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className={`h-2 bg-gradient-to-r ${platform.gradient}`}></div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getPlatformIcon()}</span>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {platform.name}
                <div className="flex items-center gap-1">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600 border border-green-200">
                    API {getApiVersion()}
                  </span>
                  <Zap size={12} className="text-green-500"/>
                </div>
              </h3>
              <p className={`text-sm flex items-center gap-1 ${(platformSavedAccounts.length > 0) ? 'text-green-600' : 'text-gray-500'}`}>
                {(platformSavedAccounts.length > 0) ? (
                  <>
                    <CheckCircle size={12} />
                    {platformSavedAccounts.length} tài khoản đã kết nối
                  </>
                ) : (
                  'Chưa có tài khoản nào'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Reload Button */}
            <button
              onClick={handleReloadAccounts}
              disabled={isLoadingAccounts}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Reload ${platform.name} accounts from server`}
            >
              {isLoadingAccounts ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              ) : (
                <RefreshCw size={16} />
              )}
            </button>

            {/* Add Account Button */}
            <button
              onClick={handlePlatformConnect}
              disabled={isConnecting}
              className="p-2 text-green-400 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Connect ${platform.name} Account`}
            >
              {isConnecting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
              ) : (
                <Plus size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingAccounts && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm">Đang tải danh sách {platform.name}...</span>
            </div>
          </div>
        )}

        {/* 🔥 ONLY Connected Accounts with Delete Functionality */}
        {platformSavedAccounts.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              Tài khoản đã kết nối ({platformSavedAccounts.length}):
            </h4>
            {platformSavedAccounts.map((account) => {
              // 🔧 FIXED: Use correct social_account_id for all platforms
              // Facebook/Instagram: use 'id' field (from database)
              // YouTube: use 'account_id' field
              const socialAccountId = isYouTubeAccount(account) ? account.account_id : account.id;
              const accountName = isYouTubeAccount(account) ? account.channel_name : account.account_name;
              const isDeleting = deletingAccountId === socialAccountId;
              
              return (
                <div
                  key={socialAccountId}
                  className={`relative rounded-lg p-3 border-2 ${
                    platform.id === 'facebook' 
                      ? 'bg-blue-50 border-blue-200' 
                      : platform.id === 'instagram'
                      ? 'bg-pink-50 border-pink-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {/* Delete Button - Top Right Corner */}
                  <button
                    onClick={() => handleDeleteAccount(account)}
                    disabled={isDeleting}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`Gỡ tài khoản ${accountName}`}
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>

                  <div className="flex items-start gap-3 pr-8">
                    <span className="text-2xl">{getPlatformIcon()}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {accountName}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          platform.id === 'facebook' 
                            ? 'bg-blue-100 text-blue-700' 
                            : platform.id === 'instagram'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {platform.id === 'facebook' ? 'Facebook Page' : 
                           platform.id === 'instagram' ? 'Instagram Business' : 'YouTube Channel'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        
                        {isYouTubeAccount(account) ? (
                          <>
                            <div>Channel ID: {account.channel_id}</div>
                            <div>Connected: {formatDate(account.connected_at)}</div>
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                              account.is_token_valid 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {account.is_token_valid ? '✓ Token hợp lệ' : '✗ Token hết hạn'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>Account ID: {account.account_id}</div>
                            <div>Created: {formatDate(account.created_at)}</div>
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                              account.is_active 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {account.is_active ? '✓ Hoạt động' : '○ Không hoạt động'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Platform OAuth Status */}
        {(platform.id === 'facebook' || platform.id === 'youtube') && validationStatus !== 'idle' && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div className={`text-xs flex items-center gap-1 ${
              validationStatus === 'valid' ? 'text-green-600' : 
              validationStatus === 'invalid' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {validationStatus === 'validating' && (
                <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
              )}
              {validationStatus === 'valid' && <CheckCircle size={12} />}
              {validationStatus === 'invalid' && <AlertCircle size={12} />}
              {validationMessage}
            </div>
          </div>
        )}

        {/* Platform Instructions - Simplified */}
        {platformSavedAccounts.length === 0 && validationStatus === 'idle' && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div className={`border-2 rounded-lg p-3 ${
              platform.id === 'facebook' 
                ? 'bg-blue-50 border-blue-200' 
                : platform.id === 'instagram'
                ? 'bg-pink-50 border-pink-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink size={14} className={
                  platform.id === 'facebook' ? 'text-blue-600' : 
                  platform.id === 'instagram' ? 'text-pink-600' : 'text-red-600'
                } />
                <h4 className={`font-medium text-sm ${
                  platform.id === 'facebook' ? 'text-blue-900' : 
                  platform.id === 'instagram' ? 'text-pink-900' : 'text-red-900'
                }`}>
                  Kết nối {platform.name}
                </h4>
              </div>
              <p className={`text-xs mb-3 ${
                platform.id === 'facebook' ? 'text-blue-700' : 
                platform.id === 'instagram' ? 'text-pink-700' : 'text-red-700'
              }`}>
                {platform.id === 'facebook' 
                  ? 'Click nút "+" để đăng nhập tài khoản Facebook của bạn. Hệ thống sẽ tự động phát hiện các Facebook Page và tài khoản Instagram liên kết.'
                  : platform.id === 'instagram'
                  ? 'Tài khoản Instagram sẽ được tự động phát hiện khi bạn kết nối Facebook.'
                  : 'Click nút "+" để kết nối YouTube channel qua Google OAuth. Hệ thống sẽ tự động lưu thông tin kênh.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Latest API Features Badge
        {platformSavedAccounts.length > 0 && (
          <div className={`bg-gradient-to-r border-2 rounded-lg p-2 ${
            platform.id === 'facebook' 
              ? 'from-green-50 to-blue-50 border-green-200' 
              : platform.id === 'instagram'
              ? 'from-pink-50 to-purple-50 border-pink-200'
              : 'from-red-50 to-orange-50 border-red-200'
          }`}>
            <div className={`flex items-center gap-1 text-xs font-medium mb-1 ${
              platform.id === 'facebook' ? 'text-green-700' : 
              platform.id === 'instagram' ? 'text-pink-700' : 'text-red-700'
            }`}>
              <Zap size={12} />
              Latest API Features
            </div>
            <div className={`text-xs ${
              platform.id === 'facebook' ? 'text-green-600' : 
              platform.id === 'instagram' ? 'text-pink-600' : 'text-red-600'
            }`}>
              {platform.id === 'facebook' 
                ? 'Enhanced media uploads, auto Instagram detection, and improved performance'
                : platform.id === 'instagram'
                ? 'Business account support, media optimization, and seamless Facebook integration'
                : 'OAuth 2.0 authentication, video uploads, and channel management with Google API'
              }
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};