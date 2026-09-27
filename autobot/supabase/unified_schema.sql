-- Drop old tables if they exist from previous phases
drop table if exists public.knowledge_base;
drop table if exists public.messages;
drop table if exists public.chats;
drop table if exists public.users;
drop table if exists public.profiles;

-- Enable Vector Extension for RAG
create extension if not exists vector; -- pgvector

-- 1. STORES USER ACCOUNTS (SaaS Tenants)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text,
  gemini_api_key text,
  global_system_prompt text default 'You are a helpful customer support assistant.',
  default_mode text default 'human', -- 'human' or 'ai'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. STORES WHATSAPP CHATS (Conversations)
create table chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  customer_phone text not null,
  customer_name text,
  chat_mode text default 'human', -- 'human' or 'ai' (Per-chat toggle)
  last_message_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, customer_phone)
);

-- 3. STORES MESSAGES (Chat History)
create table messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats(id) on delete cascade,
  sender text not null, -- 'customer', 'human_agent', or 'ai'
  message_type text default 'text', -- 'text', 'image', 'document'
  body text, -- Message content or storage URL for media
  meta_message_id text unique, -- To prevent duplicate webhook processing
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. STORES KNOWLEDGE BASE CHUNKS (RAG)
create table knowledge_base (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  file_name text,
  content text, -- The text chunk
  embedding vector(768), -- Vector embeddings for Gemini similarity search (Using 768 for Gemini text-embedding-004)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MATCH DOCUMENTS FUNCTION
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    knowledge_base.id,
    knowledge_base.content,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where knowledge_base.user_id = p_user_id
    and 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by knowledge_base.embedding <=> query_embedding
  limit match_count;
$$;
