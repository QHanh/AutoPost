import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  DollarSign,
  Activity,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { adminApiService } from '../../services/adminApiService.js';
import { AdminStats } from '../../types/admin.js';

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
}> = ({ title, value, change, changeType, icon }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'increase' ? (
                  <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                ) : (
                  <TrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                )}
                <span className="sr-only">{changeType === 'increase' ? 'Increased' : 'Decreased'} by</span>
                {change}%
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const ChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => (
  <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const MockChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  type: 'bar' | 'pie' | 'line';
}> = ({ data, type }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  if (type === 'bar') {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-gray-600">{item.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${item.color}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-12 text-sm font-medium text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
            {data.map((item, index) => {
              const percentage = (item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100;
              const startAngle = data.slice(0, index).reduce((sum, d) => 
                sum + (d.value / data.reduce((total, item) => total + item.value, 0)) * 360, 0
              );
              const endAngle = startAngle + (percentage / 100) * 360;
              
              const x1 = 16 + 12 * Math.cos(startAngle * Math.PI / 180);
              const y1 = 16 + 12 * Math.sin(startAngle * Math.PI / 180);
              const x2 = 16 + 12 * Math.cos(endAngle * Math.PI / 180);
              const y2 = 16 + 12 * Math.sin(endAngle * Math.PI / 180);
              
              const largeArcFlag = percentage > 50 ? 1 : 0;
              
              return (
                <path
                  key={index}
                  d={`M 16 16 L ${x1} ${y1} A 12 12 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={item.color}
                />
              );
            })}
          </svg>
        </div>
        <div className="ml-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 flex items-end justify-center space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center">
          <div
            className={`w-8 ${item.color} rounded-t`}
            style={{ height: `${(item.value / maxValue) * 200}px` }}
          />
          <div className="text-xs text-gray-500 mt-2">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export const AdminAnalytics: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await adminApiService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  const platformData = Object.entries(stats.platformStats).map(([platform, data]) => ({
    label: platform,
    value: data.totalPosts,
    color: platform === 'facebook' ? 'bg-blue-500' : 
           platform === 'twitter' ? 'bg-blue-400' : 'bg-pink-500'
  }));

  const userGrowthData = [
    { label: 'Jan', value: 800, color: 'bg-blue-500' },
    { label: 'Feb', value: 900, color: 'bg-blue-500' },
    { label: 'Mar', value: 950, color: 'bg-blue-500' },
    { label: 'Apr', value: 1100, color: 'bg-blue-500' },
    { label: 'May', value: 1200, color: 'bg-blue-500' },
    { label: 'Jun', value: 1250, color: 'bg-blue-500' },
  ];

  const revenueData = [
    { label: 'Jan', value: 35000, color: 'bg-green-500' },
    { label: 'Feb', value: 38000, color: 'bg-green-500' },
    { label: 'Mar', value: 42000, color: 'bg-green-500' },
    { label: 'Apr', value: 45000, color: 'bg-green-500' },
    { label: 'May', value: 48000, color: 'bg-green-500' },
    { label: 'Jun', value: 52000, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Thống kê chi tiết và báo cáo hiệu suất hệ thống
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={12.5}
          changeType="increase"
          icon={<Users className="h-5 w-5 text-blue-600" />}
        />
        <MetricCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          change={8.2}
          changeType="increase"
          icon={<Activity className="h-5 w-5 text-green-600" />}
        />
        <MetricCard
          title="Total Posts"
          value={stats.totalPosts.toLocaleString()}
          change={15.3}
          changeType="increase"
          icon={<FileText className="h-5 w-5 text-purple-600" />}
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${stats.revenue.monthly.toLocaleString()}`}
          change={stats.revenue.growth}
          changeType="increase"
          icon={<DollarSign className="h-5 w-5 text-yellow-600" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Platform Performance */}
        <ChartCard title="Platform Performance">
          <MockChart data={platformData} type="bar" />
        </ChartCard>

        {/* User Growth */}
        <ChartCard title="User Growth Trend">
          <MockChart data={userGrowthData} type="line" />
        </ChartCard>

        {/* Revenue Distribution */}
        <ChartCard title="Revenue by Platform">
          <MockChart data={platformData} type="pie" />
        </ChartCard>

        {/* Revenue Trend */}
        <ChartCard title="Revenue Trend">
          <MockChart data={revenueData} type="line" />
        </ChartCard>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Platform Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Accounts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Posts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(stats.platformStats).map(([platform, data]) => (
                <tr key={platform}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className={`h-8 w-8 rounded-full ${
                          platform === 'facebook' ? 'bg-blue-500' :
                          platform === 'twitter' ? 'bg-blue-400' : 'bg-pink-500'
                        } flex items-center justify-center`}>
                          <span className="text-white text-sm font-medium">
                            {platform.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {platform}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {data.totalAccounts.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {data.totalPosts.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.successRate >= 90 ? 'bg-green-500' :
                            data.successRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${data.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">{data.successRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      data.successRate >= 90 ? 'bg-green-100 text-green-800' :
                      data.successRate >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {data.successRate >= 90 ? 'Excellent' :
                       data.successRate >= 80 ? 'Good' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.recentActivity.newUsers} new users
                </p>
                <p className="text-xs text-gray-500">Registered in last 24h</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.recentActivity.newPosts} new posts
                </p>
                <p className="text-xs text-gray-500">Created in last 24h</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.recentActivity.failedPosts} failed posts
                </p>
                <p className="text-xs text-gray-500">In last 24h</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Summary</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.revenue.monthly.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-900">
                ${stats.revenue.total.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Growth Rate</p>
              <p className={`text-lg font-semibold ${
                stats.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.revenue.growth >= 0 ? '+' : ''}{stats.revenue.growth}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
              Generate Report
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
              Export Data
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 