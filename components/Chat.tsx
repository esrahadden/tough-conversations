'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import MessageBubble from './MessageBubble'
import { Send, Plus } from 'lucide-react'

export default function Chat() {
  const [input, setInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const { messages, isLoading, sendMessage, clearChat, isGuest } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const message = input
    setInput('')
    await sendMessage(message)
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-6 text-white">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-400 text-slate-800 px-3 py-1 rounded font-bold text-sm">
                HOW TO HAVE
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              TOUGH CONVERSATIONS
            </h1>
            <p className="text-slate-300 text-sm">
              Expert guidance for difficult workplace conversations
            </p>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-400 hover:bg-yellow-500 text-slate-800 rounded-lg transition-colors font-semibold"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-8 max-w-2xl mx-auto shadow-lg border border-gray-200">
              <div className="bg-yellow-400 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm inline-block mb-4">
                EMPATHETIC FRAMEWORK
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Welcome to Your Tough Conversations Coach
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                I'm here to help you navigate difficult workplace conversations using proven frameworks from the book "How to Have Tough Conversations."
              </p>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-700 font-semibold mb-2">Try asking:</p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• "I need to give feedback to an underperforming team member"</li>
                  <li>• "How do I address conflict between team members?"</li>
                  <li>• "I want to ask my boss for a raise but don't know how"</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {isGuest && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              💡 <strong>Guest mode:</strong> Your conversation won't be saved. Sign up to keep your chat history.
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your tough conversation challenge..."
              className="flex-1 border border-gray-300 rounded-xl px-6 py-4 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-slate-700"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:text-gray-500 text-slate-800 rounded-xl px-6 py-4 transition-colors flex items-center gap-2 font-semibold"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
