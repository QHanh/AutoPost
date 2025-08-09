export interface ProductComponent {
  id: string;
  product_code: string;
  product_name: string;
  amount: number;
  trademark?: string;
  guarantee?: string;
  stock: number;
  description?: string;
  product_photo?: string;
  product_link?: string;
  user_id: string;
  category_id?: string;
  properties?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  property_ids?: string[];
}

export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  children?: Category[];
  product_components?: ProductComponent[];
}

export interface Property {
  id: string;
  key: string;
  values?: string[];
  parent_id?: string;
  created_at: string;
  updated_at: string;
  children?: Property[];
  product_components?: ProductComponent[];
}

export interface ProductComponentCreate {
  product_code?: string;
  product_name: string;
  amount: number;
  trademark?: string;
  guarantee?: string;
  stock: number;
  description?: string;
  product_photo?: string;
  product_link?: string;
  user_id?: string;
  category_id?: string;
  properties?: string;
}

export interface ProductComponentUpdate {
  product_code?: string;
  product_name?: string;
  amount?: number;
  trademark?: string;
  guarantee?: string;
  stock?: number;
  description?: string;
  product_photo?: string;
  product_link?: string;
  category_id?: string;
  properties?: string;
}

export interface CategoryCreate {
  name: string;
  parent_id?: string;
}

export interface CategoryUpdate {
  name?: string;
  parent_id?: string;
}

export interface PropertyCreate {
  key: string;
  values?: string[];
  parent_id?: string;
}

export interface PropertyUpdate {
  key?: string;
  values?: string[];
  parent_id?: string;
}

export interface ImportResult {
  total: number;
  success: number;
  updated_count: number;
  created_count: number;
  error: number;
  errors?: string[];
}
