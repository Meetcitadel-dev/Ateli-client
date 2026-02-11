
-- ============================================
-- STORAGE SETUP FOR VOICE MESSAGES
-- ============================================

-- 1. Create the 'chat' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat', 'chat', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on storage.objects (usually enabled by default in Supabase)
-- No explicit command needed as it's a system table, but we can manage policies.

-- 3. Policy: Allow anyone to view/read objects in the 'chat' bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat' );

-- 4. Policy: Allow authenticated users to upload objects to the 'chat' bucket
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat' );

-- 5. Policy: Allow users to delete their own objects (optional but good practice)
CREATE POLICY "Owner Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'chat' AND (storage.foldername(name))[1] = auth.uid()::text );
