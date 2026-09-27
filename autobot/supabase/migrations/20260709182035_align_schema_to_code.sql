-- Migration: Align Profiles, Chats, Messages, and Knowledge Base schema to codebase expectations

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text,
  gemini_api_key text,
  global_system_prompt text default 'You are a helpful customer support assistant.',
  default_mode text default 'ai', -- Code defaults to 'ai' in fallback profile creation
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. CHATS TABLE
-- ==========================================
-- Safely add user_id if it didn't exist (per the original error log)
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS user_id uuid;

-- Re-point user_id foreign key from users to profiles
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_user_id_fkey;
ALTER TABLE public.chats ADD CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Rename customer_number to customer_phone
ALTER TABLE public.chats RENAME COLUMN customer_number TO customer_phone;

-- Add missing customer_name column
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS customer_name text;

-- Handle session_mode -> chat_mode transition
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_session_mode_check;
ALTER TABLE public.chats ALTER COLUMN session_mode DROP DEFAULT;
ALTER TABLE public.chats RENAME COLUMN session_mode TO chat_mode;

-- Update existing data from TitleCase to lowercase to match code expectations
UPDATE public.chats SET chat_mode = 'human' WHERE chat_mode = 'Human';
UPDATE public.chats SET chat_mode = 'ai' WHERE chat_mode = 'AI';
ALTER TABLE public.chats ALTER COLUMN chat_mode SET DEFAULT 'human';

-- Rename updated_at to last_message_at
ALTER TABLE public.chats RENAME COLUMN updated_at TO last_message_at;

-- ==========================================
-- 3. MESSAGES TABLE
-- ==========================================
-- Rename message_body to body
ALTER TABLE public.messages RENAME COLUMN message_body TO body;

-- Recreate sender check constraint
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_check;
-- Map old values to new values before applying constraint
UPDATE public.messages SET sender = 'ai' WHERE sender = 'bot';
UPDATE public.messages SET sender = 'customer' WHERE sender = 'user';
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_check CHECK (sender in ('customer', 'human_agent', 'ai'));

-- Add missing meta_message_id for webhook deduplication
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS meta_message_id text UNIQUE;

-- ==========================================
-- 4. KNOWLEDGE BASE TABLE
-- ==========================================
-- Rename document_name to file_name
ALTER TABLE public.knowledge_base RENAME COLUMN document_name TO file_name;

-- Fix embedding vector size (1536 for OpenAI -> 768 for Gemini)
-- We use USING NULL because you cannot cast incompatible vector sizes, this effectively clears the old incompatible embeddings.
ALTER TABLE public.knowledge_base ALTER COLUMN embedding TYPE vector(768) USING NULL;

-- Re-point user_id foreign key from users to profiles
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.knowledge_base DROP CONSTRAINT IF EXISTS knowledge_base_user_id_fkey;
ALTER TABLE public.knowledge_base ADD CONSTRAINT knowledge_base_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
