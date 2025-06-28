import { useState, useEffect } from 'react';
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
  const [youtubeAccounts, setYoutubeAccounts] = useState<YouTubeAccount[]>([]);
  const [accountMappings, setAccountMappings] = useState<AccountMapping[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);

  const { user, isAuthenticated } = useAuth();

  // Get API base URL from environment variables with fallback
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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

    // Add Facebook & Instagram accounts from server
    savedAccounts.forEach((savedAccount) => {
      const profileInfo = {
        id: savedAccount.account_id,
        displayName: savedAccount.account_name,
        username: savedAccount.account_name,
        platform: savedAccount.platform,
        verified: false,
        followers: 0
      };

      const targetPlatformId = savedAccount.platform === 'facebook' ? 'facebook' : 'instagram';
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
        
        // Store mapping for API calls
        newMappings.push({
          platformAccountId: platformAccountId,
          socialAccountId: savedAccount.id, // Use the 'id' field for FB/IG
          platform: targetPlatformId
        });
      }
    });

    // Add YouTube accounts from server
    youtubeAccounts.forEach((ytAccount) => {
      const platform = platforms.find(p => p.id === 'youtube');
      if (platform) {
        const platformAccountId = `server_yt_${ytAccount.account_id}`;
        const profileInfo = {
          id: ytAccount.channel_id,
          displayName: ytAccount.channel_name,
          username: ytAccount.channel_name,
          platform: 'youtube',
          verified: false,
          followers: 0
        };

        const newAccount: PlatformAccount = {
          id: platformAccountId,
          platformId: 'youtube',
          platformName: platform.name,
          accountName: ytAccount.channel_name,
          accessToken: 'server_youtube_token',
          connected: true,
          profileInfo,
          createdAt: new Date(ytAccount.connected_at),
          color: platform.color,
          gradient: platform.gradient,
          icon: platform.icon,
          lastPost: new Date().toISOString()
        };

        syncedAccounts.push(newAccount);
        
        // Store mapping for API calls - use account_id for YouTube
        newMappings.push({
          platformAccountId: platformAccountId,
          socialAccountId: ytAccount.account_id, // Use account_id for YouTube
          platform: 'youtube'
        });
      }
    });

    // Update accounts and mappings
    setAccounts(syncedAccounts);
    setAccountMappings(newMappings);

    console.log(`✅ Synced ${syncedAccounts.length} server accounts (${savedAccounts.length} FB/IG + ${youtubeAccounts.length} YT)`);
    console.log('📋 Account mappings:', newMappings);
  };

  // Load Facebook & Instagram accounts from backend
  const loadSavedAccounts = async () => {
    if (!isAuthenticated || !user?.token) {
      console.log('User not authenticated, skipping account load');
      return;
    }

    setIsLoadingAccounts(true);
    const apiBaseUrl = getApiBaseUrl();

    try {
      // Load Facebook accounts
      const fbResponse = await fetch(`${apiBaseUrl}/api/v1/facebook/accounts/facebook`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      // Load Instagram accounts
      const igResponse = await fetch(`${apiBaseUrl}/api/v1/facebook/accounts/instagram`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      const allServerAccounts: SavedAccount[] = [];

      if (fbResponse.ok) {
        const fbAccounts: SavedAccount[] = await fbResponse.json();
        allServerAccounts.push(...fbAccounts);
        console.log('✅ Loaded Facebook accounts:', fbAccounts);
      } else {
        console.warn('⚠️ Failed to load Facebook accounts:', fbResponse.status);
      }

      if (igResponse.ok) {
        const igAccounts: SavedAccount[] = await igResponse.json();
        allServerAccounts.push(...igAccounts);
        console.log('✅ Loaded Instagram accounts:', igAccounts);
      } else {
        console.warn('⚠️ Failed to load Instagram accounts:', igResponse.status);
      }

      setSavedAccounts(allServerAccounts);

    } catch (error) {
      console.error('❌ Error loading saved accounts:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Load YouTube accounts separately
  const loadYoutubeAccounts = async () => {
    if (!isAuthenticated || !user?.token) {
      console.log('User not authenticated, skipping YouTube account load');
      return;
    }

    setIsLoadingYoutube(true);
    const apiBaseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/youtube/accounts`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const accounts = data.data?.accounts || [];
        setYoutubeAccounts(accounts);
        console.log('✅ Loaded YouTube accounts:', accounts);
      } else {
        console.warn('⚠️ Failed to load YouTube accounts:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading YouTube accounts:', error);
    } finally {
      setIsLoadingYoutube(false);
    }
  };

  // Sync accounts whenever savedAccounts or youtubeAccounts change
  useEffect(() => {
    syncServerAccounts();
  }, [savedAccounts, youtubeAccounts]);

  // Auto-load accounts when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.token) {
      loadSavedAccounts();
      loadYoutubeAccounts();
    } else {
      // Clear accounts when not authenticated
      setAccounts([]);
      setSavedAccounts([]);
      setYoutubeAccounts([]);
      setAccountMappings([]);
    }
  }, [isAuthenticated, user?.token]);

  const getAccountsByPlatform = (platformId: string) => {
    return accounts.filter(account => account.platformId === platformId);
  };

  const getSavedAccountsByPlatform = (platformId: string) => {
    if (platformId === 'youtube') {
      return youtubeAccounts;
    }
    
    return savedAccounts.filter(account => {
      if (platformId === 'facebook') {
        return account.platform === 'facebook';
      } else if (platformId === 'instagram') {
        return account.platform === 'instagram';
      }
      return false;
    });
  };

  const getConnectedAccounts = () => {
    return accounts.filter(account => account.connected);
  };

  // Clear all data (useful for debugging)
  const clearAllData = () => {
    setAccounts([]);
    setSavedAccounts([]);
    setYoutubeAccounts([]);
    setAccountMappings([]);
    console.log('🗑️ Cleared all account data');
  };

  return {
    platforms,
    accounts,
    savedAccounts,
    youtubeAccounts,
    accountMappings,
    isLoadingAccounts,
    isLoadingYoutube,
    getAccountsByPlatform,
    getSavedAccountsByPlatform,
    getConnectedAccounts,
    getSocialAccountId,
    loadSavedAccounts,
    loadYoutubeAccounts,
    clearAllData
  };
};