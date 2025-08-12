const PUBLIC_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

export interface WarrantyService {
  id: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface WarrantyServiceCreate {
  value: string;
}

export interface WarrantyServiceUpdate {
  value: string;
}

class WarrantyServiceService {
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

    const response = await fetch(`${PUBLIC_URL}/api/v1${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  }

  async getWarrantyServices(): Promise<WarrantyService[]> {
    try {
      const response = await this.makeRequest(`/warranty-services`);
      return response;
    } catch (error) {
      console.error('Error fetching warranty services:', error);
      throw error;
    }
  }

  async createWarrantyService(warrantyService: WarrantyServiceCreate): Promise<WarrantyService> {
    try {
      const response = await this.makeRequest(`/warranty-services`, {
        method: 'POST',
        body: JSON.stringify(warrantyService)
      });
      return response;
    } catch (error) {
      console.error('Error creating warranty service:', error);
      throw error;
    }
  }

  async updateWarrantyService(id: string, warrantyService: WarrantyServiceUpdate): Promise<WarrantyService> {
    try {
      const response = await this.makeRequest(`/warranty-services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(warrantyService)
      });
      return response;
    } catch (error) {
      console.error('Error updating warranty service:', error);
      throw error;
    }
  }

  async deleteWarrantyService(id: string): Promise<void> {
    try {
      await this.makeRequest(`/warranty-services/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting warranty service:', error);
      throw error;
    }
  }
}

export const warrantyService = new WarrantyServiceService();
