import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DeviceInfo, Color } from '../../types/deviceTypes';
import { deviceService } from '../../services/deviceService';
import { colorService } from '../../services/colorService';
import { deviceColorService } from '../../services/deviceColorService';
import { Plus, Trash2, Loader, ChevronLeft, ChevronRight } from 'lucide-react';

interface DeviceColorsTabProps {
  currentPage?: number;
  currentLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const DeviceColorsTab: React.FC<DeviceColorsTabProps> = ({ currentPage: urlPage = 1, currentLimit: urlLimit = 10, onPageChange, onLimitChange }) => {
  const { isAuthenticated } = useAuth();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [deviceColors, setDeviceColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedColorToAdd, setSelectedColorToAdd] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(true);
  const deviceDropdownRef = useRef<HTMLDivElement>(null);
  
  const [colorSearchTerm, setColorSearchTerm] = useState('');
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const colorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
      fetchAllColors();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceColors(selectedDevice);
    } else {
      setDeviceColors([]);
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 1 });
    }
  }, [selectedDevice, pagination.page, pagination.limit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(event.target as Node)) {
        setIsDeviceDropdownOpen(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setIsColorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchDevices = async () => {
    try {
      // Fetch with a high limit to get all devices for the dropdown
      const result = await deviceService.getDevices({ limit: 100 });
      setDevices(result.data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      alert('Không thể tải danh sách thiết bị');
    }
  };

  const fetchAllColors = async () => {
    try {
      let allColors: Color[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await colorService.getColors({}, { page, limit: 100 });
        if (result.colors && result.colors.length > 0) {
          allColors = [...allColors, ...result.colors];
          page++;
          // Assuming the last page will have less than the limit, or check totalPages
          if (page > (result.pagination?.totalPages || 1)) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      setColors(allColors);
    } catch (error) {
      console.error('Error fetching colors:', error);
      alert('Không thể tải danh sách màu sắc');
    }
  };

  const fetchDeviceColors = async (deviceId: string) => {
    setLoading(true);
    try {
      const result = await deviceColorService.getDeviceColors(deviceId, { page: pagination.page, limit: pagination.limit });
      setDeviceColors(result.data);
      setPagination(prev => ({ ...prev, total: result.total, totalPages: result.totalPages }));
    } catch (error) {
      console.error('Error fetching device colors:', error);
      alert('Không thể tải danh sách màu của thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeviceColor = async () => {
    if (!selectedDevice || !selectedColorToAdd) {
      alert('Vui lòng chọn một thiết bị và một màu sắc');
      return;
    }
    try {
      await deviceColorService.addDeviceColor(selectedDevice, selectedColorToAdd);
      fetchDeviceColors(selectedDevice);
      setSelectedColorToAdd(null);
    } catch (error: any) {
      console.error('Error adding device color:', error);
      const errorMessage = error.response?.data?.detail || 'Không thể thêm màu cho thiết bị. Đã có lỗi xảy ra.';
      alert(errorMessage);
    }
  };

  const handleDeleteDeviceColor = async (colorId: string) => {
    if (!selectedDevice) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa màu này khỏi thiết bị không?')) {
      try {
        await deviceColorService.removeDeviceColor(selectedDevice, colorId);
        alert('Xóa màu khỏi thiết bị thành công.');
        fetchDeviceColors(selectedDevice);
      } catch (error: any) {
        console.error('Failed to delete device color:', error, typeof error, JSON.stringify(error));
        if (error && error.status === 403) {
          alert(error.message || 'Bạn không có quyền xoá mục này');
        } else if (error?.message?.toLowerCase().includes('quyền')) {
          alert(error.message);
        } else if (typeof error === 'string' && error.toLowerCase().includes('quyền')) {
          alert(error);
        } else {
          const errorMessage = error?.message || 'Xóa màu khỏi thiết bị không thành công';
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

  const availableColors = colors.filter(c => 
    c.name && !deviceColors.some(dc => dc.id === c.id) && 
    c.name.toLowerCase().includes(colorSearchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Quản lý Màu sắc Thiết bị</h2>
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
            <div className="relative flex-grow" ref={colorDropdownRef}>
              <input
                  type="text"
                  placeholder="Tìm kiếm hoặc chọn màu..."
                  className="w-full p-2 border rounded-lg"
                  value={selectedColorToAdd ? colors.find(c => c.id === selectedColorToAdd)?.name || '' : colorSearchTerm}
                  onFocus={() => setIsColorDropdownOpen(true)}
                  onChange={e => {
                      setColorSearchTerm(e.target.value);
                      setSelectedColorToAdd(null);
                      if (!isColorDropdownOpen) setIsColorDropdownOpen(true);
                  }}
              />
              {isColorDropdownOpen && (
                  <div className="absolute z-50 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {availableColors.map(color => (
                          <div
                              key={color.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onMouseDown={() => {
                                  setSelectedColorToAdd(color.id);
                                  setColorSearchTerm('');
                                  setIsColorDropdownOpen(false);
                              }}
                          >
                              {color.name}
                          </div>
                      ))}
                  </div>
              )}
            </div>
            <button
              onClick={handleAddDeviceColor}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-blue-600 self-start"
            >
              <Plus size={18} className="mr-2" />
              Thêm màu
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên màu</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {deviceColors.map((color) => (
                        <tr key={color.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{color.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDeleteDeviceColor(color.id)} className="text-red-600 hover:text-red-900">
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

export default DeviceColorsTab;