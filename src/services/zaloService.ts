import { getAuthToken } from './apiService';
import { getMyApiKey } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

// Luôn gọi API để lấy API Key thay vì lấy từ localStorage
const fetchApiKey = async (): Promise<string> => {
  const info = await getMyApiKey();
  if (!info?.api_key) throw new Error('Không tìm thấy API Key');
  if (info.is_active === false) throw new Error('API Key đã bị vô hiệu hóa');
  return info.api_key;
};

export interface ZaloSessionInfo {
  id: string;
  session_key: string;
  account_id: string | null;
  display_name: string | null;
  is_active: boolean;
  updated_at: string;
  chatbot_priority?: string | null;
}

export const getZaloSessions = async (): Promise<{ ok?: boolean; items: ZaloSessionInfo[] }> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Không tìm thấy token xác thực');
  }

  const apiKey = await fetchApiKey();
  const resp = await fetch(`${API_BASE_URL}/api/v1/zalo/sessions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });
  if (!resp.ok) {
    const errorData = await resp.json();
    throw new Error(errorData.detail || `HTTP ${resp.status}`);
  }
  return resp.json();
}

export interface QRResponse {
  type: string;
  data?: {
    image?: string;
    code?: string;
    token?: string;
    options?: {
      enabledMultiLayer: boolean;
      enabledCheckOCR: boolean;
    };
  };
  ok?: boolean;
  uid?: string;
  session_key?: string;
  error?: string;
}

export const zaloLoginQRStream = async (
  onMessage: (data: QRResponse) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<void> => {
  const token = getAuthToken();
  if (!token) {
    onError(new Error('Không tìm thấy token xác thực'));
    return;
  }

  try {
    const apiKey = await fetchApiKey();
    const response = await fetch(`${API_BASE_URL}/api/v1/zalo/login-qr`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Không thể đọc response stream');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            onComplete();
            break;
          }

          // Accumulate decoded text into buffer
          buffer += decoder.decode(value, { stream: true });

          // Normalize CRLF to LF to simplify parsing
          buffer = buffer.replace(/\r\n/g, '\n');

          // Split by SSE event delimiter (blank line)
          const events = buffer.split('\n\n');
          // Keep the last partial segment in buffer
          buffer = events.pop() || '';

          for (const evt of events) {
            if (!evt) continue;

            const evtLines = evt.split('\n');
            let dataPayload = '';

            for (let rawLine of evtLines) {
              // Remove any stray CR
              const line = rawLine.replace(/\r/g, '');
              if (line.startsWith('data:')) {
                // Strip leading 'data:' and one optional space per SSE spec
                const part = line.replace(/^data:\s?/, '');
                dataPayload += part + '\n';
              }
              // Ignore other SSE fields: event:, id:, retry:
            }

            if (dataPayload) {
              // Remove trailing newline added during join
              const jsonStr = dataPayload.endsWith('\n') ? dataPayload.slice(0, -1) : dataPayload;
              try {
                const parsedData: QRResponse = JSON.parse(jsonStr);
                onMessage(parsedData);
              } catch (parseError) {
                // Log and continue reading further chunks
                console.error('Error parsing SSE data chunk:', parseError);
              }
            }
          }
        }
      } catch (error) {
        onError(error as Error);
      }
    };

    await readStream();

  } catch (error) {
    onError(error as Error);
  }
};

export const getZaloStatus = async (): Promise<any> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Không tìm thấy token xác thực');
  }

  const apiKey = await fetchApiKey();
  const response = await fetch(`${API_BASE_URL}/api/v1/zalo/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};

