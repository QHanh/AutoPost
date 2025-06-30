import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { 
  UserSubscription, 
  SubscriptionUsage, 
  PaymentHistory, 
  PricingPlan,
  UserWithSubscription 
} from '../../types/pricing.js';
import { pricingService } from '../../services/pricingService.js';

const SubscriptionRow: React.FC<{
  subscription: UserSubscription;
  plan: PricingPlan | null;
  usage: SubscriptionUsage | null;
  onView: (subscription: UserSubscription) => void;
  onEdit: (subscription: UserSubscription) => void;
  onDelete: (id: string) => void;
}> = ({ subscription, plan, usage, onView, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getUsagePercentage = () => {
    if (!usage || !plan) return 0;
    return Math.round((usage.postsUsed / (plan.maxPostsPerDay || 1)) * 100);
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">User {subscription.userId}</div>
            <div className="text-sm text-gray-500">{plan?.name || 'Unknown Plan'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {getStatusIcon(subscription.status)}
          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
            {subscription.status}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{formatDate(subscription.startDate)}</div>
        <div className="text-sm text-gray-500">đến {formatDate(subscription.endDate)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{formatCurrency(subscription.totalPaid)} VNĐ</div>
        <div className="text-sm text-gray-500">{subscription.paymentMethod}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {usage && plan ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Posts:</span>
              <span className="font-medium">{usage.postsUsed}/{plan.maxPostsPerDay}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${getUsagePercentage()}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-500">No usage data</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(subscription)}
            className="text-blue-600 hover:text-blue-900"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(subscription)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(subscription.id)}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const SubscriptionModal: React.FC<{
  subscription: UserSubscription | null;
  plan: PricingPlan | null;
  usage: SubscriptionUsage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscription: Partial<UserSubscription>) => void;
  mode: 'view' | 'edit';
}> = ({ subscription, plan, usage, isOpen, onClose, onSave, mode }) => {
  const [formData, setFormData] = useState<Partial<UserSubscription>>({});

  useEffect(() => {
    if (subscription) {
      setFormData(subscription);
    }
  }, [subscription]);

  if (!isOpen || !subscription) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {mode === 'view' ? 'Subscription Details' : 'Edit Subscription'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          {mode === 'view' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="mt-1 text-sm text-gray-900">{subscription.userId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                <p className="mt-1 text-sm text-gray-900">{plan?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">{subscription.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(subscription.startDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(subscription.endDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Paid</label>
                <p className="mt-1 text-sm text-gray-900">{formatCurrency(subscription.totalPaid)} VNĐ</p>
              </div>
              {usage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usage Today</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {usage.postsUsed} posts used
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              onSave(formData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Auto Renew</label>
                  <select
                    value={formData.autoRenew?.toString() || ''}
                    onChange={(e) => setFormData({ ...formData, autoRenew: e.target.value === 'true' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminUserSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [usageData, setUsageData] = useState<SubscriptionUsage[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data
      const [plansData, usageData] = await Promise.all([
        pricingService.getPlans(),
        Promise.resolve([]) // Mock usage data for now
      ]);
      
      setPlans(plansData);
      setUsageData(usageData);
      
      // Mock subscriptions data
      const mockSubscriptions: UserSubscription[] = [
        {
          id: 'sub_1',
          userId: 'user_1',
          planId: '2',
          status: 'active',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-04-01'),
          autoRenew: true,
          paymentMethod: 'credit_card',
          lastPaymentDate: new Date('2024-01-01'),
          nextPaymentDate: new Date('2024-04-01'),
          totalPaid: 499000,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'sub_2',
          userId: 'user_2',
          planId: '3',
          status: 'active',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2025-01-01'),
          autoRenew: true,
          paymentMethod: 'bank_transfer',
          lastPaymentDate: new Date('2024-01-01'),
          nextPaymentDate: new Date('2025-01-01'),
          totalPaid: 1699000,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];
      
      setSubscriptions(mockSubscriptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu');
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEdit = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa subscription này?')) {
      try {
        // await pricingService.deleteSubscription(id);
        setSubscriptions(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa subscription');
        console.error('Error deleting subscription:', err);
      }
    }
  };

  const handleSave = async (subscriptionData: Partial<UserSubscription>) => {
    if (!selectedSubscription) return;
    
    try {
      // await pricingService.updateSubscription(selectedSubscription.id, subscriptionData);
      setSubscriptions(prev => 
        prev.map(s => 
          s.id === selectedSubscription.id ? { ...s, ...subscriptionData } : s
        )
      );
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu subscription');
      console.error('Error saving subscription:', err);
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    if (filter.status && subscription.status !== filter.status) return false;
    if (filter.search && !subscription.userId.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const getPlanById = (planId: string) => plans.find(p => p.id === planId) || null;
  const getUsageByUserId = (userId: string) => usageData.find(u => u.userId === userId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đăng ký</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý các đăng ký gói dịch vụ của người dùng
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative">
              <input
                type="text"
                placeholder="Search by user ID..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Subscriptions ({filteredSubscriptions.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User & Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((subscription) => (
                <SubscriptionRow
                  key={subscription.id}
                  subscription={subscription}
                  plan={getPlanById(subscription.planId)}
                  usage={getUsageByUserId(subscription.userId)}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter.status || filter.search 
                ? 'Try adjusting your filters.' 
                : 'No subscriptions available.'}
            </p>
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        subscription={selectedSubscription}
        plan={selectedSubscription ? getPlanById(selectedSubscription.planId) : null}
        usage={selectedSubscription ? getUsageByUserId(selectedSubscription.userId) : null}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        mode={modalMode}
      />
    </div>
  );
}; 