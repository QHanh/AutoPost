import { Service } from './Service';

export interface Brand {
  id: string;
  service_code: string;
  name: string;
  warranty: string;
  service_id: string;
  device_brand_id?: string;
  device_type?: string;
  color?: string;
  price?: string;
  created_at: string;
  updated_at: string;
  service?: Service; 
}