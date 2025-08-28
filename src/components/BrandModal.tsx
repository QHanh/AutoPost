import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brand } from '../types/Brand';
import { DeviceBrand } from '../types/deviceBrand';
import SearchableSelect from './SearchableSelect';
import { Plus, Check, X, Edit3, Edit, Trash2 } from 'lucide-react';
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
  // Remove duplicate declaration
  const [isAddingNewBrand, setIsAddingNewBrand] = useState<boolean>(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [deviceTypeSearchTerm, setDeviceTypeSearchTerm] = useState('');
  const [newDeviceBrand, setNewDeviceBrand] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [newWarrantyService, setNewWarrantyService] = useState<string>('');
  const [isAddingNewWarranty, setIsAddingNewWarranty] = useState<boolean>(false);
  const [isAddingNewTypeName, setIsAddingNewTypeName] = useState<boolean>(false);
  const [newTypeName, setNewTypeName] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [userNote, setUserNote] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      // Initialize user note when editing existing brand
      if (currentBrand?.note) {
        const noteParts = currentBrand.note.split('--- Điều kiện ---');
        const userNotePart = noteParts[0].trim();
        setUserNote(userNotePart);
      } else {
        setUserNote('');
      }
    }
  }, [isOpen, selectedService]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userNote]);

  // Separate useEffect to handle note changes without resetting other fields
  useEffect(() => {
    if (currentBrand?.note) {
      const noteParts = currentBrand.note.split('--- Điều kiện ---');
      const userNotePart = noteParts[0].trim();
      setUserNote(userNotePart);
    } else {
      setUserNote('');
    }
  }, [currentBrand?.note]);

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

  // ✅ Debug: Theo dõi khi deviceOptions thay đổi
  useEffect(() => {
    console.log('📊 [BrandModal] deviceOptions changed:', {
      count: deviceOptions.length,
      options: deviceOptions.map(o => ({ id: o.id, name: o.name })),
      isSearching
    });
  }, [deviceOptions, isSearching]);

  // ✅ Debug: Theo dõi isSearching state
  useEffect(() => {
    console.log('🔍 [BrandModal] isSearching changed:', isSearching);
  }, [isSearching]);

  // ✅ Reset search state khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      console.log('🔄 [BrandModal] Modal closed, resetting search state');
      setIsSearching(false);
      // Reset all input fields when modal closes
      setNewDeviceBrand('');
      setNewTypeName('');
      setNewWarrantyService('');
      setUserNote('');
    }
  }, [isOpen]);

  // ✅ callback ổn định cho fetch initial data
  const fetchInitialData = useCallback(async () => {
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
          setDeviceTypeSearchTerm(currentBrand.device_type);
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
  }, [currentBrand, selectedService]);

  // ✅ callback ổn định cho device brand change
  const handleDeviceBrandChange = useCallback(async (brandId: string) => {
    console.log('🔄 [BrandModal] Device brand change:', { from: selectedDeviceBrand, to: brandId });
    
    // ✅ QUAN TRỌNG: Reset searching state khi thay đổi brand
    // Điều này cho phép update deviceOptions
    setIsSearching(false);
    
    setSelectedDeviceBrand(brandId);
    
    // Reset device selection khi thay đổi thương hiệu
    setSelectedDeviceId('');
    setDeviceTypeSearchTerm('');
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
        
        // ✅ QUAN TRỌNG: Luôn update deviceOptions khi thay đổi brand
        // Vì đã reset isSearching = false
        setDeviceOptions(prevOptions => {
          console.log('🔄 [BrandModal] Brand change - updating deviceOptions:', {
            previous: prevOptions.length,
            new: deviceOptionsData.length,
            isSearching: false
          });
          
          return deviceOptionsData;
        });
        
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
  }, [deviceBrands, selectedDeviceBrand]);

  // ✅ callback ổn định cho search device infos
  const handleSearchDeviceInfos = useCallback(async (term: string) => {
    console.log('🔍 [BrandModal] Search started:', { term, selectedDeviceBrand });
    
    // ✅ Set searching state để tránh bị override
    setIsSearching(true);
    
    try {
      // ✅ Khi search, vẫn filter theo thương hiệu đã chọn để đảm bảo tính nhất quán
      const searchParams: any = { search: term };
      if (selectedDeviceBrand) {
        const selectedBrand = deviceBrands.find(b => b.id === selectedDeviceBrand);
        if (selectedBrand) {
          searchParams.brand = selectedBrand.name;
        }
      }
      
      console.log('🔍 [BrandModal] API call params:', searchParams);
      const res = await deviceApiService.getDeviceInfos(searchParams, { limit: 20 });
      const devices = res.devices.map(d => ({ id: String(d.id), name: String(d.model) }));
      console.log('🔍 [BrandModal] API response:', { 
        term, 
        brandFilter: searchParams.brand, 
        devicesCount: devices.length,
        devices: devices.map(d => d.name)
      });
      
      // ✅ QUAN TRỌNG: Cập nhật deviceOptions với kết quả tìm kiếm
      // Sử dụng functional update để đảm bảo state update đúng cách
      setDeviceOptions(prevOptions => {
        console.log('🔄 [BrandModal] State update:', { 
          previous: prevOptions.length, 
          new: devices.length,
          previousOptions: prevOptions.map(o => o.name),
          newOptions: devices.map(o => o.name)
        });
        return devices;
      });
      
      // ✅ QUAN TRỌNG: Đợi state update hoàn tất trước khi return
      // Điều này đảm bảo SearchableSelect nhận được options mới
      await new Promise(resolve => setTimeout(resolve, 0));
      
      console.log('✅ [BrandModal] Search completed, returning devices');
      return devices;
    } catch (error) {
      console.error('❌ [BrandModal] Search failed:', error);
      // Trong trường hợp lỗi, vẫn cập nhật state để hiển thị empty
      setDeviceOptions([]);
      return [];
    }
    // ❌ KHÔNG reset isSearching ngay lập tức - để giữ kết quả search
    // setIsSearching(false) sẽ được gọi khi user chọn option hoặc đóng dropdown
  }, [selectedDeviceBrand, deviceBrands]);

  // ✅ callback ổn định cho search device brands
  const handleSearchDeviceBrands = useCallback(async (term: string) => {
    try {
      const brands = await deviceBrandService.getDeviceBrands(0, 20, term);
      return brands.map(brand => ({ id: brand.id, name: brand.name }));
    } catch (error) {
      console.error('Failed to search device brands:', error);
      return [];
    }
  }, []);

  // ✅ callback ổn định cho device change
  const handleDeviceChange = useCallback((deviceId: string) => {
    console.log('🔄 [BrandModal] Device selected:', deviceId);
    
    // ✅ Reset searching state khi user chọn device
    setIsSearching(false);
    
    setSelectedDeviceId(deviceId);
    if (deviceId) {
      // Fetch colors for selected device
      deviceApiService.getColorsByDeviceInfoId(deviceId).then(colors => {
        const newColorOptions = colors.map(c => ({ id: String(c.id), name: String(c.name) }));
        setColorOptions(newColorOptions);
        setSelectedColor('');
      });
    } else {
      setColorOptions([]);
      setSelectedColor('');
    }
  }, []);

  const handleConditionsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setCurrentBrand(prev => {
        if (!prev) return null;

        // Update the conditions array
        const prevConditions = prev.conditions || [];
        const newConditions = checked
            ? [...prevConditions, value]
            : prevConditions.filter(c => c !== value);

        // Clean userNote by removing any existing conditions
        let cleanUserNote = userNote;
        if (prev.conditions && prev.conditions.length > 0) {
            // Remove all existing conditions from userNote
            for (const condition of prev.conditions) {
                cleanUserNote = cleanUserNote.replace(new RegExp(`\\n?${condition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
            }
            // Clean up extra newlines and commas
            cleanUserNote = cleanUserNote.replace(/\n+/g, '\n').replace(/,\s*/g, '').trim();
        }

        // Build new note from clean userNote + new conditions
        let newNote = cleanUserNote;
        if (newConditions.length > 0) {
            const conditionsText = newConditions.join(', ');
            if (cleanUserNote) {
                newNote = `${cleanUserNote}\n${conditionsText}`;
            } else {
                newNote = conditionsText;
            }
        }

        // Return updated brand with all existing values preserved
        return { 
            ...prev, 
            conditions: newConditions, 
            note: newNote 
        };
    });
  }, [userNote]);
  // ✅ callback ổn định cho price change
  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setCurrentBrand(prev => prev ? { ...prev, price: value } : null);
  }, []);

  const formatPrice = (price: string): string => {
    if (!price) return '';
    const numberValue = parseInt(price, 10);
    if (isNaN(numberValue)) return '';
    return numberValue.toLocaleString('vi-VN');
  };

  // ✅ callback ổn định cho save
  const handleSave = useCallback(async () => {
    try {
      if (!currentBrand?.name || !selectedService) {
        Swal.fire('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc.', 'error');
        return;
      }

      // Validate device brand selection
      if (!selectedDeviceBrand) {
        Swal.fire('Lỗi', 'Vui lòng chọn thương hiệu thiết bị.', 'error');
        return;
      }

      if (selectedColor === 'all') {
        // Save a service for each color sequentially
        for (const color of colorOptions) {
          const brandData = {
            ...currentBrand,
            service_id: selectedService.id,
            device_brand_id: selectedDeviceBrand,
            device_type: deviceOptions.find(d => d.id === selectedDeviceId)?.name || '',
            color: color.name,
          };

          // Since we are creating multiple entries, we should only use createBrand
          // and not updateBrand, as 'all' implies creating new entries for each color.
          await brandService.createBrand(brandData);
          // Optional: add a small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        Swal.fire('Thành công', `Đã tạo dịch vụ cho ${colorOptions.length} màu!`, 'success');

      } else {
        // Save for a single selected color
        const brandData = {
          ...currentBrand,
          service_id: selectedService.id,
          device_brand_id: selectedDeviceBrand,
          device_type: deviceOptions.find(d => d.id === selectedDeviceId)?.name || '',
          color: colorOptions.find(c => c.id === selectedColor)?.name || '',
        };

        if (currentBrand.id) {
          await brandService.updateBrand(currentBrand.id, brandData);
          Swal.fire('Thành công', 'Cập nhật loại dịch vụ thành công!', 'success');
        } else {
          await brandService.createBrand(brandData);
          Swal.fire('Thành công', 'Tạo loại dịch vụ thành công!', 'success');
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save brand:', error);
      Swal.fire('Lỗi', 'Có lỗi xảy ra khi lưu loại dịch vụ.', 'error');
    }
  }, [currentBrand, selectedService, selectedDeviceBrand, selectedDeviceId, selectedColor, deviceOptions, colorOptions, onSave, onClose]);

  // ✅ callback ổn định cho service name change
  const handleServiceNameChange = useCallback((value: string) => {
    const selected = uniqueBrandNames.find(b => b.name === value);
    setCurrentBrand(prev => ({
      ...prev,
      name: value,
      warranty: selected ? selected.warranty : prev?.warranty || ''
    }));
  }, [uniqueBrandNames]);

  const handleEditDeviceBrand = useCallback(async (brandId: string) => {
    const brand = deviceBrands.find(b => b.id === brandId);
    if (!brand) return;

    const { value: newName } = await Swal.fire({
        title: `Sửa tên thương hiệu`,
        input: 'text',
        inputValue: brand.name,
        showCancelButton: true,
        confirmButtonText: 'Lưu',
        cancelButtonText: 'Hủy',
        inputValidator: (value) => {
            if (!value) {
                return 'Tên không được để trống!';
            }
        }
    });

    if (newName && newName !== brand.name) {
        try {
            const updatedBrand = await deviceBrandService.updateDeviceBrand(brandId, { name: newName });
            setDeviceBrands(prev => prev.map(b => b.id === brandId ? updatedBrand : b));
            Swal.fire('Thành công', 'Đã cập nhật tên thương hiệu.', 'success');
        } catch (error) {
            console.error('Failed to update device brand:', error);
            Swal.fire('Lỗi', 'Không thể cập nhật thương hiệu.', 'error');
        }
    }
  }, [deviceBrands]);

  const handleDeleteDeviceBrand = useCallback(async (brandId: string) => {
    const brand = deviceBrands.find(b => b.id === brandId);
    if (!brand) return;

    Swal.fire({
        title: `Bạn chắc chắn muốn xóa "${brand.name}"?`,
        text: "Hành động này không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Vâng, xóa nó!',
        cancelButtonText: 'Hủy'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await deviceBrandService.deleteDeviceBrand(brandId);
                setDeviceBrands(prev => prev.filter(b => b.id !== brandId));
                if (selectedDeviceBrand === brandId) {
                    setSelectedDeviceBrand('');
                }
                Swal.fire('Đã xóa!', 'Thương hiệu đã được xóa.', 'success');
            } catch (error) {
                console.error('Failed to delete device brand:', error);
                Swal.fire('Lỗi', 'Không thể xóa thương hiệu.', 'error');
            }
        }
    });
  }, [deviceBrands, selectedDeviceBrand]);

  // ✅ callback ổn định cho warranty change
  const handleWarrantyChange = useCallback((value: string) => {
    const selectedWarranty = (warrantyServices || []).find(ws => ws.id === value);
    setCurrentBrand(prev => prev ? { ...prev, warranty: selectedWarranty?.value || '' } : null);
  }, [warrantyServices]);

  // ✅ callback ổn định cho edit warranty
  const handleEditWarranty = useCallback(async (warrantyId: string, newValue: string) => {
    try {
      const updatedWarranty = await warrantyService.updateWarrantyService(warrantyId, { value: newValue });
      setWarrantyServices(prev => prev.map(w => w.id === warrantyId ? updatedWarranty : w));
    } catch (error) {
      console.error('Failed to update warranty service:', error);
    }
  }, []);

  // ✅ callback ổn định cho delete warranty
  const handleDeleteWarranty = useCallback(async (warrantyId: string) => {
    try {
      await warrantyService.deleteWarrantyService(warrantyId);
      setWarrantyServices(prev => prev.filter(w => w.id !== warrantyId));
    } catch (error) {
      console.error('Failed to delete warranty service:', error);
    }
  }, []);

  // ✅ KHÔNG return null khi !isOpen, giữ mount và ẩn bằng CSS
  if (!isOpen) {
    return null; // Tạm thởi giữ nguyên để tránh breaking change
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Edit3 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {currentBrand?.id 
                    ? `Sửa loại cho "${selectedService?.name}"` 
                    : `Thêm loại cho "${selectedService?.name}"`}
                </h3>
                <p className="text-blue-100 text-xs mt-1">
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
<div className="p-8 space-y-8">
{/* Row 1: Device Brand, Type, Color */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
{/* Device Brand */}
<div>
<label className="block text-base font-medium text-gray-700 mb-2">Thương hiệu</label>
{!isAddingNewBrand ? (
  <div className="relative">
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Chọn thương hiệu"
        value={deviceBrands.find(b => b.id === selectedDeviceBrand)?.name || ''}
        onChange={(e) => {
          // Handle search
          handleSearchDeviceBrands(e.target.value);
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <button type="button" onClick={() => setIsAddingNewBrand(true)} className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"><Plus size={16} /></button>
    </div>
    <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
      {deviceBrands.map(brand => (
        <div
          key={brand.id}
          onClick={() => handleDeviceBrandChange(brand.id)}
          className={`group flex justify-between items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedDeviceBrand === brand.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
        >
          <span>{brand.name}</span>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); handleEditDeviceBrand(brand.id); }} className="p-1 text-gray-500 hover:text-blue-600"><Edit size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteDeviceBrand(brand.id); }} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  </div>
) : (
<div className="flex gap-2">
        <input type="text" value={newDeviceBrand} onChange={(e) => setNewDeviceBrand(e.target.value)} placeholder="Tên thương hiệu mới" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" autoFocus />
<button onClick={async () => { if (!newDeviceBrand.trim()) return; const newBrand = await deviceBrandService.createDeviceBrand({ name: newDeviceBrand.trim() }); setDeviceBrands(prev => [...prev, newBrand]); setSelectedDeviceBrand(newBrand.id); setNewDeviceBrand(''); setIsAddingNewBrand(false); }} className="p-2 bg-green-500 text-white rounded-lg"><Check size={16} /></button>
<button type="button" onClick={() => { setIsAddingNewBrand(false); setNewDeviceBrand(''); }} className="p-2 bg-gray-400 text-white rounded-lg"><X size={16} /></button>
</div>
)}
</div>

