import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, Store, MapPin, Phone, Mail, Globe, Facebook, Image, Info, Upload } from 'lucide-react';

interface StoreInfo {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_website: string;
  store_facebook: string;
  store_address_map: string;
  store_image: string;
  info_more: string;
}

const StoreSettingsTab: React.FC = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    store_website: '',
    store_facebook: '',
    store_address_map: '',
    store_image: '',
    info_more: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStoreInfo();
  }, []);

  const loadStoreInfo = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để xem thông tin cửa hàng' });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/store-info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStoreInfo(data);
      } else {
        console.error('Failed to load store info');
      }
    } catch (error) {
      console.error('Error loading store info:', error);
      setMessage({ type: 'error', text: 'Không thể tải thông tin cửa hàng. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveStoreInfo = async () => {
    // Store original info before any changes
    const originalInfo = { ...storeInfo };
    
    try {
      setIsSaving(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để lưu thông tin' });
        return;
      }

      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('store_info', JSON.stringify(storeInfo));
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/store-info`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const responseMobile = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents-mobile/store-info`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok || !responseMobile.ok) {
        throw new Error('Failed to save store info');
      }

      // Clear selected file after successful upload
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setMessage({ type: 'success', text: 'Thông tin cửa hàng đã được lưu thành công!' });
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error saving store info:', error);
      setMessage({ type: 'error', text: 'Không thể lưu thông tin cửa hàng. Vui lòng thử lại.' });
      // Restore original info on error
      setStoreInfo(originalInfo);
    } finally {
      setIsSaving(false);
    }
  };

  const reloadStoreInfo = async () => {
    await loadStoreInfo();
    setMessage({ type: 'success', text: 'Thông tin cửa hàng đã được làm mới!' });
    setTimeout(() => setMessage(null), 2000);
  };

  const resetStoreInfo = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông tin cửa hàng?')) {
      return;
    }

    // Store original info before any changes
    const originalInfo = { ...storeInfo };
    
    try {
      setIsSaving(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Vui lòng đăng nhập để xóa thông tin' });
        return;
      }

      // Optimistic update - clear all fields immediately
      setStoreInfo({
        store_name: '',
        store_address: '',
        store_phone: '',
        store_email: '',
        store_website: '',
        store_facebook: '',
        store_address_map: '',
        store_image: '',
        info_more: '',
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/store-info`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Đã xóa thông tin cửa hàng thành công!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to delete store info');
      }
    } catch (error) {
      console.error('Error deleting store info:', error);
      setMessage({ type: 'error', text: 'Không thể xóa thông tin cửa hàng. Vui lòng thử lại.' });
      // Restore original info on error
      setStoreInfo(originalInfo);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof StoreInfo, value: string) => {
    setStoreInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Update store_image with file name for preview
      setStoreInfo(prev => ({ ...prev, store_image: file.name }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setStoreInfo(prev => ({ ...prev, store_image: '' }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Thông Tin Cửa Hàng</h2>
          <p className="text-gray-600">Cấu hình thông tin cửa hàng cho chatbot tư vấn</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {isLoading ? (
          // Skeleton loading
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-full h-10 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center mb-4">
                <Store className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">Thông Tin Cơ Bản</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Store className="w-4 h-4 inline mr-1" />
                    Tên Cửa Hàng
                  </label>
                  <input
                    type="text"
                    value={storeInfo.store_name}
                    onChange={(e) => handleChange('store_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập tên cửa hàng"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    value={storeInfo.store_phone}
                    onChange={(e) => handleChange('store_phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={storeInfo.store_email}
                    onChange={(e) => handleChange('store_email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={storeInfo.store_website}
                    onChange={(e) => handleChange('store_website', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập website"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Địa Chỉ
                  </label>
                  <input
                    type="text"
                    value={storeInfo.store_address}
                    onChange={(e) => handleChange('store_address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập địa chỉ cửa hàng"
                  />
                </div>
              </div>
            </div>

            {/* Social Media & Additional Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center mb-4">
                <Facebook className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">Mạng Xã Hội & Thông Tin Bổ Sung</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Facebook className="w-4 h-4 inline mr-1" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={storeInfo.store_facebook}
                    onChange={(e) => handleChange('store_facebook', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập link Facebook"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Image className="w-4 h-4 inline mr-1" />
                    Hình Ảnh Cửa Hàng (URL)
                  </label>
                  <input
                    type="url"
                    value={storeInfo.store_image}
                    onChange={(e) => handleChange('store_image', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập URL hình ảnh"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Upload Ảnh Cửa Hàng
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={isSaving}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
                    >
                      <Upload className="w-4 h-4" />
                      {selectedFile ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    {selectedFile && (
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800 truncate">{selectedFile.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Hỗ trợ: JPG, PNG, GIF, WebP (tối đa 5MB) (URL ảnh sẽ tự động được tạo)
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Địa Chỉ Bản Đồ
                  </label>
                  <input
                    type="text"
                    value={storeInfo.store_address_map}
                    onChange={(e) => handleChange('store_address_map', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập địa chỉ để hiển thị trên bản đồ"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Info className="w-4 h-4 inline mr-1" />
                    Thông Tin Thêm
                  </label>
                  <textarea
                    value={storeInfo.info_more}
                    onChange={(e) => handleChange('info_more', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập thông tin bổ sung về cửa hàng..."
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              onClick={reloadStoreInfo}
              disabled={isLoading || isSaving}
              className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm Mới
            </button>
            <button
              onClick={resetStoreInfo}
              disabled={isSaving}
              className="px-6 py-3 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors font-medium flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Xóa Toàn Bộ
            </button>
          </div>
          
          <button
            onClick={saveStoreInfo}
            disabled={isSaving || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang Lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu Thông Tin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreSettingsTab;
