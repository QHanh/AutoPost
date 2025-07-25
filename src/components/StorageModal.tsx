import React, { useState, useEffect } from 'react';
import { Storage } from '../types/deviceTypes';
import { X } from 'lucide-react';

interface StorageModalProps {
  storage: Storage | null;
  onClose: () => void;
  onSave: (storageData: Partial<Storage>) => void;
}

const StorageModal: React.FC<StorageModalProps> = ({ storage, onClose, onSave }) => {
  const [capacity, setCapacity] = useState<number | ''>('');

  useEffect(() => {
    if (storage) {
      setCapacity(storage.capacity);
    } else {
      setCapacity('');
    }
  }, [storage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (capacity !== '') {
      onSave({ capacity: Number(capacity) });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{storage ? 'Chỉnh sửa dung lượng' : 'Thêm dung lượng mới'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">Dung lượng (GB)</label>
            <input
              type="number"
              id="capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StorageModal;