import React from 'react';
import { Service } from '../types/Service';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  services: Service[];
  selectedServicesForExport: Set<string>;
  handleSelectServiceForExport: (serviceId: string) => void;
  handleSelectAllServicesForExport: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  services,
  selectedServicesForExport,
  handleSelectServiceForExport,
  handleSelectAllServicesForExport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Chọn dịch vụ để xuất Excel</h3>
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="selectAll"
            checked={services.length > 0 && selectedServicesForExport.size === services.length}
            onChange={handleSelectAllServicesForExport}
            className="mr-2 h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">Chọn tất cả</label>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {services.map(service => (
            <div key={service.id} className="flex items-center">
              <input
                type="checkbox"
                id={`service-${service.id}`}
                checked={selectedServicesForExport.has(service.id)}
                onChange={() => handleSelectServiceForExport(service.id)}
                className="mr-2 h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor={`service-${service.id}`} className="text-sm font-medium text-gray-700">{service.name}</label>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Hủy</button>
          <button
            onClick={onExport}
            disabled={selectedServicesForExport.size === 0}
            className={`px-4 py-2 rounded-md ${selectedServicesForExport.size === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            Xuất Excel ({selectedServicesForExport.size} dịch vụ)
          </button>
        </div>
      </div>
    </div>
  );
};