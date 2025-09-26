import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

export interface UserSyncUrl {
  user_id: string;
  url: string;
  is_active: boolean;
}

export const userSyncUrlService = {
  get: async () => {
    return await apiGet<UserSyncUrl | null>('/sync-url');
  },
  upsert: async (url: string, is_active: boolean = true) => {
    return await apiPost<UserSyncUrl>('/sync-url', { url, is_active });
  },
  update: async (url?: string, is_active?: boolean) => {
    return await apiPut<UserSyncUrl>('/sync-url', { url, is_active });
  },
  deactivate: async () => {
    return await apiDelete<{ success: boolean }>('/sync-url');
  }
};
