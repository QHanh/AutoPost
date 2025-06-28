import { useEffect, useRef } from 'react';
import { Post } from '../types/platform';
import { apiService } from '../services/apiService';
import { validateMediaForPlatform } from '../utils/mediaUtils';

interface UseSchedulerProps {
  posts: Post[];
  updatePost: (postId: string, updates: Partial<Post>) => void;
}

export const useScheduler = ({ posts, updatePost }: UseSchedulerProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedPostsRef = useRef<Set<string>>(new Set());

  const processScheduledPost = async (post: Post) => {
    // Prevent duplicate processing
    if (processedPostsRef.current.has(post.id)) {
      return;
    }

    console.log(`🚀 Auto-posting scheduled post: ${post.id}`);
    processedPostsRef.current.add(post.id);
    
    // Update status to posting
    updatePost(post.id, { status: 'posting' });

    try {
      // Filter accounts based on media compatibility
      const compatibleAccounts = post.platforms.filter(account => {
        if (!post.media || post.media.length === 0) return true;
        const errors = validateMediaForPlatform(post.media, account.platformId);
        return errors.length === 0;
      });

      if (compatibleAccounts.length === 0) {
        updatePost(post.id, { 
          status: 'failed',
          error: 'No compatible accounts for media files'
        });
        return;
      }

      // Post to all compatible accounts
      const results = await Promise.allSettled(
        compatibleAccounts.map(account => 
          apiService.postToPlatform(account, post.content, post.media)
        )
      );

      const allSuccessful = results.every(result => 
        result.status === 'fulfilled' && result.value.success
      );

      // Collect post URLs
      const postUrls: { [key: string]: string } = {};
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success && result.value.data?.url) {
            postUrls[compatibleAccounts[index].id] = result.value.data.url;
          } else {
            errors.push(`${compatibleAccounts[index].accountName}: ${result.value.message}`);
          }
        } else {
          errors.push(`${compatibleAccounts[index].accountName}: Network error`);
        }
      });

      // Update post with results
      updatePost(post.id, { 
        status: allSuccessful ? 'posted' : 'failed',
        postUrls: Object.keys(postUrls).length > 0 ? postUrls : undefined,
        error: errors.length > 0 ? errors.join('; ') : undefined,
        postedAt: new Date()
      });

      console.log(`✅ Auto-post completed for ${post.id}: ${allSuccessful ? 'Success' : 'Partial/Failed'}`);

    } catch (error) {
      console.error(`❌ Auto-post failed for ${post.id}:`, error);
      updatePost(post.id, { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const checkScheduledPosts = () => {
    const now = new Date();
    const scheduledPosts = posts.filter(post => 
      post.status === 'scheduled' && 
      post.scheduledTime && 
      post.scheduledTime <= now &&
      !processedPostsRef.current.has(post.id)
    );

    if (scheduledPosts.length > 0) {
      console.log(`📅 Found ${scheduledPosts.length} posts ready to auto-post`);
      scheduledPosts.forEach(processScheduledPost);
    }
  };

  useEffect(() => {
    // Check every 30 seconds for scheduled posts
    intervalRef.current = setInterval(checkScheduledPosts, 30000);

    // Also check immediately when component mounts
    checkScheduledPosts();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [posts]);

  // Clean up processed posts that are no longer scheduled
  useEffect(() => {
    const currentScheduledIds = new Set(
      posts
        .filter(post => post.status === 'scheduled')
        .map(post => post.id)
    );

    // Remove processed IDs that are no longer scheduled
    processedPostsRef.current.forEach(id => {
      if (!currentScheduledIds.has(id)) {
        processedPostsRef.current.delete(id);
      }
    });
  }, [posts]);

  return {
    checkScheduledPosts,
    isSchedulerActive: intervalRef.current !== null
  };
};