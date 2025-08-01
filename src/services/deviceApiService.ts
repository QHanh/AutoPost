import {
  DeviceInfo,
  Color,
  DeviceColor,
  Storage,
  DeviceStorage,
  UserDevice,
  DeviceFilter,
  DevicePagination,
} from "../types/device";

const PUBLIC_URL = "http://192.168.1.17:8000/api/v1";

class DeviceApiService {
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("auth_token");

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${PUBLIC_URL}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }

      const errorData = await response.json().catch(() => ({}));

      // Enhanced error logging for debugging
      if (response.status === 422) {
        console.error("422 Validation Error Details:", {
          endpoint,
          status: response.status,
          errorData,
          requestOptions: options,
        });
      }

      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    // Kiểm tra nếu status code là 204 NO_CONTENT thì không parse JSON
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    return data;
  }

  // Device Info Management
  async getDeviceInfos(
    filter: DeviceFilter = {},
    pagination: Partial<DevicePagination> = {}
  ): Promise<{ devices: DeviceInfo[]; pagination: DevicePagination }> {
    const params = new URLSearchParams();

    const skip = ((pagination.page || 1) - 1) * (pagination.limit || 10);
    const limit = pagination.limit || 10;

    params.append("skip", skip.toString());
    params.append("limit", limit.toString());
    if (filter.search) params.append("search", filter.search);
    if (filter.brand) params.append("brand", filter.brand);

    const response = await this.makeRequest(
      `/device-infos?${params.toString()}`
    );

    return {
      devices: response.data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: response.total || response.data.length,
        totalPages: Math.ceil(
          (response.total || response.data.length) / (pagination.limit || 10)
        ),
      },
    };
  }

  async getDeviceInfoById(id: string): Promise<DeviceInfo> {
    if (!this.isValidUUID(id)) {
      throw new Error(`Invalid device info ID format: ${id}`);
    }
    const response = await this.makeRequest(`/device-infos/${id}`);
    return response.data;
  }

  async createDeviceInfo(deviceInfo: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const response = await this.makeRequest("/device-infos", {
      method: "POST",
      body: JSON.stringify(deviceInfo),
    });
    return response.data;
  }

  async updateDeviceInfo(
    id: string,
    deviceInfo: Partial<DeviceInfo>
  ): Promise<DeviceInfo> {
    const response = await this.makeRequest(`/device-infos/${id}`, {
      method: "PUT",
      body: JSON.stringify(deviceInfo),
    });
    return response.data;
  }

  async deleteDeviceInfo(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/device-infos/${id}`, {
      method: "DELETE",
    });
    return response.data;
  }

  // Color Management
  async getColors(
    skip: number = 0,
    limit: number = 100,
    search: string = ""
  ): Promise<any> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    const response = await this.makeRequest(
      `/colors?skip=${skip}&limit=${limit}${searchParam}`
    );
    return {
      data: response.data,
      metadata: response.metadata || {
        total: response.data.length,
        page: Math.floor(skip / limit) + 1,
        limit: limit,
        total_pages: Math.ceil(response.data.length / limit),
      },
    };
  }

  async getColorById(id: string): Promise<Color> {
    const response = await this.makeRequest(`/colors/${id}`);
    return response.data;
  }

  async createColor(color: Partial<Color>): Promise<Color> {
    const response = await this.makeRequest("/colors", {
      method: "POST",
      body: JSON.stringify(color),
    });
    return response.data;
  }

  async updateColor(id: string, color: Partial<Color>): Promise<Color> {
    const response = await this.makeRequest(`/colors/${id}`, {
      method: "PUT",
      body: JSON.stringify(color),
    });
    return response.data;
  }

  async deleteColor(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/colors/${id}`, {
      method: "DELETE",
    });
    return response.data;
  }

  // Device Color Management
  async getDeviceColors(deviceInfoId: string): Promise<DeviceColor[]> {
    const response = await this.makeRequest(
      `/device-colors/device/${deviceInfoId}`
    );
    return response.data;
  }

  async getAllDeviceColors(
    filter: DeviceFilter = {},
    pagination: Partial<DevicePagination> = {}
  ): Promise<{ deviceColors: DeviceColor[]; pagination: DevicePagination }> {
    const params = new URLSearchParams();

    const skip = ((pagination.page || 1) - 1) * (pagination.limit || 10);
    const limit = pagination.limit || 10;

    params.append("skip", skip.toString());
    params.append("limit", limit.toString());
    if (filter.search) params.append("search", filter.search);

    const response = await this.makeRequest(
      `/device-colors?${params.toString()}`
    );

    return {
      deviceColors: response.data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: response.total || response.data.length,
        totalPages: Math.ceil(
          (response.total || response.data.length) / (pagination.limit || 10)
        ),
      },
    };
  }

  async getDeviceColorsWithColor(deviceInfoId: string): Promise<DeviceColor[]> {
    const response = await this.makeRequest(
      `/device-colors/device/${deviceInfoId}/with-color`
    );
    return response.data;
  }

  async getColorsByDeviceInfoId(deviceInfoId: string): Promise<Color[]> {
    try {
      const response = await this.makeRequest(
        `/device-infos/${deviceInfoId}/colors`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching colors by device info id:", error);
      // Fallback to the old endpoint if the new one fails
      try {
        const response = await this.makeRequest(
          `/device-colors/device/${deviceInfoId}/colors`
        );
        return response.data;
      } catch (fallbackError) {
        console.error("Fallback endpoint also failed:", fallbackError);
        return [];
      }
    }
  }

  async getDevicesByColorId(colorId: string): Promise<DeviceInfo[]> {
    try {
      const response = await this.makeRequest(`/colors/${colorId}/devices`);
      return response.data;
    } catch (error) {
      console.error("Error fetching devices by color id:", error);
      return [];
    }
  }

  async addColorToDevice(
    deviceInfoId: string,
    colorId: string
  ): Promise<boolean> {
    try {
      // Validate UUIDs before making the request
      if (!this.isValidUUID(deviceInfoId)) {
        throw new Error(`Invalid device info ID format: ${deviceInfoId}`);
      }
      if (!this.isValidUUID(colorId)) {
        throw new Error(`Invalid color ID format: ${colorId}`);
      }

      const response = await this.makeRequest(
        `/device-infos/${deviceInfoId}/colors/${colorId}`,
        {
          method: "POST",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding color to device:", error);
      throw error;
    }
  }

  async removeColorFromDevice(
    deviceInfoId: string,
    colorId: string
  ): Promise<boolean> {
    try {
      // Validate UUIDs before making the request
      if (!this.isValidUUID(deviceInfoId)) {
        throw new Error(`Invalid device info ID format: ${deviceInfoId}`);
      }
      if (!this.isValidUUID(colorId)) {
        throw new Error(`Invalid color ID format: ${colorId}`);
      }

      const response = await this.makeRequest(
        `/device-infos/${deviceInfoId}/colors/${colorId}`,
        {
          method: "DELETE",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error removing color from device:", error);
      throw error;
    }
  }

  // Storage Management
  async getStorages(
    filter: DeviceFilter = {},
    pagination: Partial<DevicePagination> = {}
  ): Promise<{ storages: Storage[]; pagination: DevicePagination }> {
    // Sử dụng mock data vì endpoint /storages không tồn tại
    // Backend hiện tại chỉ có endpoint /device-storages
    const mockStorages: Storage[] = [
      {
        id: "1",
        capacity: 64,
        type: "SSD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        capacity: 128,
        type: "SSD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        capacity: 256,
        type: "SSD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "4",
        capacity: 512,
        type: "SSD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "5",
        capacity: 1024,
        type: "SSD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "6",
        capacity: 2048,
        type: "SSD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "7",
        capacity: 64,
        type: "HDD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "8",
        capacity: 128,
        type: "HDD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "9",
        capacity: 256,
        type: "HDD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "10",
        capacity: 512,
        type: "HDD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "11",
        capacity: 1024,
        type: "HDD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "12",
        capacity: 2048,
        type: "HDD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "13",
        capacity: 32,
        type: "eMMC",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "14",
        capacity: 64,
        type: "eMMC",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "15",
        capacity: 128,
        type: "eMMC",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "16",
        capacity: 256,
        type: "NVMe",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "17",
        capacity: 512,
        type: "NVMe",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "18",
        capacity: 1024,
        type: "NVMe",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "19",
        capacity: 64,
        type: "UFS",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "20",
        capacity: 128,
        type: "UFS",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "21",
        capacity: 256,
        type: "UFS",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Filter by search term if provided
    let filteredStorages = [...mockStorages];
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredStorages = filteredStorages.filter(
        (storage) =>
          storage.capacity.toString().includes(searchTerm) ||
          storage.type.toLowerCase().includes(searchTerm)
      );
    }

    // Calculate pagination
    const skip = ((pagination.page || 1) - 1) * (pagination.limit || 10);
    const limit = pagination.limit || 10;
    const total = filteredStorages.length;
    const paginatedStorages = filteredStorages.slice(skip, skip + limit);

    return {
      storages: paginatedStorages,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: total,
        totalPages: Math.ceil(total / (pagination.limit || 10)),
      },
    };
  }

  async getStorageById(id: string): Promise<Storage> {
    // Simulate getting a storage by ID
    // Tìm storage trong danh sách mock data
    const mockStorages = await this.getStorages({}, { page: 1, limit: 100 });
    const storage = mockStorages.storages.find((s) => s.id === id);

    if (storage) {
      return storage;
    }

    // Fallback nếu không tìm thấy
    return {
      id,
      capacity: 128,
      type: "SSD",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async createStorage(storage: Partial<Storage>): Promise<Storage> {
    // Simulate creating a storage
    // Trong thực tế, đây sẽ là API call đến backend
    const newStorage: Storage = {
      id: Math.random().toString(36).substring(2, 15),
      capacity: storage.capacity || 0,
      type: storage.type || "SSD",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return newStorage;
  }

  async updateStorage(id: string, storage: Partial<Storage>): Promise<Storage> {
    // Simulate updating a storage
    // Trong thực tế, đây sẽ là API call đến backend
    const updatedStorage: Storage = {
      id,
      capacity: storage.capacity || 0,
      type: storage.type || "SSD",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return updatedStorage;
  }

  async deleteStorage(id: string): Promise<boolean> {
    // Simulate deleting a storage
    // Trong thực tế, đây sẽ là API call đến backend
    return true;
  }

  async getDevicesByStorageId(storageId: string): Promise<DeviceInfo[]> {
    // Simulate getting devices by storage ID
    // Tạo mock data cho các thiết bị sử dụng storage này
    const mockDevices: DeviceInfo[] = [
      {
        id: "1",
        name: "iPhone 13",
        brand: "Apple",
        model: "iPhone 13",
        image_url: "https://example.com/iphone13.jpg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Samsung Galaxy S21",
        brand: "Samsung",
        model: "Galaxy S21",
        image_url: "https://example.com/galaxys21.jpg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Trong thực tế, đây sẽ là API call đến backend để lấy thiết bị theo storage ID
    return mockDevices;
  }

  async getDeviceStorages(deviceInfoId: string): Promise<DeviceStorage[]> {
    try {
      const response = await this.makeRequest(
        `/device-infos/${deviceInfoId}/storages`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching device storages:", error);
      // Fallback to the old endpoint if the new one fails
      try {
        const response = await this.makeRequest(
          `/device-storages/by-device/${deviceInfoId}`
        );
        return response.data;
      } catch (fallbackError) {
        console.error("Fallback endpoint also failed:", fallbackError);
        return [];
      }
    }
  }

  async addStorageToDevice(
    deviceInfoId: string,
    capacity: number,
    type: string = "SSD"
  ): Promise<DeviceStorage> {
    const response = await this.makeRequest("/device-storages", {
      method: "POST",
      body: JSON.stringify({ device_info_id: deviceInfoId, capacity }),
    });
    return response.data;
  }

  async removeStorageFromDevice(
    deviceInfoId: string,
    storageId: string
  ): Promise<boolean> {
    const response = await this.makeRequest(
      `/device-storages/${storageId}?device_info_id=${deviceInfoId}`,
      {
        method: "DELETE",
      }
    );
    return response.data;
  }

  // User Device Management
  async getUserDevices(
    userId?: string,
    skip: number = 0,
    limit: number = 10
  ): Promise<{ devices: UserDevice[]; total: number }> {
    let endpoint = "/user-devices";
    if (userId) {
      endpoint = `/user-devices/user/${userId}?skip=${skip}&limit=${limit}`;
    } else {
      endpoint = `/user-devices?skip=${skip}&limit=${limit}`;
    }

    const response = await this.makeRequest(endpoint);
    return {
      devices: response.data,
      total: response.total || response.data.length,
    };
  }

  async getUserDeviceById(id: string): Promise<UserDevice> {
    const response = await this.makeRequest(`/user-devices/${id}`);
    return response.data;
  }

  async createUserDevice(userDevice: Partial<UserDevice>): Promise<UserDevice> {
    const response = await this.makeRequest("/user-devices", {
      method: "POST",
      body: JSON.stringify(userDevice),
    });
    return response.data;
  }

  async updateUserDevice(
    id: string,
    userDevice: Partial<UserDevice>
  ): Promise<UserDevice> {
    const response = await this.makeRequest(`/user-devices/${id}`, {
      method: "PUT",
      body: JSON.stringify(userDevice),
    });
    return response.data;
  }

  async deleteUserDevice(id: string): Promise<boolean> {
    const response = await this.makeRequest(`/user-devices/${id}`, {
      method: "DELETE",
    });
    return response.data;
  }

  // Excel Import/Export
  async importUserDevices(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${PUBLIC_URL}/user-devices/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  }

  async exportUserDevices(userId?: string): Promise<Blob> {
    let endpoint = "/user-devices/export";
    if (userId) {
      endpoint = `/user-devices/export?user_id=${userId}`;
    }

    const response = await fetch(`${PUBLIC_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }

  async exportMyDevices(): Promise<Blob> {
    const response = await fetch(
      `${PUBLIC_URL}/user-devices/export/my-devices`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }

  async downloadTemplate(): Promise<Blob> {
    const response = await fetch(`${PUBLIC_URL}/user-devices/template`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }
}

export const deviceApiService = new DeviceApiService(); 