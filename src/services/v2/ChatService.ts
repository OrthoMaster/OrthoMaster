import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

export interface SendMessageResponse {
  answer: string;
  chat_conversation_id: string;
  message_id: number;
  sent_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  content: string;
  sent_at: string;
  time: string; // "HH:mm"
}

export interface ChatDayGroup {
  date: string; // "2025-03-20"
  label: string;
  messages: ChatMessage[];
}

export interface HistoryResponse {
  chat_conversation_id: string;
  title: string | null;
  data: ChatDayGroup[];
  pagination: {
    has_more: boolean;
    next_cursor: number | null;
  };
}

export interface Conversation {
  chat_conversation_id: string;
  title: string;
  last_message: string | null;
  last_at: string | null;
  created_at: string;
}

/**
 * POST /api/chatbot/ask
 * Ask and receive message
 */
export const sendMessage = async (
  query: string,
  domain: string,
  conversationId?: string | null,
): Promise<SendMessageResponse> => {
  return axiosInstance
    .post(`${baseUrl}/chatbot/ask`, {
      query,
      domain,
      chat_conversation_id: conversationId ?? undefined,
    })
    .then((response) => {
      console.log(response);
      return response.data
    })
    .catch((e: AxiosError) => {
      console.log(e);
      throw e;
    });
};

/**
 * GET /api/chatbot/history/:conversationId
 * Get conversation history
 */
export const fetchChatHistory = async (
  conversationId: string,
  cursor?: number | null,
  limit = 20,
): Promise<HistoryResponse> => {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;

  return axiosInstance
    .get(`${baseUrl}/chatbot/history/${conversationId}`, { params })
    .then((response) => response.data)
    .catch((e: AxiosError) => {
      throw e;
    });
};

/**
 * GET /api/chatbot/conversations
 * Get all conversations
 */
export const fetchConversations = async (page = 1): Promise<{
  data: Conversation[];
  pagination: { current_page: number; last_page: number; has_more: boolean };
}> => {
  return axiosInstance
    .get(`${baseUrl}/chatbot/conversations`, { params: { page } })
    .then((response) => response.data)
    .catch((e: AxiosError) => {
      throw e;
    });
};