{/* Device Type */}
<div>
<label className="block text-base font-medium text-gray-700 mb-2">Loại máy</label>
<div className="relative">
<input
  type="text"
  placeholder="Tìm và chọn loại máy"
  value={deviceTypeSearchTerm}
  onChange={(e) => {
    setDeviceTypeSearchTerm(e.target.value);
    handleSearchDeviceInfos(e.target.value);
  }}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
/>
<div className="mt-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
  {deviceOptions.map(option => (
    <div
      key={option.id}
      onClick={() => {
        handleDeviceChange(option.id);
        setDeviceTypeSearchTerm(option.name);
      }}
      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedDeviceId === option.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
    >
      {option.name}
    </div>
  ))}
</div>
</div>
</div>

{/* Color */}
<div>
<label className="block text-base font-medium text-gray-700 mb-2">Màu sắc</label>
<div className="relative">
<input
  type="text"
  placeholder="Chọn màu"
  value={selectedColor === 'all' ? 'Tất cả màu sắc' : colorOptions.find(c => c.id === selectedColor)?.name || (selectedDeviceId ? 'Chọn màu' : 'Chọn loại máy')}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
  disabled={!selectedDeviceId}
/>
<div className="mt-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
  {selectedDeviceId && (
    <>
      <div
        key="all"
        onClick={async () => {
          setSelectedColor('all');
          setCurrentBrand(prev => prev ? { ...prev, color: 'Tất cả màu sắc' } : null);
          
          // Call API for each color when 'Tất cả màu sắc' is selected
          if (selectedDeviceId && selectedDeviceBrand && colorOptions.length > 0) {
            // Execute API calls sequentially (one after another)
            for (const color of colorOptions) {
              try {
                await deviceApiService.addColorToDevice(selectedDeviceId, color.id);
                console.log(`Successfully added color ${color.name} to device ${selectedDeviceId}`);
                // Add a small delay between calls to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (error) {
                console.error(`Error adding color ${color.name} to device ${selectedDeviceId}:`, error);
                // Optionally show error to user
              }
            }
          }
        }}
        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedColor === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
      >
        Tất cả màu sắc
      </div>
      {colorOptions.map(color => (
        <div
          key={color.id}
          onClick={() => {
            setSelectedColor(color.id);
            setCurrentBrand(prev => prev ? { ...prev, color: color.name } : null);
          }}
          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedColor === color.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
        >
          {color.name}
        </div>
      ))}
    </>
  )}
  {!selectedDeviceId && (
    <div className="px-3 py-2 text-gray-500">Vui lòng chọn loại máy</div>
  )}
