import React, { useState, useEffect } from 'react';
import { serviceService } from '../services/serviceService.js';
import { brandService } from '../services/brandService.js';
import { Service } from '../types/Service.js';
import { Brand } from '../types/Brand.js';
import { Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { deviceApiService } from '../services/deviceApiService';

export const ServiceManagementPage: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [brandModalOpen, setBrandModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);
    const [currentBrand, setCurrentBrand] = useState<Partial<Brand> | null>(null);

    const [deviceOptions, setDeviceOptions] = useState<{id: string, name: string}[]>([]);
    const [colorOptions, setColorOptions] = useState<{id: string, name: string}[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');

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

    const fetchBrands = async (serviceId: string) => {
        try {
            setIsLoadingBrands(true);
            const data = await brandService.getAllBrands(0, 100, '', serviceId);
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
    }, []);

    const handleSelectService = (service: Service) => {
        setSelectedService(service);
        fetchBrands(service.id);
    };
    
    // Service Modal Handlers
    const handleOpenServiceModal = (service: Partial<Service> | null = null) => {
        setCurrentService(service ? { ...service } : { name: '' });
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
        setCurrentBrand(brand ? { ...brand } : { name: '', warranty: '' });
        setBrandModalOpen(true);
        // Lấy danh sách thiết bị
        const res = await deviceApiService.getDeviceInfos({}, {limit: 100});
        setDeviceOptions(res.devices.map(d => ({id: String(d.id), name: String(d.model)})));
        // Nếu sửa, set selectedDeviceId và selectedColor
        if (brand && brand.device_type) {
            const foundDevice = res.devices.find(d => d.name === brand.device_type);
            if (foundDevice) {
                setSelectedDeviceId(String(foundDevice.id));
                // Lấy màu sắc cho thiết bị này
                const colors = await deviceApiService.getColorsByDeviceInfoId(foundDevice.id);
                setColorOptions(colors.map(c => ({id: String(c.id), name: String(c.name)})));
                if (brand.color) {
                    const foundColor = colors.find(c => c.name === brand.color);
                    if (foundColor) setSelectedColor(String(foundColor.id));
                }
            }
        } else {
            setSelectedDeviceId('');
            setColorOptions([]);
            setSelectedColor('');
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
        const payload: Partial<Brand> = {
            name: currentBrand.name,
            warranty: currentBrand.warranty || '',
            service_id: selectedService.id,
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
                    fetchBrands(selectedService!.id);
                } catch (error) {
                    Swal.fire('Lỗi', 'Không thể xóa hãng.', 'error');
                }
            }
        });
    };

    const handleDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const deviceId = e.target.value;
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
        {selectedService ? (
            <>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Hãng & Bảo hành cho "{selectedService.name}"</h2>
                    <button onClick={() => handleOpenBrandModal()} className="p-2 rounded-full hover:bg-gray-200">
                      <Plus size={20} />
                    </button>
                </div>
                {isLoadingBrands ? (
                    <div className="text-center p-4">Đang tải...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hãng Pin</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bảo hành</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại máy</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màu sắc</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {brands && brands.map(brand => (
                                    <tr key={brand.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{brand.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{brand.warranty}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{brand.device_type || ''}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{brand.color || ''}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{brand.price || ''}</td>
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
            </>
        ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Chọn một dịch vụ để xem chi tiết.</p>
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
                      onChange={(e) => setCurrentService(prev => ({...prev, name: e.target.value}))}
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
                      <input
                          type="text"
                          value={currentBrand?.name || ''}
                          onChange={(e) => setCurrentBrand(prev => ({...prev, name: e.target.value}))}
                          placeholder="Tên hãng pin (VD: Pisen)"
                          className="w-full p-2 border rounded-md"
                      />
                      <input
                          type="text"
                          value={currentBrand?.warranty || ''}
                          onChange={(e) => setCurrentBrand(prev => ({...prev, warranty: e.target.value}))}
                          placeholder="Bảo hành (VD: 6 tháng)"
                          className="w-full p-2 border rounded-md"
                      />
                      <select
                          className="w-full p-2 border rounded-md"
                          value={selectedDeviceId}
                          onChange={handleDeviceChange}
                      >
                          <option value="">Chọn loại máy</option>
                          {deviceOptions.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                      </select>
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
                          onChange={(e) => setCurrentBrand(prev => ({...prev, price: e.target.value}))}
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
    </div>
  );
}; 