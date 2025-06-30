import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface ApiKeys {
  gemini_api_key: string;
  openai_api_key: string;
}

export const useApiKeys = () => {
  const { user } = useAuth();
  const [savedApiKeys, setSavedApiKeys] = useState<ApiKeys>({
    gemini_api_key: '',
    openai_api_key: ''
  });
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);

  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL;
  };

  const loadApiKeys = async () => {
    if (!user?.token) return;

    setIsLoadingKeys(true);
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
        setSavedApiKeys(data);
      } else {
        console.warn('Failed to load API keys:', response.status);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, [user?.token]);

  return {
    savedApiKeys,
    setSavedApiKeys,
    isLoadingKeys,
    reloadApiKeys: loadApiKeys
  };
};
