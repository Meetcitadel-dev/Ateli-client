-- 1. Retroactively fix any existing users who should be admins but are marked as clients
UPDATE public.profiles
SET role = 'admin'
WHERE (email LIKE '%@ateli.co.in' OR email LIKE '%@mastersunion.org') 
AND role != 'admin';

-- 2. Update the trigger function to ALWAYS enforce admin role for admin emails on login, even if they explicitly existed before
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
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        -- FORCE role update if the email is an admin email
        role = CASE 
            WHEN EXCLUDED.email LIKE '%@ateli.co.in' OR EXCLUDED.email LIKE '%@mastersunion.org' THEN 'admin'
            ELSE profiles.role -- Keep existing role if not an admin email
        END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
