import { apiGet, apiPost, apiDelete, getAuthHeader, apiPostFormData } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

export interface OaAccountItem {
  id: string;
  oa_id: string;
  name?: string;
  picture_url?: string;
  status?: string;
  connected_at?: string | null;
}

export interface OaConversationItem {
  id: string;
  conversation_id: string;
  display_name?: string;
  type?: string;
  last_message_at?: string | null;
  is_ignored: boolean;
  is_blocked: boolean;
}

export interface OaMessageItem {
  id: string;
  direction: 'in' | 'out';
  msg_type?: string;
  text?: string | null;
  attachments?: { type: 'photo'; url?: string; thumb?: string; description?: string } | undefined;
  timestamp?: string | null;
  message_id_from_zalo?: string | null;
  delivery_status?: string | null;
}

// Zalo OpenAPI conversation response typings
export interface ZaloOpenApiMessageItem {
  src: number; // 0: OA -> user, 1: user -> OA
  time: number;
  type?: string;
  message?: string;
  message_id?: string;
  from_id?: string | number;
  to_id?: string | number;
  from_display_name?: string;
  from_avatar?: string;
  to_display_name?: string;
  to_avatar?: string;
  links?: string[];
  thumb?: string;
  url?: string;
  description?: string;
  location?: string;
}

export interface ZaloOpenApiConversationResponse {
  data?: ZaloOpenApiMessageItem[];
  error?: number;
  message?: string;
}

export interface ZaloOpenApiRecentChatResponse {
  data?: ZaloOpenApiMessageItem[];
  error?: number;
  message?: string;
}

export type ResponseModel<T> = {
  data?: T;
  message?: string;
  status_code?: number;
  total?: number;
  totalPages?: number;
  pagination?: Record<string, unknown>;
};

export const listOaAccounts = async (): Promise<{ data: OaAccountItem[]; total: number }> => {
  const res = await apiGet<ResponseModel<OaAccountItem[]>>('/zalo-oa/accounts');
  return { data: res.data ?? [], total: res.total ?? 0 };
};

export const getOaLoginUrl = async (): Promise<string> => {
  type LoginResponse = { ok?: boolean; auth_url?: string; state?: string };
  const res = await apiGet<LoginResponse>('/zalo-oa/auth/login?return_url=true');
  if (!res?.auth_url) throw new Error('Không lấy được đường dẫn đăng nhập OA');
  return res.auth_url;
};

export const listOaConversations = async (
  account_id: string,
  params?: { limit?: number; offset?: number; search?: string }
): Promise<{ data: OaConversationItem[]; total: number }> => {
  // Use OpenAPI recent chats endpoint instead of internal DB list.
  const qs = new URLSearchParams();
  qs.set('account_id', account_id);
  // OpenAPI supports offset/count with max 10; fall back to 10 if larger
  const count = params?.limit && params.limit > 0 ? Math.min(params.limit, 10) : 10;
  const offset = params?.offset && params.offset > 0 ? params.offset : 0;
  qs.set('offset', String(offset));
  qs.set('count', String(count));
  const res = await apiGet<ResponseModel<ZaloOpenApiRecentChatResponse>>(`/zalo-oa/openapi/listrecentchat?${qs.toString()}`);
  const raw: ZaloOpenApiRecentChatResponse = res.data ?? {};
  const items: ZaloOpenApiMessageItem[] = Array.isArray(raw.data) ? raw.data : [];
  let mapped: OaConversationItem[] = items.map((m) => {
    const userId = m.src === 0 ? m.to_id : m.from_id;
    const displayName = m.src === 0 ? m.to_display_name : m.from_display_name;
    return {
      id: String(userId),
      conversation_id: String(userId),
      display_name: displayName || String(userId),
      type: 'peer',
      last_message_at: m.time ? new Date(Number(m.time)).toISOString() : null,
      is_ignored: false,
      is_blocked: false,
    };
  });
  const q = (params?.search || '').trim().toLowerCase();
  if (q) {
    mapped = mapped.filter(it =>
      (it.display_name || '').toLowerCase().includes(q) ||
      (it.conversation_id || '').toLowerCase().includes(q)
    );
  }
  return { data: mapped, total: mapped.length };
};

export const listOaMessages = async (
  account_id: string,
  conversation_id: string,
  params?: { limit?: number; offset?: number; order?: 'asc' | 'desc' }
): Promise<{ data: OaMessageItem[]; total: number }> => {
  const search = new URLSearchParams();
  search.set('account_id', account_id);
  search.set('conversation_id', conversation_id);
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));
  if (params?.order) search.set('order', params.order);
  const res = await apiGet<ResponseModel<OaMessageItem[]>>(`/zalo-oa/messages?${search.toString()}`);
  return { data: res.data ?? [], total: res.total ?? 0 };
};

export const refreshOaToken = async (account_id: string) => {
  return apiPost<ResponseModel<{ account_id: string }>>('/zalo-oa/token/refresh', { account_id });
};

export const sendOaTextMessage = async (account_id: string, to_user_id: string, text: string) => {
  return apiPost<ResponseModel<unknown>>('/zalo-oa/messages/send', { account_id, to_user_id, text });
};

