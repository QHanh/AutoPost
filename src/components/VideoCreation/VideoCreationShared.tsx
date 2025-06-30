import React from 'react';
import { Loader2, X, Maximize2 } from 'lucide-react';

// Shared interfaces
export interface VideoProgress {
  taskId: string;
  progress: number;
  state: number;
  isCreating: boolean;
}

export interface CompletedVideo {
  url: string;
  index: number;
  taskId: string;
}

// Global video progress manager
class VideoProgressManager {
  private static instance: VideoProgressManager;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(progress: VideoProgress) => void> = new Set();
  private videoListeners: Set<(videos: CompletedVideo[]) => void> = new Set();
  private currentProgress: VideoProgress = {
    taskId: '',
    progress: 0,
    state: 0,
    isCreating: false
  };
  private completedVideos: CompletedVideo[] = [];

  static getInstance(): VideoProgressManager {
    if (!VideoProgressManager.instance) {
      VideoProgressManager.instance = new VideoProgressManager();
    }
    return VideoProgressManager.instance;
  }

  constructor() {
    // Load saved state on initialization
    this.loadState();
    
    // Resume polling if there's an active task
    if (this.currentProgress.isCreating && this.currentProgress.taskId) {
      this.startPolling();
    }
  }

  private loadState() {
    try {
      const savedProgress = localStorage.getItem('videoProgress');
      const savedVideos = localStorage.getItem('completedVideos');
      
      if (savedProgress) {
        this.currentProgress = JSON.parse(savedProgress);
      }
      
      if (savedVideos) {
        this.completedVideos = JSON.parse(savedVideos);
      }
    } catch (error) {
      console.error('Error loading video progress state:', error);
    }
  }

