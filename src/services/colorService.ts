import { Color } from '../types/deviceTypes';
import { apiGet } from './apiService';
import { deviceService } from './deviceService';

/**
 * Service xử lý các thao tác liên quan đến màu sắc thiết bị
 */
export const colorService = {
  /**
   * Lấy danh sách màu sắc theo thiết bị
   * @param deviceId ID của thiết bị
   */
  getColorsByDeviceId: async (deviceId: string): Promise<Color[]> => {
    try {
      if (!deviceService.isValidUUID(deviceId)) {
        return [];
      }

      const response = await apiGet<Color[]>(`/device-infos/${deviceId}/colors`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching colors for device ${deviceId}:`, error);
      return [];
    }
  },

  /**
   * Lấy thông tin chi tiết của một màu sắc theo ID
   * @param colorId ID của màu sắc
   */
  getColorById: async (colorId: string): Promise<Color> => {
    try {
      if (!deviceService.isValidUUID(colorId)) {
        throw new Error('Invalid color ID');
      }

      const response = await apiGet<Color>(`/colors/${colorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching color with ID ${colorId}:`, error);
      throw error;
    }
  },
};