import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ChevronsUpDown, Search, RefreshCw, Link as LinkIcon } from 'lucide-react';
import Pagination from '../../components/Pagination';
import Filter, { FilterConfig } from '../../components/Filter';
import { deviceInfoService } from '../../services/deviceInfoService';
import UrlSyncConfig from '../../components/UrlSyncConfig';
import { userSyncUrlService } from '../../services/userSyncUrlService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserDevice } from '../../types/deviceTypes';

interface UrlDevicesTabProps {
  currentPage?: number;
  currentLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const UrlDevicesTab: React.FC<UrlDevicesTabProps> = ({ currentPage = 1, currentLimit = 15, onPageChange, onLimitChange }) => {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserDevice | 'device_name' | 'deviceModel' | 'colorName' | 'storageCapacity' | 'wholesale_price'; direction: 'ascending' | 'descending' } | null>(null);
  const [pagination, setPagination] = useState({
    page: currentPage,
    limit: currentLimit,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<{ [key: string]: any }>({});
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [updatedToday, setUpdatedToday] = useState(false);

  // Load filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const brandData = await deviceInfoService.getDistinctBrands();
        setBrands(brandData);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Sync internal pagination with URL params and fetch data
  useEffect(() => {
    setPagination(prev => {
      if (prev.page === currentPage && prev.limit === currentLimit) {
        return prev;
      }
      const newPagination = { ...prev, page: currentPage, limit: currentLimit };
      setTimeout(() => {
        fetchDevices(newPagination);
      }, 0);
      return newPagination;
    });
  }, [currentPage, currentLimit]);

  useEffect(() => {
    fetchDevices();
  }, [sortConfig, filters, searchTerm]);

  const fetchDevices = async (customPagination?: { page: number; limit: number }) => {
    const current = customPagination || pagination;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const params = new URLSearchParams();
      if (sortConfig) {
        params.append('sort_by', String(sortConfig.key));
        params.append('sort_order', sortConfig.direction === 'ascending' ? 'asc' : 'desc');
      }
      params.append('skip', ((current.page - 1) * current.limit).toString());
      params.append('limit', current.limit.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });

      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const base = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';
      const response = await fetch(`${base}/api/v1/user-devices-from-url/my-devices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data?.data) {
        const enriched = data.data.map((d: any) => ({
          ...d,
          // Prefer server-provided device_name, then fallback to device_info.model, then notes
          deviceModel: d.device_name || d.device_info?.model || d.notes || 'Unknown',
          colorName: d.color?.name || 'Unknown',
          storageCapacity: d.device_storage?.capacity || 0,
        }));
        setDevices(enriched);
        setPagination(prev => ({ ...prev, total: data.total || 0, totalPages: data.totalPages || 1 }));
      }
    } catch (e) {
      console.error('Error fetching URL devices:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof UserDevice | 'device_name' | 'deviceModel' | 'colorName' | 'storageCapacity' | 'wholesale_price') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const handleLimitChangeInternal = (newLimit: number) => {
    setPagination(prev => ({ ...prev, page: 1, limit: newLimit }));
    if (onLimitChange) onLimitChange(newLimit);
    fetchDevices({ page: 1, limit: newLimit });
  };

  const handlePageChangeInternal = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchDevices({ page: newPage, limit: pagination.limit });
    if (onPageChange) onPageChange(newPage);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onPageChange) onPageChange(1); else setPagination(prev => ({ ...prev, page: 1 }));
  };

  const filterConfig: FilterConfig[] = [
    { key: 'brand', label: 'Hãng', type: 'select', options: brands.map(b => ({ label: b, value: b })) },
    { key: 'inventory', label: 'Tồn kho', type: 'range-number' },
    { key: 'price', label: 'Giá bán lẻ', type: 'range-number' },
    { key: 'wholesale_price', label: 'Giá bán buôn', type: 'range-number' },
    { key: 'storage_capacity', label: 'Bộ nhớ (GB)', type: 'select', options: [
      { label: '128 GB', value: '128' },
      { label: '256 GB', value: '256' },
      { label: '512 GB', value: '512' },
      { label: '1024 GB', value: '1024' },
    ] },
  ];

  const formatPrice = (price: number): string => new Intl.NumberFormat('vi-VN').format(price);

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters(newFilters);
    if (onPageChange) onPageChange(1); else setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      const res = await userSyncUrlService.syncDevices(updatedToday, 'device');
      const data = res as any;
      const details = data?.data || data;
      const created = details?.created ?? 0;
      const updated = details?.updated ?? 0;
      const skipped = details?.skipped ?? 0;
      const errors = details?.errors ?? [];

      Swal.fire({
        icon: errors.length > 0 ? 'warning' : 'success',
        title: 'Kết quả đồng bộ',
        html: `
          Tạo mới: ${created}<br/>
          Cập nhật: ${updated}<br/>
          Bỏ qua: ${skipped}<br/>
          ${errors.length ? `<strong>Lỗi:</strong><br/>${errors.join('<br/>')}` : ''}
        `,
      });
      // Refresh list
      fetchDevices({ page: 1, limit: pagination.limit });
      if (onPageChange) onPageChange(1); else setPagination(prev => ({ ...prev, page: 1 }));
    } catch (e: any) {
      console.error('Sync error:', e);
      Swal.fire({ icon: 'error', title: 'Lỗi', text: e.message || 'Không thể đồng bộ' });
    } finally {
      setIsSyncing(false);
    }
  };

  const renderSortIcon = (key: keyof UserDevice | 'device_name' | 'deviceModel' | 'colorName' | 'storageCapacity' | 'wholesale_price') => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <LinkIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Đồng bộ URL</h2>
        </div>
        <UrlSyncConfig isAuthenticated={true} defaultType="device" />
        <div className="flex items-center gap-3 mt-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4" checked={updatedToday} onChange={(e) => setUpdatedToday(e.target.checked)} />
            Chỉ đồng bộ sản phẩm cập nhật hôm nay
          </label>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${isSyncing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold text-gray-800">Danh sách thiết bị (từ URL)</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter config={filterConfig} onFilterChange={handleFilterChange} />
          {isLoading && <LoadingSpinner size="sm" text="" />}
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo Model hoặc Mã SP..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto overflow-y-auto relative h-[calc(100vh-360px)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
            <tr>
              {[ 
                { key: 'product_code', label: 'Mã sản phẩm' },
                // Use server column name for sorting to be handled by API
                { key: 'device_name', label: 'Thiết bị' },
                { key: 'inventory', label: 'Tồn kho' },
                { key: 'price', label: 'Giá bán lẻ' },
                { key: 'wholesale_price', label: 'Giá bán buôn' },
                { key: 'colorName', label: 'Màu sắc' },
                { key: 'storageCapacity', label: 'Bộ nhớ' },
                { key: 'device_type', label: 'Loại thiết bị' },
                { key: 'device_condition', label: 'Tình trạng' },
                { key: 'battery_condition', label: 'Tình trạng pin' },
                { key: 'warranty', label: 'Bảo hành' },
                { key: 'notes', label: 'Ghi chú' },
              ].map(({ key, label }) => (
                <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort(key as any)}>
                  <div className="flex items-center">
                    {label}
                    {renderSortIcon(key as any)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {devices.map((d) => (
              <tr key={d.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.product_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{d.deviceModel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.inventory}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ textAlign: 'right' }}>{formatPrice(d.price)} đ</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ textAlign: 'right' }}>{formatPrice(d.wholesale_price || 0)} đ</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.colorName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.storageCapacity} GB</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.device_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.device_condition}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.battery_condition}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.warranty}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>
          <select
            value={currentLimit}
            onChange={(e) => handleLimitChangeInternal(Number(e.target.value))}
            className="px-3 py-1 rounded-lg bg-gray-200"
          >
            <option value={15}>15 / trang</option>
            <option value={30}>30 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Tổng số: <span className="font-semibold">{pagination.total}</span>
          </div>
          <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChangeInternal} />
        </div>
      </div>
    </div>
  );
};

export default UrlDevicesTab;
