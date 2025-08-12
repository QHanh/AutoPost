import { Brand } from '../types/Brand';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000'; // Ensure this is your correct API URL

class BrandService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("auth_token");

    const config: RequestInit = {
      headers: {
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_URL}/api/v1${endpoint}`, config);

    if (!response.ok) {
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        const errorData = await response.json();
        const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // For file downloads, we handle the blob in the component.
    if (response.headers.get("Content-Type")?.includes("sheet")) {
        return response;
    }

    return response.json();
  }

  async getAllBrands(skip = 0, limit = 100, search = '', service_id?: string, sort_by?: keyof Brand, sort_order?: 'asc' | 'desc') {
    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
      ...(search && { search }),
      ...(service_id && { service_id }),
      ...(sort_by && { sort_by }),
      ...(sort_order && { sort_order }),
    });
    const response = await this.makeRequest(`/brands?${params}`);
    return response.data;
  }

  async getUniqueBrandNames(serviceId: string) {
    return this.makeRequest(`/brands/unique-names/${serviceId}`);
  }

  async createBrand(data: Partial<Brand>) {
    return this.makeRequest('/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBrand(brandId: string, data: Partial<Brand>) {
    return this.makeRequest(`/brands/${brandId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBrand(brandId: string) {
    return this.makeRequest(`/brands/${brandId}`, { method: 'DELETE' });
  }

  async importBrands(file: File) {
      const formData = new FormData();
      formData.append('file', file);
      return this.makeRequest('/brands/import', {
          method: 'POST',
          body: formData,
      });
  }

  async exportBrands(serviceIds?: string[]) {
    const params = new URLSearchParams();
    if (serviceIds) {
      serviceIds.forEach(id => params.append('service_ids', id));
    }
    const response = await this.makeRequest(`/brands/export?${params}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brands_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    return response;
  }
}

export const brandService = new BrandService();