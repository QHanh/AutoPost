import { DeviceInfo } from '../types/deviceTypes';
import { getAuthToken } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

export const deviceInfoService = {
  async getDeviceInfos(filter: { search?: string; brand?: string; sort_by?: string; sort_order?: 'asc' | 'desc' } = {}, pagination: { page?: number; limit?: number } = {}) {
    const token = getAuthToken();
    const params = new URLSearchParams();
    const skip = ((pagination.page || 1) - 1) * (pagination.limit || 10);
    const limit = pagination.limit || 10;
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.brand) params.append('brand', filter.brand);
    if (filter.sort_by) params.append('sort_by', filter.sort_by);
    if (filter.sort_order) params.append('sort_order', filter.sort_order);
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos?${params.toString()}`, {
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
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch device info');
    const data = await response.json();
    return data.data;
  },

  async createDeviceInfo(deviceInfo: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const token = getAuthToken();
    // Xử lý dữ liệu vật liệu trước khi gửi
    const deviceInfoToSend = {
      ...deviceInfo,
      material_ids: deviceInfo.materials ? deviceInfo.materials.map(m => m.id) : []
    };
    // Xóa trường materials nếu có để tránh gửi dữ liệu thừa
    delete (deviceInfoToSend as any).materials;
    
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceInfoToSend),
    });
    if (!response.ok) throw new Error('Failed to create device info');
    const data = await response.json();
    return data.data;
  },

  async updateDeviceInfo(id: string, deviceInfo: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const token = getAuthToken();
    // Xử lý dữ liệu vật liệu trước khi gửi
    const deviceInfoToSend = {
      ...deviceInfo,
      material_ids: deviceInfo.materials ? deviceInfo.materials.map(m => m.id) : []
    };
    // Xóa trường materials nếu có để tránh gửi dữ liệu thừa
    delete (deviceInfoToSend as any).materials;
    
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceInfoToSend),
    });
    if (!response.ok) throw new Error('Failed to update device info');
    const data = await response.json();
    return data.data;
  },

  async deleteMultipleDeviceInfos(ids: string[]): Promise<boolean> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/delete-multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      let message = 'Failed to delete selected device infos';
      try {
        const data = await response.json();
        message = data?.detail || message;
      } catch {}
      throw { status: response.status, message };
    }
    const data = await response.json();
    return data.data;
  },

  async deleteDeviceInfo(id: string): Promise<boolean> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/${id}`, {
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

  async deleteAllDeviceInfos(): Promise<boolean> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/delete-all`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      let message = 'Failed to delete all device infos';
      try {
        const data = await response.json();
        message = data?.detail || message;
      } catch {}
      throw { status: response.status, message };
    }
    const data = await response.json();
    return data.data;
  },

  async getDistinctBrands(): Promise<string[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/brands`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch distinct brands');
    const data = await response.json();
    return data.data;
  },

  async exportTemplate(): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/export-template`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to export template');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_import_thiet_bi.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async importDeviceInfos(file: File): Promise<any> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/import`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Import failed' }));
      throw new Error(errorData.detail);
    }
    return response.json();
  },

  async exportDeviceInfos(filters: { search?: string; brand?: string } = {}): Promise<void> {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.brand) {
      params.append('brand', filters.brand);
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/export?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to export device infos');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh_sach_thiet_bi.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};