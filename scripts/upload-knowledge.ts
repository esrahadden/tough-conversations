import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Function to chunk text into smaller pieces
function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  
  let currentChunk = ''
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      
      // Start new chunk with some overlap
      const words = currentChunk.split(' ')
      const overlapWords = words.slice(-Math.floor(overlap / 6)) // Rough word estimate
      currentChunk = overlapWords.join(' ') + ' ' + sentence
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

async function uploadBookContent() {
  try {
    // Book content from the EMPATHETIC framework
    const bookContent = `
    The EMPATHETIC Framework for Tough Conversations:

    E - EMOTIONS and Managing Them
    Managing emotions is crucial before entering any tough conversation. Leaders must be aware of their emotional state and ensure they can remain composed throughout the discussion. You need to know your own emotions, triggers, and biases. Great leaders can manage their own emotions to compose themselves.

    M - MAKE a Plan
    Preparation is key. Define the objective, gather facts, anticipate reactions, and plan talking points before initiating the conversation. Very few people are naturally good at Tough Conversations, and those willing to improve in the delivery of Tough Conversations are willing to take the time to prepare before they talk.

    P - PRESENCE is Essential
    Being fully present fosters a deeper connection between individuals. It creates a sense of being heard and understood, leading to more productive and meaningful interactions. Put devices away, establish boundaries for device usage during conversations.

    A - ACKNOWLEDGE the Feedback May Be Difficult to Hear
    When sitting down with someone to have a Tough Conversation, you want to acknowledge upfront that this conversation may be awkward or difficult. Because you are looking for behavior change or to bring relationships back into alignment, address this early to keep their focus on deep listening.

    T - Take your TIME and Be Patient
    Tough Conversations may take longer than you expect. To be empathetic and complete in your Tough Conversations, you can't rush them. The rule of thumb is to allow 3x the time you think it will take when you are setting up the meeting.

    H - HOLD Your Tongue and Practice Deep Listening
    Your Tough Conversation is not a RANT. When you are only focused on what you want to tell them, it ends up being the wrong conversation. Tough Conversations are a dialogue, not a monologue. Let them express themselves. They may even feel the need to defend their actions or beliefs.

    E - Be EXPLICIT in Your Expectations
    In Tough Conversations, ensuring that both the giver and receiver are on the same page will make a significant difference in achieving desired outcomes. EXPLICIT is leaving no question as to meaning or intent. Speak in a way that can't be misunderstood.

    T - Create TACTICAL Plans
    A TACTICAL plan is taking a moment to decide what is the very next step. All Tough Conversations will have a next step. What is vital moving on from here is that there is a clear next step. Everyone involved has clarity and knows exactly what role they will play moving forward.

    I - ISSUE Documentation
    You may be thinking to yourself that the Tough Conversation is in no way going to lead to something as serious as getting HR involved. What seems like something minor today could potentially be the start of a pattern that will require documentation for HR.

    C - CARE for Your Team Member
    After a Tough Conversation, a great leader will remember to connect with the person after the Tough Conversation to let them know you care. The simple approach is to send a text 24 to 48 hours after the conversation to check in with them.

    The 4 Phases of Tough Conversations:
    
    Phase 1: Understand & Clarify
    Objective: Ask questions to understand their perspective. Explain your own thoughts about "alignment" so you are both more clear on the other's perspective. This is much like Stephen Covey's "seek to understand, then be understood." Tone: Be curious and calm.

    Phase 2: Name the Pattern
    Objective: When you have to give feedback on the same issue repeatedly. Repeated behaviors = a pattern. You name the pattern of behavior. Ideally, this is a catalyst for them to take ownership of the issue. Tone: Be neutral and clear.

    Phase 3: Be Direct
    Objective: Set expectations that cannot be misunderstood. This could include a Performance Improvement Plan (PIP) or another conversation that gets thoroughly honest. Tone: Be direct, not angry or frustrated.

    Phase 4: Exit
    Objective: Set expectations that cannot be misunderstood. This could include a Performance Improvement Plan (PIP) or another conversation that gets thoroughly honest. Tone: Be straightforward and matter of fact.

    The Magic Question in Tough Conversations:
    "What is the missing conversation that has not happened yet?" This question forces you to dig deeper to explore the unspoken thoughts, feelings, and concerns lurking beneath the surface. It's about uncovering the hidden obstacles, the unexpressed fears, and the unsaid truths preventing progress.

    Three Tough Conversation Types to Keep the Relationship:
    1. Change from the Way it Was - Leaders face discomfort when introducing change, as people often resist the unfamiliar.
    2. Performance Misalignment - Leaders guide team members toward improvement, acknowledging missteps as part of the learning process.
    3. Conflict Resolution - Tackling personal conflicts head-on prevents team morale erosion.

    The Goodwill Bank:
    The goodwill bank metaphorically represents the balance of positive and negative interactions in a relationship. Positive interactions create a surplus of goodwill, which can help cushion the impact of tough conversations.

    Going Too Far in Tough Conversations:
    It's essential to recognize the dangers of veering too far in either extreme whether it's being excessively empathetic – becoming a doormat – or overly direct or assertive – becoming an authoritarian leader.
    `

    // Clear existing knowledge chunks
    const { error: deleteError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('Error clearing existing chunks:', deleteError)
      return
    }

    console.log('Cleared existing knowledge chunks')

    // Chunk the content
    const chunks = chunkText(bookContent)
    console.log(`Created ${chunks.length} chunks from book content`)

    // Process chunks in batches
    const batchSize = 5
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      
      // Generate embeddings for this batch
      const embeddingPromises = batch.map(chunk => 
        openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: chunk,
        })
      )

      const embeddingResponses = await Promise.all(embeddingPromises)
      
      // Prepare data for insertion
      const insertData = batch.map((chunk, idx) => ({
        content: chunk,
        embedding: embeddingResponses[idx].data[0].embedding,
        metadata: {
          source: 'How to Have Tough Conversations',
          chunk_index: i + idx,
          word_count: chunk.split(' ').length
        }
      }))

      // Insert into database
      const { error } = await supabase
        .from('knowledge_chunks')
        .insert(insertData)

      if (error) {
        console.error('Error inserting batch:', error)
        continue
      }

      console.log(`Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`)
    }

    console.log('✅ Knowledge base upload complete!')
    
  } catch (error) {
    console.error('Error uploading knowledge:', error)
  }
}

// Run the upload
uploadBookContent()
