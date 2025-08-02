import React, { useState, useEffect, useRef } from 'react';
import { serviceService } from '../services/serviceService.js';
import { brandService } from '../services/brandService.js';
import { Service } from '../types/Service.js';
import { Brand } from '../types/Brand.js';
import { Plus, Edit, Trash2, ChevronRight, ChevronsUpDown, ArrowDown, ArrowUp, FileDown, FileUp } from 'lucide-react';
import Swal from 'sweetalert2';
import { deviceApiService } from '../services/deviceApiService';
import { SearchableSelect } from '../components/SearchableSelect';
import deviceBrandService from '../services/deviceBrandService';
import { DeviceBrand } from '../types/deviceBrand';

type SortConfig = {
    key: keyof Brand;
    direction: 'ascending' | 'descending';
} | null;

export const ServiceManagementPage: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isLoadingBrands, setIsLoadingBrands] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [brandModalOpen, setBrandModalOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [selectedServicesForExport, setSelectedServicesForExport] = useState<Set<string>>(new Set());
    const [currentService, setCurrentService] = useState<Service | null>(null);
    const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const [deviceOptions, setDeviceOptions] = useState<{id: string, name: string}[]>([]);
    const [colorOptions, setColorOptions] = useState<{id: string, name: string}[]>([]);
    const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);
    const [selectedDeviceBrand, setSelectedDeviceBrand] = useState<string>('');
    const [newDeviceBrand, setNewDeviceBrand] = useState<string>('');
    const [isDeviceBrandDropdownOpen, setIsDeviceBrandDropdownOpen] = useState<boolean>(false);
    const [isAddingNewBrand, setIsAddingNewBrand] = useState<boolean>(false);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper function to format price as Vietnamese currency
    const formatPrice = (price: string | undefined): string => {
        if (!price) return '';
        
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice)) return price;
        
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(numericPrice);
    };

    const fetchServices = async () => {
        try {
            setIsLoadingServices(true);
            const data = await serviceService.getAllServices();
            setServices(data);
            if (data && data.length > 0 && !selectedService) {
                handleSelectService(data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch services", error);
            Swal.fire('Lỗi', 'Không thể tải danh sách dịch vụ.', 'error');
        } finally {
            setIsLoadingServices(false);
        }
    };

    const fetchDeviceBrands = async () => {
        try {
            const data = await deviceBrandService.getDeviceBrands();
            setDeviceBrands(data);
        } catch (error) {
            console.error("Failed to fetch device brands", error);
            // Don't show error to user as this is supplementary functionality
        }
    };

    const fetchBrands = async (serviceId: string, sortBy?: keyof Brand, sortOrder?: 'asc' | 'desc') => {
        try {
            setIsLoadingBrands(true);
            const data = await brandService.getAllBrands(0, 100, '', serviceId, sortBy, sortOrder);
            setBrands(data);
        } catch (error) {
            console.error("Failed to fetch brands", error);
            Swal.fire('Lỗi', 'Không thể tải danh sách hãng.', 'error');
        } finally {
            setIsLoadingBrands(false);
        }
    };

    useEffect(() => {
        fetchServices();
        fetchDeviceBrands();
    }, []);

    useEffect(() => {
        if (selectedService) {
            const sortBy = sortConfig?.key;
            const sortOrder = sortConfig?.direction === 'ascending' ? 'asc' : 'desc';
            fetchBrands(selectedService.id, sortBy, sortOrder);
        }
    }, [selectedService, sortConfig]);

    const handleSelectService = (service: Service) => {
        setSelectedService(service);
        setSortConfig(null); // Reset sort when changing service
    };
    
    // Excel export selection handlers
    const handleOpenExportModal = () => {
        // Reset selection when opening modal
        setSelectedServicesForExport(new Set());
        setExportModalOpen(true);
    };

    const handleCloseExportModal = () => {
        setExportModalOpen(false);
        setSelectedServicesForExport(new Set());
    };

    const handleSelectServiceForExport = (serviceId: string) => {
        setSelectedServicesForExport(prev => {
            const newSet = new Set(prev);
            if (newSet.has(serviceId)) {
                newSet.delete(serviceId);
            } else {
                newSet.add(serviceId);
            }
            return newSet;
        });
    };

    const handleSelectAllServicesForExport = () => {
        const areAllSelected = services.length > 0 && selectedServicesForExport.size === services.length;
        if (areAllSelected) {
            // Deselect all
            setSelectedServicesForExport(new Set());
        } else {
            // Select all
            setSelectedServicesForExport(new Set(services.map(s => s.id)));
        }
    };

    const handleExportSelectedServices = async () => {
        try {
            // Close the export modal
            setExportModalOpen(false);
            
            // Call the export function with selected service IDs
            await brandService.exportBrands(Array.from(selectedServicesForExport));
            
            // Reset selection
            setSelectedServicesForExport(new Set());
            
            Swal.fire('Thành công', 'Xuất Excel thành công!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Swal.fire('Lỗi', 'Có lỗi xảy ra khi xuất Excel.', 'error');
        }
    };

    const areAllServicesSelected = services.length > 0 && selectedServicesForExport.size === services.length;
    

    
    // Service Modal Handlers
    const handleOpenServiceModal = (service: Partial<Service> | null = null) => {
        setCurrentService(service ? { ...service } as Service : { 
            id: '', 
            name: '', 
            description: '', 
            created_at: '', 
            updated_at: '' 
        });
        setServiceModalOpen(true);
    };

    const handleCloseServiceModal = () => {
        setServiceModalOpen(false);
        setCurrentService(null);
    };

    const handleSaveService = async () => {
        if (!currentService || !currentService.name) {
            Swal.fire('Lỗi', 'Tên dịch vụ không được để trống.', 'error');
            return;
        }
        try {
            if (currentService.id) {
                await serviceService.updateService(currentService.id, {name: currentService.name});
            } else {
                await serviceService.createService({ name: currentService.name });
            }
            Swal.fire('Thành công', 'Lưu dịch vụ thành công!', 'success');
            fetchServices();
            handleCloseServiceModal();
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể lưu dịch vụ.', 'error');
        }
    };

    const handleDeleteService = (service: Service) => {
        Swal.fire({
            title: `Xóa dịch vụ "${service.name}"?`,
            text: "Tất cả các hãng liên quan cũng sẽ bị xóa. Bạn không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Vâng, xóa nó!',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await serviceService.deleteService(service.id);
                    Swal.fire('Đã xóa!', 'Dịch vụ đã được xóa.', 'success');
                    fetchServices();
                    if(selectedService?.id === service.id){
                        setSelectedService(null);
                        setBrands([]);
                    }
                } catch (error) {
                    Swal.fire('Lỗi', 'Không thể xóa dịch vụ.', 'error');
                }
            }
        });
    };
    
    // Brand Modal Handlers
    const handleOpenBrandModal = async (brand: Partial<Brand> | null = null) => {
        setCurrentBrand(brand ? { ...brand } as Brand : { 
            id: '', 
            service_code: '', 
            name: '', 
            warranty: '', 
            service_id: '', 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
        });
        setBrandModalOpen(true);

        // Lấy danh sách thiết bị
        const res = await deviceApiService.getDeviceInfos({}, {limit: 100});
        const newDeviceOptions = res.devices.map(d => ({id: String(d.id), name: String(d.model)}));
        setDeviceOptions(newDeviceOptions);
        
        // Reset selections before trying to set them
        setSelectedDeviceId('');
        setColorOptions([]);
        setSelectedColor('');

        // Nếu là chế độ sửa, tìm và set giá trị đã lưu
        if (brand && brand.device_type) {
            const foundDevice = newDeviceOptions.find(d => d.name === brand.device_type);
            if (foundDevice) {
                setSelectedDeviceId(foundDevice.id);
                
                const colors = await deviceApiService.getColorsByDeviceInfoId(foundDevice.id);
                const newColorOptions = colors.map(c => ({id: String(c.id), name: String(c.name)}));
                setColorOptions(newColorOptions);

                if (brand.color) {
                    const foundColor = newColorOptions.find(c => c.name === brand.color);
                    if (foundColor) {
                        setSelectedColor(foundColor.id);
                    }
                }
            }
        }
        
        // Set selected device brand if editing existing brand
        if (brand && brand.device_brand_id) {
            setSelectedDeviceBrand(brand.device_brand_id);
        } else {
            setSelectedDeviceBrand('');
        }
    };
    
    const handleCloseBrandModal = () => {
        setBrandModalOpen(false);
        setCurrentBrand(null);
    };

    const handleSaveBrand = async () => {
        if (!currentBrand || !currentBrand.name || !selectedService) {
            Swal.fire('Lỗi', 'Tên hãng không được để trống.', 'error');
            return;
        }
        // Lấy tên thiết bị và màu sắc
        const deviceName = deviceOptions.find(d => d.id === selectedDeviceId)?.name || '';
        const colorName = colorOptions.find(c => c.id === selectedColor)?.name || '';
        
        // Use selected device brand ID directly
        const deviceBrandId = selectedDeviceBrand || undefined;
        
        const payload: Partial<Brand> = {
            name: currentBrand.name,
            warranty: currentBrand.warranty || '',
            service_id: selectedService.id,
            device_brand_id: deviceBrandId,
            device_type: deviceName,
            color: colorName,
            price: currentBrand.price || ''
        };
        if (currentBrand.id) {
            await brandService.updateBrand(currentBrand.id, payload);
        } else {
            await brandService.createBrand(payload);
        }
        Swal.fire('Thành công', 'Lưu hãng thành công!', 'success');
        fetchBrands(selectedService.id);
        handleCloseBrandModal();
    };
    
    const handleDeleteBrand = (brandId: string) => {
        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa hãng này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Vâng, xóa nó!',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await brandService.deleteBrand(brandId);
                    Swal.fire('Đã xóa!', 'Hãng đã được xóa.', 'success');
                    fetchBrands(selectedService?.id || '');
                } catch (error) {
                    Swal.fire('Lỗi', 'Không thể xóa hãng.', 'error');
                }
            }
        });
    };

    const handleDeviceChange = async (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        setSelectedColor('');
        setColorOptions([]);
        if (deviceId) {
            const colors = await deviceApiService.getColorsByDeviceInfoId(deviceId);
            setColorOptions(colors.map(c => ({id: String(c.id), name: String(c.name)})));
        }
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedColor(e.target.value);
    };

    const requestSort = (key: keyof Brand) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof Brand) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronsUpDown size={16} className="ml-2" />;
        }
        if (sortConfig.direction === 'ascending') {
            return <ArrowUp size={16} className="ml-2" />;
        }
        return <ArrowDown size={16} className="ml-2" />;
    };

    const renderSortableHeader = (key: keyof Brand, title: string) => (
        <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => requestSort(key)}
        >
            <div className="flex items-center">
                {title}
                {getSortIcon(key)}
            </div>
        </th>
    );

    const handleExport = () => {
        // Open the export modal to select services
        handleOpenExportModal();
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // No longer needs serviceId
            const result = await brandService.importBrands(file);
            Swal.fire({
                title: 'Kết quả Import',
                html: `
                    Tổng cộng: ${result.data.total}<br/>
                    Thành công: ${result.data.success}<br/>
                    Lỗi: ${result.data.error}<br/>
                    Tạo mới: ${result.data.created_count}<br/>
                    Cập nhật: ${result.data.updated_count}<br/>
                    ${result.data.errors.length > 0 ? `<strong>Lỗi:</strong><br/>${result.data.errors.join('<br/>')}`: ''}
                `,
                icon: result.data.error > 0 ? 'warning' : 'success'
            });
            // Refresh both services and the current brand list
            fetchServices();
            if (selectedService) {
                fetchBrands(selectedService.id);
            }
        } catch (error) {
            Swal.fire('Lỗi Import', 'Có lỗi xảy ra trong quá trình import file.', 'error');
        }
        // Reset file input
        event.target.value = '';
    };

  return (
    <div className="container mx-auto px-4 py-8 flex gap-8 h-[calc(100vh-80px)]">
      {/* Services Column */}
      <div className="w-1/3 bg-white shadow-md rounded-lg p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Dịch vụ</h2>
          <button onClick={() => handleOpenServiceModal()} className="p-2 rounded-full hover:bg-gray-200">
            <Plus size={20} />
          </button>
        </div>
        {isLoadingServices ? (
            <div className="text-center p-4">Đang tải...</div>
        ) : (
            <ul className="space-y-2 overflow-y-auto">
                {services.map(service => (
                    <li key={service.id} 
                        onClick={() => handleSelectService(service)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors flex justify-between items-center ${selectedService?.id === service.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    >
                        <span>{service.name}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenServiceModal(service);}} className="p-1 rounded-full hover:bg-gray-300"><Edit size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteService(service);}} className="p-1 rounded-full hover:bg-gray-300"><Trash2 size={16}/></button>
                            {selectedService?.id === service.id && <ChevronRight size={20}/>}
                        </div>
                    </li>
                ))}
            </ul>
        )}
      </div>

      {/* Brands Column */}
      <div className="w-2/3 bg-white shadow-md rounded-lg p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
                {selectedService ? `Hãng & Bảo hành cho "${selectedService.name}"` : "Tất cả Hãng & Bảo hành"}
            </h2>
            <div className="flex items-center gap-2">
                <button onClick={handleImportClick} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    <FileUp className="mr-2" size={18} /> Import Excel
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".xlsx, .xls" />

                <button onClick={handleExport} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <FileDown className="mr-2" size={18} /> Export Excel
                </button>
                {selectedService && (
                    <button onClick={() => handleOpenBrandModal()} className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                      <Plus className="mr-2" size={18} /> Thêm hãng
                    </button>
                )}
            </div>
        </div>
        {isLoadingBrands ? (
            <div className="text-center p-4">Đang tải...</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-100">
                            {!selectedService && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên dịch vụ</th>}
                            {renderSortableHeader('service_code', 'Mã DV')}
                            {renderSortableHeader('name', 'Hãng dịch vụ')}
                            {renderSortableHeader('warranty', 'Bảo hành')}
                            {renderSortableHeader('device_type', 'Loại máy')}
                            {renderSortableHeader('device_brand_id', 'Hãng điện thoại')}
                            {renderSortableHeader('color', 'Màu sắc')}
                            {renderSortableHeader('price', 'Giá')}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {brands && brands.map(brand => (
                            <tr key={brand.id}>
                                {!selectedService && <td className="px-6 py-4 whitespace-nowrap">{brand.service?.name}</td>}
                                <td className="px-6 py-4 whitespace-nowrap">{brand.service_code}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.warranty}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.device_type || ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{deviceBrands.find(db => db.id === brand.device_brand_id)?.name || ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.color || ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{formatPrice(brand.price)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button onClick={() => handleOpenBrandModal(brand)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={20}/></button>
                                    <button onClick={() => handleDeleteBrand(brand.id)} className="text-red-600 hover:text-red-900"><Trash2 size={20}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
      
      {/* Service Modal */}
      {serviceModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                  <h3 className="text-lg font-bold mb-4">{currentService?.id ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h3>
                  <input
                      type="text"
                      value={currentService?.name || ''}
                      onChange={(e) => setCurrentService(prev => prev ? {...prev, name: e.target.value} : { id: '', name: e.target.value, description: '', created_at: '', updated_at: '' })}
                      placeholder="Tên dịch vụ (VD: Thay pin điện thoại)"
                      className="w-full p-2 border rounded-md"
                  />
                  <div className="mt-6 flex justify-end gap-3">
                      <button onClick={handleCloseServiceModal} className="px-4 py-2 bg-gray-200 rounded-md">Hủy</button>
                      <button onClick={handleSaveService} className="px-4 py-2 bg-blue-500 text-white rounded-md">Lưu</button>
                  </div>
              </div>
          </div>
      )}

      {/* Brand Modal */}
      {brandModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                  <h3 className="text-lg font-bold mb-4">{currentBrand?.id ? 'Sửa hãng' : 'Thêm hãng'}</h3>
                  <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Hãng dịch vụ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={currentBrand?.name || ''}
                            onChange={(e) => setCurrentBrand(prev => prev ? {...prev, name: e.target.value} : null)}
                            placeholder="Tên hãng pin (VD: Pisen)"
                            className="w-full p-2 border rounded-md mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Hãng điện thoại
                        </label>
                        <div className="flex gap-2 mb-4 relative">
                          <input
                              type="text"
                              value={selectedDeviceBrand ? deviceBrands.find(b => b.id === selectedDeviceBrand)?.name || '' : ''}
                              onChange={() => {}}
                              placeholder="Tên hãng điện thoại"
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
                                placeholder="Tên hãng điện thoại mới"
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
                                  
                                  Swal.fire('Thành công', 'Thêm hãng điện thoại mới thành công!', 'success');
                                } catch (error) {
                                  console.error('Failed to create device brand:', error);
                                  Swal.fire('Lỗi', 'Không thể tạo hãng điện thoại mới.', 'error');
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
                      <button onClick={handleCloseBrandModal} className="px-4 py-2 bg-gray-200 rounded-md">Hủy</button>
                      <button onClick={handleSaveBrand} className="px-4 py-2 bg-blue-500 text-white rounded-md">Lưu</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Export Modal */}
      {exportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-lg font-bold mb-4">Chọn dịch vụ để xuất Excel</h3>
                  <div className="mb-4 flex items-center">
                      <input
                          type="checkbox"
                          id="selectAll"
                          checked={services.length > 0 && selectedServicesForExport.size === services.length}
                          onChange={handleSelectAllServicesForExport}
                          className="mr-2 h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">Chọn tất cả</label>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                      {services.map(service => (
                          <div key={service.id} className="flex items-center">
                              <input
                                  type="checkbox"
                                  id={`service-${service.id}`}
                                  checked={selectedServicesForExport.has(service.id)}
                                  onChange={() => handleSelectServiceForExport(service.id)}
                                  className="mr-2 h-4 w-4 text-blue-600 rounded"
                              />
                              <label htmlFor={`service-${service.id}`} className="text-sm font-medium text-gray-700">{service.name}</label>
                          </div>
                      ))}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                      <button onClick={handleCloseExportModal} className="px-4 py-2 bg-gray-200 rounded-md">Hủy</button>
                      <button 
                          onClick={handleExportSelectedServices}
                          disabled={selectedServicesForExport.size === 0}
                          className={`px-4 py-2 rounded-md ${selectedServicesForExport.size === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                      >
                          Xuất Excel ({selectedServicesForExport.size} dịch vụ)
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};