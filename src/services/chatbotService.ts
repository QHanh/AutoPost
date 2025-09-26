import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface ChatbotSettings {
  chatbot_icon_url?: string;
  chatbot_message_default?: string;
  chatbot_callout?: string;
  chatbot_name?: string;
}

export const getChatbotSettings = async (): Promise<ChatbotSettings> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chatbot-js-agent/settings`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    throw error;
  }
};

export const updateChatbotSettings = async (settings: ChatbotSettings): Promise<ChatbotSettings> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/chatbot-js-agent/settings`,
      settings,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating chatbot settings:', error);
    throw error;
  }
};
