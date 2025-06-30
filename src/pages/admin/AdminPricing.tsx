import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  DollarSign,
  Users,
  Calendar,
  HardDrive,
  Zap,
  Crown,
  Rocket,
  Grid3X3,
  List,
  Eye
} from 'lucide-react';
import { PricingPlan, PricingFeature, PricingPlanUI } from '../../types/pricing.js';
import { pricingService } from '../../services/pricingService';

// Mock UI styling data - chỉ dùng cho styling
const getPlanUI = (plan: PricingPlan): PricingPlanUI => {
  const uiConfigs = {
    'CƠ BẢN': {
      color: 'border-blue-200',
      bgColor: 'bg-gradient-to-br from-blue-50 via-white to-blue-100',
      textColor: 'text-blue-900',
      buttonColor: 'bg-blue-600 text-white hover:bg-blue-700',
      gradient: 'from-blue-500 to-blue-600',
      icon: '⚡'
    },
    'TIẾT KIỆM': {
      color: 'border-purple-500',
      bgColor: 'bg-gradient-to-br from-purple-50 via-white to-pink-100',
      textColor: 'text-purple-900',
      buttonColor: 'bg-purple-600 text-white hover:bg-purple-700',
      gradient: 'from-purple-500 to-purple-600',
      icon: '👑'
    },
    'CHUYÊN NGHIỆP': {
      color: 'border-green-500',
      bgColor: 'bg-gradient-to-br from-green-50 via-white to-green-100',
      textColor: 'text-green-900',
      buttonColor: 'bg-green-600 text-white hover:bg-green-700',
      gradient: 'from-green-500 to-green-600',
      icon: '🚀'
    }
  };

  const config = uiConfigs[plan.name as keyof typeof uiConfigs] || {
    color: 'border-gray-200',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-900',
    buttonColor: 'bg-gray-600 text-white hover:bg-gray-700',
    gradient: 'from-gray-500 to-gray-600',
    icon: '📦'
  };

  return {
    ...plan,
    ...config
  };
};

