import { DeviceBrand, DeviceBrandCreate, DeviceBrandUpdate } from "../types/deviceBrand";

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

class DeviceBrandService {
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

    const response = await fetch(`${API_URL}/api/v1${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getDeviceBrands(skip = 0, limit = 100, search = ''): Promise<DeviceBrand[]> {
    const query = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
        search,
    });
    const response = await this.makeRequest(`/device-brands?${query}`);
    return response.data;
  }

  async getDistinctDeviceBrands(search = ''): Promise<DeviceBrand[]> {
    const query = new URLSearchParams({ search });
    const response = await this.makeRequest(`/device-brands/distinct?${query}`);
    return response.data;
  }

  async getDeviceBrand(id: string): Promise<DeviceBrand> {
    const response = await this.makeRequest(`/device-brands/${id}`);
    return response.data;
  }

  async createDeviceBrand(data: DeviceBrandCreate): Promise<DeviceBrand> {
    const response = await this.makeRequest("/device-brands", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateDeviceBrand(id: string, data: DeviceBrandUpdate): Promise<DeviceBrand> {
    const response = await this.makeRequest(`/device-brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteDeviceBrand(id: string): Promise<void> {
    await this.makeRequest(`/device-brands/${id}`, {
      method: "DELETE",
    });
  }
}

export default new DeviceBrandService();
