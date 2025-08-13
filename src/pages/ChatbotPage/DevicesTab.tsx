import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit, Search, FileDown, FileUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserDevice } from '../../types/deviceTypes';
import { userDeviceService } from '../../services/userDeviceService';
import DeviceFormModal from '../../components/DeviceFormModal';
import Pagination from '../../components/Pagination';
import Filter, { FilterConfig } from '../../components/Filter';
import deviceBrandService from '../../services/deviceBrandService';
import { DeviceBrand } from '../../types/deviceBrand';
import { deviceInfoService } from '../../services/deviceInfoService';
import { deviceStorageService } from '../../services/deviceStorageService';

interface DevicesTabProps {
  // Props nếu cần
}

const DevicesTab: React.FC<DevicesTabProps> = () => {
  const { } = useAuth();
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<UserDevice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserDevice | 'deviceModel' | 'colorName' | 'storageCapacity'; direction: 'ascending' | 'descending' } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<{ [key: string]: any }>({});
  const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [storages, setStorages] = useState<number[]>([]); // To hold unique storage capacities

  useEffect(() => {
    fetchUserDevices();
  }, [sortConfig, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    // Fetch device brands for filter options
    const fetchBrands = async () => {
      try {
        const brands = await deviceBrandService.getDeviceBrands();
        setDeviceBrands(brands);
      } catch (error) {
        console.error("Failed to fetch device brands for filter:", error);
      }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    // Fetch unique brands and storages for filter options
    const fetchFilterOptions = async () => {
      try {
        // You would create these service methods and backend endpoints
        const brandData = await deviceInfoService.getDistinctBrands(); 
        setBrands(brandData);
        // const storageData = await deviceStorageService.getDistinctCapacities();
        // setStorages(storageData);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };
    fetchFilterOptions();
  }, []);

  const fetchUserDevices = async () => {
    console.log('DevicesTab: fetchUserDevices called with pagination:', pagination);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const params = new URLSearchParams();
      if (sortConfig) {
        params.append('sort_by', sortConfig.key);
        params.append('sort_order', sortConfig.direction === 'ascending' ? 'asc' : 'desc');
      }
      params.append('skip', ((pagination.page - 1) * pagination.limit).toString());
      params.append('limit', pagination.limit.toString());
      
      // Append filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value as string);
        }
      });

      console.log('DevicesTab: API request params:', params.toString());

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'}/api/v1/user-devices/my-devices?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('DevicesTab: API response:', data);
      
      if (data.data) {
        const enrichedDevices = data.data.map((device: any) => ({
          ...device,
          deviceModel: device.device_info?.model || 'Unknown',
          colorName: device.color?.name || 'Unknown',
          storageCapacity: device.device_storage?.capacity || 0,
        }));
        setUserDevices(enrichedDevices);
        
        // Handle pagination metadata from the API response
        const newPagination = {
          ...pagination,
          total: data.total || 0,
          totalPages: data.totalPages || 1,
        };
        console.log('DevicesTab: Setting new pagination:', newPagination);
        setPagination(prev => newPagination);
      }
    } catch (error) {
      console.error('Error fetching user devices:', error);
    }
  };

  const handleSort = (key: keyof UserDevice | 'deviceModel' | 'colorName' | 'storageCapacity') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenModal = (device: UserDevice | null) => {
    setEditingDevice(device);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingDevice(null);
    setIsModalOpen(false);
  };

  const handleSaveDevice = async (device: any) => {
    try {
      // Check if this is a multi-color device creation
      if (!device.id && device.color_ids && device.color_ids.length > 0) {
        // Create multiple devices for each selected color
        const results = [];
        const errors = [];
        
        for (const colorId of device.color_ids) {
          try {
            const deviceData = {
              ...device,
              color_id: colorId,
              device_info_id: device.device_info_id,
              device_storage_id: device.device_storage_id,
            };
            
            // Remove the temporary fields
            delete deviceData.color_ids;
            
            const result = await userDeviceService.addUserDevice(deviceData);
            results.push(result);
          } catch (error: any) {
            console.error(`Error saving device with color ${colorId}:`, error);
            errors.push({
              colorId,
              error: error.message || 'Unknown error'
            });
          }
        }
        
        // Show results to user
        if (errors.length > 0) {
          let errorMessage = `Đã thêm ${results.length} thiết bị thành công.\n`;
          errorMessage += `Có ${errors.length} lỗi:\n`;
          errors.forEach((err, index) => {
            errorMessage += `${index + 1}. Màu ${err.colorId}: ${err.error}\n`;
          });
          alert(errorMessage);
        } else {
          alert(`Đã thêm ${results.length} thiết bị thành công.`);
        }
      } else if (device.id) {
        // Update existing device
        await userDeviceService.updateUserDevice(device.id, device);
        alert('Cập nhật thiết bị thành công.');
      } else {
        // Single device creation (fallback)
        await userDeviceService.addUserDevice(device);
        alert('Thêm thiết bị thành công.');
      }
      
      fetchUserDevices();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving device:', error);
      // Handle error message from API service
      if (error.message) {
        // Extract the actual error message from the error object
        const message = error.message;
        // If message contains '400: ', extract the part after it
        const displayMessage = message.includes('400: ') ? message.split('400: ')[1] : message;
        alert(`Lỗi: ${displayMessage}`);
      } else {
        alert('Có lỗi xảy ra khi lưu thiết bị.');
      }
    }
  };



  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) return;

    try {
      await userDeviceService.deleteUserDevice(deviceId);
      fetchUserDevices();
    } catch (error: any) {
      console.error('Error deleting device:', error);
      if (error.response?.status === 403) {
        alert('Chỉ admin mới có quyền xoá mục này');
      } else {
        alert('Xóa thiết bị không thành công');
      }
    }
  };

  const handleExport = async () => {
    try {
      const blob = await userDeviceService.exportToExcel();
      userDeviceService.downloadFile(blob, 'my_devices.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const result = await userDeviceService.importFromExcel(file);
        
        // Create a detailed message with success and error information
        let message = `Import thành công: ${result.success} dòng, thất bại: ${result.error} dòng.`;
        
        // Add detailed error messages if there are any
        if (result.errors && result.errors.length > 0) {
          message += '\n\nChi tiết lỗi:';
          result.errors.forEach((error: string) => {
            message += `\n${error}`;
          });
        }
        
        alert(message);
        fetchUserDevices();
      } catch (error) {
        console.error('Error importing from Excel:', error);
        alert('Có lỗi xảy ra khi import file.');
      } finally {
        // Reset the file input to allow re-uploading the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilters(newFilters);
  };
  
  const filterConfig: FilterConfig[] = [
    {
      key: 'brand',
      label: 'Hãng',
      type: 'select',
      options: brands.map(brand => ({ label: brand, value: brand }))
    },
    {
      key: 'inventory',
      label: 'Tồn kho',
      type: 'range-number',
    },
    {
      key: 'price',
      label: 'Giá',
      type: 'range-number',
    },
    {
      key: 'storage_capacity',
      label: 'Bộ nhớ (GB)',
      type: 'select', // Assuming you want a select for specific capacities
      options: [ // Example storages, you should fetch this from backend
        { label: '128 GB', value: '128' },
        { label: '256 GB', value: '256' },
        { label: '512 GB', value: '512' },
        { label: '1024 GB', value: '1024' },
      ]
    }
  ];

  const filteredDevices = userDevices.filter(device =>
    (device.deviceModel?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (device.product_code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const paginatedDevices = filteredDevices;

  const renderSortIcon = (key: keyof UserDevice | 'deviceModel' | 'colorName' | 'storageCapacity') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const handlePageChange = (newPage: number) => {
    console.log('DevicesTab: handlePageChange called with', newPage);
    setPagination(prev => {
      const newPagination = { ...prev, page: newPage };
      console.log('DevicesTab: Updated pagination to', newPagination);
      return newPagination;
    });
  };

  const handleLimitChange = (newLimit: number) => {
    console.log('DevicesTab: handleLimitChange called with', newLimit);
    setPagination(prev => ({ ...prev, page: 1, limit: newLimit }));
  };

  // Price formatting function
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Nhập liệu</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Filter config={filterConfig} onFilterChange={handleFilterChange} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <FileUp className="mr-2" size={18} /> Import Excel
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".xlsx, .xls" />
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <FileDown className="mr-2" size={18} /> Export Excel
          </button>
          <button onClick={() => handleOpenModal(null)} className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
            <Plus className="mr-2" size={18} /> Thêm thiết bị
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo Model hoặc Mã SP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[ 
                { key: 'product_code', label: 'Mã sản phẩm' },
                { key: 'deviceModel', label: 'Thiết bị' },
                { key: 'inventory', label: 'Tồn kho' },
                { key: 'price', label: 'Giá' },
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
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedDevices.map((device) => (
              <tr key={device.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.product_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.deviceModel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.inventory}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(device.price)} đ</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.colorName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.storageCapacity} GB</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.device_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.device_condition}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.battery_condition}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.warranty}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.notes}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(device)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteDevice(device.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div>
          <select
            value={pagination.limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-3 py-1 rounded-lg bg-gray-200"
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>
        
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
      <DeviceFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveDevice}
        device={editingDevice}
      />
    </div>
  );
};

export default DevicesTab;