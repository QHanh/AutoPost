import { Color } from '../types/deviceTypes';
import { getAuthToken } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

interface ColorsApiResponse {
  colors: Color[];
  pagination: {
    total: number;
    totalPages: number;
  };
}

export const colorService = {
  async getColors(filter: { search?: string } = {}, pagination: { page?: number; limit?: number } = {}): Promise<ColorsApiResponse> {
    const token = getAuthToken();
    const params = new URLSearchParams();
    const skip = ((pagination.page || 1) - 1) * (pagination.limit || 10);
    params.append('skip', skip.toString());
    params.append('limit', (pagination.limit || 10).toString());
    if (filter.search) {
      params.append('search', filter.search);
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/colors?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch colors');
    const data = await response.json();
    return {
      colors: data.data,
      pagination: {
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      },
    };
  },

  async createColor(colorData: Partial<Color>): Promise<Color> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/colors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(colorData),
    });
    if (!response.ok) throw new Error('Failed to create color');
    const data = await response.json();
    return data.data;
  },

  async updateColor(id: string, colorData: Partial<Color>): Promise<Color> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/colors/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(colorData),
    });
    if (!response.ok) throw new Error('Failed to update color');
    const data = await response.json();
    return data.data;
  },

  async deleteColor(id: string): Promise<boolean> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/colors/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      let message = 'Failed to delete color';
      try {
        const data = await response.json();
        message = data?.detail || message;
      } catch {}
      throw { status: response.status, message };
    }
    const data = await response.json();
    return data.data;
  },

  async getColorsByDeviceId(deviceId: string): Promise<Color[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/${deviceId}/colors`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  },

  async getColorById(colorId: string): Promise<Color | null> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/colors/${colorId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  },
};