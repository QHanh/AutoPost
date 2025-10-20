import { apiGet, apiPost } from './apiService';

export interface FacebookAccount {
  id: string; // UUID in backend
  platform: string;
  account_name: string;
  account_id: string; // Facebook Page ID
  is_active: boolean;
  created_at?: string;
  thumbnail?: string | null;
}

export interface FBConversationItem {
  id: string;
  updated_time?: string;
  participants?: {
    data?: Array<{
      id?: string;
      name?: string;
      email?: string;
    }>;
  };
  snippet?: string;
  unread_count?: number;
}

export interface FBConversationsResponse {
  data?: FBConversationItem[];
  paging?: {
    cursors?: { before?: string; after?: string };
    previous?: string;
    next?: string;
  };
}

export interface FBMessageItem {
  id: string;
  created_time?: string;
  from?: { id?: string; name?: string; username?: string };
  to?: { data?: Array<{ id?: string; name?: string; username?: string }> };
  message?: string;
}

export interface FBConversationMessagesResponse {
  id: string; // conversation id
  messages?: {
    data?: FBMessageItem[];
    paging?: {
      cursors?: { before?: string; after?: string };
      previous?: string;
      next?: string;
    };
  };
}

export const getFacebookPages = async (): Promise<FacebookAccount[]> => {
  // Backend endpoint returns a list of FacebookResponse
  const res = await apiGet<FacebookAccount[]>(`/facebook/accounts/facebook`);
  return res;
};

export const getFBConversations = async (
  pageId: string,
  platform: 'messenger' | 'instagram' = 'messenger',
  limit = 25,
  before?: string,
  after?: string
): Promise<FBConversationsResponse> => {
  const params = new URLSearchParams({ page_id: pageId, platform, limit: String(limit) });
  if (before) params.set('before', before);
  if (after) params.set('after', after);
  return apiGet<FBConversationsResponse>(`/facebook/conversations?${params.toString()}`);
};

export const getFBConversationMessages = async (
  pageId: string,
  conversationId: string,
  limit = 20
): Promise<FBConversationMessagesResponse> => {
  const params = new URLSearchParams({ page_id: pageId, limit: String(limit) });
  return apiGet<FBConversationMessagesResponse>(`/facebook/conversations/${conversationId}/messages?${params.toString()}`);
};

export const sendFBTextMessage = async (
  pageId: string,
  psid: string,
  text: string,
) => {
  return apiPost<any>(`/messenger/messages/send`, { page_id: pageId, psid, text });
};

export const sendFBImageByUrl = async (
  pageId: string,
  psid: string,
  imageUrl: string,
) => {
  return apiPost<any>(`/messenger/messages/send`, { page_id: pageId, psid, image_url: imageUrl });
};
