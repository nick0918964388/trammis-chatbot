'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Share2, Bookmark, MoreHorizontal, Send, RefreshCw, Clock, Image as ImageIcon, ChevronLeft } from 'lucide-react'

interface ChatHistory {
  id: string
  title: string
  date: string
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  image?: string
}

export function PerplexityCloneComponent() {
  const [input, setInput] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    { id: '1', title: 'Previous Chat 1', date: '2023-05-01' },
    { id: '2', title: 'Previous Chat 2', date: '2023-05-02' },
    { id: '3', title: 'Previous Chat 3', date: '2023-05-03' },
  ])
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: "I want to build a chatbot just like the pic i provided. Please generate a Chatbot like I provide.", sender: 'user' },
    { id: '2', content: "I'd be happy to help you create a chatbot interface with a resizable right column for images. Here's a description of the updated design:", sender: 'ai' },
    { id: '3', content: "1. The chat window now has a resizable right column.\n2. The right column is hidden by default.\n3. Clicking 'View Image' will show the right column with the image.\n4. You can drag the divider to resize the right column.\n5. We've added a placeholder image to demonstrate the layout.", sender: 'ai', image: '/placeholder.svg?height=300&width=400' },
  ])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isRightColumnVisible, setIsRightColumnVisible] = useState(false)
  const [rightColumnWidth, setRightColumnWidth] = useState(400)
  const resizingRef = useRef(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      const newMessage: Message = { id: Date.now().toString(), content: input, sender: 'user' }
      setMessages([...messages, newMessage])
      setInput('')
      // Here you would typically send the message to your AI service and handle the response
    }
  }

  const handleRefresh = () => {
    // Handle conversation refresh here
    console.log('Refreshing conversation')
  }

  const handleHistoryItemClick = (id: string) => {
    // Handle loading a specific chat history
    console.log('Loading chat history:', id)
    setIsHistoryOpen(false)
  }

  const handleViewImage = (image: string) => {
    setSelectedImage(image)
    setIsRightColumnVisible(true)
  }

  const handleCloseRightColumn = () => {
    setIsRightColumnVisible(false)
    setSelectedImage(null)
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

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <img src="/placeholder.svg?height=32&width=32" alt="Perplexity Logo" className="w-8 h-8" />
          <h1 className="text-xl font-semibold">Perplexity</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            aria-label="Chat History"
          >
            <Clock className="w-5 h-5" />
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            aria-label="Refresh Conversation"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 rounded-full">1+</button>
          <button className="px-3 py-1 text-sm bg-gray-100 rounded-full">3</button>
          <span>10m</span>
          <img src="/placeholder.svg?height=32&width=32" alt="User Avatar" className="w-8 h-8 rounded-full" />
          <ChevronDown className="w-4 h-4" />
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${isRightColumnVisible ? 'pr-8' : ''}`}>
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg p-3 max-w-3xl ${message.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <p>{message.content}</p>
                {message.image && (
                  <button 
                    onClick={() => handleViewImage(message.image!)}
                    className="mt-2 flex items-center text-blue-500 hover:underline"
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    View Image
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Resizable right column */}
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
                  Close
                </button>
                {selectedImage && (
                  <img src={selectedImage} alt="Selected content" className="w-full h-auto rounded-lg shadow-lg" />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Floating Action Buttons */}
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

      {/* Chat History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Chat History</h2>
            </div>
            <div className="p-4 space-y-2">
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleHistoryItemClick(chat.id)}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded-md"
                >
                  <p className="font-medium">{chat.title}</p>
                  <p className="text-sm text-gray-500">{chat.date}</p>
                </button>
              ))}
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-full p-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}