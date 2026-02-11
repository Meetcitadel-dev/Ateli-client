
-- ============================================
-- ADD LOCATION DATA TO CHAT MESSAGES
-- ============================================

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS location_data jsonb;

-- Comment describing the structure:
-- { "latitude": number, "longitude": number, "address": string }
