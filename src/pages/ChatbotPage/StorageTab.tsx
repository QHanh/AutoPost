import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DeviceStorage } from '../../types/deviceTypes';
import { storageService } from '../../services/storageService';
import { Plus, Edit, Trash2, Search, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import StorageModal from '../../components/StorageModal';

const StorageTab: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [storages, setStorages] = useState<DeviceStorage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<DeviceStorage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchStorages();
    }
  }, [isAuthenticated, pagination.page, searchTerm]);

  const fetchStorages = async () => {
    setIsLoading(true);
    try {
      const result = await storageService.getStorages({ 
        page: pagination.page, 
        limit: pagination.limit, 
        search: searchTerm 
      });
      setStorages(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages
      }));
    } catch (error) {
      console.error('Error fetching storages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedStorage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (storage: DeviceStorage) => {
    setSelectedStorage(storage);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dung lượng này?')) {
      setIsLoading(true);
      try {
        await storageService.deleteStorage(id);
        fetchStorages();
      } catch (error) {
        alert('Có lỗi xảy ra khi xóa dung lượng');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = async (storageData: Partial<DeviceStorage>) => {
    setIsLoading(true);
    try {
      if (selectedStorage) {
        await storageService.updateStorage(selectedStorage.id, storageData);
      } else {
        await storageService.createStorage(storageData);
      }
      setIsModalOpen(false);
      fetchStorages();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu dung lượng');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý dung lượng</h2>
        <button onClick={handleCreate} className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus size={18} className="mr-2" />
          Thêm dung lượng
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm dung lượng..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin" size={48} />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dung lượng</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {storages.map((storage) => (
                  <tr key={storage.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{storage.capacity} GB</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(storage)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(storage.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-700">
              Hiển thị {storages.length} trên tổng số {pagination.total} kết quả
            </span>
            <div className="flex items-center">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)} 
                disabled={pagination.page <= 1}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="mx-2 text-sm">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(pagination.page + 1)} 
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <StorageModal
          storage={selectedStorage}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default StorageTab;