ALTER TABLE public.message
  ADD COLUMN IF NOT EXISTS sender_lang VARCHAR(10),
  ADD COLUMN IF NOT EXISTS content_translated JSONB;
