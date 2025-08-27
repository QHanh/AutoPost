import React, { useState, useEffect, useRef, useCallback } from 'react';
import { serviceService } from '../services/serviceService';
import { brandService } from '../services/brandService';
import { Service } from '../types/Service';
import { Brand } from '../types/Brand';
import { Plus, Edit, Trash2, ChevronRight, ChevronsUpDown, ArrowDown, ArrowUp, FileDown, FileUp, GripVertical, Search, X } from 'lucide-react';
import Swal from 'sweetalert2';
import deviceBrandService from '../services/deviceBrandService';
import { DeviceBrand } from '../types/deviceBrand';
import { ServiceModal } from '../components/ServiceModal';
import { BrandModal } from '../components/BrandModal';
import { ExportModal } from '../components/ExportModal';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import LoadingSpinner from '../components/LoadingSpinner';
import { deviceApiService } from '../services/deviceApiService';
import PopupModal from '../components/PopupModal';

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
    const [isImportingExcel, setIsImportingExcel] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [brandModalOpen, setBrandModalOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [selectedServicesForExport, setSelectedServicesForExport] = useState<Set<string>>(new Set());
    const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);
    const [currentBrand, setCurrentBrand] = useState<Partial<Brand> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);
    const [isServicesVisible, setIsServicesVisible] = useState(true);
    const [noteModal, setNoteModal] = useState({ isOpen: false, title: '', content: '' });
    
    // ✅ State cho search trực tiếp
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<{ id: string, name: string }[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
    const [selectedSearchBrand, setSelectedSearchBrand] = useState<string>('');


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
            const storedOrder = localStorage.getItem('serviceOrder');
            if (storedOrder) {
                const orderedIds = JSON.parse(storedOrder) as string[];
                const serviceMap = new Map(data.map((s: Service) => [s.id, s]));
                const orderedServices = orderedIds.map(id => serviceMap.get(id)).filter((s): s is Service => !!s);
                const remainingServices = data.filter((s: Service) => !orderedIds.includes(s.id));
                const finalServices = [...orderedServices, ...remainingServices];
                setServices(finalServices);

                if (finalServices.length > 0 && !selectedService) {
                    handleSelectService(finalServices[0]);
                }
            } else {
                setServices(data);
                if (data && data.length > 0 && !selectedService) {
                    handleSelectService(data[0]);
                }
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
        }
    };

    const fetchBrands = async (serviceId: string, sortBy?: keyof Brand, sortOrder?: 'asc' | 'desc') => {
        try {
            setIsLoadingBrands(true);
            const data = await brandService.getAllBrands(0, 100, '', serviceId, sortBy, sortOrder);
            setBrands(data);
        } catch (error) {
            console.error("Failed to fetch brands", error);
            Swal.fire('Lỗi', 'Không thể tải danh sách loại.', 'error');
        } finally {
            setIsLoadingBrands(false);
        }
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;

        const reorderedServices = Array.from(services);
        const [removed] = reorderedServices.splice(source.index, 1);
        reorderedServices.splice(destination.index, 0, removed);

        setServices(reorderedServices);
        const orderedIds = reorderedServices.map(s => s.id);
        localStorage.setItem('serviceOrder', JSON.stringify(orderedIds));
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

    // ✅ Handle click outside search results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.search-container')) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectService = (service: Service) => {
        setSelectedService(service);
        setSortConfig(null); // Reset sort when changing service
    };
    
    // Excel export selection handlers
    const handleOpenExportModal = () => {
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
        if (services.length > 0 && selectedServicesForExport.size === services.length) {
            setSelectedServicesForExport(new Set());
        } else {
            setSelectedServicesForExport(new Set(services.map(s => s.id)));
        }
    };

    // ✅ Callback cho search trực tiếp
    const handleSearch = useCallback(async (term: string) => {
        if (!term.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const searchParams: any = { search: term };
            if (selectedSearchBrand) {
                const selectedBrand = deviceBrands.find(b => b.id === selectedSearchBrand);
                if (selectedBrand) {
                    searchParams.brand = selectedBrand.name;
                }
            }
            
            const res = await deviceApiService.getDeviceInfos(searchParams, { limit: 20 });
            const devices = res.devices.map(d => ({ id: String(d.id), name: String(d.model) }));
            setSearchResults(devices);
            setShowSearchResults(true);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [selectedSearchBrand, deviceBrands]);

    const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        if (value.trim()) {
            // Debounce search
            const timeoutId = setTimeout(() => {
                handleSearch(value);
            }, 300);
            
            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    }, [handleSearch]);

    const handleSearchResultSelect = useCallback((device: { id: string, name: string }) => {
        setSearchTerm(device.name);
        setShowSearchResults(false);
        // Có thể thêm logic khác ở đây nếu cần
    }, []);

    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchResults.length > 0) {
            handleSearchResultSelect(searchResults[0]);
        } else if (e.key === 'Escape') {
            setShowSearchResults(false);
        }
    }, [searchResults, handleSearchResultSelect]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchResults([]);
        setShowSearchResults(false);
    }, []);

    const handleExportSelectedServices = async () => {
        try {
            setExportModalOpen(false);
            await brandService.exportBrands(Array.from(selectedServicesForExport));
            setSelectedServicesForExport(new Set());
        } catch (error) {
            console.error('Export error:', error);
            Swal.fire('Lỗi', 'Có lỗi xảy ra khi xuất Excel.', 'error');
        }
    };
    
    // Service Modal Handlers
    const handleOpenServiceModal = async (service: Partial<Service> | null = null) => {
        if (service && service.id) {
            try {
                const fullService = await serviceService.getService(service.id);
                setCurrentService({ ...fullService });
            } catch (error) {
                console.error("Failed to fetch service details", error);
                Swal.fire('Lỗi', 'Không thể tải chi tiết dịch vụ.', 'error');
                return; // Don't open modal if fetch fails
            }
        } else {
            setCurrentService({ id: '', name: '', description: '', conditions: [], created_at: '', updated_at: '' });
        }
        setServiceModalOpen(true);
    };

    const handleCloseServiceModal = () => {
        setServiceModalOpen(false);
        setCurrentService(null);
    };

    const handleSaveService = async (savedService: Service) => {
        await fetchServices();
        handleSelectService(savedService);
    };

    const handleDeleteService = (service: Service) => {
        Swal.fire({
            title: `Xóa dịch vụ "${service.name}"?`,
            text: "Tất cả các loại liên quan cũng sẽ bị xóa. Bạn không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Vâng, xóa nó!',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await serviceService.deleteService(service.id);
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
    
    // onSave cho BrandModal: MEMO HOÁ để tránh thay đổi identity mỗi render
    const handleBrandModalSave = useCallback(() => {
        if (selectedService?.id) {
            fetchBrands(selectedService.id);
        }
    }, [selectedService?.id]);

    // open/close modal cũng nên giữ API đơn giản, không reset form ở đây
    const openBrandModal = useCallback((brand: Partial<Brand> | null = null) => {
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
    }, []);

    const closeBrandModal = useCallback(() => {
        setBrandModalOpen(false);
        // ĐỪNG reset currentBrand về null ở đây nếu bên trong modal dựa vào prop để giữ form;
        // Nếu muốn dọn dẹp, làm trong unmount của chính BrandModal
    }, []);

    // Brand Modal Handlers - thay thế các hàm cũ
    const handleOpenBrandModal = openBrandModal;
    
    const handleDeleteBrand = (brandId: string) => {
        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa loại này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Vâng, xóa nó!',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await brandService.deleteBrand(brandId);
                    fetchBrands(selectedService?.id || '');
                } catch (error) {
                    Swal.fire('Lỗi', 'Không thể xóa loại.', 'error');
                }
            }
        });
    };

    const openNoteModal = (title: string, content: string) => {
        setNoteModal({ isOpen: true, title, content });
    };

    const closeNoteModal = () => {
        setNoteModal({ isOpen: false, title: '', content: '' });
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
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer bg-gray-100"
            onClick={() => requestSort(key)}
        >
            <div className="flex items-center">
                {title}
                {getSortIcon(key)}
            </div>
        </th>
    );

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImportingExcel(true);
        try {
            const result = await brandService.importBrands(file);
            
            // Luôn hiển thị thông báo kết quả import
            const icon = result.data.error > 0 ? 'warning' : 'success';
            const title = result.data.error > 0 ? 'Kết quả Import' : 'Import Thành công';
            
            Swal.fire({
                title: title,
                html: `
                    Tổng cộng: ${result.data.total}<br/>
                    Thành công: ${result.data.success}<br/>
                    Lỗi: ${result.data.error}<br/>
                    Tạo mới: ${result.data.created_count}<br/>
                    Cập nhật: ${result.data.updated_count}<br/>
                    ${result.data.errors.length > 0 ? `<strong>Lỗi:</strong><br/>${result.data.errors.join('<br/>')}`: ''}
                `,
                icon: icon
            });
            
            fetchServices();
            if (selectedService) {
                fetchBrands(selectedService.id);
            }
        } catch (error) {
            Swal.fire('Lỗi Import', 'Có lỗi xảy ra trong quá trình import file.', 'error');
        } finally {
            setIsImportingExcel(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

  return (
    <div className="w-full h-full flex gap-8">
      {/* Services Column */}
      {isServicesVisible && (
        <div className="w-1/4 bg-white shadow-md rounded-lg p-4 flex flex-col transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Dịch vụ</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenServiceModal()} className="p-2 rounded-full hover:bg-gray-200">
                        <Plus size={20} />
                    </button>
                </div>
            </div>
            {isLoadingServices ? (
                <div className="text-center p-4">Đang tải...</div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="services-list">
                        {(provided: any) => (
                            <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 overflow-y-auto">
                                {services.map((service, index) => (
                                    <Draggable key={service.id} draggableId={service.id} index={index}>
                                        {(provided: any, snapshot: any) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                
                                                className={`p-3 rounded-lg cursor-pointer transition-colors flex justify-between items-center ${selectedService?.id === service.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'} ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                                onClick={() => handleSelectService(service)}
                                            >
                                                <div className="flex items-center">
                                                    <div {...provided.dragHandleProps} className="mr-2 cursor-grab active:cursor-grabbing">
                                                        <GripVertical size={16} />
                                                    </div>
                                                    <span>{service.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenServiceModal(service);}} className="p-1 rounded-full hover:bg-gray-300"><Edit size={16}/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteService(service);}} className="p-1 rounded-full hover:bg-gray-300"><Trash2 size={16}/></button>
                                                    {selectedService?.id === service.id && <ChevronRight size={20}/>}
                                                </div>
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>
            )}
        </div>
      )}

      {/* Brands Column */}
      <div className={`${isServicesVisible ? 'w-3/4' : 'w-full'} bg-white shadow-md rounded-lg p-4 flex flex-col transition-all duration-300`}>
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsServicesVisible(!isServicesVisible)} className="p-2 rounded-full hover:bg-gray-200">
                    <ChevronsUpDown size={20} />
                </button>
                <h2 className="text-xl font-bold text-gray-800">
                    {selectedService ? `Loại & Bảo hành cho "${selectedService.name}"` : "Tất cả Loại & Bảo hành"}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleImportClick} 
                    disabled={isImportingExcel}
                    className={`flex items-center px-4 py-2 rounded-lg ${
                        isImportingExcel 
                            ? 'bg-green-400 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                >
                    {isImportingExcel ? (
                        <>
                            <LoadingSpinner size="sm" text="" />
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            <FileUp className="mr-2" size={18} /> Import Excel
                        </>
                    )}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".xlsx, .xls" />

                <button onClick={handleOpenExportModal} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <FileDown className="mr-2" size={18} /> Export Excel
                </button>
                {selectedService && (
                    <button onClick={() => handleOpenBrandModal()} className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                      <Plus className="mr-2" size={18} /> Thêm loại
                    </button>
                )}
            </div>
        </div>
        
        {/* ✅ Search Input */}
        <div className="mb-4">
            <div className="relative search-container">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Tìm kiếm thiết bị..."
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    {searchTerm && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                            Tìm thấy {searchResults.length} kết quả
                            {selectedSearchBrand && (
                                <span className="ml-2 text-blue-600">
                                    (Đã filter theo {deviceBrands.find(b => b.id === selectedSearchBrand)?.name})
                                </span>
                            )}
                        </div>
                        {searchResults.map((device) => (
                            <div
                                key={device.id}
                                onClick={() => handleSearchResultSelect(device)}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                            >
                                <div className="font-medium text-gray-900">{device.name}</div>
                                <div className="text-sm text-gray-500">ID: {device.id}</div>
                                <div className="text-xs text-blue-600 mt-1">
                                    Nhấn Enter để chọn, Esc để đóng
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Loading State */}
                {isSearching && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                        <div className="flex items-center justify-center">
                            <LoadingSpinner size="sm" text="Đang tìm kiếm..." />
                        </div>
                    </div>
                )}
                
                {/* No Results */}
                {showSearchResults && !isSearching && searchResults.length === 0 && searchTerm.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                        <div className="text-center text-gray-500">
                            Không tìm thấy kết quả nào
                        </div>
                    </div>
                )}
            </div>
        </div>
        {isLoadingBrands ? (
            <div className="text-center p-4">Đang tải...</div>
        ) : (
            <div className="overflow-x-auto overflow-y-auto relative max-h-[calc(100vh-200px)]">
                <table className="min-w-full">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-100 shadow-sm">
                           {!selectedService && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">Tên dịch vụ</th>}
                           {renderSortableHeader('service_code', 'Mã DV')}
                           {renderSortableHeader('name', 'Loại dịch vụ')}
                           {renderSortableHeader('device_brand_id', 'Thương hiệu')}
                           {renderSortableHeader('device_type', 'Loại máy')}
                           {renderSortableHeader('color', 'Màu sắc')}
                           {renderSortableHeader('price', 'Giá')}
                           {renderSortableHeader('wholesale_price', 'Giá bán buôn')}
                           {renderSortableHeader('warranty', 'Bảo hành')}
                           {renderSortableHeader('note', 'Ghi chú')}
                           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {brands && brands.map(brand => (
                            <tr key={brand.id}>
                                {!selectedService && <td className="px-6 py-4 whitespace-nowrap">{brand.service?.name}</td>}
                                <td className="px-6 py-4 whitespace-nowrap">{brand.service_code}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{deviceBrands.find(db => db.id === brand.device_brand_id)?.name || ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.device_type || ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.color || ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{formatPrice(brand.price)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{formatPrice(brand.wholesale_price)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.warranty}</td>
                                <td className="px-6 py-4" style={{ maxWidth: '250px' }}>
                                    {brand.note ? (
                                        <div className="whitespace-normal break-words">
                                            <button
                                                onClick={() => openNoteModal(`Ghi chú cho ${brand.name}`, brand.note || '')}
                                                className="text-blue-500 hover:text-blue-700 underline"
                                            >
                                                Xem
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="whitespace-normal break-words">
                                            {brand.note || ''}
                                        </div>
                                    )}
                                </td>
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
      
      <ServiceModal 
        isOpen={serviceModalOpen}
        onClose={handleCloseServiceModal}
        onSave={handleSaveService}
        currentService={currentService}
        setCurrentService={setCurrentService}
      />

      <BrandModal
        isOpen={brandModalOpen}
        onClose={closeBrandModal}
        onSave={handleBrandModalSave}
        currentBrand={currentBrand}
        setCurrentBrand={setCurrentBrand}
        selectedService={selectedService}
        // ❌ Tuyệt đối không truyền `key` động vào BrandModal
      />

      <ExportModal 
        isOpen={exportModalOpen}
        onClose={handleCloseExportModal}
        onExport={handleExportSelectedServices}
        services={services}
        selectedServicesForExport={selectedServicesForExport}
        handleSelectServiceForExport={handleSelectServiceForExport}
        handleSelectAllServicesForExport={handleSelectAllServicesForExport}
      />
      
      <PopupModal
        isOpen={noteModal.isOpen}
        onClose={closeNoteModal}
        title={noteModal.title}
        content={noteModal.content}
      />
    </div>
  );
};