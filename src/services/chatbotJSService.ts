import axios from 'axios';
import { getAuthToken } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';

export interface ChatbotSettings {
  chatbot_icon_url?: string;
  chatbot_message_default?: string;
  chatbot_callout?: string;
  chatbot_name?: string;
}

export const getChatbotSettings = async (): Promise<ChatbotSettings> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/chatbot-js-agent/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    throw error;
  }
};

export const updateChatbotSettings = async (settings: ChatbotSettings): Promise<ChatbotSettings> => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API_BASE_URL}/api/v1/chatbot-js-agent/settings`,
      settings,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating chatbot settings:', error);
    throw error;
  }
};