  private saveState() {
    try {
      localStorage.setItem('videoProgress', JSON.stringify(this.currentProgress));
      localStorage.setItem('completedVideos', JSON.stringify(this.completedVideos));
    } catch (error) {
      console.error('Error saving video progress state:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentProgress));
    this.saveState();
  }

  private notifyVideoListeners() {
    this.videoListeners.forEach(listener => listener(this.completedVideos));
    this.saveState();
  }

  subscribe(listener: (progress: VideoProgress) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.currentProgress);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeToVideos(listener: (videos: CompletedVideo[]) => void): () => void {
    this.videoListeners.add(listener);
    // Immediately notify with current videos
    listener(this.completedVideos);
    
    return () => {
      this.videoListeners.delete(listener);
    };
  }

  private async checkVideoProgress() {
    if (!this.currentProgress.taskId) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_VIDEO_URL;
      const response = await fetch(`${apiBaseUrl}/api/v1/tasks/${this.currentProgress.taskId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const taskData = data.data;
        
        this.currentProgress = {
          ...this.currentProgress,
          progress: taskData.progress || 0,
          state: taskData.state || 0
        };

        this.notifyListeners();

        // Check if video is completed (progress = 100 and state = 1)
        if (taskData.progress === 100 && taskData.state === 1) {
          this.stopPolling();
          await this.downloadCompletedVideos(taskData);
          
          this.currentProgress.isCreating = false;
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.error('Error checking video progress:', error);
    }
  }

  private async downloadCompletedVideos(taskData: any, taskId: string = this.currentProgress.taskId) {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_VIDEO_URL;
      const videoSources = taskData.videos || taskData.combined_videos || [];
      const downloadedVideos: CompletedVideo[] = [];

      for (let i = 0; i < videoSources.length; i++) {
        // Use a fixed filename for downloads
        const filename = 'final-1.mp4';
        
        const downloadResponse = await fetch(`${apiBaseUrl}/api/v1/download/${this.currentProgress.taskId}/${filename}`, {
          method: 'GET'
        });

        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob();
          //const videoUrl = URL.createObjectURL(blob);
          const videoUrl = `${apiBaseUrl}/api/v1/download/${taskId}/final-1.mp4`;

          downloadedVideos.push({
            url: videoUrl,
            index: i + 1,
            taskId: this.currentProgress.taskId
          });
        }
      }

      this.completedVideos = downloadedVideos;
      this.notifyVideoListeners();
    } catch (error) {
      console.error('Error downloading videos:', error);
    }
  }

  private startPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.checkVideoProgress();
    }, 5000);
    
    console.log('🔄 Started global video progress polling');
  }

  private stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('⏹️ Stopped global video progress polling');
  }

  startVideoCreation(taskId: string) {
    this.currentProgress = {
      taskId,
      progress: 0,
      state: 0,
      isCreating: true
    };
    
    // this.completedVideos = [];
    this.notifyListeners();
    this.notifyVideoListeners();
    this.startPolling();
    
    console.log('🚀 Started video creation with global manager:', taskId);
  }

  stopVideoCreation() {
    this.stopPolling();
    this.currentProgress = {
      ...this.currentProgress,
      isCreating: false
    };
    this.notifyListeners();

    console.log('🛑 Video creation stopped by user');
  }


  resetVideoCreation() {
    this.stopPolling();
    this.currentProgress = {
      taskId: '',
      progress: 0,
      state: 0,
      isCreating: false
    };
    this.completedVideos = [];
    
    // Clear localStorage
    localStorage.removeItem('videoProgress');
    localStorage.removeItem('completedVideos');
    
    this.notifyListeners();
    this.notifyVideoListeners();
    
    console.log('🗑️ Video creation reset');
  }

  getCurrentProgress(): VideoProgress {
    return this.currentProgress;
  }

  getCompletedVideos(): CompletedVideo[] {
    return this.completedVideos;
  }
}

// Shared API base URL function
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_VIDEO_URL;
};

// Hook to use the global video progress manager
export const useVideoProgress = () => {
  const [videoProgress, setVideoProgress] = React.useState<VideoProgress>(() => {
    const manager = VideoProgressManager.getInstance();
    return manager.getCurrentProgress();
  });

  const [completedVideos, setCompletedVideos] = React.useState<CompletedVideo[]>(() => {
    const manager = VideoProgressManager.getInstance();
    return manager.getCompletedVideos();
  });

  React.useEffect(() => {
    const manager = VideoProgressManager.getInstance();
    
    const unsubscribeProgress = manager.subscribe(setVideoProgress);
    const unsubscribeVideos = manager.subscribeToVideos(setCompletedVideos);
    
    return () => {
      unsubscribeProgress();
      unsubscribeVideos();
    };
  }, []);

  const startVideoCreation = React.useCallback((taskId: string) => {
    const manager = VideoProgressManager.getInstance();
    manager.startVideoCreation(taskId);
  }, []);

  const stopVideoCreation = React.useCallback(() => {
    const manager = VideoProgressManager.getInstance();
    manager.stopVideoCreation();
  }, []);

  const resetVideoCreation = React.useCallback(() => {
    const manager = VideoProgressManager.getInstance();
    manager.resetVideoCreation();
  }, []);

  return {
    videoProgress,
    completedVideos,
    startVideoCreation,
    stopVideoCreation,
    resetVideoCreation
  };
};

// Enhanced Progress Display Component with Stop Button
export const VideoProgressDisplay: React.FC<{ 
  progress: VideoProgress;
  onStop?: () => void;
}> = ({ progress, onStop }) => {
  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  if (!progress.isCreating) return null;

  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={20} />
          <h4 className="font-medium text-blue-900">Đang tạo video...</h4>
        </div>
        
        {/* Stop Button */}
        {/* {onStop && (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            title="Dừng tạo video"
          >
            <X size={16} />
            Dừng
          </button>
        )} */}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-blue-700">
          <span>Tiến trình:</span>
          <span>{progress.progress}%</span>
        </div>
        
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-blue-600">
          Task ID: {progress.taskId}
        </div>
        
        <div className="text-xs text-blue-600">
          💡 Tiến trình sẽ được lưu tự động, bạn có thể thoát trang và quay lại sau
        </div>
        
        {onStop && (
          <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2 mt-2">
            ⚠️ Nếu gặp lỗi hoặc muốn dừng, click nút "Dừng" ở trên
          </div>
        )}
      </div>
    </div>
  );
};

// Shared Video Gallery Component with improved video display
export const VideoGallery: React.FC<{ videos: CompletedVideo[] }> = ({ videos }) => {
  if (videos.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Video đã tạo thành công:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.index} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <video
              src={video.url}
              controls
              className="w-full max-h-[80vh] object-contain bg-black"
              preload="metadata"
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-2">Video {video.index}</h4>
              <a
                href={video.url}
                download={`video-${video.index}.mp4`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Tải xuống
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Color Picker Component
export const ColorPicker: React.FC<{ 
  color: string; 
  onChange: (color: string) => void; 
  show: boolean; 
  onToggle: () => void; 
}> = ({ color, onChange, show, onToggle }) => (
  <div className="relative">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="w-10 h-8 rounded border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow"
        style={{ backgroundColor: color }}
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
        placeholder="#FFFFFF"
      />
    </div>
    
    {show && (
      <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3">
        <div className="mb-3">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8 rounded border border-gray-300"
          />
        </div>
        <button
          onClick={onToggle}
          className="w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Đóng
        </button>
      </div>
    )}
  </div>
);

// Expandable Textarea Component
export const ExpandableTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  rows?: number;
}> = ({ value, onChange, placeholder, label, rows = 6 }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <>
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
            title="Mở rộng để chỉnh sửa"
          >
            <Maximize2 size={14} />
            Mở rộng
          </button>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
        />
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{label}</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-6">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-full min-h-[400px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsExpanded(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};