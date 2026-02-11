
-- Migration: Add recipient_id to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES auth.users(id);
