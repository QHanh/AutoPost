export interface DeviceBrand {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceBrandCreate {
  name: string;
}

export interface DeviceBrandUpdate {
  name?: string;
}
