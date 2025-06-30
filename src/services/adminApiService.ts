import { 
  AdminUser, 
  AdminStats, 
  SystemSettings, 
  AdminLog, 
  AdminNotification,
  AdminFilter,
  AdminPagination 
} from '../types/admin';

// const BASE_URL = 'http://localhost:8000/api/v1';
const PUBLIC_URL = "https://67b8-171-224-181-76.ngrok-free.app/v1"

class AdminApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${PUBLIC_URL}${endpoint}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  // Statistics
  async getStats(): Promise<AdminStats> {
    const response = await this.makeRequest('/admin/stats');
    
    // Transform backend data to frontend format
    const backendData = response.data;
    
    return {
      totalUsers: backendData.total_users,
      activeUsers: backendData.active_users,
      totalPosts: backendData.total_posts,
      totalAccounts: backendData.total_accounts,
      revenue: backendData.revenue,
      platformStats: backendData.platform_stats,
      recentActivity: backendData.recent_activity
    };
  }

  // Users Management
  async getUsers(filter: AdminFilter = {}, pagination: Partial<AdminPagination> = {}): Promise<{ users: AdminUser[], pagination: AdminPagination }> {
    const params = new URLSearchParams();
    
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.role) params.append('role', filter.role);
    if (filter.status) params.append('status', filter.status);

    const response = await this.makeRequest(`/admin/users?${params.toString()}`);
    
    const backendData = response.data;
    
    // Transform backend users to frontend format
    const users: AdminUser[] = backendData.users.map((user: any) => ({
      id: user.id,
      email: user.email,
      username: user.email.split('@')[0], // Extract username from email
      fullName: user.full_name,
      role: user.role,
      status: user.is_active ? 'active' : 'suspended',
      createdAt: new Date(user.created_at),
      lastLoginAt: new Date(user.updated_at), // Using updated_at as last login
      totalPosts: user.total_posts,
      connectedAccounts: user.connected_accounts,
      subscription: {
        plan: 'free', // Default plan, can be extended later
        features: ['basic_posting']
      }
    }));

    return {
      users,
      pagination: backendData.pagination
    };
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    try {
      const response = await this.makeRequest(`/admin/users/${id}`);
      const user = response.data;
      
      return {
        id: user.id,
        email: user.email,
        username: user.email.split('@')[0],
        fullName: user.full_name,
        role: user.role,
        status: user.is_active ? 'active' : 'suspended',
        createdAt: new Date(user.created_at),
        lastLoginAt: new Date(user.updated_at),
        totalPosts: user.total_posts,
        connectedAccounts: user.connected_accounts,
        subscription: {
          plan: 'free',
          features: ['basic_posting']
        }
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    const updateData: any = {};
    
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.status !== undefined) updateData.is_active = updates.status === 'active';

    const response = await this.makeRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    // Return updated user
    return this.getUserById(id) as Promise<AdminUser>;
  }

  async deleteUser(id: string): Promise<void> {
    await this.makeRequest(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Posts Management
  async getPosts(filter: AdminFilter = {}, pagination: Partial<AdminPagination> = {}): Promise<{ posts: any[], pagination: AdminPagination }> {
    const params = new URLSearchParams();
    
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (filter.platform) params.append('platform', filter.platform);
    if (filter.status) params.append('status', filter.status);

    const response = await this.makeRequest(`/admin/posts?${params.toString()}`);
    
    return {
      posts: response.data.posts,
      pagination: response.data.pagination
    };
  }

  // Settings Management (Mock for now, can be extended with real backend)
  async getSettings(category?: string): Promise<SystemSettings[]> {
    // Mock settings for now
    const mockSettings: SystemSettings[] = [
      {
        id: '1',
        key: 'max_posts_per_day',
        value: 50,
        description: 'Maximum posts allowed per day for free users',
        category: 'general',
        updatedAt: new Date(),
        updatedBy: 'admin@example.com'
      },
      {
        id: '2',
        key: 'enable_auto_moderation',
        value: true,
        description: 'Enable automatic content moderation',
        category: 'security',
        updatedAt: new Date(),
        updatedBy: 'admin@example.com'
      },
      {
        id: '3',
        key: 'email_notifications',
        value: true,
        description: 'Enable email notifications for users',
        category: 'notifications',
        updatedAt: new Date(),
        updatedBy: 'admin@example.com'
      }
    ];

    if (category) {
      return mockSettings.filter(setting => setting.category === category);
    }
    return mockSettings;
  }

  async updateSetting(id: string, value: any, updatedBy: string): Promise<SystemSettings> {
    // Mock update for now
    const setting = (await this.getSettings()).find(s => s.id === id);
    if (!setting) {
      throw new Error('Setting not found');
    }
    
    return {
      ...setting,
      value,
      updatedAt: new Date(),
      updatedBy
    };
  }

  // Logs (Mock for now)
  async getLogs(filter: AdminFilter = {}, pagination: Partial<AdminPagination> = {}): Promise<{ logs: AdminLog[], pagination: AdminPagination }> {
    // Mock logs
    const mockLogs: AdminLog[] = [
      {
        id: '1',
        action: 'USER_SUSPENDED',
        userId: 'admin@example.com',
        userEmail: 'admin@example.com',
        targetType: 'user',
        targetId: '4',
        details: { reason: 'Violation of terms of service' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date()
      },
      {
        id: '2',
        action: 'SETTING_UPDATED',
        userId: 'admin@example.com',
        userEmail: 'admin@example.com',
        targetType: 'system',
        targetId: '1',
        details: { oldValue: 30, newValue: 50 },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date(Date.now() - 3600000)
      }
    ];

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    return {
      logs: mockLogs,
      pagination: {
        page,
        limit,
        total: mockLogs.length,
        totalPages: 1
      }
    };
  }

  // Notifications (Mock for now)
  async getNotifications(): Promise<AdminNotification[]> {
    const mockNotifications: AdminNotification[] = [
      {
        id: '1',
        type: 'warning',
        title: 'High Failed Posts Rate',
        message: 'Failed posts rate has increased by 15% in the last 24 hours',
        read: false,
        createdAt: new Date(),
        actionUrl: '/admin/analytics'
      },
      {
        id: '2',
        type: 'info',
        title: 'New User Registration',
        message: '25 new users registered in the last hour',
        read: true,
        createdAt: new Date(Date.now() - 7200000)
      }
    ];

    return mockNotifications;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    // Mock implementation
    console.log(`Marking notification ${id} as read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    // Mock implementation
    console.log('Marking all notifications as read');
  }

  // Platform Management (Mock for now)
  async getPlatforms(): Promise<any[]> {
    const mockPlatforms = [
      {
        id: 'facebook',
        name: 'Facebook',
        color: '#1877F2',
        gradient: 'from-blue-500 to-blue-600',
        icon: '📘',
        connected: true,
        accessToken: 'mock_token_123',
        lastPost: '2024-01-15T10:30:00Z',
        followers: 1250,
        supportedFormats: {
          images: ['jpg', 'png', 'gif'],
          videos: ['mp4', 'mov'],
          maxImageSize: 4,
          maxVideoSize: 100,
          maxVideoDuration: 240
        }
      },
      {
        id: 'twitter',
        name: 'Twitter',
        color: '#1DA1F2',
        gradient: 'from-blue-400 to-blue-500',
        icon: '🐦',
        connected: true,
        accessToken: 'mock_token_456',
        lastPost: '2024-01-15T09:15:00Z',
        followers: 890,
        supportedFormats: {
          images: ['jpg', 'png', 'gif'],
          videos: ['mp4'],
          maxImageSize: 5,
          maxVideoSize: 512,
          maxVideoDuration: 140
        }
      },
      {
        id: 'instagram',
        name: 'Instagram',
        color: '#E4405F',
        gradient: 'from-pink-500 to-purple-500',
        icon: '📷',
        connected: false,
        supportedFormats: {
          images: ['jpg', 'png'],
          videos: ['mp4'],
          maxImageSize: 8,
          maxVideoSize: 100,
          maxVideoDuration: 60
        }
      }
    ];

    return mockPlatforms;
  }

  async updatePlatform(id: string, updates: any): Promise<any> {
    // Mock implementation
    console.log(`Updating platform ${id}`, updates);
    return { id, ...updates };
  }

  async deletePlatform(id: string): Promise<void> {
    // Mock implementation
    console.log(`Deleting platform ${id}`);
  }

  async togglePlatformConnection(id: string): Promise<void> {
    // Mock implementation
    console.log(`Toggling connection for platform ${id}`);
  }
}

export const adminApiService = new AdminApiService(); 