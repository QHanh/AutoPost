import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Edit, Save, X, Search, ChevronsUpDown, RefreshCw, Link, Check } from 'lucide-react';
import { productComponentService } from '../../services/productComponentService';
import { userSyncUrlService } from '../../services/userSyncUrlService';
import { ProductComponent, ProductComponentCreate, ProductComponentUpdate, Category, Property } from '../../types/productComponentTypes';
import PropertySelector from '../../components/PropertySelector';
import Pagination from '../../components/Pagination';
import { FilterConfig } from '../../components/Filter';
import Swal from 'sweetalert2';
import PopupModal from '../../components/PopupModal';
import LabeledField from '../../components/LabeledField';
import UrlSyncConfig from '../../components/UrlSyncConfig';
interface SyncNowResult {
  message: string;
  sync_details: {
    total_synced: number;
    total_created: number;
    total_updated: number;
    total_skipped: number;
  };
}

// Component hiển thị mô tả với tính năng popup
const DescriptionDisplay: React.FC<{ 
  description: string | null | undefined;
  productName: string;
  onOpenModal: (title: string, content: string) => void;
}> = ({ description, productName, onOpenModal }) => {
  if (!description) return <span className="text-gray-400">N/A</span>;
  
  // Chỉ hiển thị nút "Xem" khi mô tả có nhiều hơn 2 ký tự
  if (description.length > 2) {
    return (
      <div>
        <button
          onClick={() => onOpenModal(`Mô tả sản phẩm ${productName}`, description)}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Xem
        </button>
      </div>
    );
  }
  
  // Nếu mô tả có 2 ký tự trở xuống, hiển thị trực tiếp
  return <span>{description}</span>;
};

// Hàm format tiền tệ
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

