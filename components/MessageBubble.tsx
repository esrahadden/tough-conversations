'use client'

import { Message } from '@/hooks/useChat'
import { User, Bot } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      {!isUser && (
        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot size={18} className="text-yellow-400" />
        </div>
      )}
      
      <div className={`max-w-[75%] ${isUser ? 'order-2' : ''}`}>
        <div
          className={`rounded-2xl px-6 py-4 ${
            isUser
              ? 'bg-yellow-400 text-slate-800'
              : 'bg-white text-slate-700 shadow-md border border-gray-200'
          }`}
        >
          <div className="prose prose-sm max-w-none">
            {message.content.split('\n').map((line, index) => (
              <p key={index} className={`${index === 0 ? 'mt-0' : ''} ${isUser ? 'text-slate-800' : 'text-slate-700'} leading-relaxed`}>
                {line || '\u00A0'}
              </p>
            ))}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 order-3">
          <User size={18} className="text-white" />
        </div>
      )}
    </div>
  )
}