const PlanCard: React.FC<{
  plan: PricingPlan;
  onEdit: (plan: PricingPlan) => void;
  onDelete: (id: string) => void;
}> = ({ plan, onEdit, onDelete }) => {
  const planUI = getPlanUI(plan);
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div className={`relative rounded-3xl border-2 ${planUI.color} shadow-md overflow-hidden ${planUI.bgColor}`}>
      {plan.popular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-b-lg text-sm font-bold">
          PHỔ BIẾN
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{planUI.icon}</span>
            <h3 className={`text-xl font-bold ${planUI.textColor}`}>{plan.name}</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(plan)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(plan.id)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${planUI.textColor}`}>{formatPrice(plan.price)}</span>
            <span className="text-gray-600">{plan.period}</span>
          </div>
          {(plan.discount || plan.bonus) && (
            <div className={`text-sm font-bold mt-1 rounded-full px-2 py-1 inline-block
              ${plan.discount ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
              {plan.discount || plan.bonus}
            </div>
          )}
        </div>
        
        <p className="text-gray-600 mb-4">{plan.description}</p>
        
        <div className="space-y-2">
          {plan.features.slice(0, 3).map((feature) => (
            <div key={feature.id} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">{feature.name}: {feature.value}</span>
            </div>
          ))}
          {plan.features.length > 3 && (
            <div className="text-sm text-gray-500">
              +{plan.features.length - 3} tính năng khác
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PricingTable: React.FC<{
  plans: PricingPlan[];
  onEdit: (plan: PricingPlan) => void;
  onDelete: (id: string) => void;
  onView: (plan: PricingPlan) => void;
}> = ({ plans, onEdit, onDelete, onView }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'CƠ BẢN': return <Zap className="h-5 w-5 text-blue-600" />;
      case 'TIẾT KIỆM': return <Crown className="h-5 w-5 text-purple-600" />;
      case 'CHUYÊN NGHIỆP': return <Rocket className="h-5 w-5 text-green-600" />;
      default: return <Zap className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPlanBgColor = (planName: string) => {
    switch (planName) {
      case 'CƠ BẢN': return 'bg-blue-100';
      case 'TIẾT KIỆM': return 'bg-purple-100';
      case 'CHUYÊN NGHIỆP': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gói dịch vụ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tính năng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khuyến mãi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getPlanBgColor(plan.name)}`}>
                        {getPlanIcon(plan.name)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                      <div className="text-sm text-gray-500">{plan.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatPrice(plan.price)} VNĐ
                  </div>
                  <div className="text-sm text-gray-500">{plan.period}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div className="space-y-1">
                      {plan.features.slice(0, 3).map((feature) => (
                        <div key={feature.id} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs">{feature.name}: {feature.value}</span>
                        </div>
                      ))}
                      {plan.features.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{plan.features.length - 3} tính năng khác
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {plan.popular && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Phổ biến
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Hoạt động
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {plan.discount && (
                      <div className="text-purple-600 font-medium">{plan.discount}</div>
                    )}
                    {plan.bonus && (
                      <div className="text-green-600 font-medium">{plan.bonus}</div>
                    )}
                    {!plan.discount && !plan.bonus && (
                      <span className="text-gray-400">Không có</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onView(plan)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(plan)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(plan.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PlanModal: React.FC<{
  plan: PricingPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: PricingPlan) => void;
  mode: 'add' | 'edit';
}> = ({ plan, isOpen, onClose, onSave, mode }) => {
  const [formData, setFormData] = useState<PricingPlan>({
    id: '',
    name: '',
    price: 0,
    period: '/ tháng',
    description: '',
    popular: false,
    features: []
  });

  const [newFeature, setNewFeature] = useState({ name: '', value: '', note: '' });

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    } else if (mode === 'add') {
      setFormData({
        id: '',
        name: '',
        price: 0,
        period: '/ tháng',
        description: '',
        popular: false,
        features: []
      });
    }
  }, [plan, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'add') {
      formData.id = Date.now().toString();
    }
    onSave(formData);
  };

  const addFeature = () => {
    if (newFeature.name && newFeature.value) {
      setFormData({
        ...formData,
        features: [...formData.features, {
          id: Date.now().toString(),
          name: newFeature.name,
          value: newFeature.value,
          note: newFeature.note
        }]
      });
      setNewFeature({ name: '', value: '', note: '' });
    }
  };

  const removeFeature = (featureId: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter(f => f.id !== featureId)
    });
  };

  const updateFeature = (featureId: string, updates: Partial<PricingFeature>) => {
    setFormData({
      ...formData,
      features: formData.features.map(f => 
        f.id === featureId ? { ...f, ...updates } : f
      )
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {mode === 'add' ? 'Thêm gói mới' : 'Chỉnh sửa gói'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-4">Thông tin cơ bản</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên gói</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giá (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chu kỳ</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="/ tháng">/ tháng</option>
                    <option value="/ 3 tháng">/ 3 tháng</option>
                    <option value="/ 6 tháng">/ 6 tháng</option>
                    <option value="/ năm">/ năm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Gói phổ biến</span>
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giảm giá (tùy chọn)</label>
                  <input
                    type="text"
                    value={formData.discount || ''}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="VD: Giảm 16%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quà tặng (tùy chọn)</label>
                  <input
                    type="text"
                    value={formData.bonus || ''}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="VD: Tặng thêm 6 tháng"
                  />
                </div>
              </div>
            </div>

            {/* Features Management */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-4">Quản lý tính năng</h4>
              
              {/* Add New Feature */}
              <div className="bg-white p-4 rounded-lg border mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Thêm tính năng mới</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Tên tính năng</label>
                    <input
                      type="text"
                      value={newFeature.name}
                      onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                      placeholder="VD: Số video/ngày"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Giá trị</label>
                    <input
                      type="text"
                      value={newFeature.value}
                      onChange={(e) => setNewFeature({ ...newFeature, value: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                      placeholder="VD: 3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Ghi chú (tùy chọn)</label>
                    <input
                      type="text"
                      value={newFeature.note}
                      onChange={(e) => setNewFeature({ ...newFeature, note: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                      placeholder="VD: Tối đa"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addFeature}
                  disabled={!newFeature.name || !newFeature.value}
                  className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Thêm tính năng
                </button>
              </div>

              {/* Existing Features */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Tính năng hiện tại ({formData.features.length})</h5>
                {formData.features.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Chưa có tính năng nào</p>
                ) : (
                  formData.features.map((feature, index) => (
                    <div key={feature.id} className="bg-white p-3 rounded-lg border">
                      <div className="grid grid-cols-4 gap-3 items-center">
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Tên</label>
                          <input
                            type="text"
                            value={feature.name}
                            onChange={(e) => updateFeature(feature.id, { name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Giá trị</label>
                          <input
                            type="text"
                            value={feature.value}
                            onChange={(e) => updateFeature(feature.id, { value: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Ghi chú</label>
                          <input
                            type="text"
                            value={feature.note || ''}
                            onChange={(e) => updateFeature(feature.id, { note: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeFeature(feature.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {mode === 'add' ? 'Thêm gói' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const AdminPricing: React.FC = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalPlans: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalRevenue: number;
    popularPlan: PricingPlan | null;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [plansData, statsData] = await Promise.all([
        pricingService.getPlans(),
        pricingService.getPricingStats()
      ]);
      
      setPlans(plansData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu');
      console.error('Error fetching pricing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = () => {
    setSelectedPlan(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleEditPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleViewPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setModalMode('edit'); // Reuse edit modal for view
    setModalOpen(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa gói này?')) {
      try {
        await pricingService.deletePlan(id);
        await fetchData(); // Refresh data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa gói');
        console.error('Error deleting plan:', err);
      }
    }
  };

  const handleSavePlan = async (planData: PricingPlan) => {
    try {
      if (modalMode === 'add') {
        await pricingService.createPlan(planData);
      } else {
        await pricingService.updatePlan(planData.id, planData);
      }
      setModalOpen(false);
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu gói');
      console.error('Error saving plan:', err);
    }
  };

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
          <X className="h-6 w-6 text-red-600" />
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Bảng giá</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý các gói dịch vụ và cấu hình giá cả
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md ${
                viewMode === 'cards' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Xem dạng card"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md ${
                viewMode === 'table' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Xem dạng bảng"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleAddPlan}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm gói mới
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tổng doanh thu</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {new Intl.NumberFormat('vi-VN').format(stats.totalRevenue)} VNĐ
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tổng đăng ký</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalSubscriptions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Crown className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Đang hoạt động</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeSubscriptions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Số gói hiện tại</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalPlans}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={handleEditPlan}
              onDelete={handleDeletePlan}
            />
          ))}
        </div>
      ) : (
        <PricingTable
          plans={plans}
          onEdit={handleEditPlan}
          onDelete={handleDeletePlan}
          onView={handleViewPlan}
        />
      )}

      {plans.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có gói nào</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bắt đầu bằng cách thêm gói dịch vụ đầu tiên.
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddPlan}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm gói đầu tiên
            </button>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      <PlanModal
        plan={selectedPlan}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePlan}
        mode={modalMode}
      />
    </div>
  );
}; 