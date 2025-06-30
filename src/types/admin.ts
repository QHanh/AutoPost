export interface AdminUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'admin'  | 'user';
  status: 'active' | 'suspended' | 'pending';
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  totalPosts: number;
  connectedAccounts: number;
  subscription: {
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    expiresAt?: Date;
    features: string[];
  };
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalAccounts: number;
  revenue: {
    monthly: number;
    total: number;
    growth: number;
  };
  platformStats: {
    [platformId: string]: {
      totalAccounts: number;
      totalPosts: number;
      successRate: number;
    };
  };
  recentActivity: {
    newUsers: number;
    newPosts: number;
    failedPosts: number;
  };
}

export interface SystemSettings {
  id: string;
  key: string;
  value: any;
  description: string;
  category: 'general' | 'security' | 'notifications' | 'integrations';
  updatedAt: Date;
  updatedBy: string;
}

export interface AdminLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  targetType: 'user' | 'post' | 'account' | 'system';
  targetId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface AdminFilter {
  search?: string;
  status?: string;
  role?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  platform?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} 