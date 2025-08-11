import React from 'react';
import { Service } from '../types/Service';
import Swal from 'sweetalert2';
import { serviceService } from '../services/serviceService';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedService: Service) => void;
  currentService: Partial<Service> | null;
  setCurrentService: React.Dispatch<React.SetStateAction<Partial<Service> | null>>;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onSave, currentService, setCurrentService }) => {
  if (!isOpen) return null;

  const handleSave = async () => {
    if (!currentService || !currentService.name) {
      Swal.fire('Lỗi', 'Tên dịch vụ không được để trống.', 'error');
      return;
    }
    try {
      let savedService;
      if (currentService.id) {
        savedService = await serviceService.updateService(currentService.id, { name: currentService.name, description: currentService.description || '' });
      } else {
        savedService = await serviceService.createService({ name: currentService.name, description: currentService.description || '' });
      }
      Swal.fire('Thành công', 'Lưu dịch vụ thành công!', 'success');
      onSave(savedService);
      onClose();
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể lưu dịch vụ.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h3 className="text-lg font-bold mb-4">{currentService?.id ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h3>
        <input
          type="text"
          value={currentService?.name || ''}
          onChange={(e) => setCurrentService(prev => prev ? { ...prev, name: e.target.value } : { id: '', name: e.target.value, description: '', created_at: '', updated_at: '' })}
          placeholder="Tên dịch vụ (VD: Thay pin điện thoại)"
          className="w-full p-2 border rounded-md"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md">Lưu</button>
        </div>
      </div>
    </div>
  );
};