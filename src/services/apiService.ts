const API_BASE_URL = 'http://localhost:8000/api/v1';

interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const getAuthHeader = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const apiGet = async <T>(endpoint: string): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getAuthHeader()
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Error: ${response.status}`);
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

// Device Color Service
export const getAllDeviceColors = async (skip = 0, limit = 20, search = '') => {
  let url = `/device-colors?skip=${skip}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  return await apiGet(url);
};

export const createDeviceColor = async (data: { device_info_id: string; color_id: string }) => {
  return await apiPost('/device-colors', data);
};

export const deleteDeviceColor = async (deviceColorId: string) => {
  return await apiDelete(`/device-colors/${deviceColorId}`);
};