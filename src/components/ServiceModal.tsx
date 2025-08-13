import React, { useState } from 'react';
import { Service } from '../types/Service';
import Swal from 'sweetalert2';
import { serviceService } from '../services/serviceService';
import { Plus, Trash2 } from 'lucide-react';

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
        savedService = await serviceService.updateService(currentService.id, { name: currentService.name, description: currentService.description || '', conditions: currentService.conditions });
      } else {
        savedService = await serviceService.createService({ name: currentService.name, description: currentService.description || '', conditions: currentService.conditions });
      }
      Swal.fire('Thành công', 'Lưu dịch vụ thành công!', 'success');
      onSave(savedService);
      onClose();
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể lưu dịch vụ.', 'error');
    }
  };

  const handleAddCondition = () => {
    setCurrentService(prev => {
        const newConditions = prev?.conditions ? [...prev.conditions, ''] : [''];
        return prev ? { ...prev, conditions: newConditions } : { id: '', name: '', description: '', conditions: newConditions, created_at: '', updated_at: '' };
    });
  };

  const handleConditionChange = (index: number, value: string) => {
    setCurrentService(prev => {
        if (!prev || !prev.conditions) return prev;
        const newConditions = [...prev.conditions];
        newConditions[index] = value;
        return { ...prev, conditions: newConditions };
    });
  };

  const handleRemoveCondition = (index: number) => {
    setCurrentService(prev => {
        if (!prev || !prev.conditions) return prev;
        const newConditions = prev.conditions.filter((_, i) => i !== index);
        return { ...prev, conditions: newConditions };
    });
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-1/3">
        <h3 className="text-lg font-bold mb-4">{currentService?.id ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h3>
        <div className="space-y-4">
            <input
              type="text"
              value={currentService?.name || ''}
              onChange={(e) => setCurrentService(prev => prev ? { ...prev, name: e.target.value } : { id: '', name: e.target.value, description: '', created_at: '', updated_at: '' })}
              placeholder="Tên dịch vụ (VD: Thay pin điện thoại)"
              className="w-full p-2 border rounded-md"
            />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Điều kiện dịch vụ</label>
                {currentService?.conditions?.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                            type="text"
                            value={condition}
                            onChange={(e) => handleConditionChange(index, e.target.value)}
                            placeholder={`Điều kiện ${index + 1}`}
                            className="w-full p-2 border rounded-md"
                        />
                        <button onClick={() => handleRemoveCondition(index)} className="p-2 text-red-500 hover:text-red-700">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                <button onClick={handleAddCondition} className="flex items-center text-sm text-blue-500 hover:text-blue-700">
                    <Plus size={16} className="mr-1" /> Thêm điều kiện
                </button>
            </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md">Lưu</button>
        </div>
      </div>
    </div>
  );
};