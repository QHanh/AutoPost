import { Storage } from '../types/deviceTypes';
import { apiGet } from './apiService';
import { deviceService } from './deviceService';

/**
 * Service xử lý các thao tác liên quan đến dung lượng lưu trữ thiết bị
 */
export const storageService = {
  /**
   * Lấy danh sách dung lượng lưu trữ theo thiết bị
   * @param deviceId ID của thiết bị
   */
  getStoragesByDeviceId: async (deviceId: string): Promise<Storage[]> => {
    try {
      if (!deviceService.isValidUUID(deviceId)) {
        return [];
      }

      const response = await apiGet<Storage[]>(`/device-infos/${deviceId}/storages`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching storages for device ${deviceId}:`, error);
      return [];
    }
  },

  /**
   * Lấy thông tin chi tiết của một dung lượng lưu trữ theo ID
   * @param storageId ID của dung lượng lưu trữ
   */
  getStorageById: async (storageId: string): Promise<Storage> => {
    try {
      if (!deviceService.isValidUUID(storageId)) {
        throw new Error('Invalid storage ID');
      }

      const response = await apiGet<Storage>(`/storages/${storageId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching storage with ID ${storageId}:`, error);
      throw error;
    }
  },
};