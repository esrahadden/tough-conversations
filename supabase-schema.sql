-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create conversations table
create table conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create knowledge_chunks table for RAG
create table knowledge_chunks (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  embedding vector(1536), -- OpenAI ada-002 embeddings are 1536 dimensions
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create function to search knowledge chunks
create or replace function search_knowledge(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    knowledge_chunks.id,
    knowledge_chunks.content,
    knowledge_chunks.metadata,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Create indexes for better performance
create index on conversations(user_id);
create index on messages(conversation_id);
create index on knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Enable Row Level Security (RLS)
alter table conversations enable row level security;
alter table messages enable row level security;
alter table knowledge_chunks enable row level security;

-- Create policies for conversations
create policy "Users can view own conversations" on conversations
  for select using (auth.uid() = user_id);

create policy "Users can insert own conversations" on conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own conversations" on conversations
  for update using (auth.uid() = user_id);

create policy "Users can delete own conversations" on conversations
  for delete using (auth.uid() = user_id);

-- Create policies for messages
create policy "Users can view messages from own conversations" on messages
  for select using (
    exists (
      select 1 from conversations 
      where conversations.id = messages.conversation_id 
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can insert messages to own conversations" on messages
  for insert with check (
    exists (
      select 1 from conversations 
      where conversations.id = messages.conversation_id 
      and conversations.user_id = auth.uid()
    )
  );

-- Create policies for knowledge_chunks (read-only for all authenticated users)
create policy "Authenticated users can read knowledge chunks" on knowledge_chunks
  for select using (auth.role() = 'authenticated');

-- Allow service role to manage knowledge chunks
create policy "Service role can manage knowledge chunks" on knowledge_chunks
  for all using (auth.jwt() ->> 'role' = 'service_role');
