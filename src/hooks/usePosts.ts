import { useState, useEffect } from 'react';
import { Post } from '../types/platform';
import { useAuth } from './useAuth';

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

export const usePosts = () => {
  const [publishedPosts, setPublishedPosts] = useState<BackendPost[]>([]);
  const [unpublishedPosts, setUnpublishedPosts] = useState<BackendPost[]>([]);
  const [isLoadingPublished, setIsLoadingPublished] = useState(false);
  const [isLoadingUnpublished, setIsLoadingUnpublished] = useState(false);

  const { user, isAuthenticated } = useAuth();

  // Get API base URL from environment variables with fallback
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  };

  // Load published posts from backend
  const loadPublishedPosts = async () => {
    if (!isAuthenticated || !user?.token) {
      console.log('User not authenticated, skipping published posts load');
      return;
    }

    setIsLoadingPublished(true);
    const apiBaseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/scheduled-videos/platform-posts/published`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const posts: BackendPost[] = await response.json();
        setPublishedPosts(posts);
        console.log('✅ Loaded published posts:', posts);
      } else {
        console.warn('⚠️ Failed to load published posts:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading published posts:', error);
    } finally {
      setIsLoadingPublished(false);
    }
  };

  // Load unpublished posts from backend
  const loadUnpublishedPosts = async () => {
    if (!isAuthenticated || !user?.token) {
      console.log('User not authenticated, skipping unpublished posts load');
      return;
    }

    setIsLoadingUnpublished(true);
    const apiBaseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/scheduled-videos/platform-posts/unpublished`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const posts: BackendPost[] = await response.json();
        setUnpublishedPosts(posts);
        console.log('✅ Loaded unpublished posts:', posts);
      } else {
        console.warn('⚠️ Failed to load unpublished posts:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading unpublished posts:', error);
    } finally {
      setIsLoadingUnpublished(false);
    }
  };

  // Auto-load posts when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.token) {
      loadPublishedPosts();
      loadUnpublishedPosts();
    } else {
      // Clear posts when not authenticated
      setPublishedPosts([]);
      setUnpublishedPosts([]);
    }
  }, [isAuthenticated, user?.token]);

  // Refresh all posts
  const refreshPosts = async () => {
    await Promise.all([loadPublishedPosts(), loadUnpublishedPosts()]);
  };

  return {
    publishedPosts,
    unpublishedPosts,
    isLoadingPublished,
    isLoadingUnpublished,
    loadPublishedPosts,
    loadUnpublishedPosts,
    refreshPosts
  };
};