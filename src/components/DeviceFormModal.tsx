import React, { useState, useEffect, memo, useCallback } from 'react';
import { UserDevice, DeviceInfo, Color, DeviceStorage } from '../types/deviceTypes';
import { deviceInfoService } from '../services/deviceInfoService';
import { Search } from 'lucide-react';
import LabeledField from './LabeledField';

// Memoized DeviceSearchSection component
const DeviceSearchSection = memo<{
  formData: { device_info_id?: string };
  deviceInfos: DeviceInfo[];
  isLoading: boolean;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onDeviceInfoSelect: (info: DeviceInfo) => void;
}>(({ formData, deviceInfos, isLoading, searchTerm, onSearchTermChange, onDeviceInfoSelect }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Chỉ đồng bộ localSearchTerm khi modal mở ra lần đầu hoặc khi searchTerm có giá trị
  useEffect(() => {
    if (searchTerm !== '' || (searchTerm === '' && localSearchTerm === '')) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setLocalSearchTerm(newTerm);
    onSearchTermChange(newTerm);
  };

  return (
    <div>
      <LabeledField
        label="Thiết bị"
        required
        hintText="Tìm và chọn mẫu thiết bị (model). Gợi ý: gõ tối thiểu 2 ký tự để tìm nhanh."
        hintPosition="right"
      >
        {formData.device_info_id && (
          <div className="mb-2">
            <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">
              {deviceInfos.find(d => d.id === formData.device_info_id)?.model}
            </span>
            {(() => {
              const device = deviceInfos.find(d => d.id === formData.device_info_id);
              if (device && device.materials && device.materials.length > 0) {
                return (
                  <div className="mt-1 text-xs text-red-600">
                    Vật liệu: {device.materials.map(m => m.name).join(', ')}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm thiết bị..."
            value={localSearchTerm}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
        </div>
        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
          {isLoading ? (
            <div className="px-3 py-2 text-gray-500">Đang tìm kiếm...</div>
          ) : deviceInfos.length > 0 ? (
            deviceInfos.map(info => (
              <div
                key={info.id}
                onClick={() => onDeviceInfoSelect(info)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                  formData.device_info_id === info.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                } ${isLoading ? 'cursor-not-allowed' : ''}`}
              >
                {info.model}
              </div>
            ))
          ) : searchTerm.length > 0 ? (
            <div className="px-3 py-2 text-gray-500">Không tìm thấy thiết bị</div>
          ) : (
            <div className="px-3 py-2 text-gray-500">Nhập tên thiết bị để tìm kiếm</div>
          )}
        </div>
      </LabeledField>
    </div>
  );
});

// Memoized ColorSelectionSection component
const ColorSelectionSection = memo<{
  formData: { color_ids?: string[]; device_info_id?: string };
  colors: Color[];
  isLoading: boolean;
  onColorToggle: (colorId: string) => void;
  onSelectAllColors: () => void;
}>(({ formData, colors, isLoading, onColorToggle, onSelectAllColors }) => {
  return (
    <div>
      <LabeledField
        label="Màu sắc"
        hintText="Chọn một hoặc nhiều màu cho thiết bị. Dùng 'Chọn tất cả' để áp dụng mọi màu."
        hintPosition="right"
      >
      {formData.color_ids && formData.color_ids.length > 0 && (
        <div className="mb-2">
          <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium text-sm">
            {formData.color_ids.length} màu đã chọn
          </span>
        </div>
      )}
      <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white">
        <div
          key="select-all"
          onClick={onSelectAllColors}
          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
            formData.color_ids?.length === colors.length ? 'bg-blue-50 text-blue-700 font-medium' : ''
          } ${isLoading ? 'cursor-not-allowed' : ''} border-b border-gray-200`}
        >
          {formData.color_ids?.length === colors.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </div>
        {colors.length > 0 ? (
          colors.map(color => (
            <div
              key={color.id}
              onClick={() => onColorToggle(color.id)}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                formData.color_ids?.includes(color.id) ? 'bg-blue-50 text-blue-700 font-medium' : ''
              } ${isLoading ? 'cursor-not-allowed' : ''}`}
            >
              {color.name}
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-gray-500">
            {formData.device_info_id ? (isLoading ? 'Đang tải...' : 'Không có màu sắc') : 'Vui lòng chọn thiết bị'}
          </div>
        )}
      </div>
      </LabeledField>
    </div>
  );
});

// Memoized StorageSelectionSection component
const StorageSelectionSection = memo<{
  formData: { storage_ids?: string[]; device_info_id?: string };
  storages: DeviceStorage[];
  isLoading: boolean;
  onStorageToggle: (storageId: string) => void;
  onSelectAllStorages: () => void;
}>(({ formData, storages, isLoading, onStorageToggle, onSelectAllStorages }) => {
  return (
    <div>
      <LabeledField
        label="Dung lượng"
        hintText="Chọn một hoặc nhiều dung lượng bộ nhớ. Dùng 'Chọn tất cả' để áp dụng mọi dung lượng."
        hintPosition="right"
      >
      {formData.storage_ids && formData.storage_ids.length > 0 && (
        <div className="mb-2">
          <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium text-sm">
            {formData.storage_ids.length} dung lượng đã chọn
          </span>
        </div>
      )}
      <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white">
        {storages.length > 0 ? (
          <>
            <div
              key="select-all-storages"
              onClick={onSelectAllStorages}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                formData.storage_ids?.length === storages.length ? 'bg-blue-50 text-blue-700 font-medium' : ''
              } ${isLoading ? 'cursor-not-allowed' : ''} border-b border-gray-200`}
            >
              {formData.storage_ids?.length === storages.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </div>
            {storages.map(storage => (
              <div
                key={storage.id}
                onClick={() => onStorageToggle(storage.id)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                  formData.storage_ids?.includes(storage.id) ? 'bg-blue-50 text-blue-700 font-medium' : ''
                } ${isLoading ? 'cursor-not-allowed' : ''}`}
              >
                {storage.capacity} GB
              </div>
            ))}
          </>
        ) : (
          <div className="px-3 py-2 text-gray-500">
            {formData.device_info_id ? (isLoading ? 'Đang tải...' : 'Không có dung lượng') : 'Vui lòng chọn thiết bị'}
          </div>
        )}
      </div>
      </LabeledField>
    </div>
  );
});

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: UserDevice) => void;
  device: UserDevice | null;
}

// Extend Partial<UserDevice> to allow device_info_id, color_id, device_storage_id
interface DeviceFormData extends Partial<UserDevice> {
  device_info_id?: string;
  color_ids?: string[];
  storage_ids?: string[];
}

const defaultFormData: DeviceFormData = {
  product_code: '',
  price: 0,
  wholesale_price: 0,
  inventory: 1,
  device_condition: 'Mới',
  device_type: 'Mới',
  battery_condition: '100%',
  warranty: '12 tháng',
  notes: '',
  device_info_id: '',
  color_ids: [],
  storage_ids: [],
};

const DeviceFormModal: React.FC<DeviceFormModalProps> = ({ isOpen, onClose, onSave, device }) => {
  const [formData, setFormData] = useState<DeviceFormData>(defaultFormData);
  const [deviceInfos, setDeviceInfos] = useState<DeviceInfo[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [storages, setStorages] = useState<DeviceStorage[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isDependentDataLoading, setIsDependentDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (device) {
        setFormData({
          ...device,
          device_info_id: device.device_info?.id || '',
          color_ids: device.color?.id ? [device.color.id] : [],
          storage_ids: device.device_storage?.id ? [device.device_storage.id] : [],
        });
      } else {
        setFormData(defaultFormData);
        setColors([]);
        setStorages([]);
      }
      setSearchTerm('');
    }
  }, [device, isOpen]);

  const fetchDeviceInfos = useCallback(async (search = '') => {
    if (!isOpen) return;
    setIsSearchLoading(true);
    try {
      const params = { search: search };
      const deviceInfosData = await deviceInfoService.getDeviceInfos(params, { page: 1, limit: 100 });
      setDeviceInfos(Array.isArray(deviceInfosData.devices) ? deviceInfosData.devices : []);
    } catch (error) {
      console.error('Error fetching device infos', error);
      setDeviceInfos([]);
    } finally {
      setIsSearchLoading(false);
    }
  }, [isOpen]);

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  useEffect(() => {
    // Debounce search term to reduce API calls
    const handler = setTimeout(() => {
      // Không gọi API nếu đã có thiết bị được chọn và searchTerm rỗng
      if (formData.device_info_id && searchTerm.length === 0) {
        return;
      }
      if (searchTerm.length >= 2 || searchTerm.length === 0) {  // Only search when term is empty or at least 2 characters
        fetchDeviceInfos(searchTerm);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, fetchDeviceInfos, formData.device_info_id]);

  useEffect(() => {
    if (isOpen) {
      fetchDeviceInfos(); // Initial fetch when modal opens
    }
  }, [isOpen, fetchDeviceInfos]);

  const fetchDependentData = useCallback(async (deviceId: string) => {
    if (!deviceId) {
      setColors([]);
      setStorages([]);
      return;
    }

    setIsDependentDataLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [colorsRes, storagesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'}/api/v1/device-infos/${deviceId}/colors`, { headers }),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'}/api/v1/device-infos/${deviceId}/storages`, { headers }),
      ]);

      if (!colorsRes.ok || !storagesRes.ok) {
        throw new Error('Failed to fetch dependent data');
      }

      const colorsData = await colorsRes.json();
      const storagesData = await storagesRes.json();

      setColors(Array.isArray(colorsData.data) ? colorsData.data : []);
      setStorages(Array.isArray(storagesData.data) ? storagesData.data : []);
    } catch (error) {
      console.error('Error fetching dependent data for form', error);
      setColors([]);
      setStorages([]);
    } finally {
      setIsDependentDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (formData.device_info_id) {
      fetchDependentData(formData.device_info_id);
    } else {
      setColors([]);
      setStorages([]);
    }
  }, [formData.device_info_id, isOpen, fetchDependentData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price);
  }, []);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, price: value ? parseInt(value) : 0 }));
  }, []);

  const handleDeviceInfoSelect = useCallback((info: DeviceInfo) => {
    if (isSearchLoading || isDependentDataLoading) return;
    setFormData(prev => ({ ...prev, device_info_id: info.id, color_ids: [], storage_ids: [] }));
    setSearchTerm('');
  }, [isSearchLoading, isDependentDataLoading]);

  const handleColorToggle = useCallback((colorId: string) => {
    if (isDependentDataLoading) return;
    setFormData(prev => {
      const currentColors = prev.color_ids || [];
      const colorIndex = currentColors.indexOf(colorId);
      if (colorIndex > -1) {
        currentColors.splice(colorIndex, 1);
      } else {
        currentColors.push(colorId);
      }
      return { ...prev, color_ids: [...currentColors] };
    });
  }, [isDependentDataLoading]);

  const handleSelectAllColors = useCallback(() => {
    if (isDependentDataLoading) return;
    const allColorIds = colors.map(c => c.id);
    const currentSelected = formData.color_ids || [];
    if (currentSelected.length === colors.length) {
      setFormData(prev => ({ ...prev, color_ids: [] })); // Deselect all
    } else {
      setFormData(prev => ({ ...prev, color_ids: allColorIds })); // Select all
    }
  }, [isDependentDataLoading, colors, formData.color_ids]);

  const handleStorageToggle = useCallback((storageId: string) => {
    if (isDependentDataLoading) return;
    setFormData(prev => {
      const currentStorages = prev.storage_ids || [];
      const idx = currentStorages.indexOf(storageId);
      if (idx > -1) {
        currentStorages.splice(idx, 1);
      } else {
        currentStorages.push(storageId);
      }
      return { ...prev, storage_ids: [...currentStorages] };
    });
  }, [isDependentDataLoading]);

  const handleSelectAllStorages = useCallback(() => {
    if (isDependentDataLoading) return;
    const allStorageIds = storages.map(s => s.id);
    const currentSelected = formData.storage_ids || [];
    if (currentSelected.length === storages.length) {
      setFormData(prev => ({ ...prev, storage_ids: [] }));
    } else {
      setFormData(prev => ({ ...prev, storage_ids: allStorageIds }));
    }
  }, [isDependentDataLoading, storages, formData.storage_ids]);

  const handleDeviceTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Mới') {
      setFormData(prev => ({
        ...prev,
        device_type: value,
        device_condition: 'Mới',
        battery_condition: '100%',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        device_type: value,
        device_condition: '', // Reset when switching to 'Cũ'
        battery_condition: '', // Reset when switching to 'Cũ'
      }));
    }
  }, []);

  const handleWholesalePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, wholesale_price: value ? parseInt(value) : 0 }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.device_info_id) {
      alert('Vui lòng chọn Thiết bị!');
      return;
    }

    // The backend will create the ID, so we don't pass it for new devices.
    // For existing devices, the ID is already in formData from the useEffect hook.
    onSave(formData as UserDevice);
  }, [formData, onSave, device]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{device ? 'Sửa thiết bị' : 'Thêm thiết bị'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng modal"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Hàng 1: Thiết bị, Màu sắc, Dung lượng */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <DeviceSearchSection
              formData={formData}
              deviceInfos={deviceInfos}
              isLoading={isSearchLoading}
              searchTerm={searchTerm}
              onSearchTermChange={handleSearchTermChange}
              onDeviceInfoSelect={handleDeviceInfoSelect}
            />
            <ColorSelectionSection
              formData={formData}
              colors={colors}
              isLoading={isDependentDataLoading}
              onColorToggle={handleColorToggle}
              onSelectAllColors={handleSelectAllColors}
            />
            <StorageSelectionSection
              formData={formData}
              storages={storages}
              isLoading={isDependentDataLoading}
              onStorageToggle={handleStorageToggle}
              onSelectAllStorages={handleSelectAllStorages}
            />
          </div>
          {/* Hàng 2: Loại thiết bị, Tình trạng, Tình trạng pin */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <LabeledField
              label="Loại thiết bị"
              hintText="Chọn 'Mới' hoặc 'Cũ'. Khi chọn 'Cũ' sẽ mở các trường tình trạng."
              hintPosition="right"
            >
              <select
                name="device_type"
                value={formData.device_type || ''}
                onChange={handleDeviceTypeChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
              >
                <option value="Mới">Mới</option>
                <option value="Cũ">Cũ</option>
              </select>
            </LabeledField>
            <LabeledField
              label="Tình trạng"
              hintText="Mô tả tổng quan tình trạng máy (chỉ áp dụng khi là máy 'Cũ')."
              hintPosition="right"
            >
              <input
                type="text"
                name="device_condition"
                value={formData.device_condition || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm disabled:opacity-50 disabled:bg-gray-100"
                disabled={formData.device_type === 'Mới'}
                placeholder={formData.device_type === 'Cũ' ? "Nhập tình trạng thiết bị" : ""}
              />
            </LabeledField>
            <LabeledField
              label="Tình trạng pin"
              hintText="Nhập % pin còn lại hoặc tình trạng pin (chỉ áp dụng khi là máy 'Cũ')."
              hintPosition="right"
            >
              <input
                type="text"
                name="battery_condition"
                value={formData.battery_condition || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm disabled:opacity-50 disabled:bg-gray-100"
                disabled={formData.device_type === 'Mới'}
                placeholder={formData.device_type === 'Cũ' ? "Nhập tình trạng pin" : ""}
              />
            </LabeledField>
          </div>
          {/* Hàng 3: Giá, Giá bán buôn, Tồn kho */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <LabeledField
              label="Giá bán lẻ"
              hintText="Nhập giá bán lẻ (tự động định dạng)."
              hintPosition="right"
            >
              <input
                type="text"
                name="price"
                value={formatPrice(formData.price || 0)}
                onChange={handlePriceChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
              />
            </LabeledField>
            <LabeledField
              label="Giá bán buôn"
              hintText="Giá dành cho đại lý/khách mua số lượng."
              hintPosition="right"
            >
              <input
                type="text"
                name="wholesale_price"
                value={formatPrice(formData.wholesale_price || 0)}
                onChange={handleWholesalePriceChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
              />
            </LabeledField>
            <LabeledField
              label="Tồn kho"
              hintText="Số lượng hàng tồn kho hiện có."
              hintPosition="right"
            >
              <input
                type="number"
                name="inventory"
                value={formData.inventory || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
              />
            </LabeledField>
          </div>
          {/* Hàng 4: Bảo hành, Ghi chú */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <LabeledField
              label="Bảo hành"
              hintText="Ví dụ: 12 tháng, 6 tháng, hoặc theo chính sách cửa hàng."
              hintPosition="right"
            >
              <input
                type="text"
                name="warranty"
                value={formData.warranty || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
              />
            </LabeledField>
            <LabeledField
              label="Ghi chú"
              hintText="Thêm mô tả chi tiết hoặc thông tin đặc biệt về sản phẩm."
              hintPosition="right"
              className="md:col-span-2"
            >
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
                rows={2}
              ></textarea>
            </LabeledField>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" disabled={isSearchLoading || isDependentDataLoading}>Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default memo(DeviceFormModal);