</div>
</div>
<div className="h-4"></div>
</div>
</div>

{/* Row 2: Service Name, Price, Wholesale Price, Warranty */}
<div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1.5fr] gap-6 items-end">
{/* Service Name */}
<div>
<label className="block text-base font-medium text-gray-700 mb-2">Loại dịch vụ <span className="text-red-500">*</span></label>
{currentBrand?.id ? (
<input type="text" value={currentBrand?.name || ''} onChange={(e) => setCurrentBrand(prev => prev ? { ...prev, name: e.target.value } : null)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" placeholder="Nhập tên loại dịch vụ" />
) : !isAddingNewTypeName ? (
<div className="flex gap-2">
<div className="flex-1"><SearchableSelect options={uniqueBrandNames.map(b => ({ id: b.name, name: b.name }))} value={currentBrand?.name || ''} onChange={handleServiceNameChange} placeholder="Chọn tên loại có sẵn" /></div>
<button type="button" onClick={() => setIsAddingNewTypeName(true)} className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"><Plus size={16} /></button>
</div>
) : (
<div className="flex flex-col gap-1">
<input type="text" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="Tên loại mới" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" autoFocus />
<div className="flex gap-1 justify-end">
<button onClick={() => { if (!newTypeName.trim()) return; setCurrentBrand(prev => ({ ...prev, name: newTypeName.trim(), warranty: '' })); if (!uniqueBrandNames.some(item => item.name === newTypeName.trim())) { setUniqueBrandNames(prev => [...prev, { name: newTypeName.trim(), warranty: ''}]); } setIsAddingNewTypeName(false); setNewTypeName(''); }} className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"><Check size={14} className="inline mr-1"/>Xác nhận</button>
<button type="button" onClick={() => { setIsAddingNewTypeName(false); setNewTypeName(''); }} className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm"><X size={14} className="inline mr-1"/>Hủy</button>
</div>
</div>
)}
</div>

{/* Price */}
<div className="w-full">
<label className="block text-base font-medium text-gray-700 mb-2">Giá</label>
<input type="text" value={formatPrice(currentBrand?.price || '')} onChange={handlePriceChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" placeholder="Nhập giá" />
</div>

{/* Wholesale Price */}
<div className="w-full">
<label className="block text-base font-medium text-gray-700 mb-2">Giá bán buôn</label>
<input type="text" value={formatPrice(currentBrand?.wholesale_price || '')} onChange={(e) => {
  const value = e.target.value.replace(/[^\d]/g, '');
  setCurrentBrand(prev => prev ? { ...prev, wholesale_price: value } : null);
}} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" placeholder="Nhập giá bán buôn" />
</div>

{/* Warranty */}
<div>
<label className="block text-base font-medium text-gray-700 mb-2">Bảo hành</label>
{!isAddingNewWarranty ? (
<div className="flex gap-2">
<div className="flex-1"><SearchableSelect options={(warrantyServices || []).map(w => ({ id: w.id, name: w.value }))} value={(warrantyServices || []).find(w => w.value === currentBrand?.warranty)?.id || ''} onChange={handleWarrantyChange} placeholder="Chọn bảo hành" onDelete={handleDeleteWarranty} onEdit={handleEditWarranty} /></div>
<button type="button" onClick={() => setIsAddingNewWarranty(true)} className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"><Plus size={16} /></button>
</div>
) : (
<div className="flex gap-2">
<input type="text" value={newWarrantyService} onChange={(e) => setNewWarrantyService(e.target.value)} placeholder="Bảo hành mới" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" autoFocus />
<button onClick={async () => { if (!newWarrantyService.trim()) return; const newWarranty = await warrantyService.createWarrantyService({ value: newWarrantyService.trim() }); setWarrantyServices(prev => [...prev, newWarranty]); setCurrentBrand(prev => prev ? { ...prev, warranty: newWarranty.value } : null); setNewWarrantyService(''); setIsAddingNewWarranty(false); }} className="p-2 bg-green-500 text-white rounded-lg"><Check size={16} /></button>
<button type="button" onClick={() => { setIsAddingNewWarranty(false); setNewWarrantyService(''); }} className="p-2 bg-gray-400 text-white rounded-lg"><X size={16} /></button>
</div>
)}
</div>
</div>

{/* Row 3: Notes */}
<div>
<label className="block text-base font-medium text-gray-700 mb-2">Ghi chú</label>
<textarea 
    ref={textareaRef}
    value={userNote}
    onChange={(e) => {
        const newText = e.target.value;
        setUserNote(newText);
        
        // Check if user manually removed conditions from the note
        setCurrentBrand(prev => {
            if (!prev) return null;
            
            const currentConditions = prev.conditions || [];
            const updatedConditions: string[] = [];
            
            // Check which conditions are still present in the user input
            for (const condition of currentConditions) {
                if (newText.includes(condition)) {
                    updatedConditions.push(condition);
                }
            }
            
            // Update both note and conditions
            return { 
                ...prev, 
                note: newText,
                conditions: updatedConditions
            };
        });
    }}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base resize-none overflow-hidden" 
    placeholder="Thêm ghi chú nếu cần" 
    rows={1}
></textarea>
</div>

{/* Conditions Section (for Battery Replacement) */}
{selectedService?.conditions && selectedService.conditions.length > 0 && (
<div>
<label className="block text-base font-medium text-gray-700 mb-3">Điều kiện áp dụng</label>
<div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-gray-200 rounded-lg">
{selectedService.conditions.map(condition => (
<label key={condition} className="flex items-center space-x-2 cursor-pointer">
<input
type="checkbox"
value={condition}
checked={(currentBrand?.conditions || []).includes(condition)}
onChange={handleConditionsChange}
className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
/>
<span className="text-sm text-gray-700">{condition}</span>
</label>
))}
</div>
</div>
)}

{/* Footer with buttons */}
<div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3 border-t border-gray-200">
<button 
onClick={onClose} 
className="px-6 py-3 text-base font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all"
>
Hủy
</button>
<button 
onClick={handleSave} 
className="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all flex items-center shadow-sm"
>
<Check size={18} className="mr-2" />
{currentBrand?.id ? 'Lưu thay đổi' : 'Tạo mới'}
</button>
</div>
</div>
</div>
</div>
);
};