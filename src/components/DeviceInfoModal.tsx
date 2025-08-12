import React, { useState, useEffect } from 'react';
import { DeviceInfo } from '../types/deviceTypes';
import { X, Save, Smartphone, Calendar, Monitor, Cpu, Camera, Battery, Wifi, Palette, Ruler, Shield } from 'lucide-react';

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

  const isEditMode = !!deviceInfo;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Smartphone className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isEditMode ? 'Chỉnh sửa' : 'Thêm mới'} thiết bị
              </h2>
              <p className="text-blue-100 text-sm">
                {isEditMode ? 'Cập nhật thông tin thiết bị' : 'Nhập thông tin chi tiết về thiết bị mới'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Smartphone className="mr-2 text-blue-600" size={20} />
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: iPhone 15 Pro Max"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Thương hiệu</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: Apple, Samsung, Xiaomi"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Calendar className="mr-2 text-gray-500" size={16} />
                    Ngày ra mắt
                  </label>
                  <input
                    type="text"
                    name="release_date"
                    value={formData.release_date || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: Tháng 9/2023"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Bảo hành</label>
                  <input
                    type="text"
                    name="warranty"
                    value={formData.warranty || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: 12 tháng chính hãng"
                  />
                </div>
              </div>
            </div>

            {/* Technical Specifications Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Cpu className="mr-2 text-green-600" size={20} />
                Thông số kỹ thuật
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Monitor className="mr-2 text-gray-500" size={16} />
                    Màn hình
                  </label>
                  <input
                    type="text"
                    name="screen"
                    value={formData.screen || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: 6.7 inch, OLED, 120Hz"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Cpu className="mr-2 text-gray-500" size={16} />
                    Chip, RAM
                  </label>
                  <input
                    type="text"
                    name="chip_ram"
                    value={formData.chip_ram || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: A17 Pro, 8GB RAM"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Camera className="mr-2 text-gray-500" size={16} />
                    Camera
                  </label>
                  <input
                    type="text"
                    name="camera"
                    value={formData.camera || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: 48MP + 12MP + 12MP"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Battery className="mr-2 text-gray-500" size={16} />
                    Pin
                  </label>
                  <input
                    type="text"
                    name="battery"
                    value={formData.battery || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: 4441mAh, 20W"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Wifi className="mr-2 text-gray-500" size={16} />
                    Kết nối, Hệ điều hành
                  </label>
                  <input
                    type="text"
                    name="connectivity_os"
                    value={formData.connectivity_os || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: 5G, iOS 17"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Palette className="mr-2 text-gray-500" size={16} />
                    Màu sắc (Tiếng Anh)
                  </label>
                  <input
                    type="text"
                    name="color_english"
                    value={formData.color_english || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: Natural Titanium, Blue Titanium"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Ruler className="mr-2 text-gray-500" size={16} />
                    Kích thước, Trọng lượng
                  </label>
                  <input
                    type="text"
                    name="dimensions_weight"
                    value={formData.dimensions_weight || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: 159.9 x 76.7 x 8.25 mm, 221g"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center shadow-lg hover:shadow-xl"
              >
                <Save className="mr-2" size={18} />
                {isEditMode ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeviceInfoModal;