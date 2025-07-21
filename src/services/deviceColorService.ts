import { DeviceColor } from '../types/deviceTypes';
import { getAuthToken } from './apiService';

const API_BASE_URL = 'https://common-walls-beam.loca.lt//api/v1';

export const deviceColorService = {
  async getAllDeviceColors(skip = 0, limit = 20, search = ''): Promise<{ data: DeviceColor[]; total: number; totalPages: number }> {
    const token = getAuthToken();
    let url = `${API_BASE_URL}/device-colors?skip=${skip}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch device colors');
    const data = await response.json();
    return {
      data: data.data,
      total: data.total || data.data.length,
      totalPages: data.totalPages || Math.ceil((data.total || data.data.length) / limit),
    };
  },

  async createDeviceColor(deviceColor: { device_info_id: string; color_id: string }): Promise<boolean> {
    const token = getAuthToken();
    // Gọi API giống admin: POST /device-infos/{deviceInfoId}/colors/{colorId}
    const response = await fetch(`${API_BASE_URL}/device-infos/${deviceColor.device_info_id}/colors/${deviceColor.color_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to create device color');
    const data = await response.json();
    return data.data;
  },

  async deleteDeviceColor(deviceColorId: string): Promise<boolean> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/device-colors/${deviceColorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to delete device color');
    const data = await response.json();
    return data.data;
  },

  async getDeviceColorsByDeviceInfoId(deviceInfoId: string): Promise<DeviceColor[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/device-colors/device/${deviceInfoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch device colors by device info');
    const data = await response.json();
    return data.data;
  },
}; 