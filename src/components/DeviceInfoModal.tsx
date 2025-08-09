import React, { useState, useEffect } from 'react';
import { DeviceInfo } from '../types/deviceTypes';

interface DeviceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deviceInfo: Partial<DeviceInfo>) => void;
  deviceInfo: DeviceInfo | null;
}

const DeviceInfoModal: React.FC<DeviceInfoModalProps> = ({ isOpen, onClose, onSave, deviceInfo }) => {
  const [formData, setFormData] = useState<Partial<DeviceInfo>>({});

  useEffect(() => {
    if (deviceInfo) {
      setFormData(deviceInfo);
    } else {
      setFormData({
        model: '',
        brand: '',
        release_date: '',
        screen: '',
        chip_ram: '',
        camera: '',
        battery: '',
        connectivity_os: '',
        color_english: '',
        dimensions_weight: '',
        warranty: '',
      });
    }
  }, [deviceInfo, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{deviceInfo ? 'Sửa' : 'Thêm'} thông tin thiết bị</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <input type="text" name="model" value={formData.model || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Thương hiệu</label>
              <input type="text" name="brand" value={formData.brand || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày ra mắt</label>
              <input type="text" name="release_date" value={formData.release_date || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Màn hình</label>
              <input type="text" name="screen" value={formData.screen || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Chip, RAM</label>
              <input type="text" name="chip_ram" value={formData.chip_ram || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Camera</label>
              <input type="text" name="camera" value={formData.camera || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pin</label>
              <input type="text" name="battery" value={formData.battery || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kết nối, Hệ điều hành</label>
              <input type="text" name="connectivity_os" value={formData.connectivity_os || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Màu sắc (Tiếng Anh)</label>
              <input type="text" name="color_english" value={formData.color_english || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kích thước, Trọng lượng</label>
              <input type="text" name="dimensions_weight" value={formData.dimensions_weight || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bảo hành</label>
              <input type="text" name="warranty" value={formData.warranty || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceInfoModal;