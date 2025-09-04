import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Color } from '../../types/deviceTypes';
import { colorService } from '../../services/colorService';
import { Plus, Edit, Trash2, Search, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import ColorModal from '../../components/ColorModal';
import { GridColDef } from '@mui/x-data-grid';
import Pagination from '../../components/Pagination';

interface ColorsTabProps {
  currentPage?: number;
  currentLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const ColorsTab: React.FC<ColorsTabProps> = ({ currentPage: urlPage = 1, currentLimit: urlLimit = 10, onPageChange, onLimitChange }) => {
  const { isAuthenticated } = useAuth();
  const [colors, setColors] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: urlPage,
    limit: urlLimit,
    total: 0,
    totalPages: 0
  });

  // Sync internal pagination with URL parameters
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: urlPage, limit: urlLimit }));
  }, [urlPage, urlLimit]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchColors();
    }
  }, [isAuthenticated, pagination.page, pagination.limit, searchTerm]);

  const fetchColors = async () => {
    setIsLoading(true);
    try {
      const filter = { search: searchTerm };
      const pageOptions = { page: pagination.page, limit: pagination.limit };
      const result = await colorService.getColors(filter, pageOptions);
      setColors(result.colors);
      setPagination(prev => ({
        ...prev,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 1
      }));
    } catch (error) {
      console.error('Error fetching colors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
    if (onPageChange) {
      onPageChange(1);
    }
  };

  const handleCreate = () => {
    setSelectedColor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (color: Color) => {
    setSelectedColor(color);
    setIsModalOpen(true);
  };

  const handleDelete = async (colorId: string) => {
    try {
      await colorService.deleteColor(colorId);
      alert('Xóa màu thành công');
      fetchColors();
    } catch (error: any) {
      console.error('Failed to delete color:', error, typeof error, JSON.stringify(error));
      if (error && error.status === 403) {
        alert(error.message || 'Bạn không có quyền xoá mục này');
      } else if (error?.message?.toLowerCase().includes('quyền')) {
        alert(error.message);
      } else if (typeof error === 'string' && error.toLowerCase().includes('quyền')) {
        alert(error);
      } else {
        const errorMessage = error?.message || 'Xóa màu không thành công';
        alert(errorMessage);
      }
    }
  };

  const handleSave = async (colorData: Partial<Color>) => {
    setIsLoading(true);
    try {
      if (selectedColor) {
        await colorService.updateColor(selectedColor.id, colorData);
      } else {
        await colorService.createColor(colorData);
      }
      setIsModalOpen(false);
      fetchColors();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu màu');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit: number) => {
    if (onLimitChange) {
      onLimitChange(newLimit);
    } else {
      setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên màu', flex: 1 },
    {
      field: 'actions',
      headerName: 'Hành động',
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center">
          <button onClick={() => handleEdit(params.row)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
          <button onClick={() => handleDelete(params.row.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý màu sắc</h2>
        <button onClick={handleCreate} className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus size={18} className="mr-2" />
          Thêm màu
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm màu..."
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
          <div className="overflow-auto max-h-[70vh] bg-white rounded-lg shadow relative">
            <table className="min-w-full">
              <thead className="sticky top-0 z-10 bg-gray-100 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên màu</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {colors.map((color) => (
                  <tr key={color.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{color.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(color)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(color.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              <select
                value={urlLimit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-3 py-1 rounded-lg bg-gray-200"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>
            
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}

      {isModalOpen && (
        <ColorModal
          color={selectedColor}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ColorsTab;