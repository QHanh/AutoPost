import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Eye,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { adminApiService } from '../../services/adminApiService.js';
import { AdminStats, AdminNotification } from '../../types/admin.js';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, icon, color }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {change !== undefined && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? '+' : ''}{change}%
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const PlatformCard: React.FC<{
  platform: string;
  stats: {
    totalAccounts: number;
    totalPosts: number;
    successRate: number;
  };
}> = ({ platform, stats }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900 capitalize">{platform}</h3>
      <div className={`w-3 h-3 rounded-full ${
        stats.successRate >= 90 ? 'bg-green-400' : 
        stats.successRate >= 80 ? 'bg-yellow-400' : 'bg-red-400'
      }`} />
    </div>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-sm text-gray-500">Accounts</span>
        <span className="text-sm font-medium">{stats.totalAccounts.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-500">Posts</span>
        <span className="text-sm font-medium">{stats.totalPosts.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-500">Success Rate</span>
        <span className="text-sm font-medium">{stats.successRate}%</span>
      </div>
    </div>
  </div>
);

const NotificationCard: React.FC<{
  notification: AdminNotification;
  onMarkAsRead: (id: string) => void;
}> = ({ notification, onMarkAsRead }) => (
  <div className={`p-4 rounded-lg border ${
    notification.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200'
  }`}>
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
          notification.type === 'error' ? 'bg-red-400' :
          notification.type === 'warning' ? 'bg-yellow-400' :
          notification.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
        }`} />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
          <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
      {!notification.read && (
        <button
          onClick={() => onMarkAsRead(notification.id)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Mark as read
        </button>
      )}
    </div>
  </div>
);

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, notificationsData] = await Promise.all([
          adminApiService.getStats(),
          adminApiService.getNotifications()
        ]);
        setStats((statsData && typeof statsData === 'object' && !Array.isArray(statsData) && 'totalUsers' in statsData)
          ? (statsData as AdminStats)
          : null);
        setNotifications(Array.isArray(notificationsData)
          ? (notificationsData as AdminNotification[])
          : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await adminApiService.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tổng quan về hệ thống và hoạt động của người dùng
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={12.5}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          change={8.2}
          icon={<Activity className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Total Posts"
          value={stats.totalPosts.toLocaleString()}
          change={15.3}
          icon={<FileText className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.revenue.monthly.toLocaleString()}`}
          change={stats.revenue.growth}
          icon={<DollarSign className="h-6 w-6 text-white" />}
          color="bg-yellow-500"
        />
      </div>

      {/* Platform Stats */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Performance</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(stats.platformStats).map(([platform, platformStats]) => (
            <PlatformCard
              key={platform}
              platform={platform}
              stats={platformStats}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity & Notifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.recentActivity.newUsers} new users registered
                </p>
                <p className="text-xs text-gray-500">In the last 24 hours</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.recentActivity.newPosts} new posts created
                </p>
                <p className="text-xs text-gray-500">In the last 24 hours</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.recentActivity.failedPosts} failed posts
                </p>
                <p className="text-xs text-gray-500">In the last 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 3).map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No notifications
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 