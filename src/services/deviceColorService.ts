import { Color } from '../types/deviceTypes';
import { getAuthToken } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

interface DeviceColorsResponse {
  data: Color[];
  total: number;
  totalPages: number;
}

export const deviceColorService = {
  async getDeviceColors(deviceInfoId: string, pagination: { page: number, limit: number }): Promise<DeviceColorsResponse> {
    const token = getAuthToken();
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/${deviceInfoId}/colors?skip=${skip}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch device colors');
    }
    const data = await response.json();
    return {
        data: data.data,
        total: data.total,
        totalPages: data.totalPages
    };
  },

  async addDeviceColor(deviceInfoId: string, colorId: string): Promise<any> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/${deviceInfoId}/colors/${colorId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to add color to device');
    }
    return response.json();
  },

  async removeDeviceColor(deviceInfoId: string, colorId: string): Promise<any> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/${deviceInfoId}/colors/${colorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      let message = 'Failed to remove color from device';
      try {
        const data = await response.json();
        message = data?.detail || message;
      } catch {}
      throw { status: response.status, message };
    }
    return response.json();
  },
};