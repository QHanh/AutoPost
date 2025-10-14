export interface Material {
  id: string;
  name: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceInfo {
  id: string;
  model: string;
  brand?: string;
  release_date?: string;
  screen?: string;
  chip_ram?: string;
  camera?: string;
  battery?: string;
  connectivity_os?: string;
  color_english?: string;
  dimensions_weight?: string;
  sensors_health_features?: string;
  warranty?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  materials?: Material[];
}

export interface Color {
  id: string;
  name: string;
  hex_code?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceStorage {
  id: string;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  product_code: string;
  device_name?: string;
  warranty: string;
  device_condition: string;
  device_type: string;
  battery_condition: string;
  price: number;
  wholesale_price?: number;
  inventory: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  device_info?: DeviceInfo | null;
  color?: Color | null;
  device_storage?: DeviceStorage | null;
  device_storage_id?: string | null;
  // Thông tin hiển thị
  deviceModel?: string;
  colorName?: string;
  storageCapacity?: number;
}

export interface ImportResult {
  total: number;
  success: number;
  updated_count: number;
  created_count: number;
  error: number;
  errors?: string[];
}

export interface ImportResponse {
  data: ImportResult;
  message: string;
  status_code: number;
  total: number | null;
  totalPages: number | null;
  pagination: any;
  user_id?: string;
  created_at: string;
  updated_at: string;
  device_info?: DeviceInfo;
  color?: Color;
}