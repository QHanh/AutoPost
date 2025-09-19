import React, { useState, useEffect } from 'react';
import { Package, Smartphone, Wrench, RefreshCw, Loader2, Eye } from 'lucide-react';

interface ProductOrder {
  order_id: string;
  customer_id: string;
  thread_id: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  dia_chi: string;
  loai_don_hang: string;
  created_at: string;
  ma_san_pham: string;
  ten_san_pham: string;
  so_luong: number;
  status?: string;
}

interface ServiceOrder {
  order_id: string;
  customer_id: string;
  thread_id: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  dia_chi: string;
  loai_don_hang: string;
  created_at: string;
  ma_dich_vu: string;
  ten_dich_vu: string;
  loai_dich_vu: string;
  ten_san_pham_sua_chua: string;
  status?: string;
}

interface AccessoryOrder {
  order_id: string;
  customer_id: string;
  thread_id: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  dia_chi: string;
  loai_don_hang: string;
  created_at: string;
  ma_phu_kien: string;
  ten_phu_kien: string;
  so_luong: number;
  status?: string;
}

type OrderType = 'product' | 'service' | 'accessory';

const OrdersTab: React.FC = () => {
  const [activeOrderType, setActiveOrderType] = useState<OrderType>('product');
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [accessoryOrders, setAccessoryOrders] = useState<AccessoryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCell, setExpandedCell] = useState<{row: number, col: string} | null>(null);

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

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load all three types of orders in parallel
      const [productResponse, serviceResponse, accessoryResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/orders/product-order`, { headers }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/orders/service-order`, { headers }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/orders/accessory-order`, { headers })
      ]);

      if (productResponse.ok) {
        const productData = await productResponse.json();
        setProductOrders(Array.isArray(productData) ? productData : []);
      }

      if (serviceResponse.ok) {
        const serviceData = await serviceResponse.json();
        setServiceOrders(Array.isArray(serviceData) ? serviceData : []);
      }

      if (accessoryResponse.ok) {
        const accessoryData = await accessoryResponse.json();
        setAccessoryOrders(Array.isArray(accessoryData) ? accessoryData : []);
      }

    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
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

  const STATUS_OPTIONS = ['Chưa gọi', 'Không nghe', 'Đã gọi chưa chốt', 'Đã chốt'] as const;
  const statusToIndex = (status?: string) => {
    const idx = STATUS_OPTIONS.indexOf((status || '').trim() as any);
    return idx >= 0 ? idx : 0;
  };

  const indexToStatus = (index: number) => STATUS_OPTIONS[Math.min(Math.max(index, 0), STATUS_OPTIONS.length - 1)];

  const updateStatus = async (orderId: string, threadId: string, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Vui lòng đăng nhập để cập nhật trạng thái');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/orders/status?order_id=${orderId}&thread_id=${threadId}&status=${encodeURIComponent(status)}`,
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

      // Update local state
      if (activeOrderType === 'product') {
        setProductOrders(prev => 
          prev.map(order => 
            order.order_id === orderId ? { ...order, status } : order
          )
        );
      } else if (activeOrderType === 'service') {
        setServiceOrders(prev => 
          prev.map(order => 
            order.order_id === orderId ? { ...order, status } : order
          )
        );
      } else if (activeOrderType === 'accessory') {
        setAccessoryOrders(prev => 
          prev.map(order => 
            order.order_id === orderId ? { ...order, status } : order
          )
        );
      }

    } catch (err) {
      console.error('Error updating status:', err);
      setError('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const truncateText = (text: string | number, maxLength: number = 20) => {
    const textStr = String(text);
    if (textStr.length <= maxLength) return textStr;
    return textStr.substring(0, maxLength) + '...';
  };

  const isLongText = (text: string | number, maxLength: number = 20) => {
    return String(text).length > maxLength;
  };

  const toggleExpanded = (rowIndex: number, columnKey: string) => {
    if (expandedCell?.row === rowIndex && expandedCell?.col === columnKey) {
      setExpandedCell(null);
    } else {
      setExpandedCell({ row: rowIndex, col: columnKey });
    }
  };

  const getOrderTypeConfig = () => {
    switch (activeOrderType) {
      case 'product':
        return {
          title: 'Đơn Hàng Điện Thoại',
          icon: Smartphone,
          data: productOrders,
          columns: [
            { key: 'order_id', label: 'Mã ĐH' },
            { key: 'ten_khach_hang', label: 'Tên KH' },
            { key: 'so_dien_thoai', label: 'SĐT' },
            { key: 'dia_chi', label: 'Địa Chỉ' },
            { key: 'ma_san_pham', label: 'Mã SP' },
            { key: 'ten_san_pham', label: 'Tên SP' },
            { key: 'so_luong', label: 'SL' },
            { key: 'created_at', label: 'Ngày Tạo' },
            { key: 'status', label: 'Trạng Thái' }
          ]
        };
      case 'service':
        return {
          title: 'Đơn Hàng Dịch Vụ',
          icon: Wrench,
          data: serviceOrders,
          columns: [
            { key: 'order_id', label: 'Mã ĐH' },
            { key: 'ten_khach_hang', label: 'Tên KH' },
            { key: 'so_dien_thoai', label: 'SĐT' },
            { key: 'dia_chi', label: 'Địa Chỉ' },
            { key: 'ma_dich_vu', label: 'Mã DV' },
            { key: 'ten_dich_vu', label: 'Tên DV' },
            { key: 'loai_dich_vu', label: 'Loại DV' },
            { key: 'ten_san_pham_sua_chua', label: 'SP Sửa Chữa' },
            { key: 'created_at', label: 'Ngày Tạo' },
            { key: 'status', label: 'Trạng Thái' }
          ]
        };
      case 'accessory':
        return {
          title: 'Đơn Hàng Linh Kiện',
          icon: Package,
          data: accessoryOrders,
          columns: [
            { key: 'order_id', label: 'Mã ĐH' },
            { key: 'ten_khach_hang', label: 'Tên KH' },
            { key: 'so_dien_thoai', label: 'SĐT' },
            { key: 'dia_chi', label: 'Địa Chỉ' },
            { key: 'ma_phu_kien', label: 'Mã PK' },
            { key: 'ten_phu_kien', label: 'Tên PK' },
            { key: 'so_luong', label: 'SL' },
            { key: 'created_at', label: 'Ngày Tạo' },
            { key: 'status', label: 'Trạng Thái' }
          ]
        };
    }
  };

  const config = getOrderTypeConfig();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Đơn Hàng</h2>
          <p className="text-gray-600">Theo dõi và quản lý các đơn hàng điện thoại, dịch vụ và linh kiện</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {/* Order Type Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Loại Đơn Hàng</h3>
            <button
              onClick={loadOrders}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveOrderType('product')}
              className={`p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                activeOrderType === 'product'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Smartphone className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">Điện Thoại</div>
                <div className="text-sm text-gray-500">{productOrders.length} đơn hàng</div>
              </div>
            </button>

            <button
              onClick={() => setActiveOrderType('service')}
              className={`p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                activeOrderType === 'service'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Wrench className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">Dịch Vụ</div>
                <div className="text-sm text-gray-500">{serviceOrders.length} đơn hàng</div>
              </div>
            </button>

            <button
              onClick={() => setActiveOrderType('accessory')}
              className={`p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                activeOrderType === 'accessory'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Package className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">Linh Kiện</div>
                <div className="text-sm text-gray-500">{accessoryOrders.length} đơn hàng</div>
              </div>
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <config.icon className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">{config.title}</h3>
              <span className="text-sm text-gray-500">({config.data.length} đơn hàng)</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={24} />
                <span className="text-gray-600">Đang tải dữ liệu...</span>
              </div>
            </div>
          ) : config.data.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Không có đơn hàng nào</p>
              <p className="text-gray-400 text-sm">Chưa có đơn hàng {activeOrderType === 'product' ? 'điện thoại' : activeOrderType === 'service' ? 'dịch vụ' : 'linh kiện'} nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {config.columns.map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {config.data.map((order, index) => (
                    <tr key={order.order_id || index} className="hover:bg-gray-50">
                      {config.columns.map((column) => {
                        const cellValue = order[column.key as keyof typeof order];
                        const isExpanded = expandedCell?.row === index && expandedCell?.col === column.key;
                        const cellValueStr = String(cellValue);
                        const isLong = isLongText(cellValueStr);
                        
                        return (
                          <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                            {column.key === 'created_at' 
                              ? formatDate(cellValue as string)
                              : column.key === 'status' ? (
                                <select
                                  className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                                  value={indexToStatus(statusToIndex(order.status))}
                                  onChange={(e) => updateStatus(order.order_id, order.thread_id, e.target.value)}
                                >
                                  {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={isLong && !isExpanded ? 'truncate max-w-[150px]' : ''}>
                                    {isExpanded ? cellValueStr : truncateText(cellValueStr)}
                                  </span>
                                  {isLong && (
                                    <button
                                      onClick={() => toggleExpanded(index, column.key)}
                                      className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                      title={isExpanded ? 'Thu gọn' : 'Xem đầy đủ'}
                                    >
                                      <Eye size={14} />
                                    </button>
                                  )}
                                </div>
                              )
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersTab;
