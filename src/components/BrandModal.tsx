import React, { useState, useEffect } from 'react';
import { Brand } from '../types/Brand';
import { DeviceBrand } from '../types/deviceBrand';
import SearchableSelect from './SearchableSelect';
import { Plus, Trash2, Smartphone, Palette, DollarSign, Shield, FileText, Check, X, Edit3 } from 'lucide-react';
import Swal from 'sweetalert2';
import { deviceApiService } from '../services/deviceApiService';
import deviceBrandService from '../services/deviceBrandService';
import { brandService } from '../services/brandService';
import { warrantyService, WarrantyService } from '../services/warrantyService';
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
  const [warrantyServices, setWarrantyServices] = useState<WarrantyService[]>([]);
  const [uniqueBrandNames, setUniqueBrandNames] = useState<UniqueBrandName[]>([]);
  const [selectedDeviceBrand, setSelectedDeviceBrand] = useState<string>('');
  const [newDeviceBrand, setNewDeviceBrand] = useState<string>('');
  const [isAddingNewBrand, setIsAddingNewBrand] = useState<boolean>(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [newWarrantyService, setNewWarrantyService] = useState<string>('');
  const [isAddingNewWarranty, setIsAddingNewWarranty] = useState<boolean>(false);
  const [isAddingNewTypeName, setIsAddingNewTypeName] = useState<boolean>(false);
  const [newTypeName, setNewTypeName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen, selectedService]);

  // Đảm bảo selectedDeviceId vẫn hợp lệ khi deviceOptions thay đổi
  useEffect(() => {
    if (selectedDeviceId && deviceOptions.length > 0) {
      const deviceExists = deviceOptions.find(d => d.id === selectedDeviceId);
      if (!deviceExists) {
        console.log('Selected device no longer exists in deviceOptions, resetting...');
        setSelectedDeviceId('');
        setSelectedColor('');
        setColorOptions([]);
      }
    }
  }, [deviceOptions, selectedDeviceId]);

  const fetchInitialData = async () => {
    // Fetch initial options for Device Types (Loại máy)
    const deviceInfosRes = await deviceApiService.getDeviceInfos({}, { limit: 20 });
    let deviceOptionsData = deviceInfosRes.devices.map(d => ({ id: String(d.id), name: String(d.model) }));

    // Fetch initial options for Device Brands (Thương hiệu)
    let deviceBrandsData = await deviceBrandService.getDeviceBrands(0, 20, '');

    // --- Handle Edit Mode ---
    if (currentBrand) {
        // Handle Device Brand for editing - phải xử lý trước để filter device options
        if (currentBrand.device_brand_id) {
            const isBrandInList = deviceBrandsData.some(b => b.id === currentBrand.device_brand_id);
            if (!isBrandInList) {
                const brandData = await deviceBrandService.getDeviceBrand(currentBrand.device_brand_id);
                if (brandData) deviceBrandsData.unshift(brandData);
            }
            setSelectedDeviceBrand(currentBrand.device_brand_id);
            
            // Filter device options theo thương hiệu đã chọn bằng API
            const selectedBrand = deviceBrandsData.find(b => b.id === currentBrand.device_brand_id);
            if (selectedBrand) {
                const res = await deviceApiService.getDeviceInfos({ brand: selectedBrand.name }, { limit: 100 });
                deviceOptionsData = res.devices.map(d => ({ 
                    id: String(d.id), 
                    name: String(d.model) 
                }));
            }
        }

        // Handle Device Type for editing
        if (currentBrand.device_type) {
            const isDeviceInList = deviceOptionsData.some(d => d.name === currentBrand.device_type);
            if (!isDeviceInList) {
                // Nếu device không có trong danh sách đã filter, search thêm
                const res = await deviceApiService.getDeviceInfos({ search: currentBrand.device_type }, { limit: 1 });
                if (res.devices.length > 0) {
                    const device = res.devices[0];
                    deviceOptionsData.unshift({ id: String(device.id), name: String(device.model) });
                }
            }
            const currentDevice = deviceOptionsData.find(d => d.name === currentBrand.device_type);
            if (currentDevice) {
                setSelectedDeviceId(currentDevice.id);
                const colors = await deviceApiService.getColorsByDeviceInfoId(currentDevice.id);
                const newColorOptions = colors.map(c => ({ id: String(c.id), name: String(c.name) }));
                setColorOptions(newColorOptions);
                if (currentBrand.color) {
                    const foundColor = newColorOptions.find(c => c.name === currentBrand.color);
                    if (foundColor) setSelectedColor(foundColor.id);
                }
            }
        }
    }
    
    setDeviceOptions(deviceOptionsData);
    setDeviceBrands(deviceBrandsData);
    
    // --- Fetch other non-searchable data ---
    try {
        const warrantyData = await warrantyService.getWarrantyServices();
        setWarrantyServices(warrantyData);
    } catch (error) {
        console.error('Failed to fetch warranty services:', error);
        setWarrantyServices([]);
    }

    if (selectedService) {
        const uniqueNames = await brandService.getUniqueBrandNames(selectedService.id);
        setUniqueBrandNames(uniqueNames);
    }

    // --- Reset fields if in create mode ---
    if (!currentBrand) {
        setSelectedDeviceId('');
        setColorOptions([]);
        setSelectedColor('');
        setSelectedDeviceBrand('');
    }
  };

  const handleDeviceBrandChange = async (brandId: string) => {
    setSelectedDeviceBrand(brandId);
    
    // Reset device selection khi thay đổi thương hiệu
    setSelectedDeviceId('');
    setColorOptions([]);
    setSelectedColor('');
    
    if (brandId) {
      // Lấy thông tin thương hiệu để lấy tên
      const selectedBrand = deviceBrands.find(b => b.id === brandId);
      if (selectedBrand) {
        console.log('Selected brand:', selectedBrand);
        
        // Debug: Lấy tất cả devices để kiểm tra brand field
        const allDevices = await deviceApiService.getDeviceInfos({}, { limit: 100 });
        console.log('All devices with brands:', allDevices.devices.map(d => ({ model: d.model, brand: d.brand })));
        
        // Sử dụng API filter theo brand
        const res = await deviceApiService.getDeviceInfos({ brand: selectedBrand.name }, { limit: 100 });
        console.log('API response with brand filter:', res);
        
        const deviceOptionsData = res.devices.map(d => ({ 
          id: String(d.id), 
          name: String(d.model) 
        }));
        setDeviceOptions(deviceOptionsData);
        console.log('Filtered devices for brand:', selectedBrand.name, ':', deviceOptionsData);
      }
    } else {
      // Nếu không chọn thương hiệu, hiển thị tất cả máy
      const res = await deviceApiService.getDeviceInfos({}, { limit: 20 });
      const deviceOptionsData = res.devices.map(d => ({ 
        id: String(d.id), 
        name: String(d.model) 
      }));
      setDeviceOptions(deviceOptionsData);
      console.log('All devices loaded:', deviceOptionsData);
    }
  };

  const handleSearchDeviceInfos = async (term: string) => {
    console.log('Searching for:', term, 'with selected brand:', selectedDeviceBrand);
    
    // Khi search, KHÔNG filter theo thương hiệu đã chọn
    // Chỉ search theo term, để user có thể tìm máy khác thương hiệu
    const searchParams: any = { search: term };
    
    const res = await deviceApiService.getDeviceInfos(searchParams, { limit: 20 });
    const devices = res.devices.map(d => ({ id: String(d.id), name: String(d.model) }));
    console.log('Search results for term:', term, 'devices:', devices); // Debug log
    
    // Cập nhật deviceOptions với kết quả tìm kiếm
    setDeviceOptions(devices);
    
    return devices;
  };

  const handleSearchDeviceBrands = async (term: string) => {
    const res = await deviceBrandService.getDeviceBrands(0, 20, term);
    return res.map(b => ({ id: b.id, name: b.name }));
  };

  const handleDeviceChange = async (deviceId: string) => {
    console.log('handleDeviceChange called with deviceId:', deviceId); // Debug log
    console.log('Current deviceOptions:', deviceOptions); // Debug log
    
    // Kiểm tra xem deviceId có tồn tại trong deviceOptions không
    const selectedDevice = deviceOptions.find(d => d.id === deviceId);
    if (!selectedDevice) {
      console.error('Selected device not found in deviceOptions:', deviceId, deviceOptions);
      return;
    }
    
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

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    if (/^\d*$/.test(rawValue)) {
      setCurrentBrand(prev => prev ? { ...prev, price: rawValue } : null);
    }
  };

  const formatPrice = (price: string): string => {
    if (!price) return '';
    const numberValue = parseInt(price, 10);
    if (isNaN(numberValue)) return '';
    return numberValue.toLocaleString('vi-VN');
  };

  const handleSave = async () => {
    if (!currentBrand || !currentBrand.name || !selectedService) {
        Swal.fire('Lỗi', 'Tên loại không được để trống.', 'error');
        return;
    }

    // Lấy tên thiết bị từ selectedDeviceId
    const selectedDevice = deviceOptions.find(d => d.id === selectedDeviceId);
    const deviceName = selectedDevice?.name || '';
    
    console.log('Save - selectedDeviceId:', selectedDeviceId);
    console.log('Save - selectedDevice:', selectedDevice);
    console.log('Save - deviceName:', deviceName);
    console.log('Save - deviceOptions:', deviceOptions);
    
    // Kiểm tra xem có chọn thiết bị không
    if (!selectedDeviceId || !deviceName) {
        Swal.fire('Lỗi', 'Vui lòng chọn loại máy.', 'error');
        return;
    }
    
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
                    price: currentBrand.price || '',
                    note: currentBrand.note || ''
                };
                await brandService.createBrand(payload);
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error("Failed to create brands for all colors", error);
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
            price: currentBrand.price || '',
            note: currentBrand.note || ''
        };

        try {
            if (currentBrand.id) {
                await brandService.updateBrand(currentBrand.id, payload);
            } else {
                await brandService.createBrand(payload);
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error("Failed to save brand", error);
        }
    }
};

  const handleDeleteDeviceBrand = async (brandId: string) => {
    if (!brandId) return;

    try {
      await deviceBrandService.deleteDeviceBrand(brandId);
      fetchInitialData(); // Refresh data
      setSelectedDeviceBrand(''); // Reset selection
    } catch (error) {
      console.error("Failed to delete device brand", error);
    }
  };

  const handleEditDeviceBrand = async (brandId: string, currentName: string) => {
    Swal.fire({
      title: 'Sửa tên thương hiệu',
      input: 'text',
      inputValue: currentName,
      showCancelButton: true,
      confirmButtonText: 'Lưu',
      cancelButtonText: 'Hủy',
      inputValidator: (value) => {
        if (!value) {
          return 'Tên không được để trống!'
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deviceBrandService.updateDeviceBrand(brandId, { name: result.value });
          fetchInitialData();
        } catch (error) {
          console.error("Failed to update device brand", error);
        }
      }
    });
  };

  const handleEditWarranty = async (warrantyId: string, currentValue: string) => {
    Swal.fire({
      title: 'Sửa thông tin bảo hành',
      input: 'text',
      inputValue: currentValue,
      showCancelButton: true,
      confirmButtonText: 'Lưu',
      cancelButtonText: 'Hủy',
      inputValidator: (value) => {
        if (!value) {
          return 'Thông tin không được để trống!'
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await warrantyService.updateWarrantyService(warrantyId, { value: result.value });
          fetchInitialData();
          if (currentBrand?.warranty === currentValue) {
            setCurrentBrand(prev => prev ? { ...prev, warranty: result.value } : null);
          }
        } catch (error) {
          console.error("Failed to update warranty service", error);
        }
      }
    });
  };

  const handleDeleteWarranty = async (warrantyId: string) => {
    if (!warrantyId) return;
  
    try {
      await warrantyService.deleteWarrantyService(warrantyId);
      fetchInitialData();
      const warrantyToDelete = warrantyServices.find(w => w.id === warrantyId);
      if (warrantyToDelete && currentBrand?.warranty === warrantyToDelete.value) {
        setCurrentBrand(prev => prev ? { ...prev, warranty: '' } : null);
      }
    } catch (error) {
      console.error("Failed to delete warranty service", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Edit3 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {currentBrand?.id 
                    ? `Sửa loại cho "${selectedService?.name}"` 
                    : 'Thêm loại mới'}
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  {currentBrand?.id ? 'Cập nhật thông tin loại dịch vụ' : 'Tạo loại dịch vụ mới cho khách hàng'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 space-y-4">
          {/* Service Name Section */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Smartphone size={16} className="mr-2 text-blue-600" />
              Loại {selectedService ? `cho "${selectedService.name}"` : ''} <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="mt-2">
              {currentBrand?.id ? (
                <input
                  type="text"
                  value={currentBrand?.name || ''}
                  onChange={(e) => setCurrentBrand(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập tên loại dịch vụ"
                />
              ) : !isAddingNewTypeName ? (
                <div className="flex gap-2">
                  <div className="flex-1">
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
                      placeholder="Chọn tên loại có sẵn"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewTypeName(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                    title="Thêm loại mới"
                  >
                    <Plus size={14} />
                    <span>Mới</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Tên loại mới"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (!newTypeName.trim()) return;
                      setCurrentBrand(prev => ({ ...prev, name: newTypeName.trim(), warranty: '' }));
                      if (!uniqueBrandNames.some(item => item.name === newTypeName.trim())) {
                        setUniqueBrandNames(prev => [...prev, { name: newTypeName.trim(), warranty: ''}]);
                      }
                      setIsAddingNewTypeName(false);
                      setNewTypeName('');
                    }}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <Check size={14} />
                    <span>Lưu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewTypeName(false)}
                    className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <X size={14} />
                    <span>Hủy</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Device Brand Section */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Smartphone size={16} className="mr-2 text-purple-600" />
              Thương hiệu điện thoại
            </label>
            <div className="mt-2">
              {!isAddingNewBrand ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={deviceBrands.map(brand => ({ id: brand.id, name: brand.name }))}
                      value={selectedDeviceBrand}
                      onChange={handleDeviceBrandChange}
                      placeholder="Chọn thương hiệu"
                      onDelete={handleDeleteDeviceBrand}
                      onEdit={handleEditDeviceBrand}
                      onSearch={handleSearchDeviceBrands}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewBrand(true)}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                    title="Thêm thương hiệu mới"
                  >
                    <Plus size={14} />
                    <span>Mới</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDeviceBrand}
                    onChange={(e) => setNewDeviceBrand(e.target.value)}
                    placeholder="Tên thương hiệu mới"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
                      } catch (error) {
                        console.error('Failed to create device brand:', error);
                      }
                    }}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <Check size={14} />
                    <span>Lưu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewBrand(false)}
                    className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <X size={14} />
                    <span>Hủy</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Device Type Section */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Smartphone size={16} className="mr-2 text-indigo-600" />
              Loại máy
              {selectedDeviceBrand && (
                <span className="ml-2 text-xs text-gray-500">
                  (Đã filter theo thương hiệu: {deviceBrands.find(b => b.id === selectedDeviceBrand)?.name})
                </span>
              )}
            </label>
            <SearchableSelect
                key={`device-select-${selectedDeviceBrand}-${deviceOptions.length}`}
                options={deviceOptions}
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                placeholder={selectedDeviceBrand ? "Chọn loại máy từ thương hiệu đã chọn" : "Chọn loại máy"}
                onSearch={handleSearchDeviceInfos}
            />
            {selectedDeviceBrand && deviceOptions.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Không tìm thấy thiết bị nào cho thương hiệu "{deviceBrands.find(b => b.id === selectedDeviceBrand)?.name}". 
                Bạn có thể search để tìm thiết bị khác.
              </p>
            )}
          </div>
          
          {/* Color Section */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Palette size={16} className="mr-2 text-pink-600" />
              Màu sắc
            </label>
            <select
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={selectedColor}
                onChange={handleColorChange}
                disabled={!selectedDeviceId}
            >
                <option value="">Chọn màu sắc</option>
                {colorOptions.length > 0 && (
                    <option value="all">Tất cả màu sắc</option>
                )}
                {colorOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
            </select>
            {!selectedDeviceId && (
              <p className="text-sm text-gray-500 mt-2">Vui lòng chọn loại máy trước để xem các màu sắc</p>
            )}
          </div>

          {/* Price Section */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <DollarSign size={16} className="mr-2 text-green-600" />
              Giá
            </label>
            <input
                type="text"
                value={formatPrice(currentBrand?.price || '')}
                onChange={handlePriceChange}
                placeholder="Nhập giá (VD: 500.000)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Warranty Section */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Shield size={16} className="mr-2 text-orange-600" />
              Bảo hành
            </label>
            <div className="mt-2">
              {!isAddingNewWarranty ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={(warrantyServices || []).map(ws => ({ id: ws.id, name: ws.value }))}
                      value={(warrantyServices || []).find(ws => ws.value === currentBrand?.warranty)?.id || ''}
                      onChange={(value) => {
                        const selectedWarranty = (warrantyServices || []).find(ws => ws.id === value);
                        setCurrentBrand(prev => prev ? { ...prev, warranty: selectedWarranty?.value || '' } : null);
                      }}
                      placeholder="Chọn bảo hành"
                      onDelete={handleDeleteWarranty}
                      onEdit={handleEditWarranty}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewWarranty(true)}
                    className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                    title="Thêm bảo hành mới"
                  >
                    <Plus size={14} />
                    <span>Mới</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWarrantyService}
                    onChange={(e) => setNewWarrantyService(e.target.value)}
                    placeholder="Thông tin bảo hành mới"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      if (!newWarrantyService.trim()) return;
                      try {
                        const newWarranty = await warrantyService.createWarrantyService({ value: newWarrantyService.trim() });
                        setWarrantyServices(prev => [...prev, newWarranty]);
                        setCurrentBrand(prev => prev ? { ...prev, warranty: newWarranty.value } : null);
                        setNewWarrantyService('');
                        setIsAddingNewWarranty(false);
                      } catch (error) {
                        console.error('Failed to create warranty service:', error);
                      }
                    }}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <Check size={14} />
                    <span>Lưu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewWarranty(false)}
                    className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <X size={14} />
                    <span>Hủy</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Note Section */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <FileText size={16} className="mr-2 text-teal-600" />
              Ghi chú
            </label>
            <textarea
                value={currentBrand?.note || ''}
                onChange={(e) => setCurrentBrand(prev => prev ? { ...prev, note: e.target.value } : null)}
                placeholder="Ghi chú thêm (VD: Áp dụng cho máy còn tem, điều kiện đặc biệt...)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
                rows={3}
            />
          </div>

          {/* Conditions Section */}
          {selectedService && selectedService.conditions && selectedService.conditions.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
              <label className="block text-sm font-semibold text-blue-700 mb-2 flex items-center">
                <Shield size={16} className="mr-2 text-blue-600" />
                Điều kiện áp dụng
              </label>
              <div className="mt-2 space-y-2">
                {selectedService.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center p-2 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors duration-200">
                    <input
                      id={`condition-${index}`}
                      type="checkbox"
                      checked={currentBrand?.note?.includes(condition)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setCurrentBrand(prev => {
                          if (!prev) return null;
                          const existingNotes = prev.note ? prev.note.split(', ').filter(n => n.trim() !== '') : [];
                          let newNotes;
                          if (isChecked) {
                            newNotes = [...existingNotes, condition];
                          } else {
                            newNotes = existingNotes.filter(n => n !== condition);
                          }
                          return { ...prev, note: newNotes.join(', ') };
                        });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                    />
                    <label htmlFor={`condition-${index}`} className="ml-2 block text-sm text-blue-800 font-medium cursor-pointer hover:text-blue-900 transition-colors duration-200">
                      {condition}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-4 py-3 rounded-b-xl border-t border-gray-200">
          <div className="flex justify-end gap-2">
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Hủy
            </button>
            <button 
              onClick={handleSave} 
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {currentBrand?.id ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};