import { Brand } from '../types/Brand.js';
import { apiGet, apiPost, apiPut, apiDelete, apiPostForm } from './apiService.js';

export const brandService = {
  getAllBrands: async (
    skip = 0,
    limit = 100,
    search = '',
    service_id?: string,
    sort_by?: keyof Brand,
    sort_order?: 'asc' | 'desc'
  ) => {
    const params: any = { skip, limit, search };
    if (service_id) {
        params.service_id = service_id;
    }
    if (sort_by) {
        params.sort_by = sort_by;
        params.sort_order = sort_order || 'asc';
    }
    let url = '/brands' + '?' + new URLSearchParams(params).toString();
    const response = await apiGet(url);
    return response.data;
  },

  getBrand: async (id: string) => {
    const response = await apiGet(`/brands/${id}`);
    return response.data;
  },

  createBrand: async (brandData: Partial<Brand>) => {
    const response = await apiPost('/brands', brandData);
    return response.data;
  },

  updateBrand: async (id: string, brandData: Partial<Brand>) => {
    const response = await apiPut(`/brands/${id}`, brandData);
    return response.data;
  },

  deleteBrand: async (id: string) => {
    const response = await apiDelete(`/brands/${id}`);
    return response.data;
  },
  
  importBrands: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiPostForm(`/brands/import`, formData);
  },

  exportBrands: async (serviceIds?: string[]) => {
    let url = '/brands/export';
    if (serviceIds && serviceIds.length > 0) {
      // Add service_ids as query parameters
      const params = new URLSearchParams();
      serviceIds.forEach(id => params.append('service_ids', id));
      url += '?' + params.toString();
    }
    
    try {
      const response = await apiGet(url, { responseType: 'blob' });
      const fileName = serviceIds && serviceIds.length > 0 
        ? `danh_sach_dich_vu_${serviceIds.length}.xlsx` 
        : 'danh_sach_tat_ca_dich_vu.xlsx';
        
      const blobUrl = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl); // Clean up
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  },
};