import { Service } from '../types/Service.js';
import { apiGet, apiPost, apiPut, apiDelete, apiPostForm, apiPostAndGetBlob } from './apiService.js';

const API_ENDPOINT = '/services';

export const serviceService = {
  getAllServices: async (skip = 0, limit = 100, search = '') => {
    const query = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
      search: search || ''
    });
    const url = `${API_ENDPOINT}?${query.toString()}`;
    const response = await apiGet(url);
    return response.data;
  },

  getService: async (id: string) => {
    const response = await apiGet(`${API_ENDPOINT}/${id}`);
    return response.data;
  },

  createService: async (serviceData: Partial<Service>) => {
    const response = await apiPost(API_ENDPOINT, serviceData);
    return response.data;
  },

  updateService: async (id: string, serviceData: Partial<Service>) => {
    const response = await apiPut(`${API_ENDPOINT}/${id}`, serviceData);
    return response.data;
  },

  deleteService: async (id: string) => {
    const response = await apiDelete(`${API_ENDPOINT}/${id}`);
    return response.data;
  },

  bulkDeleteServices: async (serviceIds: string[]) => {
    const response = await apiDelete(`${API_ENDPOINT}/bulk`, serviceIds);
    return response.data;
  },

  importServicesFromExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiPostForm(`${API_ENDPOINT}/import-excel`, formData);
  },

  exportServicesToExcel: async (serviceIds: string[]) => {
    return await apiPostAndGetBlob(`${API_ENDPOINT}/export-excel`, { service_ids: serviceIds });
  },
};