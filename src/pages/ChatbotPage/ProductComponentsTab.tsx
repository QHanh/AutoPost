import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit, Save, X, Search, ChevronsUpDown, ChevronLeft, ChevronRight, Upload, Download } from 'lucide-react';
import { productComponentService } from '../../services/productComponentService';
import { ProductComponent, ProductComponentCreate, ProductComponentUpdate, Category, Property } from '../../types/productComponentTypes';
import PropertySelector from '../../components/PropertySelector';

interface ProductComponentsTabProps {
  isAuthenticated: boolean;
}

const ProductComponentsTab: React.FC<ProductComponentsTabProps> = ({ isAuthenticated }) => {
  const [productComponents, setProductComponents] = useState<ProductComponent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductComponent, setEditingProductComponent] = useState<ProductComponent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProductComponent; direction: 'ascending' | 'descending' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [formData, setFormData] = useState<ProductComponentCreate | ProductComponentUpdate>({
    product_code: '',
    product_name: '',
    stock: 0,
    properties: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      fetchProductComponents();
      fetchCategories();
      fetchProperties();
    }
  }, [isAuthenticated, sortConfig, pagination.page, pagination.limit]);

  const fetchProductComponents = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching product components with pagination:', pagination);
      const response = await productComponentService.getAllProductComponents(
        pagination.page,
        pagination.limit,
        undefined, // search term
        sortConfig?.key,
        sortConfig?.direction
      );
      console.log('Product components response:', response);
      
      // Backend returns array directly, not in data property
      const components = Array.isArray(response) ? response : response.data || [];
      console.log('Setting product components:', components);
      setProductComponents(components);
      
      // If response has pagination info, use it; otherwise set defaults
      if (!Array.isArray(response)) {
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
          totalPages: response.totalPages || 1,
        }));
      }
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
      setProperties(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
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

  // Import product components from Excel
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // Removed success notification
      fetchProductComponents(); // Refresh the list
    } catch (error) {
      console.error('Error importing product components:', error);
      alert('Import thất bại! Vui lòng kiểm tra lại file và thử lại.');
    } finally {
      // Reset file input
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
        description: productComponent.description || '',
        product_photo: productComponent.product_photo || '',
        product_link: productComponent.product_link || '',
        category_id: productComponent.category_id || '',
        properties: productComponent.properties || '',
      });
    } else {
      setEditingProductComponent(null);
      setFormData({
        product_code: '',
        product_name: '',
        stock: 0,
        properties: '',
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
          description: formData.description || undefined,
          product_photo: formData.product_photo || undefined,
          product_link: formData.product_link || undefined,
          category_id: formData.category_id || undefined,
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
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const renderSortIcon = (key: keyof ProductComponent) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="ml-1 h-4 w-4" />;
    return sortConfig.direction === 'ascending' ? 
      <ChevronsUpDown className="ml-1 h-4 w-4" /> : 
      <ChevronsUpDown className="ml-1 h-4 w-4" />;
  };

  const filteredProductComponents = productComponents.filter(pc =>
    pc.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pc.product_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return <div className="p-6 text-center">Vui lòng đăng nhập để xem nội dung này.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Linh Kiện</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200"
        >
          <Plus className="mr-2 h-5 w-5" />
          Thêm Linh Kiện
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-200"
          >
            <Download className="mr-2 h-5 w-5" />
            Xuất Excel
          </button>
          <button
            onClick={triggerFileInput}
            className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition duration-200"
          >
            <Upload className="mr-2 h-5 w-5" />
            Nhập Excel
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx, .xls"
            className="hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('product_code')}
                >
                  <div className="flex items-center">
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
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center">
                    Tồn Kho
                    {renderSortIcon('stock')}
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
                  Danh Mục
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thuộc Tính
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProductComponents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu linh kiện nào
                  </td>
                </tr>
              ) : (
                filteredProductComponents.map((productComponent) => (
                  <tr key={productComponent.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{productComponent.product_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{productComponent.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{productComponent.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{productComponent.trademark || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {productComponent.category ? productComponent.category.name : 'N/A'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleOpenModal(productComponent)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProductComponent(productComponent.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isLoading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center p-4 bg-gray-50">
          <div>
            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="px-3 py-1 rounded-lg bg-gray-200"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="flex items-center">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)} 
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 text-sm">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(pagination.page + 1)} 
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Create/Update Product Component */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingProductComponent ? 'Cập Nhật Linh Kiện' : 'Thêm Linh Kiện Mới'}
              </h3>
            </div>
            
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mã Sản Phẩm</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${formErrors.product_code ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.product_code}
                      onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                      placeholder="Nhập mã sản phẩm (tùy chọn)"
                    />
                    <p className="text-gray-500 text-xs mt-2">Nếu không nhập, hệ thống sẽ tự động tạo mã</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên Sản Phẩm *</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${formErrors.product_name ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.product_name}
                      onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                      placeholder="Nhập tên sản phẩm"
                    />
                    {formErrors.product_name && <p className="text-red-500 text-xs mt-2">{formErrors.product_name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tồn Kho *</label>
                    <input
                      type="number"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${formErrors.stock ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                      placeholder="0"
                      min="0"
                    />
                    {formErrors.stock && <p className="text-red-500 text-xs mt-2">{formErrors.stock}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thương Hiệu</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.trademark || ''}
                      onChange={(e) => setFormData({...formData, trademark: e.target.value})}
                      placeholder="Nhập thương hiệu"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bảo Hành</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.guarantee || ''}
                      onChange={(e) => setFormData({...formData, guarantee: e.target.value})}
                      placeholder="Nhập thông tin bảo hành"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh Mục</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value || undefined})}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">Đang tải danh mục...</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô Tả</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      placeholder="Nhập mô tả sản phẩm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Liên Kết Ảnh</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.product_photo || ''}
                      onChange={(e) => setFormData({...formData, product_photo: e.target.value})}
                      placeholder="Nhập URL ảnh sản phẩm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Liên Kết Sản Phẩm</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.product_link || ''}
                      onChange={(e) => setFormData({...formData, product_link: e.target.value})}
                      placeholder="Nhập URL sản phẩm"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Thuộc Tính</label>
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
    </div>
  );
};

export default ProductComponentsTab;
