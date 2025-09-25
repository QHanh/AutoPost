import { UserDevice, ImportResponse } from '../types/deviceTypes';
import { apiGet, apiPost, apiPut, apiDelete, apiGetBlob, apiPostFormData } from './apiService';

/**
 * Service xử lý các thao tác liên quan đến thiết bị của người dùng
 */
export const userDeviceService = {
  /**
   * Lấy danh sách thiết bị của người dùng hiện tại
   */
  getUserDevices: async (sort_by?: string, sort_order?: string): Promise<UserDevice[]> => {
    try {
      const params = new URLSearchParams();
      if (sort_by) {
        params.append('sort_by', sort_by);
      }
      if (sort_order) {
        params.append('sort_order', sort_order);
      }
      const response = await apiGet<UserDevice[]>(`/user-devices/my-devices?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching user devices:', error);
      throw error;
    }
  },



  /**
   * Lấy thông tin chi tiết một thiết bị của người dùng
   * @param deviceId ID của thiết bị
   */
  getUserDeviceById: async (deviceId: string): Promise<UserDevice> => {
    try {
      const response = await apiGet<UserDevice>(`/user-devices/${deviceId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching user device with ID ${deviceId}:`, error);
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
      return response;
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
      return response;
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
   * Xóa hàng loạt thiết bị người dùng.
   * @param deviceIds Danh sách ID của các thiết bị cần xóa
   */
  bulkDeleteUserDevices: async (deviceIds: string[]): Promise<void> => {
    try {
      await apiDelete('/user-devices/bulk', { user_device_ids: deviceIds });
    } catch (error) {
      console.error('Error bulk deleting user devices:', error);
      throw error;
    }
  },

  /**
   * Xóa tất cả thiết bị của người dùng.
   */
  deleteAllUserDevices: async (): Promise<void> => {
    try {
      await apiDelete('/user-devices/all');
    } catch (error) {
      console.error('Error deleting all user devices:', error);
      throw error;
    }
  },

  /**
   * Khôi phục thiết bị đã xóa mềm
   * @param deviceId ID của thiết bị cần khôi phục
   */
  restoreUserDevice: async (deviceId: string): Promise<UserDevice> => {
    try {
      const response = await apiPost<UserDevice>(`/user-devices/${deviceId}/restore`, {});
      return response;
    } catch (error) {
      console.error(`Error restoring user device with ID ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy danh sách thiết bị đã xóa mềm trong ngày
   */
  getDeletedDevicesToday: async (): Promise<UserDevice[]> => {
    try {
      const response = await apiGet<UserDevice[]>('/user-devices/deleted-today');
      return response;
    } catch (error) {
      console.error('Error fetching deleted devices today:', error);
      throw error;
    }
  },

  /**
   * Khôi phục tất cả thiết bị đã xóa trong ngày
   */
  restoreAllDeletedToday: async (): Promise<{ restored_count: number; message: string }> => {
    try {
      const response = await apiPost<{ restored_count: number; message: string }>('/user-devices/restore-all-today', {});
      return response;
    } catch (error) {
      console.error('Error restoring all deleted devices today:', error);
      throw error;
    }
  },

  // /**
  //  * Tải template Excel
  //  */
  // downloadTemplate: async (): Promise<Blob> => {
  //   try {
  //     const blob = await apiGetBlob('/user-devices/template');
  //     return blob;
  //   } catch (error) {
  //     console.error('Error downloading template:', error);
  //     throw error;
  //   }
  // },

  /**
   * Xuất dữ liệu thiết bị ra Excel
   */
  exportToExcel: async (): Promise<Blob> => {
    try {
      const blob = await apiGetBlob('/user-devices/export');
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
  importFromExcel: async (file: File): Promise<ImportResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiPostFormData<ImportResponse>('/user-devices/import', formData);
      return response;
    } catch (error) {
      console.error('Error importing from Excel:', error);
      throw error;
    }
  },

  /**
   * Tạo và tải xuống file từ blob
   * @param blob Dữ liệu blob
{{ ... }}
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