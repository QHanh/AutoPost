import { ResponseModel } from '../types/ResponseModel.js';
import { Brand } from '../types/Brand.js';
import { apiGet, apiPost, apiPut, apiDelete, apiPostForm } from './apiService.js';

const API_URL = '/brands';

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

  exportBrands: async () => {
    const response = await apiGet(`/brands/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'danh_sach_tat_ca_dich_vu.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};