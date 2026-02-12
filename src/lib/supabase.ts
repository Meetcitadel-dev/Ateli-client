import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('SUPABASE CONFIG ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing!');
    console.log('Current Env:', import.meta.env);
}

// Auto-fix URL if user only provided the Project ID (e.g., "abcdef...")
const finalSupabaseUrl = supabaseUrl?.startsWith('http')
    ? supabaseUrl
    : `https://${supabaseUrl}.supabase.co`;

export const supabase = createClient(
    finalSupabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
