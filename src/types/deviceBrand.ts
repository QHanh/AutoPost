export interface DeviceBrand {
    id: string;
    name: string;
    warranty?: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export type DeviceBrandCreate = Omit<DeviceBrand, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export type DeviceBrandUpdate = Partial<DeviceBrandCreate>;
