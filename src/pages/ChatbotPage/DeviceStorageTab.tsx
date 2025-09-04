import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DeviceInfo, DeviceStorage } from '../../types/deviceTypes';
import { deviceService } from '../../services/deviceService';
import { storageService } from '../../services/storageService';
import { deviceStorageService } from '../../services/deviceStorageService';
import { Plus, Trash2, Loader, ChevronLeft, ChevronRight } from 'lucide-react';

interface DeviceStorageTabProps {
  currentPage?: number;
  currentLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const DeviceStorageTab: React.FC<DeviceStorageTabProps> = ({ currentPage: urlPage = 1, currentLimit: urlLimit = 10, onPageChange, onLimitChange }) => {
  const { isAuthenticated } = useAuth();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [storages, setStorages] = useState<DeviceStorage[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [deviceStorages, setDeviceStorages] = useState<DeviceStorage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newStorageCapacity, setNewStorageCapacity] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(true);
  const deviceDropdownRef = useRef<HTMLDivElement>(null);
  
  const [storageSearchTerm, setStorageSearchTerm] = useState('');
  const [isStorageDropdownOpen, setIsStorageDropdownOpen] = useState(false);
  const storageDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
      fetchAllStorages();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceStorages(selectedDevice);
    } else {
      setDeviceStorages([]);
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 1 });
    }
  }, [selectedDevice, pagination.page, pagination.limit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(event.target as Node)) {
        setIsDeviceDropdownOpen(false);
      }
      if (storageDropdownRef.current && !storageDropdownRef.current.contains(event.target as Node)) {
        setIsStorageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchDevices = async () => {
    try {
      const result = await deviceService.getDevices({ limit: 100 });
      setDevices(result.data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchAllStorages = async () => {
    try {
      const allStorages = await storageService.getAllStorages();
      setStorages(allStorages);
    } catch (error) {
      console.error('Error fetching storages:', error);
    }
  };

  const fetchDeviceStorages = async (deviceId: string) => {
    setLoading(true);
    try {
      const result = await deviceStorageService.getDeviceStorages(deviceId, { page: pagination.page, limit: pagination.limit });
      setDeviceStorages(result.data || []);
      setPagination(prev => ({ ...prev, total: result.total || 0, totalPages: result.totalPages || 1 }));
    } catch (error) {
      console.error('Error fetching device storages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeviceStorage = async () => {
    if (!selectedDevice || !newStorageCapacity) {
      alert('Vui lòng chọn thiết bị và nhập dung lượng để thêm.');
      return;
    }

    const capacity = parseInt(newStorageCapacity, 10);
    if (isNaN(capacity) || capacity <= 0) {
      alert('Dung lượng không hợp lệ. Vui lòng nhập một số dương.');
      return;
    }
    
    // Check if this storage capacity already exists for the selected device
    const existingStorage = deviceStorages.find(s => s.capacity === capacity);
    if (existingStorage) {
        alert('Dung lượng này đã được thêm vào thiết bị.');
        return;
    }

    try {
      await storageService.createStorage(selectedDevice, capacity);
      alert('Thêm dung lượng vào thiết bị thành công.');
      // Refresh the list of storages for the current device
      fetchDeviceStorages(selectedDevice); 
      // Clear the input
      setNewStorageCapacity('');
    } catch (error) {
      console.error(error);
      alert('Thêm dung lượng vào thiết bị thất bại.');
    }
  };

  const handleDeleteDeviceStorage = async (storageId: string) => {
    if (!selectedDevice) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa dung lượng này khỏi thiết bị không?')) {
      try {
        await deviceStorageService.removeDeviceStorage(selectedDevice, storageId);
        alert('Xóa dung lượng khỏi thiết bị thành công.');
        fetchDeviceStorages(selectedDevice);
      } catch (error: any) {
        console.error('Failed to delete device storage:', error, typeof error, JSON.stringify(error));
        if (error && error.status === 403) {
          alert(error.message || 'Bạn không có quyền xoá mục này');
        } else if (error?.message?.toLowerCase().includes('quyền')) {
          alert(error.message);
        } else if (typeof error === 'string' && error.toLowerCase().includes('quyền')) {
          alert(error);
        } else {
          const errorMessage = error?.message || 'Xóa dung lượng khỏi thiết bị không thành công';
          alert(errorMessage);
        }
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };
  
  const handleLimitChange = (newLimit: number) => {
    setPagination({ ...pagination, limit: newLimit, page: 1 });
  };

  const filteredDevices = devices.filter(d => 
    d.model.toLowerCase().includes(deviceSearchTerm.toLowerCase())
  );

  const availableStorages = storages.filter(s => 
    !deviceStorages.some(ds => ds.id === s.id) &&
    s.capacity.toString().toLowerCase().includes(storageSearchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Quản lý Dung lượng Thiết bị</h2>
      <div className="mb-4">
        <div className="relative w-full md:w-1/3" ref={deviceDropdownRef}>
            <input
                type="text"
                placeholder="Tìm kiếm hoặc chọn thiết bị..."
                className="w-full p-2 border rounded-lg bg-white"
                value={selectedDevice ? devices.find(d => d.id === selectedDevice)?.model || '' : deviceSearchTerm}
                onFocus={() => setIsDeviceDropdownOpen(true)}
                onChange={e => {
                    setDeviceSearchTerm(e.target.value);
                    setSelectedDevice(null);
                    if (!isDeviceDropdownOpen) setIsDeviceDropdownOpen(true);
                }}
            />
            {isDeviceDropdownOpen && (
                <div className="absolute z-20 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {filteredDevices.map(device => (
                        <div
                            key={device.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={() => {
                                setSelectedDevice(device.id);
                                setDeviceSearchTerm('');
                                setIsDeviceDropdownOpen(false);
                            }}
                        >
                            {device.model}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {selectedDevice && (
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="relative flex-grow">
              <input
                  type="number"
                  placeholder="Nhập dung lượng (ví dụ: 128)..."
                  className="w-full p-2 border rounded-lg"
                  value={newStorageCapacity}
                  onChange={e => setNewStorageCapacity(e.target.value)}
              />
            </div>
            <button
              onClick={handleAddDeviceStorage}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-blue-600 self-start"
            >
              <Plus size={18} className="mr-2" />
              Thêm dung lượng
            </button>
          </div>

          {loading ? (
             <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin" size={48} />
             </div>
          ) : (
            <>
              <div className="overflow-auto max-h-[60vh] bg-white rounded-lg shadow relative">
                <table className="min-w-full">
                    <thead className="sticky top-0 z-10 bg-gray-100 shadow-sm">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dung lượng</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {deviceStorages.map((storage) => (
                        <tr key={storage.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{storage.capacity} GB</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDeleteDeviceStorage(storage.id)} className="text-red-600 hover:text-red-900">
                                <Trash2 size={18} />
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4">
                  <div>
                      <select
                          value={urlLimit}
                          onChange={(e) => handleLimitChange(Number(e.target.value))}
                          className="px-3 py-1 rounded-lg bg-gray-200"
                      >
                          <option value={10}>10 / trang</option>
                          <option value={20}>20 / trang</option>
                          <option value={50}>50 / trang</option>
                      </select>
                  </div>
                  {pagination.totalPages > 1 && (
                  <div className="flex items-center">
                      <button 
                          onClick={() => handlePageChange(pagination.page - 1)} 
                          disabled={pagination.page <= 1}
                          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <ChevronLeft size={20} />
                      </button>
                      <span className="mx-2 text-sm">
                          Trang {pagination.page} / {pagination.totalPages}
                      </span>
                      <button 
                          onClick={() => handlePageChange(pagination.page + 1)} 
                          disabled={pagination.page >= pagination.totalPages}
                          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <ChevronRight size={20} />
                      </button>
                  </div>
                  )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceStorageTab;