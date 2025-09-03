import React, { useState, useEffect, memo } from 'react';
import { DeviceInfo, Material } from '../types/deviceTypes';
import { X, Save, Smartphone, Calendar, Monitor, Cpu, Camera, Battery, Wifi, Palette, Ruler, Shield, Layers } from 'lucide-react';
import LabeledField from './LabeledField';

interface DeviceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deviceInfo: Partial<DeviceInfo>) => void;
  deviceInfo: DeviceInfo | null;
}

const DeviceInfoModal: React.FC<DeviceInfoModalProps> = ({ isOpen, onClose, onSave, deviceInfo }) => {
  const [formData, setFormData] = useState<Partial<DeviceInfo>>({});
  const [materials, setMaterials] = useState<Material[]>([]);
  const [newMaterial, setNewMaterial] = useState('');

  useEffect(() => {
    if (deviceInfo) {
      setFormData(deviceInfo);
      // Load existing materials if any
      if (deviceInfo.materials) {
        setMaterials(deviceInfo.materials);
      }
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
      setMaterials([]);
    }
  }, [deviceInfo, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMaterialChange = (materialId: string, checked: boolean) => {
    setFormData(prev => {
      const currentMaterials = prev.materials || [];
      if (checked) {
        // Add material
        const materialToAdd = materials.find(m => m.id === materialId);
        if (materialToAdd && !currentMaterials.find(m => m.id === materialId)) {
          return { ...prev, materials: [...currentMaterials, materialToAdd] };
        }
      } else {
        // Remove material
        return { ...prev, materials: currentMaterials.filter(m => m.id !== materialId) };
      }
      return prev;
    });
  };

  const addNewMaterial = () => {
    if (newMaterial.trim()) {
      const newMat: Material = {
        id: `new_${Date.now()}`,
        name: newMaterial.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setMaterials(prev => [...prev, newMat]);
      setFormData(prev => ({
        ...prev,
        materials: [...(prev.materials || []), newMat]
      }));
      setNewMaterial('');
    }
  };

  const removeMaterial = (materialId: string) => {
    setMaterials(prev => prev.filter(m => m.id !== materialId));
    setFormData(prev => ({
      ...prev,
      materials: (prev.materials || []).filter(m => m.id !== materialId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Include materials in the form data
    const dataToSave = {
      ...formData,
      materials: formData.materials || []
    };
    onSave(dataToSave);
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
                <LabeledField label="Model" required hintText="Tên/mã mẫu máy. Ví dụ: iPhone 15 Pro Max" hintPosition="right">
                  <input
                    type="text"
                    name="model"
                    value={formData.model || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: iPhone 15 Pro Max"
                    required
                  />
                </LabeledField>
                <LabeledField label="Thương hiệu" hintText="Hãng sản xuất: Apple, Samsung, Xiaomi..." hintPosition="right">
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: Apple, Samsung, Xiaomi"
                  />
                </LabeledField>
                <LabeledField label="Ngày ra mắt" hintText="Thời điểm thiết bị được công bố/bán ra (tháng/năm)." hintPosition="right">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-gray-500" size={16} />
                    <input
                      type="text"
                      name="release_date"
                      value={formData.release_date || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: Tháng 9/2023"
                    />
                  </div>
                </LabeledField>
                <LabeledField label="Bảo hành" hintText="Ví dụ: 12 tháng chính hãng hoặc theo cửa hàng." hintPosition="right">
                  <input
                    type="text"
                    name="warranty"
                    value={formData.warranty || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="VD: 12 tháng chính hãng"
                  />
                </LabeledField>
              </div>
            </div>

            {/* Materials Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Layers className="mr-2 text-purple-600" size={20} />
                Vật liệu vỏ
              </h3>
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {materials.map(material => (
                    <div key={material.id} className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                      <input
                        type="checkbox"
                        id={`material-${material.id}`}
                        checked={!!(formData.materials || []).find(m => m.id === material.id)}
                        onChange={(e) => handleMaterialChange(material.id, e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`material-${material.id}`} className="text-sm font-medium text-gray-700">
                        {material.name}
                      </label>
                      {material.id.startsWith('new_') && (
                        <button
                          type="button"
                          onClick={() => removeMaterial(material.id)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewMaterial())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Thêm vật liệu mới"
                  />
                  <button
                    type="button"
                    onClick={addNewMaterial}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                  >
                    Thêm
                  </button>
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
                <LabeledField label="Màn hình" hintText="Kích thước, công nghệ, tần số quét." hintPosition="right">
                  <div className="flex items-center gap-2">
                    <Monitor className="text-gray-500" size={16} />
                    <input
                      type="text"
                      name="screen"
                      value={formData.screen || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: 6.7 inch, OLED, 120Hz"
                    />
                  </div>
                </LabeledField>
                <LabeledField label="Chip, RAM" hintText="Tên chip và dung lượng RAM." hintPosition="right">
                  <div className="flex items-center gap-2">
                    <Cpu className="text-gray-500" size={16} />
                    <input
                      type="text"
                      name="chip_ram"
                      value={formData.chip_ram || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: A17 Pro, 8GB RAM"
                    />
                  </div>
                </LabeledField>
                <LabeledField label="Camera" hintText="Thông số camera trước/sau." hintPosition="right">
                  <div className="flex items-center gap-2">
                    <Camera className="text-gray-500" size={16} />
                    <input
                      type="text"
                      name="camera"
                      value={formData.camera || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: 48MP + 12MP + 12MP"
                    />
                  </div>
                </LabeledField>
                <LabeledField label="Pin" hintText="Dung lượng và công nghệ sạc." hintPosition="right">
                  <div className="flex items-center gap-2">
                    <Battery className="text-gray-500" size={16} />
                    <input
                      type="text"
                      name="battery"
                      value={formData.battery || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: 4441mAh, 20W"
                    />
                  </div>
                </LabeledField>
                <LabeledField label="Kết nối, Hệ điều hành" hintText="Chuẩn kết nối và phiên bản hệ điều hành." hintPosition="right">
                  <div className="flex items-center gap-2">
                    <Wifi className="text-gray-500" size={16} />
                    <input
                      type="text"
                      name="connectivity_os"
                      value={formData.connectivity_os || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: 5G, iOS 17"
                    />
                  </div>
                </LabeledField>
                <LabeledField label="Màu sắc (Tiếng Anh)" hintText="Tên màu theo tiếng Anh để đồng bộ với hãng." hintPosition="right">
                  <div className="flex items-center gap-2">
                    <Palette className="text-gray-500" size={16} />
                    <input
                      type="text"
                      name="color_english"
                      value={formData.color_english || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: Natural Titanium, Blue Titanium"
                    />
                  </div>
                </LabeledField>
                <LabeledField className="md:col-span-2" label="Kích thước, Trọng lượng" hintText="Thông số kích thước (DxRxC) và cân nặng." hintPosition="right">
                  <div className="flex items-center gap-2">
                    <Ruler className="text-gray-500" size={16} />
                    <input
                      type="text"
                      name="dimensions_weight"
                      value={formData.dimensions_weight || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: 159.9 x 76.7 x 8.25 mm, 221g"
                    />
                  </div>
                </LabeledField>
                <LabeledField className="md:col-span-2" label="Cảm biến & Tính năng sức khỏe" hintText="Liệt kê các cảm biến/tính năng nổi bật." hintPosition="right">
                  <div className="flex items-center gap-2">
                    <Shield className="text-gray-500" size={16} />
                    <input
                      type="text"
                      name="sensors_health_features"
                      value={formData.sensors_health_features || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: Face ID, Cảm biến gia tốc, Con quay hồi chuyển"
                    />
                  </div>
                </LabeledField>
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

export default memo(DeviceInfoModal);