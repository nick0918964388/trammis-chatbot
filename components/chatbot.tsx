'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Share2, Bookmark, MoreHorizontal, Send, RefreshCw, Clock, Image as ImageIcon, ChevronLeft, Menu, PlusCircle, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { chatService } from '@/services/chatService'

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
  const [userId, setUserId] = useState<string>('nickyin') // 假設當前使用者ID為 'NY'

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
      const newMessage: Message = { id: Date.now().toString(), content: input, sender: 'user' }
      if (currentChat) {
        try {
          const updatedChat = await chatService.appendMessageToChat(currentChat.id, {
            content: input,
            sender: 'user'
          });
          setCurrentChat(updatedChat);
        } catch (error) {
          console.error('添加訊息到聊天歷史失敗:', error);
        }
      } else {
        // 處理新對話的邏輯
        const newChat: ChatHistory = {
          id: Date.now().toString(),
          title: input.trim(), // 使用使用者輸入的第一句話作為標題
          date: new Date().toISOString().split('T')[0],
          messages: [newMessage],
          user_id: userId
        }
        try {
          const createdChat = await chatService.saveChatHistory(newChat);
          setChatHistory([...chatHistory, createdChat]);
          setCurrentChat(createdChat);
        } catch (error) {
          console.error('創建新聊天歷史失敗:', error);
        }
      }
      setInput('')
    }
  }

  const saveChatHistory = async (chat: ChatHistory) => {
    try {
      await chatService.saveChatHistory(chat);
    } catch (error) {
      console.error('保存聊天歷史失敗:', error);
    }
  };

  const handleRefresh = () => {
    // 處理對話刷新
    console.log('刷新對話')
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
    router.push('/new-chat')
  }

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
      }
      setDeletingChatId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingChatId(null);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* 側邊欄 */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden border-r`}>
        <div className="p-4">
          <button
            onClick={handleNewThread}
            className="w-full mb-4 p-2 flex items-center justify-center text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            新對話
          </button>
          <h2 className="text-xl font-semibold mb-4">聊天歷史</h2>
          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <div key={chat.id} className="flex items-center justify-between">
                <button
                  onClick={() => handleHistoryItemClick(chat)}
                  className="flex-grow text-left p-2 hover:bg-gray-100 rounded-md"
                >
                  <p className="font-medium">{chat.title}</p>
                  <p className="text-sm text-gray-500">{chat.date}</p>
                </button>
                <button
                  onClick={(e) => handleDeleteClick(chat.id, e)}
                  className="p-2 text-gray-500 hover:text-red-500"
                  aria-label="刪除聊天"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="flex-1 flex flex-col">
        {/* 頭部 */}
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-label="切換側邊欄"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <img src="/images/trammis-logo.jpg" alt="臺鐵MMIS Logo" className="w-8 h-8" />
              <h1 className="text-xl font-semibold">臺鐵MMIS檢修助手</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-label="刷新對話"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 rounded-full">使用者:{userId}</button>
            <ChevronDown className="w-4 h-4" />
          </div>
        </header>

        {/* 兩欄布局 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 聊天區域 */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${isRightColumnVisible ? 'pr-8' : ''}`}>
            {currentChat && currentChat.messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg p-3 max-w-3xl ${message.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <p>{message.content}</p>
                  {message.image && (
                    <button 
                      onClick={() => handleViewImage(message.image!)}
                      className="mt-2 flex items-center text-blue-500 hover:underline"
                    >
                      <ImageIcon className="w-4 h-4 mr-1" />
                      查看圖片
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 可調整大小的右欄 */}
          {isRightColumnVisible && (
            <>
              <div
                className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400 transition-colors"
                onMouseDown={handleMouseDown}
              ></div>
              <div
                className="border-l overflow-y-auto"
                style={{ width: `${rightColumnWidth}px` }}
              >
                <div className="p-4">
                  <button
                    onClick={handleCloseRightColumn}
                    className="mb-4 flex items-center text-gray-600 hover:text-gray-800"
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

        {/* 輸入區域 */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="問任何問題..."
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* 浮動操作按鈕 */}
      <div className="fixed bottom-20 right-4 space-y-2">
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
          <Share2 className="w-5 h-5" />
        </button>
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
          <Bookmark className="w-5 h-5" />
        </button>
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* 刪除確認對話框 */}
      {deletingChatId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">確認刪除</h3>
            <p className="mb-4">您確定要刪除這個聊天歷史嗎？此操作無法撤銷。</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}