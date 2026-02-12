-- Update get_user_projects to allow admins to see all projects
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
DECLARE
    user_is_admin boolean;
BEGIN
    -- Check if user is admin
    SELECT role = 'admin' INTO user_is_admin
    FROM public.profiles
    WHERE profiles.id = p_user_id;

    -- If admin, return all projects
    IF user_is_admin THEN
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
            'admin'::text as member_role
        FROM public.projects p
        ORDER BY p.last_activity DESC NULLS LAST;
    ELSE
        -- If not admin, return only projects where user is a member
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
        WHERE pm.user_id = p_user_id
        ORDER BY p.last_activity DESC NULLS LAST;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
