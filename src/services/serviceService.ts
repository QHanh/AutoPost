import { Service } from '../types/Service.js';
import { apiGet, apiPost, apiPut, apiDelete, apiPostForm, apiPostAndGetBlob } from './apiService.js';

// Define API response types
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

const API_ENDPOINT = '/services';

export const serviceService = {
  getAllServices: async (skip = 0, limit = 100, search = '') => {
    const query = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
      search: search || ''
    });
    const url = `${API_ENDPOINT}?${query.toString()}`;
    const response = await apiGet<PaginatedResponse<Service>>(url);
    return response.data;
  },

  getService: async (id: string) => {
    const response = await apiGet<ApiResponse<Service>>(`${API_ENDPOINT}/${id}`);
    return response.data;
  },

  createService: async (serviceData: Partial<Service>) => {
    const response = await apiPost<ApiResponse<Service>>(API_ENDPOINT, serviceData);
    return response.data;
  },

  updateService: async (id: string, serviceData: Partial<Service>) => {
    const response = await apiPut<ApiResponse<Service>>(`${API_ENDPOINT}/${id}`, serviceData);
    return response.data;
  },

  deleteService: async (id: string) => {
    const response = await apiDelete<ApiResponse<{ success: boolean; message?: string }>>(`${API_ENDPOINT}/${id}`);
    return response.data;
  },

  getDeletedServicesToday: async () => {
    const response = await apiGet<ApiResponse<Service[]>>(`${API_ENDPOINT}/deleted-today`);
    return response.data;
  },

  restoreAllDeletedServicesToday: async () => {
    const response = await apiPost<ApiResponse<{ restored_count: number; message: string }>>(`${API_ENDPOINT}/restore-all-today`, {});
    return response.data;
  },

  restoreService: async (id: string) => {
    const response = await apiPost<ApiResponse<{ success: boolean; message?: string }>>(`${API_ENDPOINT}/${id}/restore`, {});
    return response.data;
  },

  bulkDeleteServices: async (serviceIds: string[]) => {
    const response = await apiDelete<ApiResponse<{ success: boolean; message?: string }>>(`${API_ENDPOINT}/bulk`, serviceIds);
    return response.data;
  },

  importServicesFromExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiPostForm<ApiResponse<{ imported_count: number; message: string }>>(`${API_ENDPOINT}/import-excel`, formData);
  },

  exportServicesToExcel: async (serviceIds: string[]) => {
    return await apiPostAndGetBlob(`${API_ENDPOINT}/export-excel`, { service_ids: serviceIds });
  }
};