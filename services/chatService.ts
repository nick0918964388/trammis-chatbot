import axios from 'axios';

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  messages: Message[];
  user_id: string; // 新增用户ID字段
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  image?: string;
}

const API_BASE_URL = 'http://traapi1.mas4dev.xyz:8000/api'; // 根据您的实际 API 地址进行调整

export const chatService = {
  saveChatHistory: async (chatHistory: ChatHistoryCreate): Promise<ChatHistory> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat-history`, chatHistory);
      return response.data;
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

  getAllChatHistories: async (userId: string): Promise<ChatHistory[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/${userId}/chat-histories`);
      return response.data.chat_histories;
    } catch (error) {
      console.error('获取所有聊天历史时出错:', error);
      throw error;
    }
  },

  appendMessageToChat: async (chatId: string, message: MessageAppend): Promise<ChatHistory> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/chat-history/${chatId}`, { message });
      return response.data;
    } catch (error) {
      console.error('向聊天添加消息时出错:', error);
      throw error;
    }
  },

  deleteChatHistory: async (chatId: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/chat-history/${chatId}`);
    } catch (error) {
      console.error('删除聊天历史时出错:', error);
      throw error;
    }
  }
};

// 新增接口定义
interface ChatHistoryCreate {
  title: string;
  messages: Message[];
  user_id: string; // 新增用户ID字段
}

// 新增接口定义
interface MessageAppend {
  content: string;
  sender: 'user' | 'ai';
  image?: string;
}