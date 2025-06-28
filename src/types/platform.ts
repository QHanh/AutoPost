export interface Platform {
  id: string;
  name: string;
  color: string;
  gradient: string;
  icon: string;
  connected: boolean;
  accessToken?: string;
  lastPost?: string;
  followers?: number;
  supportedFormats?: {
    images: string[];
    videos: string[];
    maxImageSize: number; // MB
    maxVideoSize: number; // MB
    maxVideoDuration: number; // seconds
  };
}

export interface PlatformAccount {
  id: string;
  platformId: string;
  platformName: string;
  accountName: string;
  accessToken: string;
  connected: boolean;
  lastPost?: string;
  followers?: number;
  profileInfo?: {
    username?: string;
    displayName?: string;
    profilePicture?: string;
    verified?: boolean;
  };
  createdAt: Date;
  color: string;
  gradient: string;
  icon: string;
}

export interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  name: string;
}

export interface Post {
  id: string;
  content: string;
  media?: MediaFile[];
  platforms: PlatformAccount[]; // Changed from Platform[] to PlatformAccount[]
  scheduledTime?: Date;
  status: 'draft' | 'scheduled' | 'posted' | 'failed' | 'posting';
  createdAt: Date;
  postedAt?: Date;
  postUrls?: { [accountId: string]: string };
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  errorCode?: number;
  errorType?: string;
  hint?: string;
}

export interface PlatformLimits {
  [key: string]: {
    maxImages: number;
    maxVideos: number;
    maxTotalMedia: number;
    aspectRatios: string[];
    videoFormats: string[];
    imageFormats: string[];
  };
}