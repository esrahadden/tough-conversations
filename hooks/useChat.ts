import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  id?: string
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Check auth status
  const checkAuthStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setIsGuest(!user)
    return user
  }, [])

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true)
    checkAuthStatus()
  }, [checkAuthStatus])

  // Create new conversation for authenticated users
  const createConversation = useCallback(async () => {
    const user = await checkAuthStatus()
    if (!user) return null

    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Conversation' })
    })

    if (response.ok) {
      const { conversation } = await response.json()
      return conversation.id
    }
    return null
  }, [checkAuthStatus])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    setIsLoading(true)
    
    try {
      // Add user message immediately
      const userMessage: Message = { role: 'user', content }
      setMessages(prev => [...prev, userMessage])

      // Create conversation if needed and user is authenticated
      let currentConversationId = conversationId
      if (!isGuest && !currentConversationId) {
        currentConversationId = await createConversation()
        setConversationId(currentConversationId)
      }

      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationId: currentConversationId,
          isGuest
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const { message } = await response.json()
      setMessages(prev => [...prev, message])

    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }, [messages, conversationId, isGuest, createConversation])

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
  }, [])

  // Load conversation
  const loadConversation = useCallback((conversationMessages: Message[], id: string) => {
    setMessages(conversationMessages)
    setConversationId(id)
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    loadConversation,
    isGuest,
    checkAuthStatus
  }
}
