'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Share2, Bookmark, MoreHorizontal, Send, RefreshCw, Clock, Image as ImageIcon, ChevronLeft, Menu, PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { chatService } from '@/services/chatService'

interface ChatHistory {
  id: string
  title: string
  date: string
  messages: Message[]
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
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      id: '1',
      title: '关于台铁维修的对话',
      date: '2024-03-10',
      messages: [
        { id: '1', content: "台铁的车辆维修周期是多久？", sender: 'user' },
        { id: '2', content: "台铁的车辆维修周期通常根据车辆类型和使用情况而有所不同。一般来说，主要的维修周期包括：\n\n1. 日常检修：每天进行\n2. 定期检修：通常每3-6个月进行一次\n3. 大修：根据车辆类型，通常每4-8年进行一次\n\n具体的维修周期可能会根据实际情况进行调整。", sender: 'ai' },
      ]
    },
    {
      id: '2',
      title: 'MMIS系统使用问题',
      date: '2024-03-15',
      messages: [
        { id: '1', content: "如何在MMIS系统中查看设备维修历史？", sender: 'user' },
        { id: '2', content: "要在MMIS系统中查看设备维修历史，请按以下步骤操作：\n\n1. 登录MMIS系统\n2. 进入'设备管理'模块\n3. 使用搜索功能或设备列表找到目标设备\n4. 点击设备详情\n5. 在详情页面中，找到'维修历史'或'工作订单'标签\n6. 点击查看完整的维修记录\n\n如果遇到任何问题，请联系系统管理员寻求帮助。", sender: 'ai' },
      ]
    },
    {
      id: '3',
      title: '预防性维护计划制定',
      date: '2024-03-20',
      messages: [
        { id: '1', content: "如何为新购入的列车制定预防性维护计划？", sender: 'user' },
        { id: '2', content: "为新购入的列车制定预防性维护计划，可以遵循以下步骤：\n\n1. 研究制造商提供的维护手册和建议\n2. 分析类似车型的历史维护数据\n3. 确定关键部件和系统\n4. 制定检查和维护的时间表\n5. 设定性能指标和监测方案\n6. 准备所需的工具和备件\n7. 培训维护人员\n8. 在MMIS系统中创建维护计划\n9. 定期评估和调整计划\n\n记得要根据实际运行情况和反馈不断优化维护计划。", sender: 'ai' },
      ]
    },
  ])
  const [currentChat, setCurrentChat] = useState<ChatHistory | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isRightColumnVisible, setIsRightColumnVisible] = useState(false)
  const [rightColumnWidth, setRightColumnWidth] = useState(400)
  const resizingRef = useRef(false)

  useEffect(() => {
    if (!isNewChat) {
      loadAllChatHistories();
    }
  }, []);

  const loadAllChatHistories = async () => {
    try {
      const histories = await chatService.getAllChatHistories();
      setChatHistory(histories);
    } catch (error) {
      console.error('加载聊天历史失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      const newMessage: Message = { id: Date.now().toString(), content: input, sender: 'user' }
      if (currentChat) {
        const updatedChat = {
          ...currentChat,
          messages: [...currentChat.messages, newMessage]
        };
        setCurrentChat(updatedChat);
        await saveChatHistory(updatedChat);
      } else {
        const newChat: ChatHistory = {
          id: Date.now().toString(),
          title: `新对话 ${chatHistory.length + 1}`,
          date: new Date().toISOString().split('T')[0],
          messages: [newMessage]
        }
        setChatHistory([...chatHistory, newChat]);
        setCurrentChat(newChat);
        await saveChatHistory(newChat);
      }
      setInput('')
    }
  }

  const saveChatHistory = async (chat: ChatHistory) => {
    try {
      await chatService.saveChatHistory(chat);
    } catch (error) {
      console.error('保存聊天历史失败:', error);
    }
  };

  const handleRefresh = () => {
    // 处理对话刷新
    console.log('刷新对话')
  }

  const handleHistoryItemClick = async (chat: ChatHistory) => {
    try {
      const fullChatHistory = await chatService.getChatHistory(chat.id);
      setCurrentChat(fullChatHistory);
      setIsRightColumnVisible(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('加载聊天历史失败:', error);
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

  return (
    <div className="flex h-screen bg-white">
      {/* 侧边栏 */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden border-r`}>
        <div className="p-4">
          <button
            onClick={handleNewThread}
            className="w-full mb-4 p-2 flex items-center justify-center text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            新对话
          </button>
          <h2 className="text-xl font-semibold mb-4">聊天历史</h2>
          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleHistoryItemClick(chat)}
                className="w-full text-left p-2 hover:bg-gray-100 rounded-md"
              >
                <p className="font-medium">{chat.title}</p>
                <p className="text-sm text-gray-500">{chat.date}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-label="切换侧边栏"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <img src="/images/trammis-logo.jpg" alt="台铁MMIS Logo" className="w-8 h-8" />
              <h1 className="text-xl font-semibold">臺鐵MMIS检修助手</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-label="刷新对话"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 rounded-full">使用者:NY</button>                        
            {/* <img src="/placeholder.svg?height=32&width=32" alt="用户头像" className="w-8 h-8 rounded-full" /> */}
            <ChevronDown className="w-4 h-4" />
          </div>
        </header>

        {/* 两栏布局 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 聊天区域 */}
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
                      查看图片
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 可调整大小的右栏 */}
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
                    关闭
                  </button>
                  {selectedImage && (
                    <img src={selectedImage} alt="选中的内容" className="w-full h-auto rounded-lg shadow-lg" />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 输入区域 */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="问任何问题..."
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* 浮动操作按钮 */}
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
    </div>
  )
}