import { DeviceInfo } from '../types/deviceTypes';
import { getAuthToken } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

interface DeviceInfoResponse {
    data: DeviceInfo[];
    total: number;
    totalPages: number;
}

/**
 * Service xử lý các thao tác liên quan đến thông tin thiết bị
 */
export const deviceService = {
  async getDevices(params: { limit?: number, page?: number, search?: string }): Promise<DeviceInfoResponse> {
    const token = getAuthToken();
    const { limit = 10, page = 1, search = '' } = params;
    const skip = (page - 1) * limit;
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos?skip=${skip}&limit=${limit}&search=${search}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch devices');
    }
    const data = await response.json();
    return {
        data: data.data,
        total: data.total,
        totalPages: data.totalPages,
    };
  },

  async getAllDevices(): Promise<DeviceInfo[]> {
    const token = getAuthToken();
    // Fetch with a high limit to get all devices, as the dropdown needs all of them.
    // The API is capped at 100 per request.
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos?limit=100`, { 
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch devices');
    }
    const data: DeviceInfoResponse = await response.json();
    return data.data || [];
  },

  async getDeviceById(deviceId: string): Promise<DeviceInfo> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/device-infos/${deviceId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch device with ID ${deviceId}`);
    }
    const data: DeviceInfo = await response.json();
    return data;
  },

  /**
   * Kiểm tra xem một chuỗi có phải là UUID hợp lệ hay không
   * @param uuid Chuỗi cần kiểm tra
   */
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },
};