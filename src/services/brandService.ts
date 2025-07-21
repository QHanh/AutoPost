import { ResponseModel } from '../types/ResponseModel.js';
import { Brand } from '../types/Brand.js';
import { apiGet, apiPost, apiPut, apiDelete } from './apiService.js';

const API_URL = '/brands';

export const brandService = {
  getAllBrands: async (
    skip = 0,
    limit = 100,
    search = '',
    service_id?: string
  ) => {
    const params: any = { skip, limit, search };
    if (service_id) {
        params.service_id = service_id;
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
}; 