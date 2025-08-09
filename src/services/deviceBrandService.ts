import { DeviceBrand, DeviceBrandCreate, DeviceBrandUpdate } from "../types/deviceBrand";

const API_URL = "http://192.168.1.161:8000/api/v1";

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

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getDeviceBrands(): Promise<DeviceBrand[]> {
    const response = await this.makeRequest("/device-brands");
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
