-- Enable pgvector extension
create extension if not exists vector;

-- Users table (extends auth.users if using Supabase auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chats table
create table public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  customer_number text not null,
  session_mode text check (session_mode in ('Human', 'AI')) default 'AI' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats on delete cascade not null,
  sender text check (sender in ('user', 'bot', 'customer')) not null,
  message_body text not null,
  message_type text check (message_type in ('text', 'image', 'document', 'system')) default 'text' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Knowledge Base table
create table public.knowledge_base (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  document_name text not null,
  content text not null,
  embedding vector(1536), -- Assuming OpenAI ada-002 embeddings which are 1536 dimensions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.knowledge_base enable row level security;

-- Create policies (placeholder, to be refined based on auth setup)
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

create policy "Users can view own chats" on public.chats for select using (auth.uid() = user_id);
create policy "Users can create own chats" on public.chats for insert with check (auth.uid() = user_id);
create policy "Users can update own chats" on public.chats for update using (auth.uid() = user_id);
create policy "Users can delete own chats" on public.chats for delete using (auth.uid() = user_id);

create policy "Users can view messages in own chats" on public.messages for select
  using (exists (select 1 from public.chats where id = public.messages.chat_id and user_id = auth.uid()));
create policy "Users can insert messages in own chats" on public.messages for insert
  with check (exists (select 1 from public.chats where id = public.messages.chat_id and user_id = auth.uid()));

create policy "Users can view own knowledge base" on public.knowledge_base for select using (auth.uid() = user_id);
create policy "Users can insert into own knowledge base" on public.knowledge_base for insert with check (auth.uid() = user_id);
create policy "Users can update own knowledge base" on public.knowledge_base for update using (auth.uid() = user_id);
create policy "Users can delete own knowledge base" on public.knowledge_base for delete using (auth.uid() = user_id);
