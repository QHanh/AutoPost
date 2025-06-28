import React from 'react';
import { Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Post } from '../types/platform';

interface SchedulerStatusProps {
  posts: Post[];
  isSchedulerActive: boolean;
}

export const SchedulerStatus: React.FC<SchedulerStatusProps> = ({
  posts,
  isSchedulerActive
}) => {
  const scheduledPosts = posts.filter(post => post.status === 'scheduled');
  const nextPost = scheduledPosts
    .filter(post => post.scheduledTime)
    .sort((a, b) => a.scheduledTime!.getTime() - b.scheduledTime!.getTime())[0];

  const getTimeUntilNext = () => {
    if (!nextPost?.scheduledTime) return null;
    
    const now = new Date();
    const diff = nextPost.scheduledTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ready to post';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${
            isSchedulerActive ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {isSchedulerActive ? (
              <Zap className="text-green-600" size={16} />
            ) : (
              <Clock className="text-gray-500" size={16} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Auto Scheduler</h3>
            <p className="text-sm text-gray-600">
              {isSchedulerActive ? 'Active - Checking every 30 seconds' : 'Inactive'}
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isSchedulerActive 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isSchedulerActive ? 'RUNNING' : 'STOPPED'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="text-blue-500" size={14} />
          <span className="text-gray-600">Scheduled:</span>
          <span className="font-medium">{scheduledPosts.length}</span>
        </div>
        
        {nextPost && (
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={14} />
            <span className="text-gray-600">Next in:</span>
            <span className="font-medium text-green-600">
              {getTimeUntilNext()}
            </span>
          </div>
        )}
      </div>

      {nextPost && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Next scheduled post:</div>
          <div className="text-sm font-medium text-gray-900 truncate">
            {nextPost.content || 'Media post'}
          </div>
          <div className="text-xs text-gray-500">
            {nextPost.scheduledTime?.toLocaleString()} • {nextPost.platforms.length} platforms
          </div>
        </div>
      )}

      {scheduledPosts.length === 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200 text-center text-sm text-gray-500">
          No scheduled posts. Create a post and set a schedule time to see auto-posting in action.
        </div>
      )}
    </div>
  );
};