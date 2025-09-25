import React, { useState, useEffect, useCallback, useRef } from 'react';
import { userDeviceService } from '../../services/userDeviceService';
import { UserDevice, ImportResponse } from '../../types/deviceTypes';
import { Plus, Edit, Trash2, RotateCcw, ChevronsUpDown, FileUp, FileDown, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import DeviceFormModal from '../../components/DeviceFormModal';
import { useDebounce } from '../../hooks/useDebounce';
import { useRestoreAllDeletedModal } from '../../components/RestoreAllDeletedModal';
import Pagination from '../../components/Pagination';
import Filter, { FilterConfig } from '../../components/Filter';
import { deviceInfoService } from '../../services/deviceInfoService';
import LoadingSpinner from '../../components/LoadingSpinner';

interface DevicesTabProps {
  currentPage?: number;
  currentLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const DevicesTab: React.FC<DevicesTabProps> = ({ currentPage = 1, currentLimit = 15, onPageChange, onLimitChange }) => {
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<UserDevice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserDevice | 'deviceModel' | 'colorName' | 'storageCapacity' | 'wholesale_price'; direction: 'ascending' | 'descending' } | null>(null);
  const [pagination, setPagination] = useState({
    page: currentPage,
    limit: currentLimit,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<{ [key: string]: any }>({});
  const [brands, setBrands] = useState<string[]>([]);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const paginatedDevices = userDevices;


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

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const numSelected = selectedDeviceIds.size;
      const numDevices = paginatedDevices.length;
      selectAllCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numDevices;
    }
  }, [selectedDeviceIds, paginatedDevices]);

  // Sync internal pagination with URL parameters and fetch data
  useEffect(() => {
    setPagination(prev => {
      // Do not overwrite local state if it already matches the incoming URL values
      if (prev.page === currentPage && prev.limit === currentLimit) {
        return prev;
      }
      const newPagination = { ...prev, page: currentPage, limit: currentLimit };
      // Fetch only when the values actually changed
      setTimeout(() => {
        fetchUserDevices(newPagination);
        setSelectedDeviceIds(new Set());
      }, 0);
      return newPagination;
    });
  }, [currentPage, currentLimit]);

  useEffect(() => {
    fetchUserDevices();
    setSelectedDeviceIds(new Set()); // Clear selection on page/filter change
  }, [sortConfig, filters, searchTerm]);

  const fetchUserDevices = async (customPagination?: { page: number; limit: number }) => {
    const currentPagination = customPagination || pagination;
    console.log('DevicesTab: fetchUserDevices called with pagination:', currentPagination);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const params = new URLSearchParams();
      if (sortConfig) {
        params.append('sort_by', String(sortConfig.key));
        params.append('sort_order', sortConfig.direction === 'ascending' ? 'asc' : 'desc');
      }
      params.append('skip', ((currentPagination.page - 1) * currentPagination.limit).toString());
      params.append('limit', currentPagination.limit.toString());
      
      // Append filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value as string);
        }
      });
      
      // Add search term to params
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

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
        setPagination(newPagination);
      }
    } catch (error) {
      console.error('Error fetching user devices:', error);
    }
  };

  const handleSort = (key: keyof UserDevice | 'deviceModel' | 'colorName' | 'storageCapacity' | 'wholesale_price') => {
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
      // Multi-create when multiple colors OR multiple storages are selected
      if (!device.id && ((device.color_ids && device.color_ids.length > 0) || (device.storage_ids && device.storage_ids.length > 0))) {
        const results: any[] = [];
        const errors: any[] = [];

        const colorIds: (string | undefined)[] = (device.color_ids && device.color_ids.length > 0)
          ? device.color_ids
          : [undefined];

        const storageIds: (string | undefined)[] = (device.storage_ids && device.storage_ids.length > 0)
          ? device.storage_ids
          : [undefined];

        for (const colorId of colorIds) {
          for (const storageId of storageIds) {
            try {
              const deviceData: any = {
                ...device,
                color_id: colorId,
                device_info_id: device.device_info_id,
              };
              if (storageId) deviceData.device_storage_id = storageId;

              // Remove the temporary fields
              delete deviceData.color_ids;
              delete deviceData.storage_ids;

              const result = await userDeviceService.addUserDevice(deviceData);
              results.push(result);
            } catch (error: any) {
              console.error(`Error saving device with color ${colorId} and storage ${storageId || 'none'}:`, error);
              errors.push({
                colorId,
                storageId,
                error: error.message || 'Unknown error'
              });
            }
          }
        }

        if (errors.length > 0) {
          let errorMessage = `Đã thêm ${results.length} thiết bị thành công.\n`;
          errorMessage += `Có ${errors.length} lỗi:\n`;
          errors.forEach((err, index) => {
            errorMessage += `${index + 1}. Màu ${err.colorId}${err.storageId ? `, Dung lượng ${err.storageId}` : ''}: ${err.error}\n`;
          });
          alert(errorMessage);
        }
      } else if (device.id) {
        // Update existing device
        const updateData: any = { ...device };
        if (device.storage_ids && device.storage_ids.length > 0) {
          updateData.device_storage_id = device.storage_ids[0];
        }
        delete updateData.storage_ids;
        delete updateData.color_ids; // single edit doesn't use color_ids
        await userDeviceService.updateUserDevice(device.id, updateData);
        // Removed success notification
      } else {
        // Single device creation (fallback)
        const createData: any = { ...device };
        if (device.storage_ids && device.storage_ids.length > 0) {
          createData.device_storage_id = device.storage_ids[0];
        }
        delete createData.storage_ids;
        delete createData.color_ids;
        await userDeviceService.addUserDevice(createData);
        // Removed success notification
      }
      
      // After saving, reset to first page and sort by product_code, then refetch
      setPagination(prev => ({ ...prev, page: 1 }));
      setSortConfig({ key: 'product_code', direction: 'descending' });
      fetchUserDevices({ page: 1, limit: pagination.limit });
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

  const handleExportTemplate = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'}/api/v1/user-devices/export-template`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'mau_thiet_bi.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Error downloading template:', response.statusText);
      }
    } catch (error) {
      console.error('Error exporting template:', error);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsImportingExcel(true);
      try {
        const response: ImportResponse = await userDeviceService.importFromExcel(file);
        
        // Trích xuất dữ liệu từ response.data
        const result = response.data;
        
        // Luôn hiển thị thông báo kết quả import
        const icon = result.error > 0 ? 'warning' : 'success';
        const title = result.error > 0 ? 'Kết quả Import' : 'Import Thành công';
        
        Swal.fire({
          title: title,
          html: `
            Tổng cộng: ${result.total}<br/>
            Thành công: ${result.success}<br/>
            Lỗi: ${result.error}<br/>
            Tạo mới: ${result.created_count}<br/>
            Cập nhật: ${result.updated_count}<br/>
            ${result.errors && result.errors.length > 0 ? `<strong>Lỗi:</strong><br/>${result.errors.join('<br/>')}` : ''}
          `,
          icon: icon
        });
        fetchUserDevices();
      } catch (error) {
        console.error('Error importing from Excel:', error);
        alert('Có lỗi xảy ra khi import file.');
      } finally {
        setIsImportingExcel(false);
        // Reset the file input to allow re-uploading the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters(newFilters);
    // Reset to page 1 when filtering
    if (onPageChange) {
      onPageChange(1);
    } else {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
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
      label: 'Giá bán lẻ',
      type: 'range-number',
    },
    {
      key: 'wholesale_price',
      label: 'Giá bán buôn',
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



  const renderSortIcon = (key: keyof UserDevice | 'deviceModel' | 'colorName' | 'storageCapacity' | 'wholesale_price') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const handlePageChangeInternal = (newPage: number) => {
    console.log('DevicesTab: handlePageChangeInternal called with', newPage);
    // Optimistically update local pagination and fetch immediately
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchUserDevices({ page: newPage, limit: pagination.limit });
    // Update URL through parent component (if provided)
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const handleLimitChangeInternal = (newLimit: number) => {
    console.log('DevicesTab: handleLimitChangeInternal called with', newLimit);
    // Optimistically update local pagination so UI reflects selection immediately
    setPagination(prev => ({ ...prev, page: 1, limit: newLimit }));
    // Update URL/state via parent to persist selection
    if (onLimitChange) {
      onLimitChange(newLimit);
    }
    // Ensure data reloads immediately even if props change to the same values
    fetchUserDevices({ page: 1, limit: newLimit });
  };

  // Reset to page 1 whenever search term changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Reset pagination to first page to ensure API fetch starts from page 1
    if (onPageChange) {
      onPageChange(1);
    } else {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  // Price formatting function
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(deviceId)) {
        newSelectedIds.delete(deviceId);
      } else {
        newSelectedIds.add(deviceId);
      }
      return newSelectedIds;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allDeviceIds = new Set(paginatedDevices.map(d => d.id));
      setSelectedDeviceIds(allDeviceIds);
    } else {
      setSelectedDeviceIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeviceIds.size === 0) return;

    const result = await Swal.fire({
      title: `Bạn có chắc chắn muốn xóa ${selectedDeviceIds.size} thiết bị đã chọn?`,
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await userDeviceService.bulkDeleteUserDevices(Array.from(selectedDeviceIds));
        Swal.fire(
          'Đã xóa!',
          `Đã xóa thành công ${selectedDeviceIds.size} thiết bị.`,
          'success'
        );
        setSelectedDeviceIds(new Set());
        fetchUserDevices();
      } catch (error) {
        console.error('Error bulk deleting devices:', error);
        Swal.fire(
          'Lỗi!',
          'Xóa hàng loạt không thành công.',
          'error'
        );
      }
    }
  };

  const handleDeleteAll = async () => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn muốn xóa TẤT CẢ thiết bị?',
      text: "Hành động này sẽ xóa toàn bộ dữ liệu thiết bị của bạn và không thể hoàn tác!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Tôi hiểu, xóa tất cả',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await userDeviceService.deleteAllUserDevices();
        Swal.fire(
          'Đã xóa!',
          'Tất cả thiết bị đã được xóa thành công.',
          'success'
        );
        setSelectedDeviceIds(new Set());
        fetchUserDevices();
      } catch (error) {
        console.error('Error deleting all devices:', error);
        Swal.fire(
          'Lỗi!',
          'Xóa tất cả thiết bị không thành công.',
          'error'
        );
      }
    }
  };

  // Sử dụng hook chung cho việc khôi phục tất cả devices đã xóa
  const { handleRestoreAll: handleRestoreAllDeletedToday } = useRestoreAllDeletedModal({
    itemType: 'devices',
    getDeletedItems: userDeviceService.getDeletedDevicesToday,
    restoreAllItems: userDeviceService.restoreAllDeletedToday,
    onSuccess: () => {
      fetchUserDevices();
    }
  });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Loading overlay toàn màn hình khi import */}
      {isImportingExcel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Đang import dữ liệu...</p>
            <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      )}
      
      <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Nhập liệu</h2>
          {selectedDeviceIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBulkDelete} 
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
                disabled={selectedDeviceIds.size === 0}
              >
                <Trash2 className="mr-2" size={18} />
                Xóa ({selectedDeviceIds.size})
              </button>
            </div>
          )}
        </div>
       
        <div className="flex flex-wrap items-center gap-2">
          <Filter config={filterConfig} onFilterChange={handleFilterChange} />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImportingExcel}
            className={`flex items-center px-4 py-2 rounded-lg ${
              isImportingExcel 
                ? 'bg-green-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isImportingExcel ? (
              <>
                <LoadingSpinner size="sm" text="" />
                Đang xử lý...
              </>
            ) : (
              <>
                <FileUp className="mr-2" size={18} /> Import Excel
              </>
            )}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".xlsx, .xls" />
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <FileDown className="mr-2" size={18} /> Export Excel
          </button>
          <button onClick={handleExportTemplate} className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
            <FileDown className="mr-2" size={18} /> Tải Excel mẫu
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => handleOpenModal(null)} className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
              <Plus className="mr-2" size={18} /> Thêm thiết bị
            </button>
            
          </div>
          <button onClick={handleRestoreAllDeletedToday} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <RotateCcw className="mr-2" size={18} /> Khôi phục sản phẩm xóa trong ngày
          </button>
          <button onClick={handleDeleteAll} className="flex items-center px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900">
              <Trash2 className="mr-2" size={18} /> Xóa tất cả
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
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto overflow-y-auto relative h-[calc(100vh-280px)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
            <tr>
              <th scope="col" className="px-6 py-3">
                <input 
                  ref={selectAllCheckboxRef}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  onChange={handleSelectAll}
                  checked={paginatedDevices.length > 0 && selectedDeviceIds.size === paginatedDevices.length}
                />
              </th>
              {[ 
                { key: 'product_code', label: 'Mã sản phẩm' },
                { key: 'deviceModel', label: 'Thiết bị' },
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
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedDevices.map((device) => (
              <tr key={device.id} className={`${selectedDeviceIds.has(device.id) ? 'bg-indigo-50' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedDeviceIds.has(device.id)}
                    onChange={() => handleSelectDevice(device.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.product_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.deviceModel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.inventory}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ textAlign: 'right' }}>{formatPrice(device.price)} đ</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ textAlign: 'right' }}>{formatPrice(device.wholesale_price || 0)} đ</td>
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
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChangeInternal}
          />
        </div>
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