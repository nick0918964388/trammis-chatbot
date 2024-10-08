import axios from 'axios';

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  image?: string;
}

const API_BASE_URL = '/api'; // 根据您的实际 API 地址进行调整

export const chatService = {
  saveChatHistory: async (chatHistory: ChatHistory): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/chat-history`, chatHistory);
    } catch (error) {
      console.error('保存聊天历史时出错:', error);
      throw error;
    }
  },

  getChatHistory: async (chatId: string): Promise<ChatHistory> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat-history/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('获取聊天历史时出错:', error);
      throw error;
    }
  },

  getAllChatHistories: async (): Promise<ChatHistory[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat-histories`);
      return response.data;
    } catch (error) {
      console.error('获取所有聊天历史时出错:', error);
      throw error;
    }
  }
};