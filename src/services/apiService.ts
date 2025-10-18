import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';


interface ApiGetOptions extends RequestInit {
  responseType?: 'blob' | 'json';
}

const apiClient = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getAuthToken = () => {
    return localStorage.getItem('auth_token');
};

// Helper function to handle token expiry
const handleTokenExpiry = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    window.location.href = '/login';
};

apiClient.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized - token expired
        if (error.response && error.response.status === 401) {
            handleTokenExpiry();
            return Promise.reject(new Error('Token đã hết hạn. Vui lòng đăng nhập lại.'));
        }
        
        // If there's a response with error details, pass them through
        if (error.response && error.response.data && error.response.data.detail) {
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);

export const getAuthHeader = (isFormData = false): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};


export const apiGet = async <T>(endpoint: string, options: ApiGetOptions = {}): Promise<T> => {
    const token = getAuthToken();
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
        ...options,
        headers: getAuthHeader()
    });

    if (!response.ok) {
        // Handle 401 Unauthorized - token expired
        if (response.status === 401) {
            handleTokenExpiry();
            throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
        }
        
        // Handle non-JSON responses for blob errors
        if (options.responseType === 'blob') {
            throw new Error(`Error: ${response.status}`);
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    
    if (options.responseType === 'blob') {
        return await response.blob() as T;
    }

    return await response.json();
};

export const apiPost = async <T>(endpoint: string, data: any): Promise<T> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      handleTokenExpiry();
      throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};

export const apiPostForm = async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const token = getAuthToken();
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
        method: 'POST',
        headers: getAuthHeader(true), // Pass true for FormData
        body: formData
    });

    if (!response.ok) {
        // Handle 401 Unauthorized - token expired
        if (response.status === 401) {
            handleTokenExpiry();
            throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
    }

    return await response.json();
};


export const apiPut = async <T>(endpoint: string, data: any): Promise<T> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      handleTokenExpiry();
      throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};

export const apiDelete = async <T>(endpoint: string, data?: any): Promise<T> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const config: RequestInit = {
    method: 'DELETE',
    headers: getAuthHeader(),
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config);

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      handleTokenExpiry();
      throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  // Handle 204 No Content (successful deletion with no response body)
  if (response.status === 204) {
    return { success: true, message: 'Deleted successfully' } as T;
  }

  // For other successful responses, try to parse JSON
  try {
    return await response.json();
  } catch (error) {
    // If response is empty or not JSON, return success
    return { success: true } as T;
  }
};

export const apiPostFormData = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    // Không đặt Content-Type khi gửi FormData, browser sẽ tự đặt
  };

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      handleTokenExpiry();
      throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};

export const apiGetBlob = async (endpoint: string): Promise<Blob> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      handleTokenExpiry();
      throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    throw new Error(`Error: ${response.status}`);
  }

  return await response.blob();
};

export const apiPostAndGetBlob = async (endpoint: string, data: any): Promise<Blob> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      handleTokenExpiry();
      throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    throw new Error(`Error: ${response.status}`);
  }

  return await response.blob();
};

export const chatbotStream = async (
  query: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  extra?: { image_url?: string; image_base64?: string; thread_id?: string; llm_provider?: 'google_genai' | 'openai' }
) => {
  const token = getAuthToken();
  if (!token) {
    onError(new Error('Unauthorized'));
    return;
  }

  try {
    const body: any = {
      query,
      llm_provider: extra?.llm_provider ?? 'google_genai',
      stream: true,
    };
    if (extra?.image_url) body.image_url = extra.image_url;
    if (extra?.image_base64) body.image_base64 = extra.image_base64;
    if (extra?.thread_id) body.thread_id = extra.thread_id;

    const response = await fetch(`${API_BASE_URL}/api/v1/chatbot/chat`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        handleTokenExpiry();
        throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
      }
      
      let errorText = `Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorText = errorData.detail || errorText;
      } catch (e) {
        // Ignore if response is not JSON
      }
      throw new Error(errorText);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const read = async () => {
      try {
        const { done, value } = await reader.read();
        if (done) {
          onComplete();
          return;
        }
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
        await read();
      } catch (streamError) {
        onError(streamError as Error);
      }
    };

    await read();
  } catch (error: any) {
    onError(error);
  }
};

export const chatbot = async (query: string) => {
    try {
        const response = await apiClient.post('/chatbot/chat', { 
            query,
            llm_provider: 'google_genai'
        });
        return response.data.data;
    } catch (error) {
        // Re-throw the error so it can be handled by the calling function
        throw error;
    }
};

export const resetChatbotHistory = async () => {
    try {
        const response = await apiClient.post('/chatbot/clear-history-chat', {});
        return response.data;
    } catch (error) {
        console.error("Error resetting chatbot history:", error);
        throw error;
    }
};

// --- Chatbot Subscription and API Key Services ---

export const getMyApiKey = async (): Promise<{ api_key: string; scopes: string[]; is_active: boolean }> => {
    try {
        const response = await apiClient.get('/chatbot-subscriptions/my-api-key');
        return response.data;
    } catch (error) {
        console.error("Error fetching API key:", error);
        throw error;
    }
};

export const regenerateMyApiKey = async (): Promise<{ api_key: string; scopes: string[]; is_active: boolean }> => {
    try {
        const response = await apiClient.post('/chatbot-subscriptions/my-api-key/regenerate');
        return response.data;
    } catch (error) {
        console.error("Error regenerating API key:", error);
        throw error;
    }
};