interface ApiDataSyncTabProps {
  isAuthenticated: boolean;
  currentPage: number;
  currentLimit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const ApiDataSyncTab: React.FC<ApiDataSyncTabProps> = ({ 
  isAuthenticated,
  currentPage,
  currentLimit,
  onPageChange,
  onLimitChange 
}) => {
  const [productComponents, setProductComponents] = useState<ProductComponent[]>([]);
  const [selectedProductComponents, setSelectedProductComponents] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductComponent, setEditingProductComponent] = useState<ProductComponent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProductComponent; direction: 'ascending' | 'descending' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 1,
  });
  const [formData, setFormData] = useState<ProductComponentCreate | ProductComponentUpdate>({
    product_code: '',
    product_name: '',
    stock: 0,
    amount: 0,
    wholesale_price: undefined,
    properties: '',
    category: '',
    guarantee: '',
    description: '',
    product_photo: '',
    product_link: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // URL sync states
  const [syncUrl, setSyncUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlSaving, setUrlSaving] = useState(false);
  const [urlError, setUrlError] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState<{ [key: string]: any }>({});
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    propertyKeys: [] as string[],
    propertyValues: {} as { [key: string]: string[] },
    trademarks: [] as string[],
  });
  
  // Popup modal state
  const [descriptionModal, setDescriptionModal] = useState({ isOpen: false, title: '', content: '' });

  useEffect(() => {
    if (isAuthenticated) {
      fetchProductComponents();
    }
  }, [isAuthenticated, currentPage, currentLimit, sortConfig]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchProperties();
      fetchFilterOptions();
      fetchSyncUrl();
    }
  }, [isAuthenticated]);

  // Separate useEffect for search term to trigger search with debounce
  useEffect(() => {
    if (isAuthenticated) {
      // Add debounce for search
      const timeoutId = setTimeout(() => {
        fetchProductComponents();
      }, 500); // Wait 500ms after user stops typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, isAuthenticated]);

  useEffect(() => {
    console.log('=== FILTERS USE EFFECT ===');
    console.log('Filters changed:', filters);
    console.log('Filters object reference:', filters);
    console.log('Filters object keys:', Object.keys(filters));
    console.log('Filters object values:', Object.values(filters));
    console.log('isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      // Call API with new filters
      fetchProductComponents();
    }
    console.log('=== END FILTERS USE EFFECT ===');
  }, [filters]);

  const fetchProductComponents = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching product components with pagination:', { page: currentPage, limit: currentLimit });
      console.log('Search term:', searchTerm);
      console.log('Active filters:', filters);
      const response = await productComponentService.getAllProductComponents(
        currentPage,
        currentLimit,
        searchTerm || undefined, // search term
        sortConfig?.key,
        sortConfig?.direction,
        filters // pass filters to backend
      );
      console.log('Product components response:', response);
      
      // Backend now returns paginated response with data and pagination info
      const components = response.data || [];
      console.log('Setting product components:', components);
      setProductComponents(components);
      
      // Update pagination info from backend response
      setPaginationInfo({
        total: response.total || 0,
        totalPages: response.total_pages || 1,
      });
    } catch (error) {
      console.error('Error fetching product components:', error);
      alert('Có lỗi xảy ra khi tải dữ liệu linh kiện. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      const response = await productComponentService.getAllCategories();
      console.log('Categories response:', response);
      // API trả về trực tiếp mảng các category
      setCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      console.log('Fetching properties...');
      const response = await productComponentService.getAllProperties();
      setProperties(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      console.log('=== FETCHING FILTER OPTIONS ===');
      const response = await productComponentService.getFilterOptions();
      console.log('Filter options response:', response);
      console.log('Response type:', typeof response);
      console.log('Response property_values type:', typeof response.property_values);
      console.log('Response property_values:', response.property_values);
      console.log('Response property_values keys:', Object.keys(response.property_values || {}));
      console.log('Response property_values for COMBO:', response.property_values?.['COMBO']);
      
      const newFilterOptions = {
        categories: response.categories || [],
        propertyKeys: response.property_keys || [],
        propertyValues: response.property_values || {},
        trademarks: response.trademarks || [],
      };
      
      console.log('Setting filter options:', newFilterOptions);
      console.log('Property values after setting:', newFilterOptions.propertyValues);
      console.log('Property values keys:', Object.keys(newFilterOptions.propertyValues));
      console.log('Property values for COMBO after setting:', newFilterOptions.propertyValues['COMBO']);
      console.log('=== END FETCHING FILTER OPTIONS ===');
      setFilterOptions(newFilterOptions);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Fetch sync URL (component-specific)
  const fetchSyncUrl = async () => {
    try {
      setUrlLoading(true);
      setUrlError('');
      const response = await userSyncUrlService.get('component');
      if (response && response.url) {
        setSyncUrl(response.url);
      }
    } catch (error) {
      console.error('Error fetching sync URL:', error);
      setUrlError('Không thể tải URL đồng bộ');
    } finally {
      setUrlLoading(false);
    }
  };

  // Save sync URL (component-specific)
  const handleSaveSyncUrl = async () => {
    if (!syncUrl.trim()) {
      setUrlError('Vui lòng nhập URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(syncUrl);
    } catch {
      setUrlError('URL không hợp lệ');
      return;
    }

    try {
      setUrlSaving(true);
      setUrlError('');
      await userSyncUrlService.upsert(syncUrl.trim(), true, 'component');
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'URL đồng bộ đã được lưu',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error saving sync URL:', error);
      setUrlError('Có lỗi xảy ra khi lưu URL');
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể lưu URL đồng bộ'
      });
    } finally {
      setUrlSaving(false);
    }
  };

  // Deactivate sync URL (component-specific)
  const handleDeactivateSyncUrl = async () => {
    try {
      await userSyncUrlService.deactivate('component');
      setSyncUrl('');
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'URL đồng bộ đã được vô hiệu hóa',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error deactivating sync URL:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể vô hiệu hóa URL đồng bộ'
      });
    }
  };

  // Sync data from external API
  const handleSyncData = async () => {
    if (syncing) return;

    setSyncing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'}/api/v1/product-components/sync-from-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Lỗi đồng bộ dữ liệu');
      }

      const result = await response.json();
      
      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Đồng bộ thành công!',
        html: `
          <div class="text-left">
            <p><strong>Tổng số xử lý:</strong> ${result.sync_details.total_synced}</p>
            <p><strong>Tạo mới:</strong> ${result.sync_details.total_created}</p>
            <p><strong>Cập nhật:</strong> ${result.sync_details.total_updated}</p>
            <p><strong>Bỏ qua:</strong> ${result.sync_details.total_skipped}</p>
          </div>
        `,
        confirmButtonText: 'OK'
      });
      
      // Refresh data after sync
      await fetchProductComponents();
    } catch (err) {
      console.error('Lỗi đồng bộ:', err);
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi đồng bộ dữ liệu';
      Swal.fire({
        icon: 'error',
        title: 'Lỗi đồng bộ',
        text: message,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Sync data from external API for today
  const handleSyncNow = async () => {
    if (syncingNow) return;

    setSyncingNow(true);
    try {
      const result = await productComponentService.syncNowFromApi() as SyncNowResult;
      
      await Swal.fire({
        icon: 'success',
        title: 'Yêu cầu đồng bộ thành công!',
        html: `
          <div class="text-left">
            <p>${result.message}</p>
            <hr class="my-2" />
            <p><strong>Tổng số xử lý:</strong> ${result.sync_details.total_synced}</p>
            <p><strong>Tạo mới:</strong> ${result.sync_details.total_created}</p>
            <p><strong>Cập nhật:</strong> ${result.sync_details.total_updated}</p>
            <p><strong>Bỏ qua:</strong> ${result.sync_details.total_skipped}</p>
          </div>
        `,
        confirmButtonText: 'OK'
      });
      
      await fetchProductComponents();
    } catch (error) {
      console.error('Lỗi đồng bộ ngay:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi đồng bộ ngay',
        text: error instanceof Error ? error.message : 'Có lỗi xảy ra khi yêu cầu đồng bộ ngay',
      });
    } finally {
      setSyncingNow(false);
    }
  };

  // Filter configuration - using useState instead of useMemo to ensure updates
  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>([]);

  // Update filter config when filters or filterOptions change
  useEffect(() => {
    console.log('=== UPDATING FILTER CONFIG ===');
    console.log('Updating filter config with:', { filters, filterOptions });
    console.log('Property values in filterOptions:', filterOptions.propertyValues);
    console.log('Property values for COMBO in useEffect:', filterOptions.propertyValues['COMBO']);
    console.log('Filters object reference:', filters);
    console.log('FilterOptions object reference:', filterOptions);
    console.log('Filters object keys:', Object.keys(filters));
    console.log('Filters object values:', Object.values(filters));
    
    const newFilterConfig: FilterConfig[] = [
      {
        key: 'category',
        label: 'Danh Mục',
        type: 'select' as const,
        options: filterOptions.categories.map(category => ({ label: category, value: category }))
      },
      {
        key: 'property',
        label: 'Thuộc Tính',
        type: 'property-inputs' as const,
        propertyValues: filterOptions.propertyValues
      },
      {
        key: 'trademark',
        label: 'Thương Hiệu',
        type: 'select' as const,
        options: filterOptions.trademarks.map(trademark => ({ label: trademark, value: trademark }))
      },
      {
        key: 'price_range',
        label: 'Khoảng Giá',
        type: 'range-number' as const
      }
    ];
    
    console.log('New filter config:', newFilterConfig);
    console.log('=== END UPDATING FILTER CONFIG ===');
    setFilterConfig(newFilterConfig);
  }, [filters, filterOptions]);  

  // Debug filter configuration
  console.log('=== FILTER DEBUG ===');
  console.log('Current filters:', filters);
  console.log('Filter options:', filterOptions);
  console.log('Property filters:', Object.keys(filters).filter(key => key.startsWith('property_')));
  console.log('All property values keys:', Object.keys(filterOptions.propertyValues));
  console.log('Property values for COMBO:', filterOptions.propertyValues['COMBO']);
  console.log('Property values for COMBO (type):', typeof filterOptions.propertyValues['COMBO']);
  console.log('Property values for COMBO (length):', filterOptions.propertyValues['COMBO']?.length);
  console.log('Filter config length:', filterConfig.length);
  console.log('=== END FILTER DEBUG ===');

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    console.log('=== HANDLE FILTER CHANGE ===');
    console.log('Filter change - old filters:', filters);
    console.log('Filter change - new filters:', newFilters);
    console.log('Old property_key:', filters.property_key);
    console.log('New property_key:', newFilters.property_key);
    console.log('Old filters object reference:', filters);
    
    // Reset to page 1 only when filters actually change
    if (JSON.stringify(filters) !== JSON.stringify(newFilters)) {
      onPageChange(1);
    }
    
    // Always set filters, regardless of change
    console.log('Setting filters to:', newFilters);
    setFilters(newFilters);
    
    console.log('=== END HANDLE FILTER CHANGE ===');
  };

  // Export product components to Excel
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'}/api/v1/product-components/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'linh_kien.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting product components:', error);
    }
  };

  // Export sample Excel template
  const handleExportSample = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'}/api/v1/product-components/export-sample`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau_linh_kien.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting sample Excel:', error);
    }
  };

  // Import product components from Excel
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Hiển thị loading toàn màn hình
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'}/api/v1/product-components/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Import response:', result);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${result.message || 'Unknown error'}`);
      }

      // Xử lý response từ backend
      const importData = result.data || result; // Backend có thể trả về trực tiếp hoặc trong .data
      
      // Hiển thị thông báo kết quả import
      const icon = importData.error > 0 ? 'warning' : 'success';
      const title = importData.error > 0 ? 'Kết quả Import' : 'Import Thành công';
      
      Swal.fire({
        title: title,
        html: `
          Tổng cộng: ${importData.total}<br/>
          Thành công: ${importData.success}<br/>
          Lỗi: ${importData.error}<br/>
          Tạo mới: ${importData.created_count}<br/>
          Cập nhật: ${importData.updated_count}<br/>
          ${importData.errors && importData.errors.length > 0 ? `<strong>Lỗi:</strong><br/>${importData.errors.join('<br/>')}` : ''}
        `,
        icon: icon
      });
      
      fetchProductComponents(); // Refresh the list
    } catch (error) {
      console.error('Error importing product components:', error);
      Swal.fire('Import Thất bại', 'Có lỗi xảy ra trong quá trình import. Vui lòng kiểm tra lại file và thử lại.', 'error');
    } finally {
      // Ẩn loading và reset file input
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSort = (key: keyof ProductComponent) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenModal = (productComponent: ProductComponent | null = null) => {
    console.log('handleOpenModal called with:', productComponent);
    console.log('Current categories:', categories);
    console.log('Current properties:', properties);
    
    if (productComponent) {
      setEditingProductComponent(productComponent);
      setFormData({
        product_code: productComponent.product_code,
        product_name: productComponent.product_name,
        trademark: productComponent.trademark || '',
        guarantee: productComponent.guarantee || '',
        stock: productComponent.stock,
        amount: productComponent.amount,
        wholesale_price: productComponent.wholesale_price,
        description: productComponent.description || '',
        product_photo: productComponent.product_photo || '',
        product_link: productComponent.product_link || '',
        category: productComponent.category || '',
        properties: productComponent.properties || '',
      });
    } else {
      setEditingProductComponent(null);
      setFormData({
        product_code: '',
        product_name: '',
        stock: 0,
        amount: 0,
        wholesale_price: undefined,
        properties: '',
        category: '',
        guarantee: '',
        description: '',
        product_photo: '',
        product_link: '',
      });
    }
    console.log('Checking if categories need to be fetched...');
    if (categories.length === 0) {
      console.log('Fetching categories...');
      fetchCategories();
    }
    console.log('Checking if properties need to be fetched...');
    if (properties.length === 0) {
      console.log('Fetching properties...');
      fetchProperties();
    }
    setFormErrors({});
    console.log('Setting modal open to true');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProductComponent(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.product_name) errors.product_name = 'Tên sản phẩm là bắt buộc';
    if (formData.stock === undefined || formData.stock < 0) errors.stock = 'Tồn kho phải lớn hơn hoặc bằng 0';
    if (formData.amount === undefined || formData.amount < 0) errors.amount = 'Giá tiền phải lớn hơn hoặc bằng 0';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProductComponent = async () => {
    if (!validateForm()) return;

    try {
      let result: ProductComponent;
      if (editingProductComponent) {
        // Update existing product component
        const updateData: ProductComponentUpdate = {
          product_code: formData.product_code || undefined,
          product_name: formData.product_name || undefined,
          trademark: formData.trademark || undefined,
          guarantee: formData.guarantee || undefined,
          stock: formData.stock,
          amount: formData.amount,
          description: formData.description || undefined,
          product_photo: formData.product_photo || undefined,
          product_link: formData.product_link || undefined,
          category: formData.category || undefined,
          properties: formData.properties || undefined,
        };
        
        result = await productComponentService.updateProductComponent(editingProductComponent.id, updateData);
      } else {
        // Create new product component
        result = await productComponentService.createProductComponent(formData as ProductComponentCreate);
        
        // Nếu người dùng không nhập mã sản phẩm, hiển thị mã được tạo tự động
        if (!formData.product_code && result.product_code) {
          // Removed success notification
        }
      }
      
      // Cập nhật danh sách
      if (editingProductComponent) {
        setProductComponents(prev => 
          prev.map(pc => pc.id === result.id ? result : pc)
        );
      } else {
        setProductComponents(prev => [result, ...prev]);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product component:', error);
      alert('Có lỗi xảy ra khi lưu linh kiện');
    }
  };

  const handleDeleteProductComponent = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thành phần sản phẩm này?')) {
      try {
        setIsLoading(true);
        console.log('Deleting product component with ID:', id);
        await productComponentService.deleteProductComponent(id);
        console.log('Product component deleted successfully');
        
        // Cập nhật state ngay lập tức để UI phản hồi nhanh
        setProductComponents(prev => prev.filter(pc => pc.id !== id));
        
        // Cập nhật selectedProductComponents
        setSelectedProductComponents(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        
        // Removed success notification
        
        // Sau đó load lại dữ liệu để đảm bảo đồng bộ với server
        await fetchProductComponents();
        
        console.log('Data refreshed after deletion');
      } catch (error) {
        console.error('Error deleting product component:', error);
        alert('Có lỗi xảy ra khi xóa linh kiện. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
    // Clear selection when changing pages
    setSelectedProductComponents(new Set());
    setIsSelectAll(false);
  };

  const handleLimitChange = (newLimit: number) => {
    onLimitChange(newLimit);
    // Clear selection when changing page size
    setSelectedProductComponents(new Set());
    setIsSelectAll(false);
  };

  // Reset to page 1 whenever search term changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  const renderSortIcon = (key: keyof ProductComponent) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="ml-1 h-4 w-4" />;
    return sortConfig.direction === 'ascending' ? 
      <ChevronsUpDown className="ml-1 h-4 w-4" /> : 
      <ChevronsUpDown className="ml-1 h-4 w-4" />;
  };

  // Popup modal handlers
  const openDescriptionModal = (title: string, content: string) => {
    setDescriptionModal({ isOpen: true, title, content });
  };

  const closeDescriptionModal = () => {
    setDescriptionModal({ isOpen: false, title: '', content: '' });
  };

  // No need for client-side filtering since search is now handled by backend
  // The productComponents state now contains the filtered results from backend
  
  // Bulk selection handlers
  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedProductComponents(new Set());
    } else {
      const allIds = new Set(productComponents.map(pc => pc.id));
      setSelectedProductComponents(allIds);
    }
    setIsSelectAll(!isSelectAll);
  };
  
  const handleSelectProductComponent = (id: string) => {
    setSelectedProductComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    
    // Update select all state
    setIsSelectAll(selectedProductComponents.size === productComponents.length - 1);
  };
  
  const handleBulkDelete = async () => {
    if (selectedProductComponents.size === 0) {
      alert('Vui lòng chọn ít nhất một thành phần sản phẩm để xóa');
      return;
    }
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProductComponents.size} thành phần sản phẩm đã chọn?`)) {
      try {
        setIsLoading(true);
        const ids = Array.from(selectedProductComponents);
        await productComponentService.bulkDeleteProductComponents(ids);
        
        // Cập nhật state ngay lập tức để UI phản hồi nhanh
        setProductComponents(prev => prev.filter(pc => !selectedProductComponents.has(pc.id)));
        
        // Clear selection
        setSelectedProductComponents(new Set());
        setIsSelectAll(false);
        
        // Load lại dữ liệu để đảm bảo đồng bộ với server
        await fetchProductComponents();
        
        Swal.fire({
          title: 'Thành công',
          text: `Đã xóa ${ids.length} thành phần sản phẩm`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error bulk deleting product components:', error);
        alert('Có lỗi xảy ra khi xóa các linh kiện. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (productComponents.length === 0) {
      alert('Không có linh kiện nào để xóa.');
      return;
    }

    Swal.fire({
      title: 'Bạn có chắc chắn không?',
      text: `Tất cả ${productComponents.length} linh kiện sẽ bị xóa vĩnh viễn!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa tất cả!',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setIsLoading(true);
          await productComponentService.deleteAllProductComponents();

          // UI updates
          setProductComponents([]);
          setSelectedProductComponents(new Set());
          setIsSelectAll(false);
          setPaginationInfo({ total: 0, totalPages: 1 });
          onPageChange(1);

          Swal.fire(
            'Đã xóa!',
            'Tất cả linh kiện đã được xóa.',
            'success'
          );

          // Refresh data from server to confirm
          await fetchProductComponents();

        } catch (error) {
          console.error('Error deleting all product components:', error);
          Swal.fire(
            'Lỗi!',
            'Có lỗi xảy ra khi xóa tất cả linh kiện.',
            'error'
          );
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  if (!isAuthenticated) {
    return <div className="p-6 text-center">Vui lòng đăng nhập để xem nội dung này.</div>;
  }

  // Debug rendering
  console.log('=== RENDERING PRODUCT COMPONENTS TAB ===');
  console.log('Filter key:', `filter-${Object.keys(filters).filter(key => key.startsWith('property_')).length}-${filterConfig.length}`);
  console.log('Filter config:', filterConfig);
  console.log('Filter config length:', filterConfig.length);
  console.log('Filters object reference in render:', filters);
  console.log('Filters object keys in render:', Object.keys(filters));
  console.log('Filters object values in render:', Object.values(filters));
  console.log('FilterOptions object reference in render:', filterOptions);
  console.log('=== END RENDERING PRODUCT COMPONENTS TAB ===');

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Loading overlay toàn màn hình khi import */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Đang import dữ liệu...</p>
            <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      )}
            <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Nạp dữ liệu từ API ({paginationInfo.total})</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncData}
            disabled={syncing || isLoading}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              syncing || isLoading
                ? 'bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Đang nạp dữ liệu...' : 'Nạp dữ tất cả dữ liệu'}
          </button>
          <button
            onClick={handleSyncNow}
            disabled={syncingNow || isLoading}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              syncingNow || isLoading
                ? 'bg-gray-400'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${syncingNow ? 'animate-spin' : ''}`} />
            {syncingNow ? 'Đang đồng bộ...' : 'Nạp dữ liệu trong ngày'}
          </button>
          {/* <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <Plus size={20} className="mr-2" />
              Thêm Linh Kiện
            </button>
          </div> */}
          {productComponents.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="bg-red-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <Trash2 size={20} className="mr-2" />
              Xóa Tất Cả
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx, .xls"
            className="hidden"
          />
        </div>
      </div>

      {selectedProductComponents.size > 0 && (
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <Trash2 size={20} className="mr-2" />
                Xóa ({selectedProductComponents.size})
              </button>
              <span className="text-sm text-gray-600">
                Đã chọn {selectedProductComponents.size} trên {productComponents.length} mục
              </span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
        <UrlSyncConfig isAuthenticated={isAuthenticated} defaultType="component" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            Tìm kiếm: "{searchTerm}" - Tìm thấy {paginationInfo.total} kết quả
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-auto max-h-[70vh] relative">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={isSelectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('product_code')}
                >
                  <div className="flex items-center justify-end">
                    Mã SP
                    {renderSortIcon('product_code')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('product_name')}
                >
                  <div className="flex items-center">
                    Tên Sản Phẩm
                    {renderSortIcon('product_name')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh Mục
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thuộc Tính
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end">
                    Giá bán lẻ
                    {renderSortIcon('amount')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('wholesale_price')}
                >
                  <div className="flex items-center justify-end">
                    Giá Bán Buôn
                    {renderSortIcon('wholesale_price')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('trademark')}
                >
                  <div className="flex items-center">
                    Thương Hiệu
                    {renderSortIcon('trademark')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bảo Hành
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center justify-end">
                    Tồn Kho
                    {renderSortIcon('stock')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô Tả Sản Phẩm
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ảnh Sản Phẩm
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link Sản Phẩm
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productComponents.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? `Không tìm thấy kết quả nào cho "${searchTerm}"` : 'Không có dữ liệu linh kiện nào'}
                  </td>
                </tr>
              ) : (
                productComponents.map((productComponent) => (
                  <tr key={productComponent.id} className={selectedProductComponents.has(productComponent.id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="checkbox"
                        checked={selectedProductComponents.has(productComponent.id)}
                        onChange={() => handleSelectProductComponent(productComponent.id)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                       {productComponent.product_code}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{productComponent.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof productComponent.category === 'string' ? productComponent.category : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {productComponent.properties ? (
                        (() => {
                          try {
                            const parsedProperties = JSON.parse(productComponent.properties);
                            return parsedProperties && parsedProperties.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {parsedProperties.map((property: any, index: number) => (
                                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                                    {property.key}: {property.values ? property.values.join(', ') : 'N/A'}
                                  </span>
                                ))}
                              </div>
                            ) : 'N/A';
                          } catch (e) {
                            return productComponent.properties || 'N/A';
                          }
                        })()
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                       {formatCurrency(productComponent.amount)}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                       {productComponent.wholesale_price ? formatCurrency(productComponent.wholesale_price) : 'N/A'}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{productComponent.trademark || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {productComponent.guarantee || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                       {productComponent.stock}
                     </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <DescriptionDisplay 
                        description={productComponent.description} 
                        productName={productComponent.product_name}
                        onOpenModal={openDescriptionModal}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {productComponent.product_photo ? (
                        <a href={productComponent.product_photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Xem ảnh
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {productComponent.product_link ? (
                        <a href={productComponent.product_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Xem liên kết
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleOpenModal(productComponent)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProductComponent(productComponent.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isLoading}
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <div>
          <select
            value={currentLimit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-3 py-1 rounded-lg bg-gray-200"
          >
            <option value={15}>15 / trang</option>
            <option value={30}>30 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={paginationInfo.totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modal for Create/Update Product Component */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingProductComponent ? 'Cập Nhật Linh Kiện' : 'Thêm Linh Kiện Mới'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Đóng modal"
              >
                ×
              </button>
            </div>
            
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <LabeledField label="Mã Sản Phẩm" hintText="Tùy chọn. Để trống hệ thống sẽ tự sinh mã." hintPosition="right">
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${formErrors.product_code ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.product_code}
                      onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                      placeholder="Nhập mã sản phẩm (tùy chọn)"
                    />
                  </LabeledField>
                  
                  <LabeledField label="Tên Sản Phẩm" required hintText="Tên hiển thị của linh kiện/dịch vụ." hintPosition="right">
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${formErrors.product_name ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.product_name}
                      onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                      placeholder="Nhập tên sản phẩm"
                    />
                    {formErrors.product_name && <p className="text-red-500 text-xs mt-2">{formErrors.product_name}</p>}
                  </LabeledField>
                  
                  <LabeledField label="Giá bán lẻ" required hintText="Lưu ý: Với dịch vụ liên quan đến vỏ máy, mỗi màu có thể có giá khác nhau." hintPosition="right">
                    <input
                      type="number"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${formErrors.amount ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                      placeholder="0"
                      min="0"
                    />
                    {formErrors.amount && <p className="text-red-500 text-xs mt-2">{formErrors.amount}</p>}
                  </LabeledField>
                  
                  <LabeledField label="Giá Bán Buôn" hintText="Giá áp dụng cho đại lý/mua số lượng." hintPosition="right">
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.wholesale_price || ''}
                      onChange={(e) => setFormData({...formData, wholesale_price: e.target.value ? Number(e.target.value) : undefined})}
                      placeholder="0"
                      min="0"
                    />
                  </LabeledField>

                  <LabeledField label="Tồn Kho" required hintText="Số lượng còn lại trong kho." hintPosition="right">
                    <input
                      type="number"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${formErrors.stock ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                      placeholder="0"
                      min="0"
                    />
                    {formErrors.stock && <p className="text-red-500 text-xs mt-2">{formErrors.stock}</p>}
                  </LabeledField>
                  
                  <LabeledField label="Thương Hiệu" hintText="Ví dụ: Apple, Samsung..." hintPosition="right">
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.trademark || ''}
                      onChange={(e) => setFormData({...formData, trademark: e.target.value})}
                      placeholder="Nhập thương hiệu"
                    />
                  </LabeledField>
                  
                  <LabeledField label="Bảo Hành" hintText="Thời hạn hoặc điều kiện bảo hành." hintPosition="right">
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.guarantee || ''}
                      onChange={(e) => setFormData({...formData, guarantee: e.target.value})}
                      placeholder="Nhập thông tin bảo hành"
                    />
                  </LabeledField>
                </div>
                
                <div className="space-y-4">
                  <LabeledField label="Danh Mục" hintText="Nhóm phân loại của sản phẩm/dịch vụ." hintPosition="right">
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.category || ''}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="Nhập tên danh mục"
                    />
                  </LabeledField>
                  
                  <LabeledField label="Mô Tả" hintText="Nếu là dịch vụ vỏ máy: ghi chú rõ mỗi màu có thể có giá khác nhau." hintPosition="right">
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      placeholder="Nhập mô tả sản phẩm"
                    />
                  </LabeledField>
                  
                  <LabeledField label="Liên Kết Ảnh" hintText="URL ảnh minh họa sản phẩm/dịch vụ." hintPosition="right">
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.product_photo || ''}
                      onChange={(e) => setFormData({...formData, product_photo: e.target.value})}
                      placeholder="Nhập URL ảnh sản phẩm"
                    />
                  </LabeledField>
                  
                  <LabeledField label="Liên Kết Sản Phẩm" hintText="URL chi tiết sản phẩm để khách tham khảo." hintPosition="right">
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.product_link || ''}
                      onChange={(e) => setFormData({...formData, product_link: e.target.value})}
                      placeholder="Nhập URL sản phẩm"
                    />
                  </LabeledField>
                </div>
                
                <div className="md:col-span-2">
                  <LabeledField label="Thuộc Tính" hintText="Thêm thuộc tính như Màu sắc, Dung lượng... Lưu ý: Với dịch vụ liên quan đến vỏ máy, các màu có thể có giá khác nhau." hintPosition="right">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <PropertySelector 
                        properties={properties}
                        selectedProperties={formData.properties || ''}
                        onPropertiesChange={(properties) => {
                          setFormData({
                            ...formData,
                            properties
                          });
                        }}
                        onAddNewProperty={async (key, values) => {
                          try {
                            const newProperty = await productComponentService.createProperty({
                              key,
                              values
                            });
                            
                            setProperties(prev => [...prev, newProperty]);
                            
                            // Update properties in form data
                            let currentProperties: any[] = [];
                            try {
                              currentProperties = formData.properties ? JSON.parse(formData.properties) : [];
                            } catch (e) {
                              currentProperties = [];
                            }
                            
                            const updatedProperties = [
                              ...currentProperties,
                              { key: newProperty.key, values: newProperty.values || [] }
                            ];
                            
                            setFormData({
                              ...formData,
                              properties: JSON.stringify(updatedProperties)
                            });
                          } catch (error) {
                            console.error('Error creating new property:', error);
                            alert('Có lỗi xảy ra khi thêm thuộc tính mới');
                          }
                        }}
                      />
                    </div>
                  </LabeledField>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                <X className="inline mr-2 h-4 w-4" />
                Hủy
              </button>
              <button
                onClick={handleSaveProductComponent}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Save className="inline mr-2 h-4 w-4" />
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
      
      <PopupModal
        isOpen={descriptionModal.isOpen}
        onClose={closeDescriptionModal}
        title={descriptionModal.title}
        content={descriptionModal.content}
      />
    </div>
  );
};

export default ApiDataSyncTab;