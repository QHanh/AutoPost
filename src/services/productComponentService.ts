import { apiGet, apiPost, apiPut, apiDelete } from './apiService';
import { 
  ProductComponent, 
  ProductComponentCreate, 
  ProductComponentUpdate,
  Category,
  CategoryCreate,
  CategoryUpdate,
  Property,
  PropertyCreate,
  PropertyUpdate
} from '../types/productComponentTypes';

// Product Component APIs
export const productComponentService = {
  // Get all product components
  getAllProductComponents: async (
    page: number = 1, 
    limit: number = 10,
    searchTerm?: string,
    sortKey?: string,
    sortDirection?: 'ascending' | 'descending'
  ) => {
    const params = new URLSearchParams({
      skip: String((page - 1) * limit),
      limit: String(limit),
    });

    if (searchTerm) {
      // Backend doesn't support search yet, but we'll keep this for future
      params.append('search', searchTerm);
    }
    if (sortKey) {
      params.append('sort_by', sortKey);
    }
    if (sortDirection) {
      params.append('sort_order', sortDirection === 'descending' ? 'desc' : 'asc');
    }

    return await apiGet<ProductComponent[]>(`/product-components?${params.toString()}`);
  },

  // Get product component by ID
  getProductComponentById: async (id: string) => {
    return await apiGet<ProductComponent>(`/product-components/${id}`);
  },

  // Create product component
  createProductComponent: async (data: ProductComponentCreate) => {
    return await apiPost<ProductComponent>('/product-components', data);
  },

  // Update product component
  updateProductComponent: async (id: string, data: ProductComponentUpdate) => {
    return await apiPut<ProductComponent>(`/product-components/${id}`, data);
  },

  // Delete product component
  deleteProductComponent: async (id: string) => {
    return await apiDelete(`/product-components/${id}`);
  },

  // Get all categories
  getAllCategories: async (skip: number = 0, limit: number = 100) => {
    return await apiGet<Category[]>(`/categories?skip=${skip}&limit=${limit}`);
  },

  // Get category by ID
  getCategoryById: async (id: string) => {
    return await apiGet<Category>(`/categories/${id}`);
  },

  // Create category
  createCategory: async (data: CategoryCreate) => {
    return await apiPost<Category>('/categories', data);
  },

  // Update category
  updateCategory: async (id: string, data: CategoryUpdate) => {
    return await apiPut<Category>(`/categories/${id}`, data);
  },

  // Delete category
  deleteCategory: async (id: string) => {
    return await apiDelete(`/categories/${id}`);
  },

  // Get all properties
  getAllProperties: async (skip: number = 0, limit: number = 100) => {
    return await apiGet<Property[]>(`/properties?skip=${skip}&limit=${limit}`);
  },

  // Get property by ID
  getPropertyById: async (id: string) => {
    return await apiGet<Property>(`/properties/${id}`);
  },

  // Create property
  createProperty: async (data: PropertyCreate) => {
    return await apiPost<Property>('/properties', data);
  },

  // Update property
  updateProperty: async (id: string, data: PropertyUpdate) => {
    return await apiPut<Property>(`/properties/${id}`, data);
  },

  // Delete property
  deleteProperty: async (id: string) => {
    return await apiDelete(`/properties/${id}`);
  }
};
