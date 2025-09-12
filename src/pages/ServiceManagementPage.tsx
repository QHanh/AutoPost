import React, { useState, useEffect, useRef, useCallback } from 'react';
import { serviceService } from '../services/serviceService';
import { brandService } from '../services/brandService';
import { Service } from '../types/Service';
import { Brand } from '../types/Brand';
import { Plus, Edit, Trash2, ChevronRight, ChevronsUpDown, ArrowDown, ArrowUp, FileDown, FileUp, GripVertical, RotateCcw } from 'lucide-react';
import Swal from 'sweetalert2';
import deviceBrandService from '../services/deviceBrandService';
import { DeviceBrand } from '../types/deviceBrand';
import { ServiceModal } from '../components/ServiceModal';
import { BrandModal } from '../components/BrandModal';
import { ExportModal } from '../components/ExportModal';
import { useDebounce } from '../hooks/useDebounce';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupModal from '../components/PopupModal';
import { useRestoreAllDeletedModal } from '../components/RestoreAllDeletedModal';

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
    const [selectedBrandsForDelete, setSelectedBrandsForDelete] = useState<Set<string>>(new Set());
    const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);
    const [currentBrand, setCurrentBrand] = useState<Partial<Brand> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);
    const [isServicesVisible, setIsServicesVisible] = useState(true);
    const [noteModal, setNoteModal] = useState({ isOpen: false, title: '', content: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const totalProducts = services.reduce((acc, service) => acc + (service.product_count || 0), 0);

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

    const fetchBrands = async (serviceId: string, search: string, sortBy?: keyof Brand, sortOrder?: 'asc' | 'desc') => {
        try {
            setIsLoadingBrands(true);
            const data = await brandService.getAllBrands(0, 100, search, serviceId, sortBy, sortOrder);
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
            fetchBrands(selectedService.id, debouncedSearchQuery, sortBy, sortOrder);
        }
    }, [selectedService, sortConfig, debouncedSearchQuery]);

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


    // Brand selection handlers
    const handleSelectBrandForDelete = (brandId: string) => {
        setSelectedBrandsForDelete(prev => {
            const newSet = new Set(prev);
            if (newSet.has(brandId)) {
                newSet.delete(brandId);
            } else {
                newSet.add(brandId);
            }
            return newSet;
        });
    };

    const handleSelectAllBrandsForDelete = () => {
        if (brands.length > 0 && selectedBrandsForDelete.size === brands.length) {
            setSelectedBrandsForDelete(new Set());
        } else {
            setSelectedBrandsForDelete(new Set(brands.map(b => b.id)));
        }
    };

    const handleBulkDeleteBrands = async () => {
        if (selectedBrandsForDelete.size === 0) {
            Swal.fire('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm để xóa.', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: `Xóa ${selectedBrandsForDelete.size} sản phẩm đã chọn?`,
            text: "Bạn không thể hoàn tác hành động này!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Vâng, xóa tất cả!',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const brandIds = Array.from(selectedBrandsForDelete);
                let successCount = 0;
                let errorCount = 0;
                const errors: string[] = [];

                for (const brandId of brandIds) {
                    try {
                        await brandService.deleteBrand(brandId);
                        successCount++;
                    } catch (error) {
                        errorCount++;
                        errors.push(`Lỗi xóa sản phẩm ID: ${brandId}`);
                    }
                }

                if (errorCount > 0) {
                    Swal.fire({
                        title: 'Kết quả xóa',
                        html: `
                            Thành công: ${successCount}<br/>
                            Lỗi: ${errorCount}<br/>
                            ${errors.length > 0 ? `<strong>Chi tiết lỗi:</strong><br/>${errors.join('<br/>')}` : ''}
                        `,
                        icon: 'warning'
                    });
                } else {
                    Swal.fire('Thành công', `Đã xóa ${successCount} sản phẩm.`, 'success');
                }

                setSelectedBrandsForDelete(new Set());
                if (selectedService) {
                    fetchBrands(selectedService.id, debouncedSearchQuery);
                }
            } catch (error) {
                console.error('Bulk delete error:', error);
                Swal.fire('Lỗi', 'Có lỗi xảy ra khi xóa sản phẩm.', 'error');
            }
        }
    };

    // Reset selected brands when service changes
    useEffect(() => {
        setSelectedBrandsForDelete(new Set());
    }, [selectedService]);

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
            setCurrentService({ id: '', name: '', description: '', conditions: [], applied_conditions: [], created_at: '', updated_at: '' });
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



    // Sử dụng hook chung cho việc khôi phục tất cả dịch vụ đã xóa (kèm chi tiết brand)
    const { handleRestoreAll: handleRestoreAllDeletedServices } = useRestoreAllDeletedModal({
        itemType: 'services',
        getDeletedItems: () => serviceService.getDeletedServicesToday(),
        restoreAllItems: () => serviceService.restoreAllDeletedServicesToday(),
        onSuccess: () => {
            fetchServices();
            if (selectedService) {
                fetchBrands(selectedService.id, debouncedSearchQuery);
            }
        },
        // formatPrice dùng cho hiển thị giá trong danh sách brand của từng service
        formatPrice: (price: string | number) => formatPrice(price?.toString())
    });
    
    // onSave cho BrandModal: MEMO HOÁ để tránh thay đổi identity mỗi render
    const handleBrandModalSave = useCallback(() => {
        if (selectedService?.id) {
            fetchBrands(selectedService.id, debouncedSearchQuery);
        }
    }, [selectedService?.id, debouncedSearchQuery]);

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
                    fetchBrands(selectedService?.id || '', debouncedSearchQuery);
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

    const handleExportTemplate = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'}/api/v1/brands/export-template`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'mau_dich_vu.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Error downloading template:', response.statusText);
                Swal.fire('Lỗi', 'Có lỗi xảy ra khi tải file mẫu.', 'error');
            }
        } catch (error) {
            console.error('Error exporting template:', error);
            Swal.fire('Lỗi', 'Có lỗi xảy ra khi tải file mẫu.', 'error');
        }
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
                fetchBrands(selectedService.id, debouncedSearchQuery);
            }
            setSearchQuery('');
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
    <div className="w-full flex gap-4 h-[calc(100vh-80px)] p-4">
      {/* Services Column */}
      {isServicesVisible && (
        <div className="w-1/4 bg-white shadow-md rounded-lg p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Danh sách dịch vụ ({totalProducts})</h2>
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
                                                    <div className="flex-grow">
                                                        <div className="font-medium">{service.name} <span className="text-xs text-gray-500">({service.product_count || 0})</span></div>
                                                    </div>
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
      <div className={`${isServicesVisible ? 'w-3/4' : 'w-full'} bg-white shadow-md rounded-lg p-4 flex flex-col h-full transition-all duration-300`}>
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsServicesVisible(!isServicesVisible)} className="p-2 rounded-full hover:bg-gray-200">
                    <ChevronsUpDown size={20} />
                </button>
                <h2 className="text-xl font-bold text-gray-800">
                    {selectedService ? `Sản phẩm cho "${selectedService.name}" (${brands.length})` : "Tất cả sản phẩm"}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                {selectedBrandsForDelete.size > 0 && (
                    <button
                        onClick={handleBulkDeleteBrands}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa ({selectedBrandsForDelete.size})
                    </button>
                )}
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
                <button onClick={handleExportTemplate} className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                    <FileDown className="mr-2" size={18} /> Tải Excel mẫu
                </button>
                <button onClick={handleRestoreAllDeletedServices} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <RotateCcw className="mr-2" size={18} /> Khôi phục dịch vụ xóa trong ngày
                </button>
                {selectedService && (
                    <button onClick={() => handleOpenBrandModal()} className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                      <Plus className="mr-2" size={18} /> Thêm loại
                    </button>
                )}
            </div>
        </div>
        
        <div className="mb-4 px-4">
            <input
                type="text"
                placeholder="Tìm kiếm theo loại sản phẩm, mã DV, loại máy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        {isLoadingBrands ? (
            <div className="text-center p-4">Đang tải...</div>
        ) : (
            <div className="overflow-x-auto overflow-y-auto relative max-h-[calc(100vh-200px)]">
                <table className="min-w-full">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-100 shadow-sm">
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                               <input
                                   type="checkbox"
                                   checked={brands.length > 0 && selectedBrandsForDelete.size === brands.length}
                                   onChange={handleSelectAllBrandsForDelete}
                                   className="rounded"
                               />
                           </th>
                           {!selectedService && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">Tên dịch vụ</th>}
                           {renderSortableHeader('service_code', 'Mã DV')}
                           {renderSortableHeader('name', 'loại sản phẩm')}
                           {renderSortableHeader('device_brand_id', 'Thương hiệu')}
                           {renderSortableHeader('device_type', 'Loại máy')}
                           {renderSortableHeader('color', 'Màu sắc')}
                           {renderSortableHeader('price', 'Giá bán lẻ')}
                           {renderSortableHeader('wholesale_price', 'Giá bán buôn')}
                           {renderSortableHeader('warranty', 'Bảo hành')}
                           {renderSortableHeader('note', 'Ghi chú')}
                           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {brands && brands.map(brand => (
                            <tr key={brand.id} className={selectedBrandsForDelete.has(brand.id) ? 'bg-red-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedBrandsForDelete.has(brand.id)}
                                        onChange={() => handleSelectBrandForDelete(brand.id)}
                                        className="rounded"
                                    />
                                </td>
                                {!selectedService && <td className="px-6 py-4 whitespace-nowrap">{brand.service?.name}</td>}
                                <td className="px-6 py-4 whitespace-nowrap">{brand.service_code}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{deviceBrands.find(db => db.id === brand.device_brand_id)?.name || ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.device_type || ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{brand.color || ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">{formatPrice(brand.price)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">{formatPrice(brand.wholesale_price)}</td>
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