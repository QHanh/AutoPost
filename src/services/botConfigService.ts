import { getAuthToken, getMyApiKey } from './apiService';

export type BotConfig = {
  id?: string;
  session_key: string;
  stop_minutes: number;
  created_at?: string;
  updated_at?: string;
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

async function safeText(resp: Response) {
  try { return await resp.text(); } catch { return ''; }
}

/**
 * Lấy danh sách bot configs
 */
export async function listBotConfigs(params: { limit?: number; offset?: number } = {}) {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const apiKey = (await getMyApiKey()).api_key;
  const qs = buildQuery(params as any);
  
  const resp = await fetch(`${API_BASE_URL}/api/v1/zalo/bot-configs${qs}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });
  
  if (!resp.ok) throw new Error((await safeText(resp)) || `HTTP ${resp.status}`);
  return resp.json() as Promise<{ ok?: boolean; data?: BotConfig[]; items?: BotConfig[]; count?: number }>;
}

/**
 * Lấy bot config của chính người dùng hiện tại
 */
export async function getMyBotConfig(accountId?: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const apiKey = (await getMyApiKey()).api_key;
  
  const url = `${API_BASE_URL}/api/v1/zalo/bot-configs/me${accountId ? `?account_id=${encodeURIComponent(accountId)}` : ''}`;
  const resp = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });
  
  if (!resp.ok) throw new Error((await safeText(resp)) || `HTTP ${resp.status}`);
  return resp.json() as Promise<{ ok?: boolean; data?: BotConfig }>;
}

/**
 * Tạo hoặc cập nhật bot config cho chính người dùng hiện tại
 */
export async function upsertMyBotConfig(body: { stop_minutes: number }, accountId?: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const apiKey = (await getMyApiKey()).api_key;
  
  const resp = await fetch(`${API_BASE_URL}/api/v1/zalo/bot-configs/me`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, ...(accountId ? { account_id: accountId } : {}) }),
  });
  
  if (!resp.ok) throw new Error((await safeText(resp)) || `HTTP ${resp.status}`);
  return resp.json() as Promise<{ ok?: boolean; data?: BotConfig }>;
}

export default {
  listBotConfigs,
  getMyBotConfig,
  upsertMyBotConfig,
};
