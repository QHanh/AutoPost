import { DeviceStorage } from '../types/deviceTypes';
import { getAuthToken } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

interface DeviceStoragesResponse {
  data: DeviceStorage[];
  total: number;
  totalPages: number;
}

export const deviceStorageService = {
  async getDeviceStorages(deviceInfoId: string, pagination: { page: number, limit: number }): Promise<DeviceStoragesResponse> {
    const token = getAuthToken();
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/${deviceInfoId}/storages?skip=${skip}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch device storages');
    }
    const data = await response.json();
    return {
        data: data.data,
        total: data.total,
        totalPages: data.totalPages
    };
  },

  async addDeviceStorage(deviceInfoId: string, storageId: string): Promise<any> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/${deviceInfoId}/storages/${storageId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to add storage to device');
    }
    return response.json();
  },

  async removeDeviceStorage(deviceInfoId: string, storageId: string): Promise<any> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-storages/${storageId}?device_info_id=${deviceInfoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      let message = 'Failed to remove storage from device';
      try {
        const data = await response.json();
        message = data?.detail || message;
      } catch {}
      throw { status: response.status, message };
    }
    return response.json();
  },
};