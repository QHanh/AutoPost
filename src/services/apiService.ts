import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.161:8000/api/v1';

interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
}

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


export const apiGet = async <T>(endpoint: string, options: ApiGetOptions = {}): Promise<any> => {
    const token = getAuthToken();
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: getAuthHeader()
    });

    if (!response.ok) {
        // Handle non-JSON responses for blob errors
        if (options.responseType === 'blob') {
            throw new Error(`Error: ${response.status}`);
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    
    if (options.responseType === 'blob') {
        return await response.blob();
    }

    return await response.json();
};

export const apiPost = async <T>(endpoint: string, data: any): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};

export const apiPostForm = async <T>(endpoint: string, formData: FormData): Promise<any> => {
    const token = getAuthToken();
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeader(true), // Pass true for FormData
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
    }

    return await response.json();
};


export const apiPut = async <T>(endpoint: string, data: any): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};

export const apiDelete = async <T>(endpoint: string): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};

export const apiPostFormData = async <T>(endpoint: string, formData: FormData): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    // Không đặt Content-Type khi gửi FormData, browser sẽ tự đặt
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
  }

  return await response.json();
};

export const apiGetBlob = async (endpoint: string): Promise<Blob> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  return await response.blob();
};

export const chatbot = async (query: string) => {
    try {
        const response = await apiClient.post('/chatbot/chatbot/chat', { 
            query,
            llm_provider: 'google_genai'
        });
        return response.data.data;
    } catch (error) {
        // Re-throw the error so it can be handled by the calling function
        throw error;
    }
};