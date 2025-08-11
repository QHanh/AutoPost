import { DeviceStorage } from '../types/deviceTypes';
import { apiGet, getAuthToken } from './apiService';
import { deviceService } from './deviceService';

const API_BASE_URL = 'http://192.168.1.161:8000/api/v1';

interface StoragesResponse {
    data: DeviceStorage[];
    total: number;
    totalPages: number;
}

export const storageService = {
  async getStorages(params: { limit?: number, page?: number, search?: string }): Promise<StoragesResponse> {
    const token = getAuthToken();
    const { limit = 10, page = 1, search = '' } = params;
    const skip = (page - 1) * limit;
    const response = await fetch(`${API_BASE_URL}/device-storages?skip=${skip}&limit=${limit}&search=${search}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch storages');
    }
    const data = await response.json();
    return {
        data: data.data,
        total: data.total,
        totalPages: data.totalPages,
    };
  },

  async getAllStorages(): Promise<DeviceStorage[]> {
    let allStorages: DeviceStorage[] = [];
    let page = 1;
    let hasMore = true;

    while(hasMore) {
        try {
            const response = await this.getStorages({ page, limit: 100 });
            if (response.data && response.data.length > 0) {
                allStorages = [...allStorages, ...response.data];
                if (page >= response.totalPages) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        } catch (error) {
            console.error('Error fetching all storages:', error);
            hasMore = false;
        }
    }
    return allStorages;
  },

  async createStorage(deviceInfoId: string, capacity: number): Promise<DeviceStorage> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/device-storages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ device_info_id: deviceInfoId, capacity }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create storage');
    }
    return response.json();
  },

  async updateStorage(storageId: string, storageData: Partial<DeviceStorage>): Promise<DeviceStorage> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/device-storages/${storageId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(storageData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update storage');
    }
    return response.json();
  },

  async deleteStorage(storageId: string): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/device-storages/${storageId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete storage');
    }
  },

  /**
   * Lấy thông tin chi tiết của một dung lượng lưu trữ theo ID
   * @param storageId ID của dung lượng lưu trữ
   */
  getStorageById: async (storageId: string): Promise<DeviceStorage> => {
    try {
      if (!deviceService.isValidUUID(storageId)) {
        throw new Error('Invalid storage ID');
      }

      const response = await apiGet<DeviceStorage>(`/storages/${storageId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching storage with ID ${storageId}:`, error);
      throw error;
    }
  },
};