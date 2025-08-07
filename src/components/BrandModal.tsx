
import React, { useState, useEffect } from 'react';
import { Brand } from '../types/Brand';
import { DeviceBrand } from '../types/deviceBrand';
import { SearchableSelect } from './SearchableSelect';
import { Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import { deviceApiService } from '../services/deviceApiService';
import deviceBrandService from '../services/deviceBrandService';
import { brandService } from '../services/brandService';
import { Service } from '../types/Service';

interface UniqueBrandName {
  name: string;
  warranty: string;
}

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  currentBrand: Partial<Brand> | null;
  setCurrentBrand: React.Dispatch<React.SetStateAction<Partial<Brand> | null>>;
  selectedService: Service | null;
}

export const BrandModal: React.FC<BrandModalProps> = ({ isOpen, onClose, onSave, currentBrand, setCurrentBrand, selectedService }) => {
  const [deviceOptions, setDeviceOptions] = useState<{ id: string, name: string }[]>([]);
  const [colorOptions, setColorOptions] = useState<{ id: string, name: string }[]>([]);
  const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);
  const [uniqueBrandNames, setUniqueBrandNames] = useState<UniqueBrandName[]>([]);
  const [selectedDeviceBrand, setSelectedDeviceBrand] = useState<string>('');
  const [newDeviceBrand, setNewDeviceBrand] = useState<string>('');
  const [isAddingNewBrand, setIsAddingNewBrand] = useState<boolean>(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen, selectedService]);

  const fetchInitialData = async () => {
    const res = await deviceApiService.getDeviceInfos({}, { limit: 100 });
    const newDeviceOptions = res.devices.map(d => ({ id: String(d.id), name: String(d.model) }));
    setDeviceOptions(newDeviceOptions);

    const brandData = await deviceBrandService.getDeviceBrands();
    setDeviceBrands(brandData);

    if (selectedService) {
        const uniqueNames = await brandService.getUniqueBrandNames(selectedService.id);
        setUniqueBrandNames(uniqueNames);
    }

    if (currentBrand) {
      if (currentBrand.device_type) {
        const foundDevice = newDeviceOptions.find(d => d.name === currentBrand.device_type);
        if (foundDevice) {
          setSelectedDeviceId(foundDevice.id);
          const colors = await deviceApiService.getColorsByDeviceInfoId(foundDevice.id);
          const newColorOptions = colors.map(c => ({ id: String(c.id), name: String(c.name) }));
          setColorOptions(newColorOptions);

          if (currentBrand.color) {
            const foundColor = newColorOptions.find(c => c.name === currentBrand.color);
            if (foundColor) {
              setSelectedColor(foundColor.id);
            }
          }
        }
      }
      if (currentBrand.device_brand_id) {
        setSelectedDeviceBrand(currentBrand.device_brand_id);
      }
    } else {
        setSelectedDeviceId('');
        setColorOptions([]);
        setSelectedColor('');
        setSelectedDeviceBrand('');
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setSelectedColor('');
    setColorOptions([]);
    if (deviceId) {
      const colors = await deviceApiService.getColorsByDeviceInfoId(deviceId);
      setColorOptions(colors.map(c => ({ id: String(c.id), name: String(c.name) })));
    }
  };
  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedColor(e.target.value);
};

  const handleSave = async () => {
    if (!currentBrand || !currentBrand.name || !selectedService) {
        Swal.fire('Lỗi', 'Tên loại không được để trống.', 'error');
        return;
    }

    const deviceName = deviceOptions.find(d => d.id === selectedDeviceId)?.name || '';
    const deviceBrandId = selectedDeviceBrand || undefined;

    if (selectedColor === 'all' && colorOptions.length > 0) {
        try {
            for (const colorOpt of colorOptions) {
                const payload: Partial<Brand> = {
                    name: currentBrand.name,
                    warranty: currentBrand.warranty || '',
                    service_id: selectedService.id,
                    device_brand_id: deviceBrandId,
                    device_type: deviceName,
                    color: colorOpt.name,
                    price: currentBrand.price || ''
                };
                await brandService.createBrand(payload);
            }
            Swal.fire('Thành công', `Đã thêm ${colorOptions.length} loại dịch vụ.`, 'success');
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to create brands for all colors", error);
            Swal.fire('Lỗi', 'Không thể tạo loại dịch vụ cho tất cả màu sắc.', 'error');
        }
    } else {
        const colorName = colorOptions.find(c => c.id === selectedColor)?.name || '';
        
        const payload: Partial<Brand> = {
            name: currentBrand.name,
            warranty: currentBrand.warranty || '',
            service_id: selectedService.id,
            device_brand_id: deviceBrandId,
            device_type: deviceName,
            color: colorName,
            price: currentBrand.price || ''
        };

        try {
            if (currentBrand.id) {
                await brandService.updateBrand(currentBrand.id, payload);
                Swal.fire('Thành công', 'Cập nhật loại dịch vụ thành công!', 'success');
            } else {
                await brandService.createBrand(payload);
                Swal.fire('Thành công', 'Tạo loại dịch vụ thành công!', 'success');
            }
            onSave();
            onClose();
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể lưu loại dịch vụ.', 'error');
        }
    }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h3 className="text-lg font-bold mb-4">{currentBrand?.id ? 'Sửa loại' : 'Thêm loại'}</h3>
        <div className="space-y-4">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Loại {selectedService ? `cho "${selectedService.name}"` : ''} <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={uniqueBrandNames.map(b => ({ id: b.name, name: b.name }))}
              value={currentBrand?.name || ''}
              onChange={(value) => {
                const selected = uniqueBrandNames.find(b => b.name === value);
                setCurrentBrand(prev => ({
                  ...prev,
                  name: value,
                  warranty: selected ? selected.warranty : prev?.warranty || ''
                }));
              }}
              placeholder="Chọn hoặc nhập tên loại"
              creatable
            />
          </div>

          {/* Device Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thương hiệu
            </label>
            <div className="relative">
              <select
                value={selectedDeviceBrand}
                onChange={(e) => {
                  setSelectedDeviceBrand(e.target.value);
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Chọn thương hiệu</option>
                {deviceBrands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsAddingNewBrand(true)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
              >
                <Plus size={16} />
              </button>
              {isAddingNewBrand && (
                <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border rounded-md shadow-lg z-10 flex gap-2">
                  <input
                    type="text"
                    value={newDeviceBrand}
                    onChange={(e) => setNewDeviceBrand(e.target.value)}
                    placeholder="Tên thương hiệu mới"
                    className="flex-1 p-2 border rounded-md"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      if (!newDeviceBrand.trim()) return;
                      try {
                        const newBrand = await deviceBrandService.createDeviceBrand({ name: newDeviceBrand.trim() });
                        setDeviceBrands(prev => [...prev, newBrand]);
                        setSelectedDeviceBrand(newBrand.id);
                        setNewDeviceBrand('');
                        setIsAddingNewBrand(false);
                        Swal.fire('Thành công', 'Thêm thương hiệu mới thành công!', 'success');
                      } catch (error) {
                        console.error('Failed to create device brand:', error);
                        Swal.fire('Lỗi', 'Không thể tạo thương hiệu mới.', 'error');
                      }
                    }}
                    className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewBrand(false)}
                    className="p-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    X
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Warranty */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Bảo hành</label>
            <input
              type="text"
              value={currentBrand?.warranty || ''}
              onChange={(e) => setCurrentBrand(prev => prev ? { ...prev, warranty: e.target.value } : null)}
              placeholder="Bảo hành (VD: 6 tháng)"
              className="w-full p-2 border rounded-md mt-1"
            />
          </div>

          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Loại máy</label>
            <SearchableSelect
                options={deviceOptions}
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                placeholder="Chọn loại máy"
            />
          </div>
          
          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Màu sắc</label>
            <select
                className="w-full p-2 border rounded-md mt-1"
                value={selectedColor}
                onChange={handleColorChange}
                disabled={!selectedDeviceId}
            >
                <option value="">Chọn màu sắc</option>
                {colorOptions.length > 0 && !currentBrand?.id && (
                    <option value="all">Tất cả màu sắc</option>
                )}
                {colorOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Giá</label>
            <input
                type="text"
                value={currentBrand?.price || ''}
                onChange={(e) => setCurrentBrand(prev => prev ? { ...prev, price: e.target.value } : null)}
                placeholder="Giá (VD: 500000)"
                className="w-full p-2 border rounded-md mt-1"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md">Lưu</button>
        </div>
      </div>
    </div>
  );
};