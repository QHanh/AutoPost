import { getAuthToken } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

export interface FaqItem {
  faq_id: string;
  classification: string;
  question: string;
  answer: string;
  customer_id: string;
  image?: string; // Comma-separated image URLs
}

export interface FaqCreate {
  classification: string;
  question: string;
  answer: string;
  images?: File[]; // Array of files for multiple images
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/**
 * Service xử lý các thao tác liên quan đến FAQ Mobile
 */
export const faqMobileService = {
  /**
   * Lấy tất cả FAQs của user hiện tại
   */
  async getAllFaqs(): Promise<FaqItem[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/mobile-faqs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch FAQs');
    }

    const result: ApiResponse<FaqItem[]> = await response.json();
    return result.data || [];
  },

  /**
   * Thêm FAQ mới
   */
  async addFaq(faqData: FaqCreate): Promise<any> {
    const token = getAuthToken();
    const formData = new FormData();
    
    // Add faq_data as JSON string
    const faqJson = {
      classification: faqData.classification,
      question: faqData.question,
      answer: faqData.answer
    };
    formData.append('faq_data', JSON.stringify(faqJson));
    
    // Add files if provided
    if (faqData.images && faqData.images.length > 0) {
      faqData.images.forEach((file, index) => {
        formData.append('files', file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/mobile-faq`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to add FAQ');
    }

    return await response.json();
  },

  /**
   * Cập nhật FAQ
   */
  async updateFaq(faqId: string, faqData: FaqCreate): Promise<any> {
    const token = getAuthToken();
    const formData = new FormData();
    
    // Add faq_data as JSON string
    const faqJson = {
      classification: faqData.classification,
      question: faqData.question,
      answer: faqData.answer
    };
    formData.append('faq_data', JSON.stringify(faqJson));
    
    // Add files if provided
    if (faqData.images && faqData.images.length > 0) {
      faqData.images.forEach((file, index) => {
        formData.append('files', file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/mobile-faq/${faqId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update FAQ');
    }

    return await response.json();
  },

  /**
   * Xóa FAQ
   */
  async deleteFaq(faqId: string): Promise<any> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/mobile-faq/${faqId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete FAQ');
    }

    return await response.json();
  },

  /**
   * Xóa tất cả FAQs
   */
  async deleteAllFaqs(): Promise<any> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/mobile-faqs`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete all FAQs');
    }

    return await response.json();
  },

  /**
   * Import FAQ từ file Excel
   */
  async importFaqFromFile(file: File): Promise<any> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/v1/mobile-faq/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to import FAQ');
    }

    return await response.json();
  },

  /**
   * Export FAQ ra file Excel
   */
  async exportFaqToExcel(): Promise<Blob> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/mobile-faq/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to export FAQ');
    }

    return await response.blob();
  },
};
