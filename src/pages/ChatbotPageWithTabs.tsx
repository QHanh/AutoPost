import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Plus, Trash2, Edit, Save, X, Search, Database, FileDown, FileUp, Layers, Settings, Users, Palette, HardDrive, MoreVertical, Eye, Loader, ChevronLeft, ChevronRight, Upload, Download } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { DeviceInfo, Color, Storage, UserDevice, DeviceColor } from '../types/deviceTypes';
import { deviceColorService } from '../services/deviceColorService';
import { deviceInfoService } from '../services/deviceInfoService';
import { deviceApiService } from '../services/deviceApiService';
import { deviceStorageService } from '../services/deviceStorageService';

// Interfaces đã được chuyển sang file types/deviceTypes.ts

const ChatbotPageWithTabs: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // State cho tab hiện tại
  const [activeTab, setActiveTab] = useState<'devices' | 'colors' | 'storage' | 'settings' | 'device-colors' | 'device-infos' | 'device-storage'>('devices');

  // State cho thiết bị
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [isEditingDevice, setIsEditingDevice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State cho màu sắc
  const [colors, setColors] = useState<Color[]>([]);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);

  // State cho dung lượng
  const [storages, setStorages] = useState<Storage[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);

  // State cho thiết bị mới
  const [newDevice, setNewDevice] = useState<UserDevice>({
    device_info_id: '',
    color_id: '',
    storage_id: '',
    device_condition: 'Mới',
    device_type: 'Mới',
    price: 0,
    inventory: 1
  });

  // Tham chiếu đến input file ẩn
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thêm state cho tab device-color
  const [deviceColors, setDeviceColors] = useState<DeviceColor[]>([]);
  const [isDeviceColorModalOpen, setIsDeviceColorModalOpen] = useState(false);
  const [isDeviceColorLoading, setIsDeviceColorLoading] = useState(false);
  const [deviceColorFilter, setDeviceColorFilter] = useState('');
  const [deviceColorPagination, setDeviceColorPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [deviceColorModalData, setDeviceColorModalData] = useState<{ device_info_id: string; color_id: string }>({ device_info_id: '', color_id: '' });
  const [deviceOptions, setDeviceOptions] = useState<DeviceInfo[]>([]);
  const [colorOptions, setColorOptions] = useState<Color[]>([]);
  const [isDeviceColorOptionsLoading, setIsDeviceColorOptionsLoading] = useState(false);

  // Thêm state cho tab device-infos
  const [deviceInfos, setDeviceInfos] = useState<DeviceInfo[]>([]);
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isDeviceInfoModalOpen, setIsDeviceInfoModalOpen] = useState(false);
  const [isDeviceInfoLoading, setIsDeviceInfoLoading] = useState(false);
  const [deviceInfoFilter, setDeviceInfoFilter] = useState('');
  const [deviceInfoPagination, setDeviceInfoPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // State cho tab device-storage
  const [deviceStorages, setDeviceStorages] = useState<any[]>([]);
  const [isDeviceStorageModalOpen, setIsDeviceStorageModalOpen] = useState(false);
  const [isDeviceStorageLoading, setIsDeviceStorageLoading] = useState(false);
  const [selectedDeviceStorageDeviceId, setSelectedDeviceStorageDeviceId] = useState('');
  const [deviceStorageDevices, setDeviceStorageDevices] = useState<DeviceInfo[]>([]);
  const [deviceStorageStorages, setDeviceStorageStorages] = useState<any[]>([]);

  // State cho bảng thiết bị-dung lượng
  const [storageList, setStorageList] = useState<any[]>([]);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageSearch, setStorageSearch] = useState('');
  const [storagePagination, setStoragePagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDevices();
      fetchUserDevices();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedDevice) {
      fetchColors(selectedDevice.id);
      fetchStorages(selectedDevice.id);
    } else {
      setColors([]);
      setStorages([]);
    }
  }, [selectedDevice]);

  // Fetch device-colors khi tab này active
  useEffect(() => {
    if (activeTab === 'device-colors') {
      fetchDeviceColors();
    }
  }, [activeTab, deviceColorPagination.page, deviceColorFilter]);

  // Fetch device-infos khi tab này active
  useEffect(() => {
    if (activeTab === 'device-infos') {
      fetchDeviceInfos();
    }
  }, [activeTab, deviceInfoPagination.page, deviceInfoFilter]);

  // Fetch devices for device-storage tab
  useEffect(() => {
    if (activeTab === 'device-storage') {
      (async () => {
        setIsDeviceStorageLoading(true);
        try {
          const result = await deviceApiService.getDeviceInfos({}, { page: 1, limit: 100 });
          const devices = result.devices;
          // Lấy dung lượng cho từng thiết bị
          const devicesWithStorages = await Promise.all(
            devices.map(async (device: any) => {
              try {
                const storages = await deviceApiService.getDeviceStorages(device.id);
                return { ...device, storages };
              } catch {
                return { ...device, storages: [] };
              }
            })
          );
          setDeviceStorageDevices(devicesWithStorages);
        } catch (e) {
          setDeviceStorageDevices([]);
        } finally {
          setIsDeviceStorageLoading(false);
        }
      })();
    }
  }, [activeTab]);

  const handleAddDeviceStorage = () => {
    setIsDeviceStorageModalOpen(true);
  };

  const handleDeleteDeviceStorage = async (storageId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa liên kết thiết bị-dung lượng này?')) return;
    setIsDeviceStorageLoading(true);
    try {
      await deviceApiService.removeStorageFromDevice(storageId);
      fetchAllDeviceStorages(); // Cập nhật lại bảng tổng hợp
    } catch (e) {
      alert('Có lỗi xảy ra khi xóa liên kết thiết bị-dung lượng');
    } finally {
      setIsDeviceStorageLoading(false);
    }
  };

  const handleSaveDeviceStorage = async (formData: { device_info_id: string; capacity: number }) => {
    setIsDeviceStorageLoading(true);
    try {
      await deviceApiService.addStorageToDevice(formData.device_info_id, formData.capacity);
      setIsDeviceStorageModalOpen(false);
      fetchAllDeviceStorages(); // Cập nhật lại bảng tổng hợp
    } catch (e) {
      alert('Có lỗi xảy ra khi lưu liên kết thiết bị-dung lượng');
    } finally {
      setIsDeviceStorageLoading(false);
    }
  };

  // Hàm lấy danh sách thiết bị
  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/v1/device-infos?limit=100', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      console.log('Device API response:', data);
      if (data.data) {
        setDevices(data.data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  // Hàm lấy danh sách màu sắc theo thiết bị
  const fetchColors = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/v1/device-infos/${deviceId}/colors`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      console.log('Colors API response:', data);
      if (data.data) {
        setColors(data.data);
        setSelectedColor(null); // Reset selected color
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
      setColors([]);
    }
  };

  // Hàm lấy danh sách dung lượng theo thiết bị
  const fetchStorages = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/v1/device-infos/${deviceId}/storages`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      console.log('Storages API response:', data);
      if (data.data) {
        setStorages(data.data);
        setSelectedStorage(null); // Reset selected storage
      }
    } catch (error) {
      console.error('Error fetching storages:', error);
      setStorages([]);
    }
  };

  // Hàm lấy danh sách thiết bị của người dùng
  const fetchUserDevices = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return; // Chỉ gọi nếu có token
      
      // Sử dụng endpoint mới để lấy thiết bị của người dùng hiện tại
      const response = await fetch('http://localhost:8000/api/v1/user-devices/my-devices', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('User devices API response:', data);
      if (data.data) {
        // Sử dụng thông tin đã có trong response thay vì gọi API riêng
        const enrichedDevices = data.data.map((device: any) => {
          return {
            ...device,
            deviceModel: device.device_info ? device.device_info.model : 'Unknown',
            colorName: device.color ? device.color.name : 'Unknown',
            storageCapacity: device.device_storage ? device.device_storage.capacity : 0
          };
        });
        
        setUserDevices(enrichedDevices);
      }
    } catch (error) {
      console.error('Error fetching user devices:', error);
    }
  };

  const fetchDeviceInfos = async () => {
    setIsDeviceInfoLoading(true);
    try {
      const filter = { search: deviceInfoFilter };
      const pagination = { page: deviceInfoPagination.page, limit: deviceInfoPagination.limit };
      const result = await deviceInfoService.getDeviceInfos(filter, pagination);
      setDeviceInfos(result.devices);
      setDeviceInfoPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }));
    } catch (error) {
      console.error('Error fetching device infos:', error);
    } finally {
      setIsDeviceInfoLoading(false);
    }
  };

  const handleDeviceInfoSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeviceInfoFilter(e.target.value);
    setDeviceInfoPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateDeviceInfo = () => {
    setSelectedDeviceInfo(null);
    setIsDeviceInfoModalOpen(true);
  };

  const handleEditDeviceInfo = (device: DeviceInfo) => {
    setSelectedDeviceInfo(device);
    setIsDeviceInfoModalOpen(true);
  };

  const handleDeleteDeviceInfo = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      setIsDeviceInfoLoading(true);
      try {
        await deviceInfoService.deleteDeviceInfo(id);
        fetchDeviceInfos();
      } catch (error) {
        alert('Có lỗi xảy ra khi xóa thiết bị');
      } finally {
        setIsDeviceInfoLoading(false);
      }
    }
  };

  const handleSaveDeviceInfo = async (deviceData: Partial<DeviceInfo>) => {
    setIsDeviceInfoLoading(true);
    try {
      if (selectedDeviceInfo) {
        await deviceInfoService.updateDeviceInfo(selectedDeviceInfo.id, deviceData);
      } else {
        await deviceInfoService.createDeviceInfo(deviceData);
      }
      setIsDeviceInfoModalOpen(false);
      fetchDeviceInfos();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu thiết bị');
    } finally {
      setIsDeviceInfoLoading(false);
    }
  };

  const handleDeviceInfoPageChange = (newPage: number) => {
    setDeviceInfoPagination(prev => ({ ...prev, page: newPage }));
  };

  // Hàm thêm thiết bị mới
  const handleAddDevice = async () => {
    if (!selectedDevice || !selectedColor || !selectedStorage) {
      alert('Vui lòng chọn đầy đủ thông tin thiết bị, màu sắc và dung lượng');
      return;
    }

    const deviceToAdd = {
      ...newDevice,
      device_info_id: selectedDevice.id,
      color_id: selectedColor.id,
      storage_id: selectedStorage.id
      // Không gửi user_id nữa, backend sẽ lấy từ token
    };

    try {
      console.log('Sending device data:', deviceToAdd);
      console.log('Device data to be sent:', JSON.stringify(deviceToAdd, null, 2));
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/v1/user-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(deviceToAdd),
      });

      const data = await response.json();
      console.log('Add device API response:', data);
      if (data.data) {
        // Reset form
        console.log('Resetting form after successful device addition');
        
        setNewDevice({
          device_info_id: '',
          color_id: '',
          storage_id: '',
          device_condition: 'Mới',
          device_type: 'Mới',
          price: 0,
          inventory: 0
        });
        setSelectedDevice(null);
        setSelectedColor(null);
        setSelectedStorage(null);
        setIsAddingDevice(false);
        
        // Refresh user devices
        fetchUserDevices();
      }
    } catch (error) {
      console.error('Error adding device:', error);
    }
  };

  // Hàm cập nhật thiết bị
  const handleUpdateDevice = async (deviceId: string) => {
    const deviceToUpdate = userDevices.find(d => d.id === deviceId);
    if (!deviceToUpdate) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/v1/user-devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(deviceToUpdate),
      });

      const data = await response.json();
      console.log('Update device API response:', data);
      if (data.data) {
        setIsEditingDevice(null);
        fetchUserDevices();
      }
    } catch (error) {
      console.error('Error updating device:', error);
    }
  };

  // Hàm xóa thiết bị
  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/v1/user-devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Delete device API response:', data);
      if (data.data) {
        setUserDevices(userDevices.filter(d => d.id !== deviceId));
      }
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  // Lọc thiết bị theo từ khóa tìm kiếm
  const filteredDevices = devices.filter(device => 
    device.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hàm tải template Excel
  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Vui lòng đăng nhập để tải template');
        return;
      }

      // Gọi API tải template Excel
      const response = await fetch('http://localhost:8000/api/v1/user-devices/template', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Lỗi khi tải template Excel');
      }

      // Lấy dữ liệu blob từ response
      const blob = await response.blob();
      
      // Tạo URL cho blob
      const url = window.URL.createObjectURL(blob);
      
      // Tạo thẻ a để tải xuống
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_device_template.xlsx';
      document.body.appendChild(a);
      a.click();
      
      // Dọn dẹp
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Lỗi khi tải template Excel:', error);
      alert('Có lỗi xảy ra khi tải template Excel');
    }
  };

  // Hàm xử lý export Excel
  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Vui lòng đăng nhập để xuất dữ liệu');
        return;
      }

      // Gọi API xuất Excel
      const response = await fetch('http://localhost:8000/api/v1/user-devices/export/my-devices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Lỗi khi xuất dữ liệu Excel');
      }

      // Lấy dữ liệu blob từ response
      const blob = await response.blob();
      
      // Tạo URL cho blob
      const url = window.URL.createObjectURL(blob);
      
      // Tạo thẻ a để tải xuống
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_devices_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Dọn dẹp
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      alert('Có lỗi xảy ra khi xuất dữ liệu Excel');
    }
  };

  // Hàm xử lý khi chọn file để import
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Vui lòng đăng nhập để nhập dữ liệu');
        return;
      }

      // Tạo FormData
      const formData = new FormData();
      formData.append('file', file);

      // Gọi API import Excel
      const response = await fetch('http://localhost:8000/api/v1/user-devices/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('Import result:', result);

      if (response.ok) {
        // Nếu có lỗi chi tiết, hiển thị từng lỗi
        if (result.data && result.data.error > 0 && Array.isArray(result.data.errors) && result.data.errors.length > 0) {
          alert(
            `Có lỗi khi nhập dữ liệu!\nTổng số: ${result.data.total}\nThành công: ${result.data.success}\nCập nhật: ${result.data.updated_count}\nTạo mới: ${result.data.created_count}\nLỗi: ${result.data.error}\n\nChi tiết lỗi:\n` +
            result.data.errors.join('\n')
          );
        } else {
          alert(`Nhập dữ liệu thành công!\nTổng số: ${result.data.total}\nThành công: ${result.data.success}\nCập nhật: ${result.data.updated_count}\nTạo mới: ${result.data.created_count}\nLỗi: ${result.data.error}`);
        }
        // Làm mới danh sách thiết bị
        fetchUserDevices();
      } else {
        alert(`Lỗi khi nhập dữ liệu: ${result.message || 'Không xác định'}`);
      }
    } catch (error) {
      console.error('Lỗi khi import Excel:', error);
      alert('Có lỗi xảy ra khi nhập dữ liệu Excel');
    } finally {
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Hàm kích hoạt click vào input file ẩn
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Render tab Thiết bị
  const renderDevicesTab = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Smartphone className="text-blue-600" /> Thiết bị
          </h2>
          <div className="flex gap-2">
            {/* Nút Export Excel */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Xuất dữ liệu ra Excel"
            >
              <FileDown size={18} /> Xuất Excel
            </button>
            
            {/* Nút Import Excel */}
            <button
              onClick={triggerFileInput}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              title="Nhập dữ liệu từ Excel"
            >
              <FileUp size={18} /> Nhập Excel
            </button>
            
            {/* Input file ẩn */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".xlsx, .xls" 
              className="hidden" 
            />
            
            {/* Nút Thêm thiết bị */}
            <button
              onClick={() => setIsAddingDevice(!isAddingDevice)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isAddingDevice ? <X size={18} /> : <Plus size={18} />}
              {isAddingDevice ? 'Hủy' : 'Thêm thiết bị'}
            </button>
          </div>
        </div>

        {/* Add Device Form */}
        {isAddingDevice && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Thêm thiết bị mới</h3>
            {/* Hàng 1: Thiết bị, màu sắc, dung lượng */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Device Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thiết bị</label>
                {selectedDevice && (
                  <div className="mb-2"><span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">{selectedDevice.model}</span></div>
                )}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm thiết bị..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                  {filteredDevices.length > 0 ? (
                    filteredDevices.map(device => (
                      <div
                        key={device.id}
                        onClick={() => {
                          setSelectedDevice(device);
                          setSearchTerm('');
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedDevice?.id === device.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                      >
                        {device.model}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">Không tìm thấy thiết bị</div>
                  )}
                </div>
              </div>
              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                {selectedColor && (
                  <div className="mb-2"><span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">{selectedColor.name}</span></div>
                )}
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg bg-white">
                  {colors.length > 0 ? (
                    colors.map(color => (
                      <div
                        key={color.id}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedColor?.id === color.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                      >
                        {color.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">{selectedDevice ? 'Không có màu sắc' : 'Vui lòng chọn thiết bị trước'}</div>
                  )}
                </div>
              </div>
              {/* Storage Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dung lượng</label>
                {selectedStorage && (
                  <div className="mb-2"><span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">{selectedStorage.capacity} GB</span></div>
                )}
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg bg-white">
                  {storages.length > 0 ? (
                    storages.map(storage => (
                      <div
                        key={storage.id}
                        onClick={() => setSelectedStorage(storage)}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedStorage?.id === storage.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                      >
                        {storage.capacity} GB
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">{selectedDevice ? 'Không có dung lượng' : 'Vui lòng chọn thiết bị trước'}</div>
                  )}
                </div>
              </div>
            </div>
            {/* Hàng 2: Loại máy, tình trạng, tình trạng pin */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Device Type (Loại máy) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại máy</label>
                {newDevice.device_type && (
                  <div className="mb-2"><span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">{newDevice.device_type}</span></div>
                )}
                <select
                  value={newDevice.device_type}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === 'Mới') {
                      setNewDevice(prev => ({ ...prev, device_type: value, device_condition: 'Mới', battery_condition: '100%' }));
                    } else {
                      setNewDevice(prev => ({
                        ...prev,
                        device_type: value,
                        device_condition: prev.device_condition === 'Mới' ? '' : prev.device_condition,
                        battery_condition: prev.battery_condition === '100%' ? '' : prev.battery_condition
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Mới">Mới</option>
                  <option value="Cũ">Cũ</option>
                  <option value="Trưng bày">Trưng bày</option>
                </select>
              </div>
              {/* Device Condition (Tình trạng) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng</label>
                {newDevice.device_condition && (
                  <div className="mb-2"><span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">{newDevice.device_condition}</span></div>
                )}
                <input
                  type="text"
                  value={newDevice.device_condition}
                  onChange={e => setNewDevice(prev => ({ ...prev, device_condition: e.target.value }))}
                  placeholder="Nhập tình trạng thiết bị (VD: Mới, Đã qua sử dụng, ... )"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              {/* Battery Condition */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng pin</label>
                {newDevice.battery_condition && (
                  <div className="mb-2"><span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">{newDevice.battery_condition}</span></div>
                )}
                <input
                  type="text"
                  value={newDevice.battery_condition || ''}
                  onChange={e => setNewDevice(prev => ({ ...prev, battery_condition: e.target.value }))}
                  placeholder="Nhập tình trạng pin (VD: 100%, 90-99%, ... hoặc ghi chú khác)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
                <input
                  type="number"
                  value={newDevice.price}
                  onChange={(e) => setNewDevice({...newDevice, price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              
              {/* Inventory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
                <input
                  type="number"
                  value={newDevice.inventory}
                  onChange={(e) => setNewDevice({...newDevice, inventory: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              
              {/* Warranty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bảo hành</label>
                <input
                  type="text"
                  value={newDevice.warranty || ''}
                  onChange={(e) => setNewDevice({...newDevice, warranty: e.target.value})}
                  placeholder="VD: 12 tháng"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                value={newDevice.notes || ''}
                onChange={(e) => setNewDevice({...newDevice, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={2}
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleAddDevice}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={18} /> Lưu thiết bị
              </button>
            </div>
          </div>
        )}

        {/* Devices Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thiết bị</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màu sắc</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dung lượng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tình trạng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại thiết bị</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tình trạng pin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bảo hành</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá (VNĐ)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userDevices.length > 0 ? (
                userDevices.map(device => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {device.product_code || <span className="text-gray-500 italic">Không có</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium">{device.deviceModel || 'Không xác định'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {device.colorName ? (
                        <span className="inline-block px-2 py-1 rounded bg-gray-100">{device.colorName}</span>
                      ) : (
                        <span className="text-gray-500 italic">Không xác định</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {device.storageCapacity ? (
                        <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                          {device.storageCapacity} GB
                        </span>
                      ) : (
                        <span className="text-gray-500 italic">Không xác định</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditingDevice === device.id ? (
                        <select
                          value={device.device_condition}
                          onChange={(e) => {
                            const updatedDevices = userDevices.map(d => 
                              d.id === device.id ? {...d, device_condition: e.target.value} : d
                            );
                            setUserDevices(updatedDevices);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Mới">Mới</option>
                          <option value="Đã qua sử dụng">Đã qua sử dụng</option>
                          <option value="Tân trang">Tân trang</option>
                        </select>
                      ) : (
                        device.device_condition
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditingDevice === device.id ? (
                        <select
                          value={device.device_type}
                          onChange={(e) => {
                            const updatedDevices = userDevices.map(d => 
                              d.id === device.id ? {...d, device_type: e.target.value} : d
                            );
                            setUserDevices(updatedDevices);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Mới">Mới</option>
                          <option value="Cũ">Cũ</option>
                          <option value="Tân trang">Tân trang</option>
                        </select>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded bg-gray-100">{device.device_type}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditingDevice === device.id ? (
                        <input
                          type="text"
                          value={device.battery_condition || ''}
                          onChange={(e) => {
                            const updatedDevices = userDevices.map(d => 
                              d.id === device.id ? {...d, battery_condition: e.target.value} : d
                            );
                            setUserDevices(updatedDevices);
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="VD: 100%, 90-99%, ..."
                        />
                      ) : (
                        <span>{device.battery_condition || 'Không xác định'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditingDevice === device.id ? (
                        <input
                          type="text"
                          value={device.warranty || ''}
                          onChange={(e) => {
                            const updatedDevices = userDevices.map(d => 
                              d.id === device.id ? {...d, warranty: e.target.value} : d
                            );
                            setUserDevices(updatedDevices);
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="VD: 12"
                        />
                      ) : (
                        <span>{device.warranty ? `${device.warranty} tháng` : 'Không có'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditingDevice === device.id ? (
                        <input
                          type="number"
                          value={device.price}
                          onChange={(e) => {
                            const updatedDevices = userDevices.map(d => 
                              d.id === device.id ? {...d, price: parseFloat(e.target.value)} : d
                            );
                            setUserDevices(updatedDevices);
                          }}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        new Intl.NumberFormat('vi-VN').format(device.price)
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditingDevice === device.id ? (
                        <input
                          type="number"
                          value={device.inventory}
                          onChange={(e) => {
                            const updatedDevices = userDevices.map(d => 
                              d.id === device.id ? {...d, inventory: parseInt(e.target.value)} : d
                            );
                            setUserDevices(updatedDevices);
                          }}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        device.inventory
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditingDevice === device.id ? (
                        <input
                          type="text"
                          value={device.notes || ''}
                          onChange={(e) => {
                            const updatedDevices = userDevices.map(d => 
                              d.id === device.id ? {...d, notes: e.target.value} : d
                            );
                            setUserDevices(updatedDevices);
                          }}
                          className="w-32 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-600">{device.notes || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {isEditingDevice === device.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleUpdateDevice(device.id!)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Lưu"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => setIsEditingDevice(null)}
                            className="p-1 text-gray-600 hover:text-gray-800"
                            title="Hủy"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setIsEditingDevice(device.id!)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteDevice(device.id!)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="px-4 py-4 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Database className="text-gray-400 mb-2" size={32} />
                      <p>Chưa có thiết bị nào. Hãy thêm thiết bị mới!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // State cho quản lý màu sắc
  const [colorList, setColorList] = useState<Color[]>([]);
  const [selectedColorForEdit, setSelectedColorForEdit] = useState<Color | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isColorDetailModalOpen, setIsColorDetailModalOpen] = useState(false);
  const [isColorLoading, setIsColorLoading] = useState(false);
  const [isColorDeleting, setIsColorDeleting] = useState(false);
  const [colorFilter, setColorFilter] = useState('');
  const [colorPagination, setColorPagination] = useState({
    page: 1,
    limit: 31,
    total: 0,
    totalPages: 0
  });

  // Fetch colors khi component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchColorList();
    }
  }, [isAuthenticated, user, colorPagination.page, colorPagination.limit, colorFilter]);

  const fetchColorList = async () => {
    setIsColorLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const skip = (colorPagination.page - 1) * colorPagination.limit;
      const limit = colorPagination.limit;
      const searchParam = colorFilter ? `&search=${encodeURIComponent(colorFilter)}` : '';
      
      const response = await fetch(`http://localhost:8000/api/v1/colors?skip=${skip}&limit=${limit}${searchParam}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      
      if (data.data) {
        setColorList(data.data);
        setColorPagination(prev => ({
          ...prev,
          total: data.metadata?.total || data.data.length,
          totalPages: data.metadata?.total_pages || Math.ceil((data.metadata?.total || data.data.length) / limit)
        }));
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    } finally {
      setIsColorLoading(false);
    }
  };

  const handleColorSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColorFilter(e.target.value);
    setColorPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateColor = () => {
    setSelectedColorForEdit(null);
    setIsColorModalOpen(true);
  };

  const handleEditColor = (color: Color) => {
    setSelectedColorForEdit(color);
    setIsColorModalOpen(true);
  };

  const handleViewColor = (color: Color) => {
    setSelectedColorForEdit(color);
    setIsColorDetailModalOpen(true);
  };

  const handleDeleteColor = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa màu sắc này?')) {
      setIsColorDeleting(true);
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`http://localhost:8000/api/v1/colors/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
              if (response.ok) {
        fetchColorList();
      } else {
        alert('Có lỗi xảy ra khi xóa màu sắc');
      }
      } catch (error) {
        console.error('Error deleting color:', error);
        alert('Có lỗi xảy ra khi xóa màu sắc');
      } finally {
        setIsColorDeleting(false);
      }
    }
  };

  const handleSaveColor = async (colorData: Partial<Color>) => {
    setIsColorLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      let response;
      
      if (selectedColorForEdit) {
        // Update existing color
        response = await fetch(`http://localhost:8000/api/v1/colors/${selectedColorForEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(colorData),
        });
      } else {
        // Create new color
        response = await fetch('http://localhost:8000/api/v1/colors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(colorData),
        });
      }
      
      if (response.ok) {
        setIsColorModalOpen(false);
        fetchColorList();
      } else {
        alert('Có lỗi xảy ra khi lưu màu sắc');
      }
    } catch (error) {
      console.error('Error saving color:', error);
      alert('Có lỗi xảy ra khi lưu màu sắc');
    } finally {
      setIsColorLoading(false);
    }
  };

  const handleColorPageChange = (newPage: number) => {
    setColorPagination(prev => ({ ...prev, page: newPage }));
  };

  // Color Row Component
  const ColorRow: React.FC<{
    color: Color;
    onEdit: (color: Color) => void;
    onDelete: (id: string) => void;
    onView: (color: Color) => void;
  }> = ({ color, onEdit, onDelete, onView }) => {
    const [showActions, setShowActions] = useState(false);

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 h-10 w-10 rounded-md border border-gray-200" 
              style={{ backgroundColor: color.hex_code }}
            />
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{color.name}</div>
              <div className="text-sm text-gray-500">{color.hex_code}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(color.created_at).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(color.updated_at).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-gray-400 hover:text-gray-600"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onView(color);
                      setShowActions(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </button>
                  <button
                    onClick={() => {
                      onEdit(color);
                      setShowActions(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      onDelete(color.id);
                      setShowActions(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </button>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Color Modal Component
  const ColorModal: React.FC<{
    color: Color | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (color: Partial<Color>) => void;
    isLoading: boolean;
  }> = ({ color, isOpen, onClose, onSave, isLoading }) => {
    const [formData, setFormData] = useState<Partial<Color>>({
      name: '',
      hex_code: '#000000'
    });

    useEffect(() => {
      if (color) {
        setFormData({
          name: color.name || '',
          hex_code: color.hex_code || '#000000'
        });
      } else {
        setFormData({
          name: '',
          hex_code: '#000000'
        });
      }
    }, [color]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">
              {color ? 'Chỉnh sửa màu sắc' : 'Thêm màu sắc mới'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên màu</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Mã màu (HEX)</label>
                <div className="flex mt-1">
                  <input
                    type="color"
                    name="hex_code"
                    value={formData.hex_code}
                    onChange={handleChange}
                    className="h-10 w-10 border border-gray-300 rounded-md shadow-sm p-0"
                  />
                  <input
                    type="text"
                    name="hex_code"
                    value={formData.hex_code}
                    onChange={handleChange}
                    className="ml-2 flex-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    title="Mã màu HEX hợp lệ (ví dụ: #FF5733)"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Xem trước</label>
                <div className="mt-1 flex items-center">
                  <div 
                    className="h-16 w-16 rounded-md border border-gray-300" 
                    style={{ backgroundColor: formData.hex_code }}
                  />
                  <div className="ml-4">
                    <p className="text-sm font-medium">{formData.name || 'Tên màu'}</p>
                    <p className="text-sm text-gray-500">{formData.hex_code}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 flex items-center"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Color Detail Modal Component
  const ColorDetailModal: React.FC<{
    color: Color | null;
    isOpen: boolean;
    onClose: () => void;
  }> = ({ color, isOpen, onClose }) => {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [deviceFilter, setDeviceFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
      if (color && isOpen) {
        fetchColorDetails(color.id);
      }
    }, [color, isOpen]);

    const fetchColorDetails = async (colorId: string) => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`http://localhost:8000/api/v1/colors/${colorId}/devices`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        setDevices(data.data || []);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error fetching color details:', error);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    // Filter devices based on search input
    const filteredDevices = devices.filter(device => {
      const searchTerm = deviceFilter.toLowerCase();
      return (
        device.name?.toLowerCase().includes(searchTerm) ||
        device.brand?.toLowerCase().includes(searchTerm) ||
        device.model?.toLowerCase().includes(searchTerm)
      );
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentDevices = filteredDevices.slice(indexOfFirstItem, indexOfLastItem);

    if (!isOpen || !color) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Chi tiết màu sắc</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center mb-8 gap-6">
              <div 
                className="h-32 w-32 rounded-md border border-gray-300 flex-shrink-0" 
                style={{ backgroundColor: color.hex_code }}
              />
              <div className="flex-grow">
                <h3 className="text-2xl font-bold mb-2">{color.name}</h3>
                <p className="text-gray-600 mb-4">{color.hex_code}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Ngày tạo</p>
                    <p className="font-medium">{new Date(color.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                    <p className="font-medium">{new Date(color.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <h4 className="text-lg font-medium">Thiết bị sử dụng màu này</h4>
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm thiết bị..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={deviceFilter}
                    onChange={(e) => {
                      setDeviceFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-40 bg-gray-50 rounded-md">
                  <Loader className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : filteredDevices.length > 0 ? (
                <div className="bg-white rounded-md overflow-hidden border border-gray-200 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thiết bị
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thương hiệu
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Model
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentDevices.map(device => (
                          <tr key={device.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {device.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {device.brand}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {device.model}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                      <div className="text-sm text-gray-700">
                        Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">
                          {Math.min(indexOfLastItem, filteredDevices.length)}
                        </span> trong <span className="font-medium">{filteredDevices.length}</span> kết quả
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-md text-center">
                  <p className="text-gray-500">Không có thiết bị nào sử dụng màu này</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t p-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render tab Màu sắc
  const renderColorsTab = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Palette className="text-blue-600" /> Quản lý màu sắc
          </h2>
          <button
            onClick={handleCreateColor}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm màu sắc
          </button>
        </div>
        
        <div className="mb-5 flex justify-between">
          <div className="relative max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm màu sắc..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={colorFilter}
              onChange={handleColorSearch}
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => alert('Tính năng đang phát triển')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <button
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => alert('Tính năng đang phát triển')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Màu sắc
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cập nhật lần cuối
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isColorLoading && colorList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <Loader className="h-5 w-5 text-blue-500 animate-spin mr-3" />
                      <span>Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : colorList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Không có màu sắc nào
                  </td>
                </tr>
              ) : (
                colorList.map(color => (
                  <ColorRow
                    key={color.id}
                    color={color}
                    onEdit={handleEditColor}
                    onDelete={handleDeleteColor}
                    onView={handleViewColor}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {colorList.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{(colorPagination.page - 1) * colorPagination.limit + 1}</span> đến <span className="font-medium">
                {Math.min(colorPagination.page * colorPagination.limit, colorPagination.total)}
              </span> trong <span className="font-medium">{colorPagination.total}</span> kết quả
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleColorPageChange(colorPagination.page - 1)}
                disabled={colorPagination.page === 1}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${colorPagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleColorPageChange(colorPagination.page + 1)}
                disabled={colorPagination.page === colorPagination.totalPages}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${colorPagination.page === colorPagination.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Color Modal */}
        <ColorModal
          color={selectedColorForEdit}
          isOpen={isColorModalOpen}
          onClose={() => setIsColorModalOpen(false)}
          onSave={handleSaveColor}
          isLoading={isColorLoading}
        />
        
        {/* Color Detail Modal */}
        <ColorDetailModal
          color={selectedColorForEdit}
          isOpen={isColorDetailModalOpen}
          onClose={() => setIsColorDetailModalOpen(false)}
        />
      </div>
    );
  };

  // Render tab Dung lượng
  const renderStorageTab = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <HardDrive className="text-blue-600" /> Quản lý dung lượng
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10">
          <HardDrive className="text-gray-400 mb-4" size={48} />
          <p className="text-lg text-gray-600 mb-2">Tính năng đang được phát triển</p>
          <p className="text-gray-500">Chức năng quản lý dung lượng sẽ sớm được cập nhật.</p>
        </div>
      </div>
    );
  };

  // Render tab Cài đặt
  const renderSettingsTab = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="text-blue-600" /> Cài đặt
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10">
          <Settings className="text-gray-400 mb-4" size={48} />
          <p className="text-lg text-gray-600 mb-2">Tính năng đang được phát triển</p>
          <p className="text-gray-500">Chức năng cài đặt sẽ sớm được cập nhật.</p>
        </div>
      </div>
    );
  };

  // Render tab Thiết bị - Màu sắc
  const renderDeviceColorsTab = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Smartphone className="text-blue-600" /> + <Palette className="text-blue-600" /> Thiết bị - Màu sắc
        </h2>
        <button
          onClick={handleCreateDeviceColor}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Thêm liên kết
        </button>
      </div>
      <div className="mb-5 flex justify-between">
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm thiết bị hoặc màu sắc..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={deviceColorFilter}
            onChange={handleDeviceColorSearch}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thiết bị</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màu sắc</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isDeviceColorLoading && deviceColors.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">Đang tải...</td></tr>
            ) : deviceColors.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Không có liên kết nào</td></tr>
            ) : (
              deviceColors.map(dc => (
                <tr key={dc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{dc.device_info?.model || dc.device_info_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{dc.color?.name || dc.color_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(dc.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleDeleteDeviceColor(dc.id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {deviceColors.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">{(deviceColorPagination.page - 1) * deviceColorPagination.limit + 1}</span> đến <span className="font-medium">{Math.min(deviceColorPagination.page * deviceColorPagination.limit, deviceColorPagination.total)}</span> trong <span className="font-medium">{deviceColorPagination.total}</span> kết quả
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleDeviceColorPageChange(deviceColorPagination.page - 1)}
              disabled={deviceColorPagination.page === 1}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${deviceColorPagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeviceColorPageChange(deviceColorPagination.page + 1)}
              disabled={deviceColorPagination.page === deviceColorPagination.totalPages}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${deviceColorPagination.page === deviceColorPagination.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* DeviceColorModal chỉ render ở đây */}
      <DeviceColorModal
        isOpen={isDeviceColorModalOpen}
        onClose={() => setIsDeviceColorModalOpen(false)}
        onSave={handleSaveDeviceColor}
        isLoading={isDeviceColorLoading}
        deviceOptions={deviceOptions}
        colorOptions={colorOptions}
        formData={deviceColorModalData}
        setFormData={setDeviceColorModalData}
        isOptionsLoading={isDeviceColorOptionsLoading}
      />
    </div>
  );

  const handleCreateDeviceColor = () => {
    setIsDeviceColorModalOpen(true);
  };

  // Device-color handlers
  const fetchDeviceColors = async () => {
    setIsDeviceColorLoading(true);
    try {
      const skip = (deviceColorPagination.page - 1) * deviceColorPagination.limit;
      const limit = deviceColorPagination.limit;
      const result = await deviceColorService.getAllDeviceColors(skip, limit, deviceColorFilter);
      setDeviceColors(result.data);
      setDeviceColorPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages
      }));
    } catch (error) {
      console.error('Error fetching device colors:', error);
    } finally {
      setIsDeviceColorLoading(false);
    }
  };

  const handleDeviceColorSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeviceColorFilter(e.target.value);
    setDeviceColorPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDeleteDeviceColor = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa liên kết thiết bị-màu sắc này?')) {
      setIsDeviceColorLoading(true);
      try {
        await deviceColorService.deleteDeviceColor(id);
        fetchDeviceColors();
      } catch (error) {
        alert('Có lỗi xảy ra khi xóa liên kết thiết bị-màu sắc');
      } finally {
        setIsDeviceColorLoading(false);
      }
    }
  };

  const handleDeviceColorPageChange = (newPage: number) => {
    setDeviceColorPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSaveDeviceColor = async () => {
    setIsDeviceColorLoading(true);
    try {
      await deviceColorService.createDeviceColor(deviceColorModalData);
      setIsDeviceColorModalOpen(false);
      fetchDeviceColors();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu liên kết thiết bị-màu sắc');
    } finally {
      setIsDeviceColorLoading(false);
    }
  };

  // Khi mở modal, fetch danh sách thiết bị
  useEffect(() => {
    if (isDeviceColorModalOpen) {
      (async () => {
        setIsDeviceColorOptionsLoading(true);
        try {
          const token = localStorage.getItem('auth_token');
          const deviceRes = await fetch('http://localhost:8000/api/v1/device-infos?limit=100', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          });
          const deviceData = await deviceRes.json();
          setDeviceOptions(deviceData.data || []);
          // Set default device
          setDeviceColorModalData({ device_info_id: deviceData.data?.[0]?.id || '', color_id: '' });
        } catch (err) {
          setDeviceOptions([]);
          setDeviceColorModalData({ device_info_id: '', color_id: '' });
        } finally {
          setIsDeviceColorOptionsLoading(false);
        }
      })();
    }
  }, [isDeviceColorModalOpen]);

  // Khi chọn thiết bị, fetch danh sách màu và loại bỏ màu đã liên kết
  useEffect(() => {
    const fetchColorsForDevice = async (deviceId: string) => {
      setIsDeviceColorOptionsLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        // Lấy tất cả màu
        const colorRes = await fetch('http://localhost:8000/api/v1/colors?limit=100', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const colorData = await colorRes.json();
        // Lấy các màu đã liên kết với thiết bị này
        const linkedRes = await fetch(`http://localhost:8000/api/v1/device-colors/device/${deviceId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const linkedData = await linkedRes.json();
        const linkedColorIds = new Set((linkedData.data || []).map((dc: any) => dc.color_id));
        // Lọc màu chưa liên kết
        const availableColors = (colorData.data || []).filter((color: Color) => !linkedColorIds.has(color.id));
        setColorOptions(availableColors);
        setDeviceColorModalData(prev => ({ ...prev, color_id: availableColors[0]?.id || '' }));
      } catch (err) {
        setColorOptions([]);
        setDeviceColorModalData(prev => ({ ...prev, color_id: '' }));
      } finally {
        setIsDeviceColorOptionsLoading(false);
      }
    };
    if (deviceColorModalData.device_info_id) {
      fetchColorsForDevice(deviceColorModalData.device_info_id);
    } else {
      setColorOptions([]);
      setDeviceColorModalData(prev => ({ ...prev, color_id: '' }));
    }
  }, [deviceColorModalData.device_info_id]);

  // DeviceColorModal riêng cho user
  const DeviceColorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isLoading: boolean;
    deviceOptions: DeviceInfo[];
    colorOptions: Color[];
    formData: { device_info_id: string; color_id: string };
    setFormData: React.Dispatch<React.SetStateAction<{ device_info_id: string; color_id: string }>>;
    isOptionsLoading: boolean;
  }> = ({ isOpen, onClose, onSave, isLoading, deviceOptions, colorOptions, formData, setFormData, isOptionsLoading }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Thêm liên kết thiết bị - màu sắc</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          {isOptionsLoading ? (
            <div className="p-4 flex justify-center items-center h-40">
              <Loader className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); onSave(); }} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thiết bị</label>
                  <select
                    name="device_info_id"
                    value={formData.device_info_id}
                    onChange={e => setFormData(prev => ({ ...prev, device_info_id: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    {deviceOptions.length === 0 ? (
                      <option value="" disabled>Không có thiết bị nào</option>
                    ) : (
                      deviceOptions.map(device => (
                        <option key={device.id} value={device.id}>{device.model}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Màu sắc</label>
                  <select
                    name="color_id"
                    value={formData.color_id}
                    onChange={e => setFormData(prev => ({ ...prev, color_id: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                    disabled={colorOptions.length === 0}
                  >
                    {colorOptions.length === 0 ? (
                      <option value="" disabled>Không có màu sắc khả dụng</option>
                    ) : (
                      colorOptions.map(color => (
                        <option key={color.id} value={color.id}>{color.name} ({color.hex_code})</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.device_info_id || !formData.color_id}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 flex items-center"
                >
                  {isLoading ? (<><Loader className="h-4 w-4 mr-2 animate-spin" />Đang xử lý...</>) : (<><Save className="h-4 w-4 mr-2" />Lưu</>)}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // DeviceInfoModal
  const DeviceInfoModal: React.FC<{
    device: DeviceInfo | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (device: Partial<DeviceInfo>) => void;
    isLoading: boolean;
  }> = ({ device, isOpen, onClose, onSave, isLoading }) => {
    const [formData, setFormData] = useState<Partial<DeviceInfo>>({
      model: '',
      release_date: '',
      screen: '',
      chip_ram: '',
      camera: '',
      battery: '',
      connectivity_os: '',
      color_english: '',
      dimensions_weight: '',
      warranty: ''
    });

    useEffect(() => {
      if (device) {
        setFormData({
          model: device.model || '',
          release_date: device.release_date || '',
          screen: device.screen || '',
          chip_ram: device.chip_ram || '',
          camera: device.camera || '',
          battery: device.battery || '',
          connectivity_os: device.connectivity_os || '',
          color_english: device.color_english || '',
          dimensions_weight: device.dimensions_weight || '',
          warranty: device.warranty || ''
        });
      } else {
        setFormData({
          model: '',
          release_date: '',
          screen: '',
          chip_ram: '',
          camera: '',
          battery: '',
          connectivity_os: '',
          color_english: '',
          dimensions_weight: '',
          warranty: ''
        });
      }
    }, [device]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">
              {device ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4">
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày ra mắt</label>
                <input
                  type="text"
                  name="release_date"
                  value={formData.release_date}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Màn hình</label>
                <input
                  type="text"
                  name="screen"
                  value={formData.screen}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Chip & RAM</label>
                <input
                  type="text"
                  name="chip_ram"
                  value={formData.chip_ram}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Camera</label>
                <input
                  type="text"
                  name="camera"
                  value={formData.camera}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pin</label>
                <input
                  type="text"
                  name="battery"
                  value={formData.battery}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kết nối & Hệ điều hành</label>
                <input
                  type="text"
                  name="connectivity_os"
                  value={formData.connectivity_os}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Màu sắc (tiếng Anh)</label>
                <input
                  type="text"
                  name="color_english"
                  value={formData.color_english}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kích thước & Trọng lượng</label>
                <input
                  type="text"
                  name="dimensions_weight"
                  value={formData.dimensions_weight}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bảo hành</label>
                <input
                  type="text"
                  name="warranty"
                  value={formData.warranty}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 flex items-center"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render tab Thiết bị (device-infos)
  const renderDeviceInfosTab = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Smartphone className="text-blue-600" /> Thiết bị mẫu
        </h2>
        <button
          onClick={handleCreateDeviceInfo}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Thêm thiết bị mẫu
        </button>
      </div>
      <div className="mb-5 flex justify-between">
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm thiết bị..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={deviceInfoFilter}
            onChange={handleDeviceInfoSearch}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màn hình</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày ra mắt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isDeviceInfoLoading && deviceInfos.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Đang tải...</td></tr>
            ) : deviceInfos.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Không có thiết bị nào</td></tr>
            ) : (
              deviceInfos.map(device => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{device.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{device.screen || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{device.release_date || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(device.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleEditDeviceInfo(device)} className="text-blue-600 hover:text-blue-800 mr-2"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteDeviceInfo(device.id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {deviceInfos.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">{(deviceInfoPagination.page - 1) * deviceInfoPagination.limit + 1}</span> đến <span className="font-medium">{Math.min(deviceInfoPagination.page * deviceInfoPagination.limit, deviceInfoPagination.total)}</span> trong <span className="font-medium">{deviceInfoPagination.total}</span> kết quả
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleDeviceInfoPageChange(deviceInfoPagination.page - 1)}
              disabled={deviceInfoPagination.page === 1}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${deviceInfoPagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeviceInfoPageChange(deviceInfoPagination.page + 1)}
              disabled={deviceInfoPagination.page === deviceInfoPagination.totalPages}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${deviceInfoPagination.page === deviceInfoPagination.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* DeviceInfoModal */}
      <DeviceInfoModal
        device={selectedDeviceInfo}
        isOpen={isDeviceInfoModalOpen}
        onClose={() => setIsDeviceInfoModalOpen(false)}
        onSave={handleSaveDeviceInfo}
        isLoading={isDeviceInfoLoading}
      />
    </div>
  );

  // Render tab Thiết bị - Dung lượng
  const renderDeviceStorageTab = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Smartphone className="text-blue-600" /> + <Database className="text-blue-600" /> Thiết bị - Dung lượng
        </h2>
        <button
          onClick={handleAddDeviceStorage}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Thêm dung lượng cho thiết bị
        </button>
      </div>
      <div className="mb-5 flex justify-between">
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm thiết bị..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={storageSearch}
            onChange={handleStorageSearch}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thiết bị</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dung lượng</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {storageLoading && storageList.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center">Đang tải...</td></tr>
            ) : storageList.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Không có liên kết thiết bị-dung lượng nào</td></tr>
            ) : (
              storageList.map((item: any) => (
                <tr key={item.storage_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{item.device_model}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.capacity} GB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleDeleteDeviceStorage(item.storage_id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {storageList.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Hiển thị <span className="font-medium">{(storagePagination.page - 1) * storagePagination.limit + 1}</span> đến <span className="font-medium">
              {Math.min(storagePagination.page * storagePagination.limit, storagePagination.total)}
            </span> trong <span className="font-medium">{storagePagination.total}</span> kết quả
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleStoragePageChange(storagePagination.page - 1)}
              disabled={storagePagination.page === 1}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${storagePagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleStoragePageChange(storagePagination.page + 1)}
              disabled={storagePagination.page === storagePagination.totalPages}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${storagePagination.page === storagePagination.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* DeviceStorageModal */}
      <DeviceStorageModal
        isOpen={isDeviceStorageModalOpen}
        onClose={() => setIsDeviceStorageModalOpen(false)}
        onSave={handleSaveDeviceStorage}
        isLoading={isDeviceStorageLoading}
        devices={deviceStorageDevices}
      />
    </div>
  );

  const DeviceStorageModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: { device_info_id: string; capacity: number }) => void;
    isLoading: boolean;
    devices: DeviceInfo[];
  }> = ({ isOpen, onClose, onSave, isLoading, devices }) => {
    const [formData, setFormData] = useState<{ device_info_id: string; capacity: number | '' }>({
      device_info_id: devices[0]?.id || '',
      capacity: ''
    });
    useEffect(() => {
      if (isOpen && devices.length > 0) {
        setFormData({ device_info_id: devices[0].id, capacity: '' });
      }
    }, [isOpen, devices]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: name === 'capacity' ? (value === '' ? '' : Number(value)) : value }));
    };
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.device_info_id && formData.capacity) {
        onSave({ device_info_id: formData.device_info_id, capacity: Number(formData.capacity) });
      }
    };
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Thêm dung lượng cho thiết bị</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Thiết bị</label>
                <select
                  name="device_info_id"
                  value={formData.device_info_id}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  {devices.length === 0 ? (
                    <option value="" disabled>Không có thiết bị nào</option>
                  ) : (
                    devices.map(device => (
                      <option key={device.id} value={device.id}>{device.model}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dung lượng (GB)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  min={1}
                  required
                  placeholder="Nhập dung lượng (GB)"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.device_info_id || !formData.capacity}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 flex items-center"
              >
                {isLoading ? (<><Loader className="h-4 w-4 mr-2 animate-spin" />Đang xử lý...</>) : (<><Save className="h-4 w-4 mr-2" />Lưu</>)}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Khi mở form thêm thiết bị mới, set mặc định nếu loại máy là 'Mới'
  useEffect(() => {
    if (isAddingDevice) {
      setNewDevice(prev => {
        let updates = { ...prev };
        if (!prev.device_type) updates.device_type = 'Mới';
        if (updates.device_type === 'Mới') {
          if (!updates.device_condition) updates.device_condition = 'Mới';
          if (!updates.battery_condition) updates.battery_condition = '100%';
        }
        return updates;
      });
    }
  }, [isAddingDevice]);

  // Fetch dữ liệu thiết bị-dung lượng
  const fetchAllDeviceStorages = async () => {
    setStorageLoading(true);
    try {
      const result = await deviceStorageService.getAllDeviceStorages(storageSearch, storagePagination.page, storagePagination.limit);
      setStorageList(result.data);
      setStoragePagination(prev => ({
        ...prev,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }));
    } catch (e) {
      setStorageList([]);
    } finally {
      setStorageLoading(false);
    }
  };

  // Đảm bảo fetchAllDeviceStorages được gọi khi tab device-storage được kích hoạt
  useEffect(() => {
    if (activeTab === 'device-storage') {
      console.log('Fetching device storages...');
      fetchAllDeviceStorages();
    }
  }, [activeTab, storagePagination.page, storageSearch]);

  const handleStorageSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStorageSearch(e.target.value);
    setStoragePagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStoragePageChange = (newPage: number) => {
    setStoragePagination(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Quản lý <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Thiết bị</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Thêm và quản lý các thiết bị điện thoại trong cửa hàng của bạn
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm ${activeTab === 'devices' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Smartphone size={18} /> Thiết bị
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm ${activeTab === 'colors' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Palette size={18} /> Màu sắc
          </button>
          <button
            onClick={() => setActiveTab('device-colors')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm ${activeTab === 'device-colors' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Smartphone size={18} /> + <Palette size={18} /> Thiết bị - Màu sắc
          </button>
          <button
            onClick={() => setActiveTab('device-infos')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm ${activeTab === 'device-infos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Smartphone size={18} /> Thiết bị mẫu
          </button>
          <button
            onClick={() => setActiveTab('device-storage')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm ${activeTab === 'device-storage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Smartphone size={18} /> + <Database size={18} /> Thiết bị - Dung lượng
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'devices' && renderDevicesTab()}
        {activeTab === 'colors' && renderColorsTab()}
        {activeTab === 'device-colors' && renderDeviceColorsTab()}
        {activeTab === 'device-infos' && renderDeviceInfosTab()}
        {activeTab === 'device-storage' && renderDeviceStorageTab()}
      </main>
    </div>
  );
};

export default ChatbotPageWithTabs;