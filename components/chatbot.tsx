'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Share2, Bookmark, MoreHorizontal, Send, RefreshCw, Clock, Image as ImageIcon, ChevronLeft, Menu, PlusCircle, Trash2, BookOpen, MessageSquare, Repeat, Share, Download, ThumbsUp, ThumbsDown, ZoomIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { chatService } from '@/services/chatService'
import axios from 'axios'

interface ChatHistory {
  id: string
  title: string
  date: string
  messages: Message[]
  user_id: string // 新增使用者ID欄位
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  image?: string
}

interface ChatbotComponentProps {
  isNewChat?: boolean
}

const API_KEY = 'app-B3zSfh1fxmxgU8rPmMyUqNWb'
const API_URL = 'http://dify.webtw.xyz/v1/chat-messages'

export function ChatbotComponent({ isNewChat = false }: ChatbotComponentProps) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [currentChat, setCurrentChat] = useState<ChatHistory | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isRightColumnVisible, setIsRightColumnVisible] = useState(false)
  const [rightColumnWidth, setRightColumnWidth] = useState(400)
  const resizingRef = useRef(false)
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('nickyin')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
  const [newChatMessage, setNewChatMessage] = useState('')
  const [streamingResponse, setStreamingResponse] = useState('')
  const [apiConversationId, setApiConversationId] = useState<string | null>(null)

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);

  useEffect(() => {
    if (!isNewChat) {
      loadAllChatHistories();
    }
  }, []);

  const loadAllChatHistories = async () => {
    try {
      const histories = await chatService.getAllChatHistories(userId);
      setChatHistory(histories);
    } catch (error) {
      console.error('載入聊天歷史失敗:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      const userMessage: Message = { id: Date.now().toString(), content: input, sender: 'user' }
      
      if (currentChat) {
        try {
          await chatService.appendMessageToChat(currentChat.id, {
            content: input,
            sender: 'user'
          });

          let aiMessageId = Date.now().toString();
          let aiResponse = '';
          setCurrentChat(prevChat => {
            if (!prevChat) return null;
            const updatedMessages = [
              ...prevChat.messages,
              userMessage,
              { id: aiMessageId, content: '', sender: 'ai' }
            ];
            return { ...prevChat, messages: updatedMessages };
          });

          const newConversationId = await chatService.sendMessageToAPI(input, apiConversationId, userId, (chunk) => {
            try {
              const data = JSON.parse(chunk);
              if (data.event === 'agent_message') {
                aiResponse += data.answer || '';
                setStreamingResponse(aiResponse);
                setCurrentChat(prevChat => {
                  if (!prevChat) return null;
                  const updatedMessages = prevChat.messages.map(msg => 
                    msg.id === aiMessageId ? { ...msg, content: aiResponse } : msg
                  );
                  return { ...prevChat, messages: updatedMessages };
                });
              } else if (data.event === 'message_end') {
                chatService.appendMessageToChat(currentChat.id, {
                  content: aiResponse,
                  sender: 'ai'
                }).then(updatedChat => {
                  setCurrentChat(updatedChat);
                });
              }
            } catch (error) {
              console.error('解析 JSON 失敗:', error, 'Raw chunk:', chunk);
            }
          });

          if (newConversationId) {
            setApiConversationId(newConversationId);
          }
        } catch (error) {
          console.error('添加訊息到聊天歷史失敗:', error);
        }
      } else {
        // 處理新聊天的邏輯
        // ... (保持不變)
      }
      setInput('')

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }

  const saveChatHistory = async (chat: ChatHistory) => {
    try {
      await chatService.saveChatHistory(chat);
    } catch (error) {
      console.error('保存聊天歷史失敗:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (currentChat) {
        const refreshedChat = await chatService.getChatHistory(currentChat.id);
        setCurrentChat(refreshedChat);
      } else {
        await loadAllChatHistories();
      }
    } catch (error) {
      console.error('刷新對話歷史失敗:', error);
    } finally {
      setIsRefreshing(false);
    }
  }

  const handleHistoryItemClick = async (chat: ChatHistory) => {
    try {
      const fullChatHistory = await chatService.getChatHistory(chat.id);
      setCurrentChat(fullChatHistory);
      setIsRightColumnVisible(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('載入聊天歷史失敗:', error);
    }
  }

  const handleViewImage = (image: string) => {
    setSelectedImage(image)
    setIsRightColumnVisible(true)
  }

  const handleCloseRightColumn = () => {
    setIsRightColumnVisible(false)
    setSelectedImage(null)
    setCurrentChat(null)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (resizingRef.current) {
      const newWidth = window.innerWidth - e.clientX
      setRightColumnWidth(Math.max(200, Math.min(newWidth, window.innerWidth - 400)))
    }
  }

  const handleMouseUp = () => {
    resizingRef.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleNewThread = () => {
    setIsNewChatModalOpen(true);
  }

  const handleCreateNewChat = async () => {
    if (newChatMessage.trim()) {
      const newChat: ChatHistory = {
        id: Date.now().toString(),
        title: newChatMessage.trim(),
        date: new Date().toISOString().split('T')[0],
        messages: [
          { id: Date.now().toString(), content: newChatMessage, sender: 'user' }
        ],
        user_id: userId
      };

      try {
        const createdChat = await chatService.saveChatHistory(newChat);
        setChatHistory(prevHistory => [...prevHistory, createdChat]);
        setCurrentChat(createdChat);
        setIsNewChatModalOpen(false);
        setNewChatMessage('');
        setInput('');
        setIsRightColumnVisible(false);
        setSelectedImage(null);

        // 滾動到底部
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } catch (error) {
        console.error('創建新聊天失敗:', error);
      }
    }
  };

  useEffect(() => {
    if (isNewChat) {
      setCurrentChat(null)
    }
  }, [isNewChat])

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleDeleteClick = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeletingChatId(chatId);
  };

  const handleConfirmDelete = async () => {
    if (deletingChatId) {
      try {
        await chatService.deleteChatHistory(deletingChatId);
        setChatHistory(chatHistory.filter(chat => chat.id !== deletingChatId));
        if (currentChat && currentChat.id === deletingChatId) {
          setCurrentChat(null);
        }
      } catch (error) {
        console.error('刪除聊天歷史失敗:', error);
      } finally {
        setDeletingChatId(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeletingChatId(null);
  };

  const groupMessages = (messages: Message[]) => {
    const groupedMessages: Message[][] = [];
    let currentGroup: Message[] = [];

    messages.forEach((message) => {
      if (message.sender === 'user') {
        if (currentGroup.length > 0) {
          groupedMessages.push(currentGroup);
        }
        currentGroup = [message];
      } else {
        // AI 消息，確保每組至少有兩條消息（Sources 和 Answer）
        if (currentGroup.length === 1) {
          // 如果只有用戶消息，添加一個空的 Sources 消息
          currentGroup.push({ id: `sources-${message.id}`, content: '', sender: 'ai' });
        }
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      // 如果最後一組只有用戶消息，添加空的 Sources 和 Answer
      if (currentGroup.length === 1) {
        currentGroup.push({ id: `sources-${Date.now()}`, content: '', sender: 'ai' });
        currentGroup.push({ id: `answer-${Date.now()}`, content: '', sender: 'ai' });
      } else if (currentGroup.length === 2) {
        // 如果只有用戶消息和 Sources，添加空的 Answer
        currentGroup.push({ id: `answer-${Date.now()}`, content: '', sender: 'ai' });
      }
      groupedMessages.push(currentGroup);
    }

    return groupedMessages;
  };

  const generateMockSources = () => {
    return [
      { 
        title: "圖片最佳化", 
        author: "cythilya", 
        votes: 1,
        summary: "本文介紹了圖片優化的重要性和常用技巧，包括壓縮、懶加載和響應式圖片等方法。",
        thumbnail: "https://picsum.photos/100/100?random=1"
      },
      { 
        title: "反向圖像搜尋", 
        author: "products.aspose", 
        votes: 2,
        summary: "這是一個多語言的反向圖像搜尋應用，支持英語、中文、日文等多種語言。",
        thumbnail: "https://picsum.photos/100/100?random=2"
      },
      { 
        title: "Lidemy 聚會心得", 
        author: "yakimhsu", 
        votes: 3,
        summary: "作者分享了參加 Lidemy 實體聚會的經驗，包括交流學習心得和建立人脈的過程。",
        thumbnail: "https://picsum.photos/100/100?random=3"
      }
    ];
  };

  const handleResend = async () => {
    if (currentChat && currentChat.messages.length > 0) {
      // 找到最後一條用戶消息
      const lastUserMessage = [...currentChat.messages].reverse().find(m => m.sender === 'user');
      
      if (lastUserMessage) {
        try {
          // 重新發送用戶消息
          await chatService.appendMessageToChat(currentChat.id, {
            content: lastUserMessage.content,
            sender: 'user'
          });
          
          // 模擬 AI 回覆（實際應用中，這裡應該調用 AI 服務）
          const aiResponse = await chatService.appendMessageToChat(currentChat.id, {
            content: "這是重新發送後的 AI 回覆。實際應用中，這裡應該是從 AI 服務獲取的回覆。",
            sender: 'ai'
          });
          
          // 更新當前聊天
          const updatedChat = await chatService.getChatHistory(currentChat.id);
          setCurrentChat(updatedChat);
          
          console.log('消息重新發送成功');
        } catch (error) {
          console.error('重新發送消息失敗:', error);
        }

        // 在成功重發消息後，滾動到底部
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        console.log('沒有找到可以重新發送的用戶消息');
      }
    } else {
      console.log('當前沒有活動的聊天或聊天為空');
    }
  };

  const handleShare = () => {
    console.log('分享當前對話');
    // 這裡可以添加分享功能的邏輯，例如複製對話鏈接到剪貼板
  };

  const handleExport = () => {
    console.log('導出當前對話');
    // 這裡可以添加導出對話內容的邏輯，例如生成 PDF 或文本文件
  };

  const handleLike = () => {
    console.log('點讚');
    // 這裡可以添加點讚的邏輯，例如更新服務器上的點讚計數
  };

  const handleDislike = () => {
    console.log('點踩');
    // 這裡可以添加點踩的邏輯，例如更新服務器上的點踩計數
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleChatSelect = async (chat: ChatHistory) => {
    try {
      const fullChatHistory = await chatService.getChatHistory(chat.id);
      setCurrentChat(fullChatHistory);
      setIsRightColumnVisible(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('載入聊天歷史失敗:', error);
    }
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setDeletingChatId(chatId);
  };

  const handleThumbnailClick = (images: string[], index: number) => {
    setModalImages(images);
    setCurrentModalImageIndex(index);
    setIsImageModalOpen(true);
  };

  const handleModalImageChange = (index: number) => {
    setCurrentModalImageIndex(index);
  };

  const closeImageModal = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsImageModalOpen(false);
      setModalImages([]);
      setCurrentModalImageIndex(0);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f1eb]">
      {/* 左側邊欄 */}
      <div className={`w-64 bg-[#f5f1eb] overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4">
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 p-2 bg-[#b8a88a] text-white rounded-lg hover:bg-[#a69778] transition-colors duration-200 text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>新對話</span>
          </button>
        </div>
        <div className="px-2">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm ${
                currentChat?.id === chat.id ? 'bg-[#e9e5df]' : 'hover:bg-[#e9e5df]'
              }`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="flex items-center space-x-2 overflow-hidden">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </div>
              <button
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className="text-[#7a7a7a] hover:text-[#4a4a4a]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="flex-1 flex flex-col">
        {/* 頭部 - 移除底部邊框 */}
        <header className="flex items-center justify-between p-4 bg-[#f5f1eb]">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-[#4a4a4a] hover:bg-[#e9e5df] rounded-full"
              aria-label="切換側邊欄"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <img src="/images/trammis-logo.jpg" alt="臺鐵MMIS Logo" className="w-8 h-8" />
              <h1 className="text-xl font-semibold hidden sm:inline text-[#4a4a4a]">臺鐵MMIS檢修助手</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className={`p-2 text-[#4a4a4a] hover:bg-[#e9e5df] rounded-full ${isRefreshing ? 'animate-spin' : ''}`}
              aria-label="重新整理對話"
              disabled={isRefreshing}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="px-3 py-1 text-sm bg-[#e9e5df] rounded-full text-[#4a4a4a]">
              <span className="hidden sm:inline">使用者:</span>{userId}
            </button>
            <ChevronDown className="w-4 h-4 text-[#4a4a4a]" />
          </div>
        </header>

        {/* 兩欄布局 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 聊天區域 */}
          <div 
            ref={chatContainerRef}
            className={`flex-1 overflow-y-auto p-6 space-y-8 ${isRightColumnVisible ? 'pr-8' : ''}`}
          >
            {currentChat && groupMessages(currentChat.messages).map((group, groupIndex) => (              
              <div key={groupIndex} className="flex">
                
                <div className="flex-1 flex flex-col space-y-4 max-w-3xl">
                  {group.map((message, messageIndex) => (
                    <div key={message.id} className="pb-4">
                      <h3 className="text-xl font-bold mb-2 flex items-center text-[#4a4a4a]">
                        {message.sender === 'user' ? (
                          ''
                        ) : messageIndex === 1 ? (
                          <>
                            <BookOpen className="w-6 h-6 mr-2" />
                            Sources
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-6 h-6 mr-2" />
                            Answer
                          </>
                        )}
                      </h3>
                      {message.sender === 'user' ? (
                        <p className="text-[#4a4a4a] text-3xl">{message.content}</p>
                      ) : messageIndex === 1 ? (
                        // Sources 部分
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="grid grid-cols-3 gap-4">
                            {generateMockSources().map((source, index) => (
                              <div 
                                key={index} 
                                className="bg-[#f5f1eb] p-3 rounded-lg relative group cursor-pointer"
                              >
                                <h4 className="font-medium text-[#4a4a4a] truncate">{source.title}</h4>
                                <p className="text-sm text-[#7a7a7a] truncate">{source.author}</p>
                                <div className="flex items-center justify-end mt-2 text-[#7a7a7a]">
                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                  <span className="text-xs">{source.votes}</span>
                                </div>
                                {/* 摘要彈出框 */}
                                <div className="absolute left-0 top-full mt-2 bg-white p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 w-full">
                                  <p className="text-sm text-[#4a4a4a]">{source.summary}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button className="mt-4 text-[#b8a88a] hover:underline">View 4 more</button>
                        </div>
                      ) : (
                        <p className="text-[#4a4a4a] text-lg">{message.content || '暫無內容'}</p>
                      )}
                      {message.sender === 'ai' && message.image && (
                        <button 
                          onClick={() => handleViewImage(message.image!)}
                          className="mt-2 flex items-center text-[#b8a88a] hover:underline"
                        >
                          <ImageIcon className="w-4 h-4 mr-1" />
                          查看圖片
                        </button>
                      )}
                    </div>
                  ))}
                  {/* 添加小按鈕 */}
                  <div className="flex justify-end space-x-2 mt-2">
                    <button onClick={handleResend} className="p-1 text-[#7a7a7a] hover:text-[#b8a88a]" title="重發">
                      <Repeat className="w-4 h-4" />
                    </button>
                    <button onClick={handleShare} className="p-1 text-[#7a7a7a] hover:text-[#b8a88a]" title="分享">
                      <Share className="w-4 h-4" />
                    </button>
                    <button onClick={handleExport} className="p-1 text-[#7a7a7a] hover:text-[#b8a88a]" title="匯出">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={handleLike} className="p-1 text-[#7a7a7a] hover:text-[#b8a88a]" title="比讚">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button onClick={handleDislike} className="p-1 text-[#7a7a7a] hover:text-[#b8a88a]" title="比倒讚">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* 修改縮圖區域 */}
                <div className="ml-4 flex flex-col space-y-2 w-48">
                  {generateMockSources().length > 0 && (
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => handleThumbnailClick(generateMockSources().map(s => s.thumbnail), 0)}
                    >
                      <img 
                        src={generateMockSources()[0].thumbnail}
                        alt="Main Thumbnail"
                        className="w-full h-32 object-cover rounded-md transition-transform duration-200 ease-in-out transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {generateMockSources().slice(1).map((source, index) => (
                      <div 
                        key={index + 1}
                        className="relative group cursor-pointer"
                        onClick={() => handleThumbnailClick(generateMockSources().map(s => s.thumbnail), index + 1)}
                      >
                        <img 
                          src={source.thumbnail}
                          alt={`Thumbnail ${index + 2}`}
                          className="w-full h-20 object-cover rounded-md transition-transform duration-200 ease-in-out transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {/* {streamingResponse && (
              <div className="flex justify-start mb-4">
                <div className="bg-white rounded-lg p-3 max-w-[70%] shadow">
                  <p className="text-gray-800">{streamingResponse}</p>
                </div>
              </div>
            )} */}
          </div>

          {/* 可調整大小的右欄 - 移除左邊框 */}
          {isRightColumnVisible && (
            <>
              <div
                className="w-1 cursor-col-resize bg-[#d1d1d1] hover:bg-[#b8a88a] transition-colors"
                onMouseDown={handleMouseDown}
              ></div>
              <div
                className="overflow-y-auto bg-white"
                style={{ width: `${rightColumnWidth}px` }}
              >
                <div className="p-4">
                  <button
                    onClick={handleCloseRightColumn}
                    className="mb-4 flex items-center text-[#4a4a4a] hover:text-[#b8a88a]"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    關閉
                  </button>
                  {selectedImage && (
                    <img src={selectedImage} alt="選中的內容" className="w-full h-auto rounded-lg shadow-lg" />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 輸入區域 - 移除頂部邊框 */}
        <div className="p-4 bg-[#f5f1eb]">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 p-3 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b8a88a] focus:border-transparent text-lg text-[#4a4a4a]"
              
            />
            <button 
              type="submit" 
              className="p-3 bg-[#b8a88a] text-white rounded-lg hover:bg-[#a69778] focus:outline-none focus:ring-2 focus:ring-[#b8a88a] focus:ring-offset-2 disabled:opacity-50"
              
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>

      {/* 浮動操作按鈕 */}
      <div className="fixed bottom-20 right-4 space-y-2 md:hidden">
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-[#e9e5df]">
          <Share2 className="w-5 h-5 text-[#4a4a4a]" />
        </button>
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-[#e9e5df]">
          <Bookmark className="w-5 h-5 text-[#4a4a4a]" />
        </button>
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-[#e9e5df]">
          <MoreHorizontal className="w-5 h-5 text-[#4a4a4a]" />
        </button>
      </div>

      

      {/* 刪除確認對話框 */}
      {deletingChatId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-[#4a4a4a]">確認刪除</h3>
            <p className="mb-4 text-[#4a4a4a]">您確定要刪除這個聊天歷史嗎？此操作無法撤銷。</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-[#4a4a4a] hover:bg-[#e9e5df] rounded"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-[#b8a88a] text-white hover:bg-[#a69778] rounded"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新對話模態框 */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-[#f5f1eb] p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-[#4a4a4a]">開始新對話</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateNewChat(); }}>
              <textarea
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="輸入您的第一條消息..."
                className="w-full p-3 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b8a88a] focus:border-transparent text-lg mb-4 bg-white text-[#4a4a4a] resize-none"
                rows={4}
              />
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="px-4 py-2 text-[#4a4a4a] hover:bg-[#e9e5df] rounded"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b8a88a] text-white hover:bg-[#a69778] rounded focus:outline-none focus:ring-2 focus:ring-[#b8a88a] focus:ring-offset-2"
                >
                  發送
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 修改圖片 Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeImageModal}
        >
          <div className="bg-white p-4 rounded-lg max-w-5xl w-full h-[80vh] flex" onClick={e => e.stopPropagation()}>
            <div className="flex-1 flex items-center justify-center">
              <img src={modalImages[currentModalImageIndex]} alt="Full size image" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="w-24 ml-4 overflow-y-auto">
              {modalImages.map((image, index) => (
                <img 
                  key={index}
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-20 h-20 object-cover rounded-md cursor-pointer mb-2 ${index === currentModalImageIndex ? 'border-2 border-[#b8a88a]' : ''}`}
                  onClick={() => handleModalImageChange(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}