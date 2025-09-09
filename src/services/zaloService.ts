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
