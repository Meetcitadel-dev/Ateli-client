-- ============================================
-- ATELI COMPLETE DATABASE SETUP
-- 
-- RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- This will DROP existing tables and create fresh ones
-- ============================================

-- First, drop existing objects to start fresh
DROP FUNCTION IF EXISTS get_user_projects CASCADE;
DROP FUNCTION IF EXISTS upsert_project CASCADE;
DROP FUNCTION IF EXISTS upsert_project_member CASCADE;
DROP FUNCTION IF EXISTS upsert_order CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.project_members CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name text DEFAULT 'New User',
    email text,
    phone text,
    avatar_url text,
    role text DEFAULT 'client',
    wallet_balance numeric DEFAULT 10000,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. PROJECTS TABLE
-- ============================================
CREATE TABLE public.projects (
    id text PRIMARY KEY,
    name text NOT NULL,
    site_address text DEFAULT '',
    location text DEFAULT '',
    status text DEFAULT 'active',
    gst_config jsonb DEFAULT '{"enabled": false}'::jsonb,
    collection_person jsonb DEFAULT '{"name": "", "phone": ""}'::jsonb,
    budget numeric DEFAULT 0,
    description text DEFAULT '',
    last_activity timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. PROJECT_MEMBERS TABLE
-- ============================================
CREATE TABLE public.project_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id text REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role text DEFAULT 'member',
    permissions jsonb DEFAULT '{}'::jsonb,
    joined_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- ============================================
-- 4. ORDERS TABLE
-- ============================================
CREATE TABLE public.orders (
    id text PRIMARY KEY,
    project_id text REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    order_number text NOT NULL,
    items jsonb DEFAULT '[]'::jsonb,
    total_amount numeric DEFAULT 0,
    status text DEFAULT 'order_received',
    approvals jsonb DEFAULT '[]'::jsonb,
    created_by uuid,
    created_by_name text DEFAULT 'Unknown',
    initiated_by text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    confirmed_at timestamptz,
    delivery_date timestamptz,
    estimated_delivery timestamptz,
    notes text,
    driver_info jsonb,
    payment jsonb,
    delivery_outcome text,
    pending_items jsonb
);

-- ============================================
-- 5. CHAT_MESSAGES TABLE
-- ============================================
CREATE TABLE public.chat_messages (
    id text PRIMARY KEY,
    project_id text REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    chat_id text,
    sender_id uuid,
    sender_name text DEFAULT 'Unknown',
    sender_avatar text,
    content text,
    type text DEFAULT 'text',
    media_url text,
    order_id text,
    draft_order jsonb,
    location_data jsonb,
    is_from_ateli boolean DEFAULT false,
    is_read boolean DEFAULT false,
    timestamp timestamptz DEFAULT now()
);

-- ============================================
-- 6. WALLET_TRANSACTIONS TABLE
-- ============================================
CREATE TABLE public.wallet_transactions (
    id text PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL,
    description text,
    order_id text,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- 7. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        NEW.email,
        NEW.phone
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. RPC FUNCTION: GET USER PROJECTS
-- ============================================
CREATE OR REPLACE FUNCTION get_user_projects(p_user_id uuid)
RETURNS TABLE (
    id text,
    name text,
    site_address text,
    location text,
    status text,
    gst_config jsonb,
    collection_person jsonb,
    budget numeric,
    description text,
    last_activity timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    member_role text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.site_address,
        p.location,
        p.status,
        p.gst_config,
        p.collection_person,
        p.budget,
        p.description,
        p.last_activity,
        p.created_at,
        p.updated_at,
        pm.role as member_role
    FROM public.projects p
    INNER JOIN public.project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. RPC FUNCTION: UPSERT PROJECT
-- ============================================
CREATE OR REPLACE FUNCTION upsert_project(
    p_id text,
    p_name text DEFAULT NULL,
    p_site_address text DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_gst_config text DEFAULT NULL,
    p_collection_person text DEFAULT NULL,
    p_budget numeric DEFAULT NULL,
    p_description text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.projects (id, name, site_address, location, status, gst_config, collection_person, budget, description, last_activity, created_at, updated_at)
    VALUES (
        p_id, 
        COALESCE(p_name, 'New Project'), 
        COALESCE(p_site_address, ''), 
        COALESCE(p_location, ''), 
        COALESCE(p_status, 'active'), 
        COALESCE(p_gst_config::jsonb, '{"enabled": false}'::jsonb),
        COALESCE(p_collection_person::jsonb, '{"name": "", "phone": ""}'::jsonb),
        COALESCE(p_budget, 0), 
        COALESCE(p_description, ''), 
        now(), 
        now(), 
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(p_name, projects.name),
        site_address = COALESCE(p_site_address, projects.site_address),
        location = COALESCE(p_location, projects.location),
        status = COALESCE(p_status, projects.status),
        gst_config = COALESCE(p_gst_config::jsonb, projects.gst_config),
        collection_person = COALESCE(p_collection_person::jsonb, projects.collection_person),
        budget = COALESCE(p_budget, projects.budget),
        description = COALESCE(p_description, projects.description),
        last_activity = now(),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. RPC FUNCTION: GET PROJECT MEMBERS
-- ============================================
CREATE OR REPLACE FUNCTION get_project_members(p_project_id text)
RETURNS TABLE (
    user_id uuid,
    role text,
    permissions jsonb,
    joined_at timestamptz,
    name text,
    email text,
    avatar_url text,
    phone text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.user_id,
        pm.role,
        pm.permissions,
        pm.joined_at,
        p.name,
        p.email,
        p.avatar_url,
        p.phone
    FROM public.project_members pm
    LEFT JOIN public.profiles p ON pm.user_id = p.id
    WHERE pm.project_id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. RPC FUNCTION: UPSERT PROJECT MEMBER
-- ============================================
CREATE OR REPLACE FUNCTION upsert_project_member(
    p_project_id text,
    p_user_id uuid,
    p_role text DEFAULT 'member'
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.project_members (project_id, user_id, role, joined_at, updated_at)
    VALUES (p_project_id, p_user_id, COALESCE(p_role, 'member'), now(), now())
    ON CONFLICT (project_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. RPC FUNCTION: UPSERT ORDER
-- ============================================
CREATE OR REPLACE FUNCTION upsert_order(
    p_id text,
    p_project_id text,
    p_order_number text,
    p_items text DEFAULT '[]',
    p_total_amount numeric DEFAULT 0,
    p_status text DEFAULT 'order_received',
    p_approvals text DEFAULT '[]',
    p_created_by uuid DEFAULT NULL,
    p_created_by_name text DEFAULT 'Unknown',
    p_initiated_by text DEFAULT NULL,
    p_created_at timestamptz DEFAULT now(),
    p_updated_at timestamptz DEFAULT now(),
    p_confirmed_at timestamptz DEFAULT NULL,
    p_delivery_date timestamptz DEFAULT NULL,
    p_estimated_delivery timestamptz DEFAULT NULL,
    p_notes text DEFAULT NULL,
    p_driver_info text DEFAULT NULL,
    p_payment text DEFAULT NULL,
    p_delivery_outcome text DEFAULT NULL,
    p_pending_items text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.orders (
        id, project_id, order_number, items, total_amount, status, approvals,
        created_by, created_by_name, initiated_by, created_at, updated_at, confirmed_at,
        delivery_date, estimated_delivery, notes, driver_info, payment,
        delivery_outcome, pending_items
    ) VALUES (
        p_id, 
        p_project_id, 
        p_order_number, 
        COALESCE(p_items::jsonb, '[]'::jsonb), 
        COALESCE(p_total_amount, 0), 
        COALESCE(p_status, 'order_received'), 
        COALESCE(p_approvals::jsonb, '[]'::jsonb),
        p_created_by, 
        COALESCE(p_created_by_name, 'Unknown'), 
        p_initiated_by, 
        COALESCE(p_created_at, now()), 
        COALESCE(p_updated_at, now()), 
        p_confirmed_at,
        p_delivery_date, 
        p_estimated_delivery, 
        p_notes, 
        CASE WHEN p_driver_info IS NOT NULL THEN p_driver_info::jsonb ELSE NULL END,
        CASE WHEN p_payment IS NOT NULL THEN p_payment::jsonb ELSE NULL END,
        p_delivery_outcome,
        CASE WHEN p_pending_items IS NOT NULL THEN p_pending_items::jsonb ELSE NULL END
    )
    ON CONFLICT (id) DO UPDATE SET
        project_id = EXCLUDED.project_id,
        order_number = EXCLUDED.order_number,
        items = EXCLUDED.items,
        total_amount = EXCLUDED.total_amount,
        status = EXCLUDED.status,
        approvals = EXCLUDED.approvals,
        updated_at = now(),
        confirmed_at = EXCLUDED.confirmed_at,
        delivery_date = EXCLUDED.delivery_date,
        estimated_delivery = EXCLUDED.estimated_delivery,
        notes = EXCLUDED.notes,
        driver_info = EXCLUDED.driver_info,
        payment = EXCLUDED.payment,
        delivery_outcome = EXCLUDED.delivery_outcome,
        pending_items = EXCLUDED.pending_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 12. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. RLS POLICIES
-- ============================================

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- PROJECTS (via RPC, so allow all for authenticated)
CREATE POLICY "projects_all" ON public.projects FOR ALL USING (true);

-- PROJECT_MEMBERS
CREATE POLICY "project_members_all" ON public.project_members FOR ALL USING (true);

-- ORDERS
CREATE POLICY "orders_all" ON public.orders FOR ALL USING (true);

-- CHAT_MESSAGES
CREATE POLICY "chat_messages_all" ON public.chat_messages FOR ALL USING (true);

-- WALLET
CREATE POLICY "wallet_select" ON public.wallet_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wallet_insert" ON public.wallet_transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- 14. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.project_members TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.wallet_transactions TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_projects TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_members TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_project TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_project_member TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_order TO authenticated;

-- ============================================
-- DONE! Database is now fully set up.
-- ============================================
SELECT 'Database setup complete!' as status;
