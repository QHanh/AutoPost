export const deviceStorageService = {
  async getAllDeviceStorages(search: string, page: number, limit: number) {
    const token = localStorage.getItem('auth_token');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', String(page));
    params.append('limit', String(limit));
    
    console.log('Calling device-storages API with params:', params.toString());
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/device-storages/all?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        throw new Error(`Lỗi khi lấy danh sách thiết bị-dung lượng: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching device storages:', error);
      throw error;
    }
  }
};