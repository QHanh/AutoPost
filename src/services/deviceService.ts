import { DeviceInfo } from '../types/deviceTypes';
import { apiGet } from './apiService';

/**
 * Service xử lý các thao tác liên quan đến thông tin thiết bị
 */
export const deviceService = {
  /**
   * Lấy danh sách tất cả thiết bị
   */
  getAllDevices: async (): Promise<DeviceInfo[]> => {
    try {
      const response = await apiGet<DeviceInfo[]>('/device-infos');
      return response.data;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết của một thiết bị theo ID
   * @param deviceId ID của thiết bị
   */
  getDeviceById: async (deviceId: string): Promise<DeviceInfo> => {
    try {
      const response = await apiGet<DeviceInfo>(`/device-infos/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching device with ID ${deviceId}:`, error);
      throw error;
    }
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