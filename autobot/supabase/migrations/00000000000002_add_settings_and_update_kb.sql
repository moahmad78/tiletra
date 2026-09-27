alter table public.users add column gemini_api_key text;
alter table public.users add column system_prompt text;

-- Drop and recreate the embedding column with 768 dimensions for Gemini (text-embedding-004)
alter table public.knowledge_base drop column embedding;
alter table public.knowledge_base add column embedding vector(768);
