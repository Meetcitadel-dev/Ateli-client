
-- 1. Create a helper function to check admin status safely (prevents recursion)
-- SECURITY DEFINER runs with the privileges of the creator (usually postgres)
-- SET search_path = public ensures we don't accidentally check other schemas
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- 3. Create clean, non-recursive policies
-- The trick here is (auth.uid() = id) which handles the user's own session
-- without needing to query the table again, breaking the recursion.
CREATE POLICY "profiles_select" ON public.profiles 
FOR SELECT USING (
    auth.uid() = id 
    OR (auth.uid() <> id AND public.is_admin())
);

-- Allow users to update their own profile
CREATE POLICY "profiles_update" ON public.profiles 
FOR UPDATE USING (
    auth.uid() = id
) WITH CHECK (
    auth.uid() = id
);

-- 4. Ensure handle_new_user is robust
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
            WHEN NEW.email IS NOT NULL AND (NEW.email LIKE '%@ateli.co.in' OR NEW.email LIKE '%@mastersunion.org')
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
