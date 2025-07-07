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
  const [isLoadingPublished, setIsLoadingPublished] = useState(true);
  const [isLoadingUnpublished, setIsLoadingUnpublished] = useState(true);

  const { user, isAuthenticated } = useAuth();

  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL;
  };

  const refreshPosts = useCallback(async () => {
    if (!isAuthenticated || !user?.token) {
      console.log('User not authenticated, skipping posts load');
      setPublishedPosts([]);
      setUnpublishedPosts([]);
      setIsLoadingPublished(false);
      setIsLoadingUnpublished(false);
      return;
    }

    setIsLoadingPublished(true);
    setIsLoadingUnpublished(true);

    const apiBaseUrl = getApiBaseUrl();
    const headers = {
      'accept': 'application/json',
      'Authorization': `Bearer ${user.token}`
    };

    try {
      const [publishedResponse, unpublishedResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/scheduled-videos/platform-posts/published?skip=0&limit=100`, { headers }),
        fetch(`${apiBaseUrl}/api/v1/scheduled-videos/platform-posts/unpublished?skip=0&limit=100`, { headers })
      ]);

      let newPublishedPosts: BackendPost[] = [];
      if (publishedResponse.ok) {
        newPublishedPosts = await publishedResponse.json();
      } else {
        console.warn('⚠️ Failed to load published posts:', publishedResponse.status);
      }

      let newUnpublishedPosts: BackendPost[] = [];
      if (unpublishedResponse.ok) {
        newUnpublishedPosts = await unpublishedResponse.json();
      } else {
        console.warn('⚠️ Failed to load unpublished posts:', unpublishedResponse.status);
      }
      
      const publishedIds = new Set(newPublishedPosts.map(p => p.id));
      const filteredUnpublishedPosts = newUnpublishedPosts.filter(p => !publishedIds.has(p.id));

      setPublishedPosts(newPublishedPosts);
      setUnpublishedPosts(filteredUnpublishedPosts);

    } catch (error) {
      console.error('❌ Error refreshing posts:', error);
      setPublishedPosts([]);
      setUnpublishedPosts([]);
    } finally {
      setIsLoadingPublished(false);
      setIsLoadingUnpublished(false);
    }
  }, [isAuthenticated, user?.token]);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

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

  const retryPost = async (postId: string) => {
    if (!isAuthenticated || !user?.token) {
      throw new Error('User not authenticated.');
    }
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/v1/scheduled-videos/platform-posts/${postId}/retry`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'accept': 'application/json'
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to retry post.');
    }
    return response.json();
  };

  return {
    publishedPosts,
    unpublishedPosts,
    isLoadingPublished,
    isLoadingUnpublished,
    refreshPosts,
    updatePost,
    deletePost,
    retryPost
  };
};