export const sendZaloImageFile = async (
  threadId: string,
  file: File,
  message?: string,
  accountId?: string
): Promise<{ ok: boolean; data?: any; thread_id?: string }> => {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  if (!threadId || !String(threadId).trim()) throw new Error('Thiếu thread_id');
  if (!file) throw new Error('Thiếu file ảnh');

  const apiKey = await fetchApiKey();
  const form = new FormData();
  form.set('thread_id', String(threadId));
  if (message && message.trim()) form.set('message', message.trim());
  form.set('image', file, file.name);
  if (accountId && accountId.trim()) form.set('account_id', accountId.trim());

  const resp = await fetch(`${API_BASE_URL}/api/v1/zalo/send-image-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      // 'Content-Type' not set so browser sets correct multipart boundary
    } as any,
    body: form,
  });
  if (!resp.ok) {
    if (resp.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
    }
    let errorText = `Error: ${resp.status}`;
    try { const errorData = await resp.json(); errorText = errorData.detail || errorText; } catch {}
    throw new Error(errorText);
  }
  return resp.json();
};

export const sendZaloImageMessage = async (
  threadId: string,
  opts: { image_url?: string; file_path?: string; message?: string; account_id?: string }
): Promise<{ ok: boolean; data?: any; thread_id?: string }> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Không tìm thấy token xác thực');
  }
  if (!threadId || !String(threadId).trim()) {
    throw new Error('Thiếu thread_id');
  }
  if ((!opts?.image_url || !String(opts.image_url).trim()) && (!opts?.file_path || !String(opts.file_path).trim())) {
    throw new Error('Thiếu image_url hoặc file_path');
  }

  const apiKey = await fetchApiKey();
  const response = await fetch(`${API_BASE_URL}/api/v1/zalo/send-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ thread_id: String(threadId), ...opts }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
    }
    let errorText = `Error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorText = errorData.detail || errorText;
    } catch {}
    throw new Error(errorText);
  }

  return await response.json();
};

export const sendZaloTextMessage = async (
  threadId: string,
  message: string,
  accountId?: string,
): Promise<{ ok: boolean; data?: any; thread_id?: string }> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Không tìm thấy token xác thực');
  }
  if (!threadId || !String(threadId).trim()) {
    throw new Error('Thiếu thread_id');
  }
  if (!message || !String(message).trim()) {
    throw new Error('Thiếu nội dung tin nhắn');
  }

  const apiKey = await fetchApiKey();
  const response = await fetch(`${API_BASE_URL}/api/v1/zalo/send-message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ thread_id: String(threadId), message: String(message), ...(accountId ? { account_id: accountId } : {}) }),
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      // Reuse apiService token expiry behavior by mimicking
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
    }
    let errorText = `Error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorText = errorData.detail || errorText;
    } catch {}
    throw new Error(errorText);
  }

  return await response.json();
};

// -------- Staff Zalo helpers --------
export interface CreateStaffPayload {
  zalo_uid: string;
  name: string;
  role?: 'admin' | 'staff' | 'viewer';
  permissions?: {
    can_control_bot?: boolean;
    can_manage_orders?: boolean;
    can_receive_notifications?: boolean;
  };
  associated_session_keys?: string[];
  owner_account_id?: string;
}

export const listStaffZalo = async (params?: { includeInactive?: boolean; limit?: number; offset?: number; accountId?: string }) => {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const apiKey = await fetchApiKey();
  const search = new URLSearchParams();
  if (params?.includeInactive !== undefined) search.set('includeInactive', String(params.includeInactive));
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  if (params?.offset !== undefined) search.set('offset', String(params.offset));
  if (params?.accountId) search.set('account_id', String(params.accountId));

  const resp = await fetch(`${API_BASE_URL}/api/v1/staffzalo${search.toString() ? `?${search}` : ''}` , {
    headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': apiKey },
  });
  if (!resp.ok) throw new Error((await resp.text()) || `HTTP ${resp.status}`);
  return resp.json();
};

export const createStaffZalo = async (payload: CreateStaffPayload) => {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const apiKey = await fetchApiKey();
  const resp = await fetch(`${API_BASE_URL}/api/v1/staffzalo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error((await resp.text()) || `HTTP ${resp.status}`);
  return resp.json();
};

export const deleteStaffZalo = async (id: string) => {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const apiKey = await fetchApiKey();
  const resp = await fetch(`${API_BASE_URL}/api/v1/staffzalo/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': apiKey },
  });
  if (!resp.ok) throw new Error((await resp.text()) || `HTTP ${resp.status}`);
  return resp.json();
};

// Update staff (permissions, role, name, is_active, etc.)
export const updateStaffZalo = async (
  id: string,
  payload: Partial<{
    name: string;
    role: 'admin' | 'staff' | 'viewer';
    is_active: boolean;
    can_control_bot: boolean;
    can_manage_orders: boolean;
    can_receive_notifications: boolean;
    associated_session_keys: string[];
  }>
) => {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const apiKey = await fetchApiKey();
  // Transform flat permission flags into nested `permissions` object as backend expects
  const { can_control_bot, can_manage_orders, can_receive_notifications, ...rest } = (payload || {}) as any;
  const body: any = { ...rest };
  const permissions: any = {};
  if (typeof can_control_bot === 'boolean') permissions.can_control_bot = can_control_bot;
  if (typeof can_manage_orders === 'boolean') permissions.can_manage_orders = can_manage_orders;
  if (typeof can_receive_notifications === 'boolean') permissions.can_receive_notifications = can_receive_notifications;
  if (Object.keys(permissions).length > 0) body.permissions = permissions;

  const resp = await fetch(`${API_BASE_URL}/api/v1/staffzalo/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error((await resp.text()) || `HTTP ${resp.status}`);
  return resp.json();
};

export const logoutZalo = async (accountId?: string): Promise<any> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Không tìm thấy token xác thực');
  }

  const apiKey = await fetchApiKey();
  const url = `${API_BASE_URL}/api/v1/zalo/logout${accountId ? `?account_id=${encodeURIComponent(accountId)}` : ''}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};

export interface ZaloConversation {
  conversation_id: string;
  thread_id?: string;
  peer_id?: string;
  d_name?: string;
  group_name?: string;
  last_content?: string;
  last_ts?: number | string;
  last_created_at?: string; // ISO timestamp from backend
  type?: number;
}

export interface ZaloMessage {
  id: string;
  content: string;
  is_self: boolean;
  d_name?: string;
  uid_from?: string;
  ts?: number | string; // may arrive as string ms
  created_at?: string;
  quote?: any;
  mentions?: any;
}

export const getZaloConversations = async (accountId?: string): Promise<{ items: ZaloConversation[]; count: number }> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Không tìm thấy token xác thực');
  }

  const apiKey = await fetchApiKey();
  const url = `${API_BASE_URL}/api/v1/zalo/conversations${accountId ? `?account_id=${encodeURIComponent(accountId)}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};

export const getZaloMessages = async (
  threadId?: string,
  peerId?: string,
  limit: number = 50,
  order: string = 'asc',
  accountId?: string,
): Promise<{ items: ZaloMessage[]; count: number; conversation_id?: string }> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Không tìm thấy token xác thực');
  }

  if (!threadId && !peerId) {
    throw new Error('Cần cung cấp thread_id hoặc peer_id');
  }

  const params = new URLSearchParams({
    limit: limit.toString(),
    order: order
  });

  if (threadId) {
    params.set('thread_id', threadId);
  }
  if (peerId) {
    params.set('peer_id', peerId);
  }

  if (accountId) params.set('account_id', accountId);
  const response = await fetch(`${API_BASE_URL}/api/v1/zalo/messages?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-Key': await fetchApiKey(),
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};