export const uploadOaImage = async (
  account_id: string,
  file: File,
): Promise<ResponseModel<{ attachment_id: string }>> => {
  const form = new FormData();
  form.append('account_id', account_id);
  form.append('file', file);
  return apiPostFormData<ResponseModel<{ attachment_id: string }>>('/zalo-oa/messages/upload-image', form);
};

export const sendOaImageMessage = async (
  account_id: string,
  to_user_id: string,
  attachment_id: string,
) => {
  return apiPost<ResponseModel<unknown>>('/zalo-oa/messages/send-image', { account_id, to_user_id, attachment_id });
};

export const getOaMe = async (account_id: string) => {
  const search = new URLSearchParams();
  search.set('account_id', account_id);
  return apiGet<ResponseModel<unknown>>(`/zalo-oa/me?${search.toString()}`);
};

export const patchOaConversation = async (conv_id: string, body: Partial<{ is_ignored: boolean; is_blocked: boolean }>) => {
  const headers = getAuthHeader();
  const resp = await fetch(`${API_BASE_URL}/api/v1/zalo-oa/conversations/${conv_id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(err || `HTTP ${resp.status}`);
  }
  return resp.json() as Promise<ResponseModel<{ id: string }>>;
};

export const deleteOaAccount = async (account_id: string) => {
  return apiDelete<ResponseModel<{ id: string }>>(`/zalo-oa/accounts/${account_id}`);
};

export const getOaConversationOpenApi = async (
  account_id: string,
  user_id: string,
  params?: { offset?: number; count?: number }
): Promise<{ data: OaMessageItem[] }> => {
  const search = new URLSearchParams();
  search.set('account_id', account_id);
  search.set('user_id', user_id);
  if (params?.offset !== undefined) search.set('offset', String(params.offset));
  if (params?.count !== undefined) search.set('count', String(params.count));
  const res = await apiGet<ResponseModel<ZaloOpenApiConversationResponse>>(`/zalo-oa/openapi/conversation?${search.toString()}`);
  const raw: ZaloOpenApiConversationResponse = res.data ?? {};
  const items: ZaloOpenApiMessageItem[] = Array.isArray(raw.data) ? raw.data : [];
  // Ensure ascending order (oldest -> newest) so newest shows at bottom
  items.sort((a, b) => Number(a.time || 0) - Number(b.time || 0));
  const mapped: OaMessageItem[] = items.map((m) => ({
    id: String(m.message_id ?? m.time ?? Math.random()),
    direction: m.src === 0 ? 'out' : 'in',
    msg_type: m.type,
    text: typeof m.message === 'string' ? m.message : '',
    attachments: m.type === 'photo' ? { type: 'photo', url: m.url, thumb: m.thumb, description: m.description } : undefined,
    timestamp: m.time ? new Date(Number(m.time)).toISOString() : null,
    message_id_from_zalo: m.message_id ?? null,
    delivery_status: undefined,
  }));
  return { data: mapped };
};

export const getOaRecentChatsOpenApi = async (
  account_id: string,
  params?: { offset?: number; count?: number }
): Promise<{ data: OaConversationItem[] }> => {
  const search = new URLSearchParams();
  search.set('account_id', account_id);
  if (params?.offset !== undefined) search.set('offset', String(params.offset));
  if (params?.count !== undefined) search.set('count', String(params.count));
  const res = await apiGet<ResponseModel<ZaloOpenApiRecentChatResponse>>(`/zalo-oa/openapi/listrecentchat?${search.toString()}`);
  const raw: ZaloOpenApiRecentChatResponse = res.data ?? {};
  const items: ZaloOpenApiMessageItem[] = Array.isArray(raw.data) ? raw.data : [];
  const mapped: OaConversationItem[] = items.map((m) => {
    const userId = m.src === 0 ? m.to_id : m.from_id;
    const displayName = m.src === 0 ? m.to_display_name : m.from_display_name;
    return {
      id: String(userId),
      conversation_id: String(userId),
      display_name: displayName || String(userId),
      type: 'peer',
      last_message_at: m.time ? new Date(Number(m.time)).toISOString() : null,
      is_ignored: false,
      is_blocked: false,
    };
  });
  return { data: mapped };
};

// -------- Blocked Users (per OA account) --------
export interface OaBlockedUserItem {
  id: string;
  blocked_user_id: string;
  note?: string;
  created_at?: string | null;
}

export const listBlockedUsers = async (
  account_id: string,
): Promise<{ data: OaBlockedUserItem[]; total: number }> => {
  const search = new URLSearchParams();
  search.set('account_id', account_id);
  const res = await apiGet<ResponseModel<OaBlockedUserItem[]>>(`/zalo-oa/blocked-users?${search.toString()}`);
  return { data: res.data ?? [], total: res.total ?? 0 };
};

export const createBlockedUser = async (
  account_id: string,
  blocked_user_id: string,
  note?: string,
): Promise<ResponseModel<{ id: string }>> => {
  return apiPost<ResponseModel<{ id: string }>>('/zalo-oa/blocked-users', {
    account_id,
    blocked_user_id,
    note,
  });
};

export const deleteBlockedUser = async (blocked_id: string): Promise<ResponseModel<{ id: string }>> => {
  return apiDelete<ResponseModel<{ id: string }>>(`/zalo-oa/blocked-users/${blocked_id}`);
};
