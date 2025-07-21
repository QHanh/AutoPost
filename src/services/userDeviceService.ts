import { UserDevice, ImportResult } from '../types/deviceTypes';
import { apiGet, apiPost, apiPut, apiDelete, apiGetBlob, apiPostFormData } from './apiService';
import { deviceService } from './deviceService';
import { colorService } from './colorService';
import { storageService } from './storageService';

/**
 * Service xử lý các thao tác liên quan đến thiết bị của người dùng
 */
export const userDeviceService = {
  /**
   * Lấy danh sách thiết bị của người dùng hiện tại
   */
  getUserDevices: async (): Promise<UserDevice[]> => {
    try {
      const response = await apiGet<UserDevice[]>('/user-devices/my-devices');
      return response.data;
    } catch (error) {
      console.error('Error fetching user devices:', error);
      throw error;
    }
  },

  /**
   * Làm phong phú dữ liệu thiết bị với thông tin thiết bị, màu sắc và dung lượng
   * @param devices Danh sách thiết bị cần làm phong phú
   */
  enrichUserDevices: async (devices: UserDevice[]): Promise<UserDevice[]> => {
    try {
      const enrichedDevices = await Promise.all(devices.map(async (device) => {
        let deviceModel = '';
        let colorName = '';
        let storageCapacity = 0;
        
        try {
          if (device.device_info_id && deviceService.isValidUUID(device.device_info_id)) {
            const deviceInfo = await deviceService.getDeviceById(device.device_info_id);
            deviceModel = deviceInfo.model;
          }
          
          if (device.color_id && deviceService.isValidUUID(device.color_id)) {
            const color = await colorService.getColorById(device.color_id);
            colorName = color.name;
          }
          
          if (device.storage_id && deviceService.isValidUUID(device.storage_id)) {
            const storage = await storageService.getStorageById(device.storage_id);
            storageCapacity = storage.capacity;
          }
        } catch (error) {
          console.error('Error enriching device data:', error);
        }
        
        return {
          ...device,
          deviceModel,
          colorName,
          storageCapacity
        };
      }));
      
      return enrichedDevices;
    } catch (error) {
      console.error('Error enriching user devices:', error);
      throw error;
    }
  },

  /**
   * Thêm thiết bị mới
   * @param deviceData Dữ liệu thiết bị cần thêm
   */
  addUserDevice: async (deviceData: UserDevice): Promise<UserDevice> => {
    try {
      const response = await apiPost<UserDevice>('/user-devices', deviceData);
      return response.data;
    } catch (error) {
      console.error('Error adding user device:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thiết bị
   * @param deviceId ID của thiết bị cần cập nhật
   * @param updateData Dữ liệu cập nhật
   */
  updateUserDevice: async (deviceId: string, updateData: Partial<UserDevice>): Promise<UserDevice> => {
    try {
      const response = await apiPut<UserDevice>(`/user-devices/${deviceId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user device with ID ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Xóa thiết bị
   * @param deviceId ID của thiết bị cần xóa
   */
  deleteUserDevice: async (deviceId: string): Promise<void> => {
    try {
      await apiDelete(`/user-devices/${deviceId}`);
    } catch (error) {
      console.error(`Error deleting user device with ID ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Tải template Excel
   */
  downloadTemplate: async (): Promise<Blob> => {
    try {
      const blob = await apiGetBlob('/user-devices/template');
      return blob;
    } catch (error) {
      console.error('Error downloading template:', error);
      throw error;
    }
  },

  /**
   * Xuất dữ liệu thiết bị ra Excel
   */
  exportToExcel: async (): Promise<Blob> => {
    try {
      const blob = await apiGetBlob('/user-devices/export/my-devices');
      return blob;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  },

  /**
   * Nhập dữ liệu từ file Excel
   * @param file File Excel cần nhập
   */
  importFromExcel: async (file: File): Promise<ImportResult> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiPostFormData<ImportResult>('/user-devices/import', formData);
      return response.data;
    } catch (error) {
      console.error('Error importing from Excel:', error);
      throw error;
    }
  },

  /**
   * Tạo và tải xuống file từ blob
   * @param blob Dữ liệu blob
   * @param filename Tên file
   */
  downloadFile: (blob: Blob, filename: string): void => {
    // Tạo URL cho blob
    const url = window.URL.createObjectURL(blob);
    
    // Tạo thẻ a để tải xuống
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Dọn dẹp
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};