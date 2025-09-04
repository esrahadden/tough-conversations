import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key (for admin operations)
export const supabaseAdmin = supabaseServiceRoleKey !== 'placeholder-service-key'
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null

export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export type Conversation = {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
  messages?: Message[]
}
