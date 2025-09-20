import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Loader2, Eye, User, Phone, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  email: string | null;
}

interface OrderItem {
  id: number;
  product_name: string;
  properties: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  created_at: string;
}

interface CustomOrder {
  id: number;
  customer_profile_id: number;
  customer_id: string;
  session_id: string;
  order_status: string;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  customer_info: CustomerInfo;
  items: OrderItem[];
  total_items: number;
}

interface OrdersResponse {
  status: string;
  data: CustomOrder[];
  total_orders: number;
  customer_id: string;
  session_id: string | null;
}

const OrdersCustomTab: React.FC = () => {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const STATUS_OPTIONS = ['Chưa gọi', 'Không nghe', 'Đã gọi chưa chốt', 'Đã chốt'] as const;

  const statusToIndex = (status?: string) => {
    const idx = STATUS_OPTIONS.indexOf((status || '').trim() as any);
    return idx >= 0 ? idx : 0;
  };

  const indexToStatus = (index: number) => STATUS_OPTIONS[Math.min(Math.max(index, 0), STATUS_OPTIONS.length - 1)];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setError('Vui lòng đăng nhập để xem đơn hàng');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/orders-custom/product-order`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Không thể tải danh sách đơn hàng');
      }

      const result: OrdersResponse = await response.json();
      setOrders(result.data || []);

    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (orderId: number, threadId: string, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Vui lòng đăng nhập để cập nhật trạng thái');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/orders-custom/status?order_id=${orderId}&thread_id=${encodeURIComponent(threadId)}&status=${encodeURIComponent(status)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Không thể cập nhật trạng thái');
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: status } : o));
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'Chưa xác định';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const toggleExpanded = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Đơn Hàng</h2>
          <p className="text-gray-600">Quản lý các đơn hàng từ chatbot linh kiện</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {/* Header with refresh button */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Danh Sách Đơn Hàng</h3>
            <button
              onClick={loadOrders}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm Mới
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={24} />
                <span className="text-gray-600">Đang tải dữ liệu...</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Không có đơn hàng nào</p>
              <p className="text-gray-400 text-sm">Chưa có đơn hàng nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Đơn hàng #{order.id}</h4>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <select
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                          value={indexToStatus(statusToIndex(order.order_status))}
                          onChange={(e) => updateStatus(order.id, order.session_id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => toggleExpanded(order.id)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title={expandedOrder === order.id ? 'Thu gọn' : 'Xem chi tiết'}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{order.customer_info.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{order.customer_info.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 truncate">{order.customer_info.address}</span>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">
                        <strong>{order.total_items}</strong> sản phẩm
                      </span>
                      <span className="text-gray-600">
                        Tổng tiền: <strong className="text-green-600">{formatCurrency(order.total_amount)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-3">Chi tiết sản phẩm:</h5>
                      {order.items.length === 0 ? (
                        <p className="text-gray-500 text-sm">Không có sản phẩm nào</p>
                      ) : (
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.product_name}</p>
                                  {item.properties && (
                                    <p className="text-sm text-gray-600 mt-1">{item.properties}</p>
                                  )}
                                </div>
                                <div className="text-right text-sm text-gray-600 ml-4">
                                  <p>Số lượng: <strong>{item.quantity}</strong></p>
                                  <p>Đơn giá: <strong>{formatCurrency(item.unit_price)}</strong></p>
                                  {item.total_price && (
                                    <p className="text-green-600 font-medium">
                                      Thành tiền: <strong>{formatCurrency(item.total_price)}</strong>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {order.notes && (
                        <div className="mt-3">
                          <h6 className="font-medium text-gray-900 mb-1">Ghi chú:</h6>
                          <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersCustomTab;
