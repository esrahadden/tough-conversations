import { NextRequest, NextResponse } from 'next/server'
import { generateResponse } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId, isGuest } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    // Generate AI response
    const response = await generateResponse(messages)

    // If not guest and has conversationId, save to database
    if (!isGuest && conversationId) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Save the user message
        const userMessage = messages[messages.length - 1]
        if (userMessage) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'user',
            content: userMessage.content,
          })
        }

        // Save the assistant response
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: response,
        })

        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId)
      }
    }

    return NextResponse.json({ 
      message: { 
        role: 'assistant', 
        content: response 
      } 
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
