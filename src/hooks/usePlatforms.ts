import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PlatformAccount } from '../types/platform';
import { useAuth } from './useAuth';

const initialPlatforms: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    gradient: 'from-blue-600 to-blue-700',
    icon: 'facebook',
    connected: false,
    followers: 0
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    gradient: 'from-pink-500 via-red-500 to-yellow-500',
    icon: 'instagram',
    connected: false,
    followers: 0
  },
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    gradient: 'from-red-600 to-red-700',
    icon: 'youtube',
    connected: false,
    followers: 0
  }
];

interface SavedAccount {
  id: string;
  platform: string;
  account_name: string;
  account_id: string;
  is_active: boolean;
  created_at: string;
  thumbnail?: string;
}

// Store social account IDs for API calls
interface AccountMapping {
  platformAccountId: string;
  socialAccountId: string;
  platform: string;
}

export const usePlatforms = () => {
  const [platforms] = useState<Platform[]>(initialPlatforms);
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [accountMappings, setAccountMappings] = useState<AccountMapping[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Prevent multiple simultaneous API calls and infinite loops
  const isLoadingRef = useRef(false);
  const hasInitialLoadedRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

  const { user, isAuthenticated } = useAuth();

  // Get API base URL from environment variables with fallback
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL;
  };

  // Get social account ID for API calls
  const getSocialAccountId = (platformAccountId: string): string | null => {
    const mapping = accountMappings.find(m => m.platformAccountId === platformAccountId);
    return mapping?.socialAccountId || null;
  };

  // Sync all accounts from database
  const syncServerAccounts = () => {
    const syncedAccounts: PlatformAccount[] = [];
    const newMappings: AccountMapping[] = [];

    // Add Facebook, Instagram & YouTube accounts from server
    savedAccounts.forEach((savedAccount) => {
      const profileInfo = {
        id: savedAccount.account_id,
        displayName: savedAccount.account_name,
        username: savedAccount.account_name,
        platform: savedAccount.platform,
        verified: false,
        followers: 0,
        profilePicture: savedAccount.thumbnail,
      };

      const targetPlatformId = savedAccount.platform;
      const platform = platforms.find(p => p.id === targetPlatformId);

      if (platform) {
        const platformAccountId = `server_${savedAccount.id}`;
        const newAccount: PlatformAccount = {
          id: platformAccountId,
          platformId: targetPlatformId,
          platformName: platform.name,
          accountName: savedAccount.account_name,
          accessToken: 'server_account_token',
          connected: true,
          profileInfo,
          createdAt: new Date(savedAccount.created_at),
          color: platform.color,
          gradient: platform.gradient,
          icon: platform.icon,
          lastPost: new Date().toISOString()
        };

        syncedAccounts.push(newAccount);
        
        // Store mapping for API calls - use the 'id' field for all platforms
        newMappings.push({
          platformAccountId: platformAccountId,
          socialAccountId: savedAccount.id,
          platform: targetPlatformId
        });
      }
    });

    // Update accounts and mappings
    setAccounts(syncedAccounts);
    setAccountMappings(newMappings);

    console.log(`✅ Synced ${syncedAccounts.length} server accounts from 'savedAccounts'`);
    console.log('📋 Account mappings:', newMappings);
  };

  // Load ALL accounts from backend, with optional granular reload
  const loadSavedAccounts = useCallback(async (platformToReload?: string) => {
    if (!isAuthenticated || !user?.token) {
      console.log('🔒 User not authenticated, skipping account load');
      return;
    }

    // Prevent multiple simultaneous calls for initial load
    if (!platformToReload) {
      if (isLoadingRef.current) {
        console.log('🔄 Already loading accounts, skipping duplicate request...');
        return;
      }

      // Check if we've already loaded for this token (prevents re-loading on same session)
      if (hasInitialLoadedRef.current && lastTokenRef.current === user.token) {
        console.log('📋 Accounts already loaded for this session, skipping...');
        return;
      }

      isLoadingRef.current = true;
      setIsLoadingAccounts(true);
      setSavedAccounts([]);
      console.log('🚀 Starting initial account load...');
    }
    
    const apiBaseUrl = getApiBaseUrl();
    
    try {
        const platformsToFetch = platformToReload ? [platformToReload] : ['facebook', 'instagram', 'youtube'];
        
        const fetchPromises = platformsToFetch.map(async (platform) => {
            try {
                const response = await fetch(`${apiBaseUrl}/api/v1/facebook/accounts/${platform}`, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                
                if (response.ok) {
                    const newAccounts: SavedAccount[] = await response.json();
                    
                    if (platformToReload) {
                      // Granular update: remove old accounts for this platform and add the new ones.
                      setSavedAccounts(prevAccounts => [
                          ...prevAccounts.filter(acc => acc.platform !== platformToReload), 
                          ...newAccounts
                      ]);
                    } else {
                      // Full reload: just append new accounts (since state was cleared).
                      setSavedAccounts(prevAccounts => [...prevAccounts, ...newAccounts]);
                    }

                    console.log(`✅ Loaded ${platform} accounts (${newAccounts.length} items):`, newAccounts);
                } else {
                    console.warn(`⚠️ Failed to load ${platform} accounts:`, response.status);
                }
            } catch (platformError) {
                console.error(`❌ Error loading ${platform} accounts:`, platformError);
            }
        });

        // Đợi tất cả các yêu cầu song song hoàn tất
        await Promise.all(fetchPromises);

        // Mark as successfully loaded for initial load
        if (!platformToReload) {
          hasInitialLoadedRef.current = true;
          lastTokenRef.current = user.token;
          console.log('🎯 Initial account load completed successfully');
        }

    } catch (error) {
      console.error('❌ Error loading saved accounts:', error);
    } finally {
      // Only set global loading state on a full, initial load
      if (!platformToReload) {
        setIsLoadingAccounts(false);
        isLoadingRef.current = false;
      }
    }
  }, [isAuthenticated, user?.token]);

  // Sync accounts whenever savedAccounts change
  useEffect(() => {
    syncServerAccounts();
  }, [savedAccounts]);

  // Auto-load accounts when user is authenticated (optimized to prevent infinite loops)
  useEffect(() => {
    if (isAuthenticated && user?.token) {
      // Only load if we haven't loaded yet or if token has changed
      if (!hasInitialLoadedRef.current || lastTokenRef.current !== user.token) {
        console.log('🔐 Authentication detected, loading accounts...');
        loadSavedAccounts();
      } else {
        console.log('💾 Accounts already loaded for current session');
      }
    } else if (!isAuthenticated) {
      // Clear accounts when not authenticated
      console.log('🚪 User logged out, clearing account data');
      setAccounts([]);
      setSavedAccounts([]);
      setAccountMappings([]);
      hasInitialLoadedRef.current = false;
      lastTokenRef.current = null;
      isLoadingRef.current = false;
    }
  }, [isAuthenticated, user?.token, loadSavedAccounts]);

  const getAccountsByPlatform = (platformId: string) => {
    return accounts.filter(account => account.platformId === platformId);
  };

  const getSavedAccountsByPlatform = (platformId: string) => {
    return savedAccounts.filter(account => account.platform === platformId);
  };

  const getConnectedAccounts = () => {
    return accounts.filter(account => account.connected);
  };

  const removeAccountFromState = (socialAccountId: string) => {
    setSavedAccounts(prevAccounts => 
      prevAccounts.filter(account => account.id !== socialAccountId)
    );
    console.log(`✅ Optimistically removed account ${socialAccountId} from state.`);
  };

  // Force reload accounts (useful for debugging or manual refresh)
  const forceReloadAccounts = useCallback(() => {
    console.log('🔄 Forcing account reload...');
    hasInitialLoadedRef.current = false;
    lastTokenRef.current = null;
    isLoadingRef.current = false;
    loadSavedAccounts();
  }, [loadSavedAccounts]);

  // Clear all data (useful for debugging)
  const clearAllData = () => {
    setAccounts([]);
    setSavedAccounts([]);
    setAccountMappings([]);
    hasInitialLoadedRef.current = false;
    lastTokenRef.current = null;
    isLoadingRef.current = false;
    console.log('🗑️ Cleared all account data and reset flags');
  };

  return {
    platforms,
    accounts,
    savedAccounts,
    accountMappings,
    isLoadingAccounts,
    getAccountsByPlatform,
    getSavedAccountsByPlatform,
    getConnectedAccounts,
    getSocialAccountId,
    loadSavedAccounts,
    removeAccountFromState,
    forceReloadAccounts,
    clearAllData
  };
};