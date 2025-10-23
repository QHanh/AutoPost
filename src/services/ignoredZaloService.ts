import { getAuthToken, getMyApiKey } from './apiService';

export type IgnoredConversation = {
  id: string;
  session_key: string;
  user_id?: string | null;
  thread_id: string;
  name?: string | null;
  created_at: string;
  updated_at: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

function buildQuery(params: Record<string, any>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function listIgnoredZalo(params: { thread_id?: string; user_id?: string; limit?: number; offset?: number; account_id?: string } = {}) {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const apiKey = (await getMyApiKey()).api_key;
  const qs = buildQuery(params as any);
  const resp = await fetch(`${API_BASE_URL}/api/v1/zalo/ignored-conversations${qs}` , {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });
  if (!resp.ok) throw new Error((await safeText(resp)) || `HTTP ${resp.status}`);
  return resp.json() as Promise<{ ok?: boolean; data?: IgnoredConversation[]; items?: IgnoredConversation[]; count?: number }>;
}

export async function upsertIgnoredZalo(body: { thread_id: string; name?: string; user_id?: string; account_id: string }) {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const apiKey = (await getMyApiKey()).api_key;
  const resp = await fetch(`${API_BASE_URL}/api/v1/zalo/ignored-conversations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error((await safeText(resp)) || `HTTP ${resp.status}`);
  return resp.json() as Promise<{ ok?: boolean; data?: IgnoredConversation }>;
}

export async function deleteIgnoredZalo(id: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const apiKey = (await getMyApiKey()).api_key;
  const resp = await fetch(`${API_BASE_URL}/api/v1/zalo/ignored-conversations/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
    },
  });
  if (!resp.ok) throw new Error((await safeText(resp)) || `HTTP ${resp.status}`);
  try {
    return await resp.json();
  } catch {
    return { ok: true } as any;
  }
}

async function safeText(resp: Response) {
  try { return await resp.text(); } catch { return ''; }
}

export default {
  listIgnoredZalo,
  upsertIgnoredZalo,
  deleteIgnoredZalo,
};
