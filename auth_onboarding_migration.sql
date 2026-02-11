-- 1. PER-ADMIN READ RECEIPTS
-- Replace boolean is_read with a JSONB array/UUID array tracking per-user reads
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS read_by uuid[] DEFAULT '{}';

-- 2. UPDATED NEW USER TRIGGER
-- Auto-assigns 'admin' role for @ateli.co.in emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        NEW.email,
        NEW.phone,
        CASE 
            WHEN NEW.email IS NOT NULL AND NEW.email LIKE '%@ateli.co.in' 
            THEN 'admin'
            ELSE 'client'
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, profiles.phone);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. READ RECEIPT RPC
-- Helper to efficiently mark messages as read for a specific user
CREATE OR REPLACE FUNCTION mark_messages_read(
    p_project_id text,
    p_user_id uuid
) RETURNS void AS $$
BEGIN
    UPDATE public.chat_messages
    SET read_by = array_append(read_by, p_user_id)
    WHERE project_id = p_project_id
    AND NOT (p_user_id = ANY(read_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. UPDATED PROFILE RLS
-- Allows admins to see all profiles (needed for team management)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (
    auth.uid() = id 
    OR EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);
