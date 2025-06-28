export const PLATFORM_LIMITS = {
  facebook: {
    maxImages: 10,
    maxVideos: 1,
    maxTotalMedia: 10,
    maxImageSize: 10, // MB
    maxVideoSize: 1024, // MB
    maxVideoDuration: 240, // minutes
    aspectRatios: ['1:1', '4:5', '16:9', '9:16'],
    videoFormats: ['mp4', 'mov', 'avi'],
    imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  },
  instagram: {
    maxImages: 10,
    maxVideos: 1,
    maxTotalMedia: 10,
    maxImageSize: 30, // MB
    maxVideoSize: 650, // MB
    maxVideoDuration: 60, // minutes
    aspectRatios: ['1:1', '4:5', '16:9', '9:16'],
    videoFormats: ['mp4', 'mov'],
    imageFormats: ['jpg', 'jpeg', 'png']
  },
  youtube: {
    maxImages: 1, // thumbnail
    maxVideos: 1,
    maxTotalMedia: 1,
    maxImageSize: 2, // MB
    maxVideoSize: 256000, // MB (256GB)
    maxVideoDuration: 720, // minutes (12 hours)
    aspectRatios: ['16:9', '4:3', '1:1', '9:16'],
    videoFormats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
    imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp']
  },
  twitter: {
    maxImages: 4,
    maxVideos: 1,
    maxTotalMedia: 4,
    maxImageSize: 5, // MB
    maxVideoSize: 512, // MB
    maxVideoDuration: 2.2, // minutes
    aspectRatios: ['16:9', '1:1', '4:5', '2:1'],
    videoFormats: ['mp4', 'mov'],
    imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  },
  linkedin: {
    maxImages: 9,
    maxVideos: 1,
    maxTotalMedia: 9,
    maxImageSize: 20, // MB
    maxVideoSize: 5120, // MB
    maxVideoDuration: 10, // minutes
    aspectRatios: ['1.91:1', '1:1', '4:5'],
    videoFormats: ['mp4', 'mov', 'wmv', 'flv', 'avi'],
    imageFormats: ['jpg', 'jpeg', 'png', 'gif']
  },
  tiktok: {
    maxImages: 35, // for slideshow
    maxVideos: 1,
    maxTotalMedia: 35,
    maxImageSize: 20, // MB
    maxVideoSize: 287, // MB
    maxVideoDuration: 10, // minutes
    aspectRatios: ['9:16', '1:1', '16:9'],
    videoFormats: ['mp4', 'mov', 'webm'],
    imageFormats: ['jpg', 'jpeg', 'png', 'webp']
  }
};

export const createMediaFile = (file: File): Promise<MediaFile> => {
  return new Promise((resolve, reject) => {
    const mediaFile: MediaFile = {
      id: crypto.randomUUID(),
      file,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url: URL.createObjectURL(file),
      size: file.size,
      name: file.name
    };

    if (mediaFile.type === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        mediaFile.duration = video.duration;
        
        // Create thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        video.currentTime = 1; // Get frame at 1 second
        video.onseeked = () => {
          ctx?.drawImage(video, 0, 0);
          mediaFile.thumbnail = canvas.toDataURL();
          resolve(mediaFile);
        };
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = mediaFile.url;
    } else {
      resolve(mediaFile);
    }
  });
};

export const validateMediaForPlatform = (media: MediaFile[], platformId: string): string[] => {
  const limits = PLATFORM_LIMITS[platformId];
  const errors: string[] = [];

  if (!limits) return errors;

  const images = media.filter(m => m.type === 'image');
  const videos = media.filter(m => m.type === 'video');

  // Check media count limits
  if (images.length > limits.maxImages) {
    errors.push(`${platformId} supports maximum ${limits.maxImages} images`);
  }
  
  if (videos.length > limits.maxVideos) {
    errors.push(`${platformId} supports maximum ${limits.maxVideos} videos`);
  }

  if (media.length > limits.maxTotalMedia) {
    errors.push(`${platformId} supports maximum ${limits.maxTotalMedia} media files`);
  }

  // Check file sizes and formats
  media.forEach(mediaFile => {
    const fileSizeMB = mediaFile.size / (1024 * 1024);
    const fileExtension = mediaFile.name.split('.').pop()?.toLowerCase() || '';

    if (mediaFile.type === 'image') {
      if (fileSizeMB > limits.maxImageSize) {
        errors.push(`Image "${mediaFile.name}" exceeds ${limits.maxImageSize}MB limit for ${platformId}`);
      }
      if (!limits.imageFormats.includes(fileExtension)) {
        errors.push(`Image format "${fileExtension}" not supported by ${platformId}`);
      }
    } else if (mediaFile.type === 'video') {
      if (fileSizeMB > limits.maxVideoSize) {
        errors.push(`Video "${mediaFile.name}" exceeds ${limits.maxVideoSize}MB limit for ${platformId}`);
      }
      if (!limits.videoFormats.includes(fileExtension)) {
        errors.push(`Video format "${fileExtension}" not supported by ${platformId}`);
      }
      if (mediaFile.duration && mediaFile.duration > limits.maxVideoDuration * 60) {
        errors.push(`Video "${mediaFile.name}" exceeds ${limits.maxVideoDuration} minute limit for ${platformId}`);
      }
    }
  });

  return errors;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};