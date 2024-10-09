import axios from 'axios';

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  messages: Message[];
  user_id: string; // 新增使用者ID欄位
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  image?: string;
}

interface ChatHistoryCreate {
  title: string;
  messages: Message[];
  user_id: string; // 新增使用者ID欄位
}

interface MessageAppend {
  content: string;
  sender: 'user' | 'ai';
  image?: string;
}

const API_BASE_URL = 'http://traapi1.mas4dev.xyz:8000/api'; // 根據您的實際 API 地址進行調整
const DIFY_API_URL = 'http://dify.webtw.xyz/v1/chat-messages';
const API_KEY = 'app-B3zSfh1fxmxgU8rPmMyUqNWb';

export const chatService = {
  saveChatHistory: async (chatHistory: ChatHistoryCreate): Promise<ChatHistory> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat-history`, chatHistory);
      return response.data;
    } catch (error) {
      console.error('保存聊天歷史時出錯:', error);
      throw error;
    }
  },

  getChatHistory: async (chatId: string): Promise<ChatHistory> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat-history/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('獲取聊天歷史時出錯:', error);
      throw error;
    }
  },

  getAllChatHistories: async (userId: string): Promise<ChatHistory[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/${userId}/chat-histories`);
      return response.data.chat_histories;
    } catch (error) {
      console.error('獲取所有聊天歷史時出錯:', error);
      throw error;
    }
  },

  appendMessageToChat: async (chatId: string, message: MessageAppend): Promise<ChatHistory> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/chat-history/${chatId}`, { message });
      return response.data;
    } catch (error) {
      console.error('向聊天添加訊息時出錯:', error);
      throw error;
    }
  },

  deleteChatHistory: async (chatId: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/chat-history/${chatId}`);
    } catch (error) {
      console.error('刪除聊天歷史時出錯:', error);
      throw error;
    }
  },

  sendMessageToAPI: async (message: string, chatId: string | null, userId: string, onChunk: (chunk: string) => void): Promise<string> => {
    try {
      const response = await axios.post(DIFY_API_URL, {
        inputs: {},
        query: message,
        response_mode: "streaming",
        conversation_id: chatId || "",
        user: userId,
        files: [
          {
            type: "image",
            transfer_method: "remote_url",
            url: "https://cloud.dify.ai/logo/logo-site.png"
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'text',
        onDownloadProgress: (progressEvent) => {
          const xhr = progressEvent.target as XMLHttpRequest;
          const data = xhr.responseText;
          const lines = data.split('\n');
          let newConversationId = '';
          
          lines.forEach(line => {
            if (line.startsWith('data:')) {
              const jsonString = line.slice(5).trim();
              onChunk(jsonString);
              try {
                const jsonData = JSON.parse(jsonString);
                if (jsonData.conversation_id && !newConversationId) {
                  newConversationId = jsonData.conversation_id;
                }
                if (jsonData.event === 'message_end') {
                  onChunk(JSON.stringify({ event: 'message_end', conversation_id: jsonData.conversation_id }));
                }
              } catch (error) {
                console.error('解析 JSON 失敗:', error, 'Raw data:', jsonString);
              }
            }
          });

          if (progressEvent.loaded === progressEvent.total) {
            return newConversationId;
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('發送消息到 API 時出錯:', error);
      throw error;
    }
  }
};