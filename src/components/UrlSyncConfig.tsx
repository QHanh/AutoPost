import React, { useState, useEffect } from 'react';
import { Link, Check, X, RefreshCw, Calendar, Settings } from 'lucide-react';
import { userSyncUrlService } from '../services/userSyncUrlService';
import Swal from 'sweetalert2';

interface UrlSyncConfigProps {
  isAuthenticated: boolean;
}

const UrlSyncConfig: React.FC<UrlSyncConfigProps> = ({ isAuthenticated }) => {
  const [syncUrl, setSyncUrl] = useState('');
  const [typeUrl, setTypeUrl] = useState<'device' | 'component' | 'service' | ''>('');
  const [urlToday, setUrlToday] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlSaving, setUrlSaving] = useState(false);
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchSyncUrl();
    }
  }, [isAuthenticated]);

  // Fetch sync URL
  const fetchSyncUrl = async () => {
    try {
      setUrlLoading(true);
      setUrlError('');
      const response = await userSyncUrlService.get();
      if (response && response.url) {
        setSyncUrl(response.url);
        setTypeUrl((response.type_url as any) || '');
        setUrlToday(response.url_today || '');
      }
    } catch (error) {
      console.error('Error fetching sync URL:', error);
      setUrlError('Không thể tải URL đồng bộ');
    } finally {
      setUrlLoading(false);
    }
  };

  // Save sync URL
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

    // Optional: validate url_today if provided
    if (urlToday.trim()) {
      try {
        new URL(urlToday);
      } catch {
        setUrlError('URL đồng bộ theo ngày (url_today) không hợp lệ');
        return;
      }
    }

    try {
      setUrlSaving(true);
      setUrlError('');
      await userSyncUrlService.upsert(syncUrl.trim(), true, typeUrl || undefined, urlToday || undefined);
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Cấu hình URL đồng bộ đã được lưu',
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

  // Deactivate sync URL
  const handleDeactivateSyncUrl = async () => {
    try {
      await userSyncUrlService.deactivate();
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <Link className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Cấu hình URL đồng bộ</h3>
      </div>
      
      <div className="flex flex-col gap-3 items-stretch">
        <div className="flex-1">
          <input
            type="url"
            value={syncUrl}
            onChange={(e) => {
              setSyncUrl(e.target.value);
              setUrlError('');
            }}
            placeholder="Nhập URL API để đồng bộ dữ liệu (ví dụ: https://api.example.com/products)"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              urlError ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={urlLoading || urlSaving}
          />
          {urlError && (
            <p className="text-red-500 text-sm mt-1">{urlError}</p>
          )}
          {urlLoading && (
            <p className="text-gray-500 text-sm mt-1">Đang tải URL...</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <select
              value={typeUrl}
              onChange={(e) => setTypeUrl(e.target.value as any)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Chọn loại dữ liệu...</option>
              <option value="device">Thiết bị</option>
              <option value="component">Linh kiện</option>
              <option value="service">Dịch vụ</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="url"
              value={urlToday}
              onChange={(e) => setUrlToday(e.target.value)}
              placeholder="URL đồng bộ theo ngày (tuỳ chọn)"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={urlLoading || urlSaving}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveSyncUrl}
            disabled={urlLoading || urlSaving || !syncUrl.trim()}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              urlSaving
                ? 'bg-gray-400'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {urlSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {urlSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
          
          {syncUrl && (
            <button
              onClick={handleDeactivateSyncUrl}
              disabled={urlLoading || urlSaving}
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Xóa URL
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        <p>💡 <strong>Hướng dẫn:</strong> Nhập URL API để hệ thống có thể đồng bộ dữ liệu sản phẩm từ nguồn bên ngoài.</p>
        <p className="mt-1">Chọn loại dữ liệu phù hợp để hệ thống đồng bộ đúng loại: Thiết bị, Linh kiện hoặc Dịch vụ. Nếu có URL dành riêng cho đồng bộ theo ngày, hãy nhập vào ô "URL đồng bộ theo ngày".</p>
      </div>
    </div>
  );
};

export default UrlSyncConfig;
