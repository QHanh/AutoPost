export interface Brand {
  id: string;
  service_code: string;
  name: string;
  warranty: string;
  note?: string;
  service_id: string;
  device_brand_id?: string;
  device_type?: string;
  color?: string;
  price?: string;
  wholesale_price?: string;
  created_at: string;
  updated_at: string;
  service?: { name: string };
  device_brand?: { name: string };
  conditions?: string[];
}

export type BrandCreate = Omit<Brand, 'id' | 'service_code' | 'created_at' | 'updated_at' | 'service' | 'device_brand'>;

export type BrandUpdate = Partial<BrandCreate>;