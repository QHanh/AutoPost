import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Plus, Trash2, Edit, Save, X, Search, Database, FileDown, FileUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface DeviceInfo {
  id: string;
  model: string;
  release_date?: string;
  screen?: string;
  chip_ram?: string;
  camera?: string;
  battery?: string;
  connectivity_os?: string;
}

interface Color {
  id: string;
  name: string;
}

interface Storage {
  id: string;
  device_info_id: string;
  capacity: number;
}

interface UserDevice {
  id?: string;
  user_id?: string; // Làm cho user_id trở thành tùy chọn vì sẽ được lấy từ token ở backend
  device_info_id: string;
  color_id: string;
  storage_id: string;
  device_storage_id?: string;
  warranty?: string;
  device_condition: string;
  device_type: string;
  battery_condition?: string;
  price: number;
  inventory: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Thông tin hiển thị
  deviceModel?: string;
  colorName?: string;
  storageCapacity?: number;
  // Thông tin từ API
  device_info?: DeviceInfo;
  color?: Color;
  device_storage?: Storage;
  product_code?: string; // Thêm product_code vào interface
}

export const ChatbotPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [storages, setStorages] = useState<Storage[]>([]);
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [isEditingDevice, setIsEditingDevice] = useState<string | null>(null);
  
  const [newDevice, setNewDevice] = useState<UserDevice>({
    device_info_id: '',
    color_id: '',
    storage_id: '',
    device_condition: 'Mới',
    device_type: 'Mới',
    price: 0,
    inventory: 0
  });
  
  // Không cần cập nhật user_id nữa vì sẽ sử dụng token để xác thực ở backend

  // Fetch devices, colors, and user devices on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDevices();
      fetchUserDevices();
    }
  }, [isAuthenticated, user]);

  // Fetch colors and storages when a device is selected
  useEffect(() => {
    if (selectedDevice) {
      fetchColors(selectedDevice.id);
      fetchStorages(selectedDevice.id);
    } else {
      setColors([]);
      setStorages([]);
    }
  }, [selectedDevice]);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://autodangbai.doiquanai.vn/api/v1/device-infos?limit=100', {
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

  const fetchColors = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`https://autodangbai.doiquanai.vn/api/v1/device-infos/${deviceId}/colors`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      console.log('Colors API response:', data);
      if (data.data) {
        setColors(data.data);
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  const fetchStorages = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`https://autodangbai.doiquanai.vn/api/v1/device-infos/${deviceId}/storages`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      console.log('Storages API response:', data);
      if (data.data) {
        setStorages(data.data);
      }
    } catch (error) {
      console.error('Error fetching storages:', error);
    }
  };

  // Hàm kiểm tra UUID hợp lệ (giữ lại để sử dụng cho các trường hợp khác)
  const isValidUUID = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

  const fetchUserDevices = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return; // Chỉ gọi nếu có token
      
      // Sử dụng endpoint mới để lấy thiết bị của người dùng hiện tại
      const response = await fetch('https://autodangbai.doiquanai.vn/api/v1/user-devices/my-devices', {
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

  const handleAddDevice = async () => {
    if (!selectedDevice || !selectedColor || !selectedStorage) {
      alert('Vui lòng chọn đầy đủ thông tin thiết bị, màu sắc và dung lượng');
      return;
    }
    
    // Kiểm tra người dùng đã đăng nhập
    console.log('Current user:', user);
    if (!user) {
      alert('Vui lòng đăng nhập để thêm thiết bị');
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
      
      const response = await fetch('https://autodangbai.doiquanai.vn/api/v1/user-devices', {
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

  const handleUpdateDevice = async (deviceId: string) => {
    const deviceToUpdate = userDevices.find(d => d.id === deviceId);
    if (!deviceToUpdate) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`https://autodangbai.doiquanai.vn/api/v1/user-devices/${deviceId}`, {
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

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`https://autodangbai.doiquanai.vn/api/v1/user-devices/${deviceId}`, {
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

  const filteredDevices = devices.filter(device => 
    device.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tham chiếu đến input file ẩn
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hàm tải template Excel
  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Vui lòng đăng nhập để tải template');
        return;
      }

      // Gọi API tải template Excel
      const response = await fetch('https://autodangbai.doiquanai.vn/api/v1/user-devices/template', {
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
      const response = await fetch('https://autodangbai.doiquanai.vn/api/v1/user-devices/export/my-devices', {
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
      const response = await fetch('https://autodangbai.doiquanai.vn/api/v1/user-devices/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('Import result:', result);

      if (response.ok) {
        alert(`Nhập dữ liệu thành công!\nTổng số: ${result.data.total}\nThành công: ${result.data.success}\nCập nhật: ${result.data.updated_count}\nTạo mới: ${result.data.created_count}\nLỗi: ${result.data.error}`);
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

        {/* Device Management Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Smartphone className="text-blue-600" /> Thiết bị của bạn
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Device Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thiết bị</label>
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Device Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng</label>
                  <select
                    value={newDevice.device_condition}
                    onChange={(e) => setNewDevice({...newDevice, device_condition: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Mới">Mới</option>
                    <option value="Đã qua sử dụng">Đã qua sử dụng</option>
                    <option value="Tân trang">Tân trang</option>
                  </select>
                </div>
                
                {/* Device Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại máy</label>
                  <select
                    value={newDevice.device_type}
                    onChange={(e) => setNewDevice({...newDevice, device_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Mới">Mới</option>
                    <option value="Cũ">Cũ</option>
                    <option value="Trưng bày">Trưng bày</option>
                  </select>
                </div>
                
                {/* Battery Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng pin</label>
                  <input
                    type="text"
                    value={newDevice.battery_condition || ''}
                    onChange={(e) => setNewDevice({...newDevice, battery_condition: e.target.value})}
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
                    <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
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
      </main>
    </div>
  );
};

export default ChatbotPage;