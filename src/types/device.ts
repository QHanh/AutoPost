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
  description?: string;
  image_url?: string;
  name?: string;
  brand?: string;
  created_at: string;
  updated_at: string;
}

export interface Color {
  id: string;
  name: string;
  hex_code?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceColor {
  id: string;
  device_info_id: string;
  color_id: string;
  color?: Color;
  device_info?: DeviceInfo;
  created_at: string;
  updated_at: string;
}

export interface Storage {
  id: string;
  capacity: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceStorage {
  id: string;
  device_info_id: string;
  storage_id: string;
  storage?: Storage;
  device_info?: DeviceInfo;
  created_at: string;
  updated_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_info_id: string;
  color_id: string;
  storage_id: string;
  warranty: string;
  device_condition: string;
  device_type: string;
  battery_condition?: string;
  price: number;
  inventory: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  device_info?: DeviceInfo;
  color?: Color;
  storage?: Storage;
}

export interface DeviceFilter {
  search?: string;
  brand?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DevicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DeviceInfoResponse {
  devices: DeviceInfo[];
  pagination: DevicePagination;
}

export interface ColorResponse {
  colors: Color[];
  pagination: DevicePagination;
}

export interface StorageResponse {
  storages: Storage[];
  pagination: DevicePagination;
}

export interface DeviceColorResponse {
  deviceColors: DeviceColor[];
  pagination: DevicePagination;
}

export interface DeviceStorageResponse {
  deviceStorages: DeviceStorage[];
  pagination: DevicePagination;
}

export interface UserDeviceResponse {
  userDevices: UserDevice[];
  pagination: DevicePagination;
}