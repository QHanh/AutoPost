
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
  const [selectedDeviceBrand, setSelectedDeviceBrand] = useState<string>('');
  const [newDeviceBrand, setNewDeviceBrand] = useState<string>('');
  const [isDeviceBrandDropdownOpen, setIsDeviceBrandDropdownOpen] = useState<boolean>(false);
  const [isAddingNewBrand, setIsAddingNewBrand] = useState<boolean>(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    const res = await deviceApiService.getDeviceInfos({}, { limit: 100 });
    const newDeviceOptions = res.devices.map(d => ({ id: String(d.id), name: String(d.model) }));
    setDeviceOptions(newDeviceOptions);

    const brandData = await deviceBrandService.getDeviceBrands();
    setDeviceBrands(brandData);

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
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Loại {selectedService ? `cho "${selectedService.name}"` : ''} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={currentBrand?.name || ''}
                            onChange={(e) => setCurrentBrand(prev => prev ? {...prev, name: e.target.value} : null)}
                            placeholder={selectedService ? `Tên loại (VD: Pisen cho ${selectedService.name})` : "Tên loại"}
                            className="w-full p-2 border rounded-md mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Thương hiệu
                        </label>
                        <div className="flex gap-2 mb-4 relative">
                          <input
                              type="text"
                              value={selectedDeviceBrand ? deviceBrands.find(b => b.id === selectedDeviceBrand)?.name || '' : ''}
                              onChange={() => {}}
                              placeholder="Tên thương hiệu"
                              className="w-full p-2 border rounded-md"
                              onFocus={() => setIsDeviceBrandDropdownOpen(true)}
                              onBlur={() => setTimeout(() => setIsDeviceBrandDropdownOpen(false), 200)}
                          />
                          <button 
                              onClick={() => {
                                  setIsAddingNewBrand(!isAddingNewBrand);
                                  if (isAddingNewBrand) {
                                      setSelectedDeviceBrand('');
                                      setNewDeviceBrand('');
                                  }
                              }}
                              className="p-2 bg-blue-500 text-white rounded-md ml-2"
                          >
                              <Plus size={20} />
                          </button>
                          
                          {isDeviceBrandDropdownOpen && deviceBrands.length > 0 && (
                              <div className="absolute top-full left-0 right-12 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                                  {deviceBrands.map(brand => (
                                      <div 
                                          key={brand.id}
                                          className="p-2 hover:bg-gray-100 cursor-pointer"
                                          onClick={() => {
                                              setSelectedDeviceBrand(brand.id);
                                              setIsDeviceBrandDropdownOpen(false);
                                          }}
                                      >
                                          {brand.name}
                                      </div>
                                  ))}
                              </div>
                          )}
                        </div>
                        
                        {isAddingNewBrand && (
                          <div className="flex gap-2 mb-4">
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
                                  const newBrand = await deviceBrandService.createDeviceBrand({
                                    name: newDeviceBrand.trim()
                                  });
                                  
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
                              className="p-2 bg-green-500 text-white rounded-md"
                            >
                              ✓
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                          type="text"
                          value={currentBrand?.warranty || ''}
                          onChange={(e) => setCurrentBrand(prev => prev ? {...prev, warranty: e.target.value} : null)}
                          placeholder="Bảo hành (VD: 6 tháng)"
                          className="w-full p-2 border rounded-md"
                      />
                      <SearchableSelect
                          options={deviceOptions}
                          value={selectedDeviceId}
                          onChange={handleDeviceChange}
                          placeholder="Chọn loại máy"
                      />
                      <select
                          className="w-full p-2 border rounded-md"
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
                      <input
                          type="text"
                          value={currentBrand?.price || ''}
                          onChange={(e) => setCurrentBrand(prev => prev ? {...prev, price: e.target.value} : null)}
                          placeholder="Giá (VD: 500000)"
                          className="w-full p-2 border rounded-md"
                      />
                  </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md">Lưu</button>
        </div>
      </div>
    </div>
  );
};