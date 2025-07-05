import { useState, useEffect, useCallback } from 'react';
//import { Post } from '../types/platform';
import { useAuth } from './useAuth';

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
}

export const usePosts = () => {
  const [publishedPosts, setPublishedPosts] = useState<BackendPost[]>([]);
  const [unpublishedPosts, setUnpublishedPosts] = useState<BackendPost[]>([]);
  const [isLoadingPublished, setIsLoadingPublished] = useState(false);
  const [isLoadingUnpublished, setIsLoadingUnpublished] = useState(false);

  const { user, isAuthenticated } = useAuth();

  // Get API base URL from environment variables with fallback
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL;
  };

  // Load published posts from backend
  const loadPublishedPosts = useCallback(async () => {
    if (!isAuthenticated || !user?.token) {
      console.log('User not authenticated, skipping published posts load');
      return;
    }

    setIsLoadingPublished(true);
    const apiBaseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/scheduled-videos/platform-posts/published?skip=0&limit=100`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const posts: BackendPost[] = await response.json();
        setPublishedPosts(posts);
        console.log('✅ Loaded published posts raw API response:', posts);
      } else {
        console.warn('⚠️ Failed to load published posts:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading published posts:', error);
    } finally {
      setIsLoadingPublished(false);
    }
  }, [isAuthenticated, user?.token]);

  // Load unpublished posts from backend
  const loadUnpublishedPosts = useCallback(async () => {
    if (!isAuthenticated || !user?.token) {
      console.log('User not authenticated, skipping unpublished posts load');
      return;
    }

    setIsLoadingUnpublished(true);
    const apiBaseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/scheduled-videos/platform-posts/unpublished?skip=0&limit=100`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const posts: BackendPost[] = await response.json();
        setUnpublishedPosts(posts);
        console.log('✅ Loaded unpublished posts raw API response:', posts);
      } else {
        console.warn('⚠️ Failed to load unpublished posts:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading unpublished posts:', error);
    } finally {
      setIsLoadingUnpublished(false);
    }
  }, [isAuthenticated, user?.token]);

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
  }, [isAuthenticated, user?.token, loadPublishedPosts, loadUnpublishedPosts]);

  // Refresh all posts
  const refreshPosts = async () => {
    await Promise.all([loadPublishedPosts(), loadUnpublishedPosts()]);
  };

  const updatePost = async (postId: string, data: { preview_content: string, scheduled_at: string }) => {
    if (!isAuthenticated || !user?.token) {
      throw new Error('User not authenticated.');
    }
    const apiBaseUrl = getApiBaseUrl();
    const formData = new FormData();
    formData.append('preview_content', data.preview_content);
    formData.append('scheduled_at', data.scheduled_at);

    const response = await fetch(`${apiBaseUrl}/api/v1/scheduled-videos/platform-posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.token}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update post.');
    }
    return response.json();
  };

  const deletePost = async (postId: string) => {
    if (!isAuthenticated || !user?.token) {
      throw new Error('User not authenticated.');
    }
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/v1/scheduled-videos/platform-posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete post.');
    }
  };

  return {
    publishedPosts,
    unpublishedPosts,
    isLoadingPublished,
    isLoadingUnpublished,
    refreshPosts,
    updatePost,
    deletePost
  };
};