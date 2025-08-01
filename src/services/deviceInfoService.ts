import { DeviceInfo } from '../types/deviceTypes';
import { getAuthToken } from './apiService';

const API_BASE_URL = 'http://192.168.1.17:8000/api/v1';

export const deviceInfoService = {
  async getDeviceInfos(filter: any = {}, pagination: { page?: number; limit?: number } = {}) {
    const token = getAuthToken();
    const params = new URLSearchParams();
    const skip = ((pagination.page || 1) - 1) * (pagination.limit || 10);
    const limit = pagination.limit || 10;
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.brand) params.append('brand', filter.brand);
    const response = await fetch(`${API_BASE_URL}/device-infos?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch device infos');
    const data = await response.json();
    return {
      devices: data.data,
      pagination: {
        page: pagination.page || 1,
        limit: limit,
        total: data.total || data.data.length,
        totalPages: Math.ceil((data.total || data.data.length) / limit),
      },
    };
  },

  async getDeviceInfoById(id: string): Promise<DeviceInfo> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/device-infos/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch device info');
    const data = await response.json();
    return data.data;
  },

  async createDeviceInfo(deviceInfo: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/device-infos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceInfo),
    });
    if (!response.ok) throw new Error('Failed to create device info');
    const data = await response.json();
    return data.data;
  },

  async updateDeviceInfo(id: string, deviceInfo: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/device-infos/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceInfo),
    });
    if (!response.ok) throw new Error('Failed to update device info');
    const data = await response.json();
    return data.data;
  },

  async deleteDeviceInfo(id: string): Promise<boolean> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/device-infos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      let message = 'Failed to delete device info';
      try {
        const data = await response.json();
        message = data?.detail || message;
      } catch {}
      throw { status: response.status, message };
    }
    const data = await response.json();
    return data.data;
  },
}; 