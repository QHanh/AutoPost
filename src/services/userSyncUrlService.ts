import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

export interface UserSyncUrl {
  user_id: string;
  url: string;
  is_active: boolean;
  type_url?: 'device' | 'component' | 'service' | string;
  url_today?: string | null;
}

export const userSyncUrlService = {
  get: async () => {
    return await apiGet<UserSyncUrl | null>('/sync-url');
  },
  upsert: async (url: string, is_active: boolean = true, type_url?: string, url_today?: string) => {
    return await apiPost<UserSyncUrl>('/sync-url', { url, is_active, type_url, url_today });
  },
  update: async (url?: string, is_active?: boolean, type_url?: string, url_today?: string) => {
    return await apiPut<UserSyncUrl>('/sync-url', { url, is_active, type_url, url_today });
  },
  deactivate: async () => {
    return await apiDelete<{ success: boolean }>('/sync-url');
  },
  syncDevices: async (updated_today: boolean = false) => {
    const qs = updated_today ? '?updated_today=true' : '';
    return await apiPost<unknown>(`/sync-url/sync-devices${qs}`, {});
  }
};
