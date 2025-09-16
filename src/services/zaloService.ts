import { getAuthToken } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

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
    const response = await fetch(`${API_BASE_URL}/api/v1/zalo/login-qr`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    
    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            onComplete();
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim()) {
                try {
                  const parsedData: QRResponse = JSON.parse(data);
                  onMessage(parsedData);
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                }
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

  const response = await fetch(`${API_BASE_URL}/api/v1/zalo/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
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
    can_view_all_conversations?: boolean;
    can_manage_staff?: boolean;
  };
  associated_session_keys?: string[];
}

export const listStaffZalo = async (params?: { includeInactive?: boolean; limit?: number; offset?: number }) => {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const search = new URLSearchParams();
  if (params?.includeInactive !== undefined) search.set('includeInactive', String(params.includeInactive));
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  if (params?.offset !== undefined) search.set('offset', String(params.offset));

  const resp = await fetch(`${API_BASE_URL}/api/v1/staffzalo${search.toString() ? `?${search}` : ''}` , {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error((await resp.text()) || `HTTP ${resp.status}`);
  return resp.json();
};

export const createStaffZalo = async (payload: CreateStaffPayload) => {
  const token = getAuthToken();
  if (!token) throw new Error('Không tìm thấy token xác thực');
  const resp = await fetch(`${API_BASE_URL}/api/v1/staffzalo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
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
  const resp = await fetch(`${API_BASE_URL}/api/v1/staffzalo/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error((await resp.text()) || `HTTP ${resp.status}`);
  return resp.json();
};

export const logoutZalo = async (): Promise<any> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Không tìm thấy token xác thực');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/zalo/logout`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
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

export const getZaloConversations = async (): Promise<{ items: ZaloConversation[]; count: number }> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Không tìm thấy token xác thực');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/zalo/conversations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
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
  order: string = 'asc'
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

  const response = await fetch(`${API_BASE_URL}/api/v1/zalo/messages?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};
