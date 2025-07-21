export interface DeviceInfo {
  id: string;
  model: string;
  release_date?: string;
  screen?: string;
  chip_ram?: string;
  camera?: string;
  battery?: string;
  connectivity_os?: string;
  color_english?: string;
  dimensions_weight?: string;
  warranty?: string;
  created_at: string;
  updated_at: string;
  // Thông tin hiển thị
  deviceModel?: string;
  colorName?: string;
  storageCapacity?: number;
  // Thông tin từ API
  device_info?: DeviceInfo;
  color?: Color;
  storage?: Storage;
  product_code?: string;
}

export interface Color {
  id: string;
  name: string;
  hex_code: string;
  created_at: string;
  updated_at: string;
}

export interface Storage {
  id: string;
  device_info_id: string;
  capacity: number;
}

export interface UserDevice {
  id?: string;
  user_id?: string; // Làm cho user_id trở thành tùy chọn vì sẽ được lấy từ token ở backend
  device_info_id: string;
  color_id: string;
  storage_id: string;
  device_storage_id?: string;
  warranty?: string;
  device_condition: string;
  device_type: string;
  battery_condition?: string;
  price: number;
  inventory: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Thông tin hiển thị
  deviceModel?: string;
  colorName?: string;
  storageCapacity?: number;
  // Thông tin từ API
  device_info?: DeviceInfo;
  color?: Color;
  storage?: Storage;
  product_code?: string;
}

export interface ImportResult {
  total: number;
  success: number;
  updated_count: number;
  created_count: number;
  error: number;
}

export interface DeviceColor {
  id: string;
  device_info_id: string;
  color_id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  device_info?: DeviceInfo;
  color?: Color;
}